import fs from 'fs';
import path from 'path';
import { loadBook, getBookDir } from '../kg/kg-new.js';
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
    const bookName = this.projectDir.split('/').pop();
    this.kg = loadBook(bookName);
    console.log('知识图谱已加载:', this.projectName);
  }
  
  async planner(chapter) {
    console.log('规划者：正在规划章节...');
    
    const outline = this.kg.outline;
    this.task = parseCurrentTaskFromOutline(outline, chapter);
    
    // 读取大纲库对应的章节内容
    const chapterFile = this.getChapterFile(chapter);
    const chapterContent = chapterFile ? fs.readFileSync(chapterFile, 'utf-8') : '';
    
    this.context = {
      ...generateAgentContext(this.kg, this.task, this.projectName),
      chapterContent
    };
    
    console.log('规划完成');
    return this.task;
  }
  
  getChapterFile(chapterNum) {
    const outlineDir = path.join(this.projectDir, '大纲库');
    const chapterFile = path.join(outlineDir, `第${chapterNum}章.md`);
    return fs.existsSync(chapterFile) ? chapterFile : null;
  }
  
  async composer(task) {
    console.log('编辑者：正在组织上下文...');
    
    const chapterNum = task?.startChapter || 1;
    
    // 1. 从章节内容中提取配置的文风名称
    const chapterContent = this.context?.chapterContent || '';
    const styleMatch = chapterContent.match(/文风[：:]\s*([^\n]+)/);
    const styleName = styleMatch ? styleMatch[1].trim() : '开局';
    
    // 2. 从文风库提取对应文风
    const style = this.kg.styles.find(s => s.name === styleName);
    
    // 3. 从章节内容中提取涉及的人物等实体
    const entities = this.extractEntities(chapterContent);
    
    // 4. 从设定库提取对应的设定
    const relevantSettings = {};
    for (const [category, names] of Object.entries(entities)) {
      if (names.length > 0) {
        relevantSettings[category] = this.kg.settings.filter(
          s => s.category === category && names.includes(s.name)
        );
      }
    }
    
    // 5. 读取上一章数值
    const previousValues = await this.values(chapterNum);
    
    this.context = {
      ...this.context,
      style: style?.content || '',
      relevantSettings,
      previousValues,
      entities
    };
    
    console.log('上下文已组织');
    return this.context;
}
   
  async composer(task) {
    console.log('编辑者：正在组织上下文...');
    
    const chapterNum = task?.startChapter || 1;
    const chapterContent = this.context?.chapterContent || '';
    
    // 1. 程序解析文风（支持多个）
    const styleNames = this.parseStyleNames(chapterContent);
    const styleContents = styleNames
      .map(name => this.kg.styles.find(s => s.name === name)?.content)
      .filter(c => c)
      .join('\n\n');
    
    // 2. LLM分析涉及的实体
    const categories = this.extractCategories();
    const entities = await this.analyzeEntities(chapterContent, categories);
    
    // 3. 从设定库提取相关设定
    const relevantSettings = {};
    for (const [category, names] of Object.entries(entities)) {
      if (Array.isArray(names) && names.length > 0) {
        relevantSettings[category] = this.kg.settings.filter(
          s => s.category === category && names.includes(s.name)
        );
      }
    }
    
    // 4. 读取上一章数值
    const previousValues = await this.values(chapterNum);
    
    this.context = {
      ...this.context,
      style: styleContents,
      styleNames,
      relevantSettings,
      previousValues,
      entities
    };
    
    console.log('上下文已组织');
    return this.context;
  }
  
  parseStyleNames(chapterContent) {
    const pattern = /文风[：:]\s*([^\n]+)/;
    const match = chapterContent.match(pattern);
    if (!match) return ['开局'];
    
    let content = match[1].trim();
    content = content.replace(/^[（(（\[【《]/, '').replace(/[）)）\]\]\】》]$/, '');
    
    const names = content
      .split(/[,，、、\s]+/)
      .map(s => s.trim())
      .filter(s => s && s.length > 0);
    
    return names.length > 0 ? names : ['开局'];
  }
  
  extractCategories() {
    const settingDir = path.join(this.projectDir, '设定库');
    if (!fs.existsSync(settingDir)) return [];
    return fs.readdirSync(settingDir).filter(f => {
      return fs.statSync(path.join(settingDir, f)).isDirectory();
    });
  }
  
  async analyzeEntities(chapterContent, categories) {
    const categoriesStr = categories.join('、');
    const allSettings = this.kg.settings.map(s => `${s.category}：${s.name}`).join('\n');
    
    const prompt = `你是一个小说助手。现在需要从章节内容中提取涉及的实体。

## 设定库中可用的实体
${allSettings}

## 章节内容
${chapterContent}

请分析章节内容，返回涉及的实体。用JSON格式返回：
{
  "人物": ["角色1", "角色2"],
  "势力": ["势力1"]
}`;

    this.conversationHistory.push({ role: 'user', content: prompt });
    const result = await chat(this.conversationHistory);
    const response = result.choices[0].message.content;
    this.conversationHistory.push({ role: 'assistant', content: response });
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.log('解析实体JSON失败');
    }
    return {};
  }
  
  /**
   * 预览发送给 LLM 的完整提示词
   * 用于调优提示词
   */
  async previewPrompt(chapter = 1) {
    const { TemplateFactory } = await import('../llm/conversation-builder.js');
    const { ConfigParser } = await import('../llm/config-parser.js');
    const { parseCurrentTaskFromOutline, extractChapterOutline } = await import('./agent.js');
    
    const config = ConfigParser.parse();
    const apiMode = config.apiMode || 'OPENAI';
    const adapterType = (apiMode === 'MINIMAX' || apiMode === 'minimax') ? 'minimax' : 'openai';
    
    console.log(`🔍 预览模式 - 适配器: ${adapterType}`);
    
    const outline = this.kg.outline;
    const chapterInfo = parseCurrentTaskFromOutline(outline, chapter);
    const chapterNum = chapterInfo?.startChapter || chapter;
    const currentOutline = extractChapterOutline(this.kg.outline, chapterNum);
    
    const template = TemplateFactory.createWriterTemplate(adapterType);
    
    // 从新格式提取上下文
    const styleContent = this.kg.styles.find(s => s.name === (chapterInfo?.style || '开局'))?.content || '';
    const settingsByCategory = {};
    for (const s of this.kg.settings) {
      if (!settingsByCategory[s.category]) settingsByCategory[s.category] = [];
      settingsByCategory[s.category].push(s);
    }
    
    const context = {
      style: styleContent,
      characters: JSON.stringify(settingsByCategory['人物'] || []),
      factions: JSON.stringify(settingsByCategory['势力'] || []),
      locations: JSON.stringify(settingsByCategory['地点'] || []),
      outline: currentOutline || '',
      chapterNum: chapterNum,
      chapterInfo: chapterInfo ? `当前章节: ${chapterInfo.chapterRange || chapterInfo.startChapter + '-' + chapterInfo.endChapter + '章'}\n> 标题: ${chapterInfo.title || ''}` : ''
    };
    
    const messages = template.buildInitialMessages(context);
    
    return {
      adapterType,
      chapterInfo,
      context,
      messages
    };
  }
  
  async writer(intent, kgFiles, chapterInfo, previousValues = {}) {
    console.log('写作者：正在使用多轮对话生成内容...');
    
    const { TemplateFactory, ConversationExecutor } = await import('../llm/conversation-builder.js');
    const { ConfigParser } = await import('../llm/config-parser.js');
    
    const config = ConfigParser.parse();
    const apiMode = config.apiMode || 'OPENAI';
    const adapterType = (apiMode === 'MINIMAX' || apiMode === 'minimax') ? 'minimax' : 'openai';
    console.log(`📝 使用 ${adapterType} 模板`);
    
    const template = TemplateFactory.createWriterTemplate(adapterType);
    const executor = new ConversationExecutor(this.chat.bind(this));
    
    const chapterNum = chapterInfo?.startChapter || 1;
    const currentOutline = extractChapterOutline(kgFiles.outline, chapterNum);
    
    // 构建settings字符串
    const settingsStr = Object.entries(this.context.relevantSettings || {})
      .map(([cat, items]) => {
        if (!items || items.length === 0) return '';
        return `### ${cat}\n` + items.map(s => `**${s.name}**：${Object.values(s.fields).join('；')}`).join('\n');
      })
      .filter(s => s)
      .join('\n');
    
    // 构建previousValues字符串
    const prevValuesStr = previousValues ? 
      Object.entries(previousValues).map(([cat, vals]) => 
        `### ${cat}\n` + Object.entries(vals).map(([k, v]) => `- ${k}：${v}`).join('\n')
      ).join('\n') : '无';
    
    executor.setContext({
      style: this.context.style || '',
      outline: currentOutline || '',
      settings: settingsStr || '无',
      previousValues: prevValuesStr,
      chapterNum: chapterNum
    });
    
    const result = await executor.executeTemplate(template, { maxTokens: 50000 });
    const content = result.finalResponse || '';
    
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
    
    const draft = await this.writer(task, this.kg, this.task, this.context.previousValues);
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
      passed
    };
  }
}
