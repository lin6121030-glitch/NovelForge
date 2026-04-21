import { loadAll, loadOutline } from '../kg/kg-reader.js';
import { parseCurrentTaskFromOutline, generateAgentContext, extractChapterOutline } from './agent.js';
import { initLLM, chat } from '../llm/llm.js';
import { addToHistory, getHistory, clearHistory } from '../llm/multichat.js';

export class AgentPipeline {
  constructor(projectDir, projectName = 'novel') {
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
    console.log('知识图谱已加载:', this.projectName);
  }
  
  async planner(chapter) {
    console.log('规划者：正在规划章节...');
    
    const outline = loadOutline(this.projectDir);
    this.task = parseCurrentTaskFromOutline(outline, chapter);
    this.context = generateAgentContext(this.kg, this.task, this.projectName);
    
    console.log('规划完成');
    return this.task;
  }
  
  async composer(task) {
    console.log('编辑者：正在组织上下文...');
    
    console.log('上下文已组织');
    return this.context;
  }
  
  async writer(intent, kgFiles, chapterInfo, previousValues = {}) {
    console.log('写作者：正在使用多轮对话生成内容...');
    
    // Import multi-turn conversation framework
    const { TemplateFactory, ConversationExecutor } = await import('../llm/conversation-builder.js');
    const { ConfigParser } = await import('../llm/config-parser.js');
    
    // 根据配置选择适配器类型
    const config = ConfigParser.parse();
    const apiMode = config.apiMode || 'OPENAI';
    const adapterType = (apiMode === 'MINIMAX' || apiMode === 'minimax') ? 'minimax' : 'openai';
    console.log(`📝 使用 ${adapterType} 模板`);
    
    // Create Writer template
    const template = TemplateFactory.createWriterTemplate(adapterType);
    
    // Create executor
    const executor = new ConversationExecutor(this.chat.bind(this));
    
    // Extract current chapter outline
    const chapterNum = chapterInfo?.startChapter || 1;
    const currentOutline = extractChapterOutline(kgFiles.outline, chapterNum);
    
    // Set context data
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
    
    // Execute multi-turn conversation
    const result = await executor.executeTemplate(template, {
      maxTokens: 50000
    });
    
    let content = result.finalResponse || '';
    
    console.log('内容已生成');
    return content;
  }
  
  async observer(draft) {
    console.log('观察者：正在提取事实...');
    
    const observerPrompt = `从以下内容中提取关键事实（角色、地点、物品、事件、状态变化）：\n\n${draft}`;
    
    this.conversationHistory.push({ role: 'user', content: observerPrompt });
    
    const result = await chat(this.conversationHistory);
    const facts = result.choices[0].message.content;
    
    this.conversationHistory.push({ role: 'assistant', content: facts });
    
    console.log('事实已提取');
    return facts;
  }
  
  async auditor(draft, facts) {
    console.log('审核者：正在审核...');
    
    if (!this.context) {
      this.context = generateAgentContext(this.kg, this.task, this.projectName);
    }
    
    let auditorPrompt = `根据世界规则、约束、事实矛盾和AI模式审核以下内容：\n\n## 内容\n${draft}\n\n## 提取的事实\n${facts}\n`;
    
    this.conversationHistory.push({ role: 'user', content: auditorPrompt });
    
    const result = await chat(this.conversationHistory);
    const report = result.choices[0].message.content;
    
    this.conversationHistory.push({ role: 'assistant', content: report });
    
    const passed = !report.includes('') && !report.toLowerCase().includes('issue');
    
    console.log(passed ? '审核通过' : '需要修订');
    return { report, passed };
  }

