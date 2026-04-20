import { loadAll, loadOutline } from '../kg/kg-reader.js';
import { parseCurrentTaskFromOutline, generateAgentContext, extractChapterOutline } from './agent.js';
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
  
  // Bind chat method for ConversationExecutor
  async chat(messages, options) {
    const { chat } = await import('../llm/llm.js');
    return await chat(messages, options);
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
  
  async writer(intent, kgFiles, chapterInfo) {
    console.log('📋 Writer: 使用多轮对话生成正文...');
    
    // 导入多轮对话框架
    const { TemplateFactory, ConversationExecutor } = await import('../llm/conversation-builder.js');
    
    // 创建Writer模板
    const template = TemplateFactory.createWriterTemplate();
    
    // 创建执行器
    const executor = new ConversationExecutor(this.chat.bind(this));
    
    // 提取当前章节的大纲
    const chapterNum = chapterInfo?.startChapter || 1;
    const prevChapter = chapterNum - 1;
    const currentOutline = extractChapterOutline(kgFiles.outline, chapterNum);
    
    // 设置上下文数据
    executor.setContext({
      characters: kgFiles.characters || '',
      factions: kgFiles.factions || '',
      locations: kgFiles.locations || '',
      worldRules: kgFiles.worldRules || '',
      style: kgFiles.style || '',
      constraints: kgFiles.constraints || '',
      outline: currentOutline || '',
      chapterNum: chapterNum,
      chapterInfo: chapterInfo ? `当前章节: ${chapterInfo.chapterRange || chapterInfo.startChapter + '-' + chapterInfo.endChapter + '章'}\n> 事件: ${chapterInfo.title || ''}` : ''
    });
    
    // 执行多轮对话
    const result = await executor.executeTemplate(template, {
      maxTokens: 50000
    });
    
    // 强制加上章节标题
    let content = result.finalResponse || '';
    const chapterTitle = `第${chapterNum}章`;
    if (!content.startsWith('# ') && !content.startsWith(chapterTitle)) {
      content = `# ${chapterTitle}\n\n${content}`;
    }
    
    console.log('✓ 正文已生成');
    return content;
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
    
    const draft = await this.writer(task, this.kg, this.task);
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