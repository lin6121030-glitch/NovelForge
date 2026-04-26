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
    
    const planner = new PlannerAgent(this.projectDir, this.kg.outline);
    const plannerResult = await planner.run(chapter);
    console.log('\n---\n');
    
    const composer = new ComposerAgent(this.projectDir, this.kg.styles, this.kg.settings);
    const composerResult = await composer.run(plannerResult.chapterContent);
    console.log('\n---\n');
    
    const valuesAgent = new ValuesAgent(this.projectDir);
    const prevResult = await valuesAgent.run(chapter);
    console.log('\n---\n');
    
    const writer = new WriterAgent(async (msgs, opts) => {
      return await chat(msgs, opts);
    });
    const outline = extractChapterOutline(this.kg.outline, chapter);
    const writerResult = await writer.run({
      chapterInfo: plannerResult.chapterInfo,
      style: composerResult.style,
      relevantSettings: composerResult.relevantSettings,
      outline: outline || '',
      prevValues: prevResult.values,
      constitution: this.kg.constitution || ''
    });
    console.log('内容已生成 (' + writerResult.draft.length + ' 字符)\n');
    console.log('\n---\n');
    
    const observer = new ObserverAgent();
    const observerResult = await observer.run(writerResult.draft);
    console.log('\n---\n');
    
    const auditor = new AuditorAgent();
    const auditorResult = await auditor.run(writerResult.draft, observerResult.facts);
    console.log('\n---\n');
    
    const currentValuesResult = await valuesAgent.run(chapter, writerResult.draft);
    
    console.log('\n=== 生成完成 ===');
    
    return {
      chapter,
      planner: plannerResult,
      composer: composerResult,
      writer: writerResult,
      observer: observerResult,
      auditor: auditorResult,
      values: currentValuesResult
    };
  }
}