  async values(chapter, draft = null) {
    if (draft) {
      // Extract values from current chapter
      console.log('数值代理：正在提取数值...');
      
      const valuesPrompt = `请分析以下章节内容，提取你能找到的所有数值。不要限制在预定义的类别中 - 找出文本中出现的任何数字、数量、测量值或数值数据。

请用Markdown格式返回，分类如下：
## 类别名称
- 项目: 数值
- 项目2: 数值2

章节内容：
${draft}`;
      
      this.conversationHistory.push({ role: 'user', content: valuesPrompt });
      
      const result = await chat(this.conversationHistory);
      const valuesMarkdown = result.choices[0].message.content;
      
      this.conversationHistory.push({ role: 'assistant', content: valuesMarkdown });
      
      // Save values directly as markdown
      await this.saveChapterValuesMarkdown(chapter, valuesMarkdown);
      
      console.log('数值已提取并保存');
      return this.parseValuesFromMarkdown(valuesMarkdown);
    } else {
      // Read previous chapter values
      console.log('数值代理：正在读取上一章数值...');
      
      if (chapter <= 1) {
        console.log('第一章 - 无上一章数值');
        return {};
      }
      
      const fs = await import('fs');
      const path = await import('path');
      
      const chapterDir = path.join(this.projectDir, 'story', `chapter-${chapter - 1}`);
      const valuesFile = path.join(chapterDir, 'values.md');
      
      if (!fs.existsSync(valuesFile)) {
        console.log('未找到上一章数值文件');
        return {};
      }
      
      try {
        const content = fs.readFileSync(valuesFile, 'utf-8');
        const values = this.parseValuesFromMarkdown(content);
        console.log('上一章数值已成功加载');
        return values;
      } catch (e) {
        console.log(`加载上一章数值失败: ${e.message}`);
        return {};
      }
    }
  }

  async saveChapterValuesMarkdown(chapter, valuesMarkdown) {
    const fs = await import('fs');
    const path = await import('path');
    
    // Create chapter-specific folder
    const chapterDir = path.join(this.projectDir, 'story', `chapter-${chapter}`);
    if (!fs.existsSync(chapterDir)) {
      fs.mkdirSync(chapterDir, { recursive: true });
    }
    
    // Add header to markdown
    const fullMarkdown = `# 第${chapter}章 数值数据\n\n## 提取时间\n${new Date().toISOString()}\n\n${valuesMarkdown}`;
    
    // Save values as markdown
    const valuesFile = path.join(chapterDir, 'values.md');
    fs.writeFileSync(valuesFile, fullMarkdown);
    console.log(`数值已保存到: ${valuesFile}`);
  }

  parseValuesFromMarkdown(markdown) {
    const values = {};
    const lines = markdown.split('\n');
    let currentCategory = '';
    
    for (const line of lines) {
      if (line.startsWith('## ')) {
        currentCategory = line.replace('## ', '').toLowerCase();
        values[currentCategory] = {};
      } else if (line.startsWith('- ') && currentCategory) {
        const [key, ...valueParts] = line.replace('- ', '').split(': ');
        const value = valueParts.join(': ');
        if (key && value) {
          values[currentCategory][key] = value;
        }
      }
    }
    
    return values;
  }
  
  async run(chapter) {
    console.log(`\n=== 开始生成第${chapter}章 ===\n`);
    console.log('项目:', this.projectName, '\n');
    
    this.clearHistory();
    
    const task = await this.planner(chapter);
    console.log('\n---\n');
    
    const context = await this.composer(task);
    console.log('\n---\n');
    
    // Read previous chapter values
    const previousValues = await this.values(chapter);
    console.log('\n---\n');
    
    const draft = await this.writer(task, this.kg, this.task, previousValues);
    console.log('内容已生成 (' + draft.length + ' 字符)\n');
    console.log('\n---\n');
    
    const facts = await this.observer(draft);
    console.log('\n---\n');
    
    const { report, passed } = await this.auditor(draft, facts);
    console.log('\n---\n');
    
    // Extract and save current chapter values
    const currentValues = await this.values(chapter, draft);
    
    console.log('\n=== 生成完成 ===');
    
    return {
      chapter,
      task,
      context,
      draft,
      facts,
      report,
      passed,
      previousValues,
      currentValues
    };
  }
}
