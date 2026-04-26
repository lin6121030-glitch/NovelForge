import { loadBook } from '../kg/kg-new.js';
import { extractChapterOutline } from './agent.js';
import { chat } from '../llm/llm.js';
import { PlannerAgent } from './planner.js';
import { ComposerAgent } from './composer.js';
import { WriterAgent } from './writer.js';
import { ObserverAgent } from './observer.js';
import { AuditorAgent } from './auditor.js';
import { ValuesAgent } from './values.js';

export class Runner {
  constructor(projectDir, projectName) {
    this.projectDir = projectDir;
    this.projectName = projectName;
    this.kg = null;
  }
  
  async init() {
    const bookName = this.projectDir.split(/[/\\]/).pop();
    this.kg = loadBook(bookName);
    console.log('知识图谱已加载:', this.projectName);
  }
  
  async run(chapter) {
    console.log(`\n=== 开始生成第${chapter}章 ===\n`);
    console.log('项目:', this.projectName, '\n');
    
    // 1. PlannerAgent - 读取大纲
    const planner = new PlannerAgent(this.projectDir, this.kg.outline);
    const plannerResult = await planner.run(chapter);
    console.log('\n---\n');
    
    // 2. ValuesAgent - 加载上一章状态
    const valuesAgent = new ValuesAgent(this.projectDir);
    const prevState = await valuesAgent.loadPreviousState(chapter);
    console.log('\n---\n');
    
    // 3. ComposerAgent - 合并设定 + 状态
    const composer = new ComposerAgent(this.projectDir, this.kg.styles, this.kg.settings);
    const composerResult = await composer.run(plannerResult.chapterContent, prevState.state);
    console.log('\n---\n');
    
    // 4. WriterAgent - 生成内容
    const writer = new WriterAgent(async (msgs, opts) => {
      return await chat(msgs, opts);
    });
    const outline = extractChapterOutline(this.kg.outline, chapter);
    const writerResult = await writer.run({
      chapterInfo: plannerResult.chapterInfo,
      style: composerResult.style,
      mergedContext: composerResult.mergedContext,
      outline: outline || '',
      constitution: this.kg.constitution || ''
    });
    console.log('内容已生成 (' + writerResult.draft.length + ' 字符)\n');
    console.log('\n---\n');
    
    // 5. ObserverAgent - 提取事实
    const observer = new ObserverAgent();
    const observerResult = await observer.run(writerResult.draft);
    console.log('\n---\n');
    
    // 6. AuditorAgent - 审核
    const auditor = new AuditorAgent();
    const auditorResult = await auditor.run(writerResult.draft, observerResult.facts);
    console.log('\n---\n');
    
    // 7. ValuesAgent - 提取并保存状态
    const stateResult = await valuesAgent.run(chapter, writerResult.draft, prevState.state);
    
    console.log('\n=== 生成完成 ===');
    
    return {
      chapter,
      planner: plannerResult,
      composer: composerResult,
      writer: writerResult,
      observer: observerResult,
      auditor: auditorResult,
      state: stateResult
    };
  }
}