import { loadAll, loadOutline } from '../kg/kg-reader.js';
import { parseCurrentTaskFromOutline, generateAgentContext } from './agent.js';
import { initLLM, chat } from '../llm/llm.js';
import { addToHistory, getHistory, clearHistory } from '../llm/multichat.js';

export class AgentPipeline {
  constructor(projectDir, projectName = '小说') {
    this.projectDir = projectDir;
    this.projectName = projectName;
    this.kg = null;
    this.task = null;
    this.context = null;
    this.conversationHistory = [];
  }
  
  clearHistory() {
    this.conversationHistory = [];
  }
  
  async init() {
    this.kg = loadAll(this.projectDir);
    console.log('✓ KnowledgeGraph loaded:', this.projectName);
  }
  
  async planner(chapter) {
    console.log('📋 Planner: 规划本章...');
    
    const outline = loadOutline(this.projectDir);
    this.task = parseCurrentTaskFromOutline(outline, chapter);
    this.context = generateAgentContext(this.kg, this.task, this.projectName);
    
    console.log('✓ 已规划');
    return this.task;
  }
  
  async composer(task) {
    console.log('📋 Composer: 整理上下文...');
    
    console.log('✓ 上下文已整理');
    return this.context;
  }
  
  async writer(intent, context) {
    console.log('📋 Writer: 生成正文...');
    
    const systemPrompt = `你是小说作家。直接写出本章正文小说内容。
要求：
- 用第三人称视角，紧贴主角
- 语言白话幽默，网感
- 每章有笑点或爽点
- 禁止输出任何分析、清单、表格、说明文字
- 只输出小说正文`;
    
    const writerPrompt = `${systemPrompt}\n\n## 当前上下文\n${context}`;
    
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: writerPrompt }
    ];
    
    const result = await chat(messages, { maxTokens: 4000 });
    const draft = result.choices[0].message.content;
    
    console.log('✓ 正文已生成');
    return draft;
  }
  
  async observer(draft) {
    console.log('📋 Observer: 提取事实...');
    
    const observerPrompt = `从以下正文中提取关键事实（角色、地点、物品、事件、状态变化）：\n\n${draft}`;
    
    this.conversationHistory.push({ role: 'user', content: observerPrompt });
    
    const result = await chat(this.conversationHistory);
    const facts = result.choices[0].message.content;
    
    this.conversationHistory.push({ role: 'assistant', content: facts });
    
    console.log('✓ 事实已提取');
    return facts;
  }
  
  async auditor(draft, facts) {
    console.log('📋 Auditor: 审计中...');
    
    if (!this.context) {
      this.context = generateAgentContext(this.kg, this.task, this.projectName);
    }
    
    let auditorPrompt = `基于以下内容进行审计（世界观规则、约束、事实矛盾、AI味）：\n\n## 正文\n${draft}\n\n## 提取的事实\n${facts}\n`;
    
    this.conversationHistory.push({ role: 'user', content: auditorPrompt });
    
    const result = await chat(this.conversationHistory);
    const report = result.choices[0].message.content;
    
    this.conversationHistory.push({ role: 'assistant', content: report });
    
    const passed = !report.includes('❌') && !report.toLowerCase().includes('issue');
    
console.log(passed ? '✓ 审计通过' : '⚠ 需修订');
    return { report, passed };
  }
  
  async run(chapter) {
    console.log(`\n=== 开始生成第${chapter}章 ===\n`);
    console.log('项目:', this.projectName, '\n');
    
    this.clearHistory();
    
    const task = await this.planner(chapter);
    console.log('\n---\n');
    
    const context = await this.composer(task);
    console.log('\n---\n');
    
    const draft = await this.writer(task, context);
    console.log('正文已生成 (' + draft.length + '字)\n');
    console.log('\n---\n');
    
    const facts = await this.observer(draft);
    console.log('\n---\n');
    
    const { report, passed } = await this.auditor(draft, facts);
    
    console.log('\n=== 生成完成 ===');
    
    return {
      chapter,
      task,
      context,
      draft,
      facts,
      report,
      passed
    };
  }
}