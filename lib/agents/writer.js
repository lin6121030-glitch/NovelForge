import { Agent } from './base.js';
import { TemplateFactory, ConversationExecutor } from '../llm/conversation-builder.js';
import { ConfigParser } from '../llm/config-parser.js';

export class WriterAgent extends Agent {
  constructor(chatFn) {
    super('写作者');
    this.chatFn = chatFn;
  }
  
  async run({ chapterInfo, style, relevantSettings, outline, prevValues, state = '', constitution }) {
    this.log('正在使用多轮对话生成内容...');
    
    const config = ConfigParser.parse();
    const apiMode = config.apiMode || 'OPENAI';
    const adapterType = (apiMode === 'MINIMAX' || apiMode === 'minimax') ? 'minimax' : 'openai';
    
    const template = TemplateFactory.createWriterTemplate(adapterType);
    const executor = new ConversationExecutor(this.chatFn);
    
    const chapterNum = chapterInfo?.startChapter || 1;
    
    // 解析大纲
    const { title, goal, plot } = this.parseOutline(outline);
    
    // 构建settings字符串
    const settingsStr = Object.entries(relevantSettings || {})
      .map(([cat, items]) => {
        if (!items || items.length === 0) return '';
        return `### ${cat}\n` + items.map(s => `- ${s.name}: ${Object.values(s.fields).join('；')}`).join('\n');
      })
      .filter(s => s)
      .join('\n');
    
    executor.setContext({
      style: style || '',
      title: title || '',
      goal: goal || '',
      plot: plot || '',
      settings: settingsStr || '无',
      previous: prevValues || '无',
      state: state || '无',
      constitution: constitution || '',
      chapterNum: chapterNum
    });
    
    const result = await executor.executeTemplate(template, { maxTokens: 50000 });
    const draft = result.finalResponse || '';
    
    this.log('内容已生成');
    
    return { draft };
  }
  
  parseOutline(outline) {
    const lines = (outline || '').split('\n');
    let title = '', goal = '', plot = [];
    let inPlot = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- 标题：') || trimmed.startsWith('- 标题:')) {
        title = trimmed.replace(/^- \s*标题[：:]\s*/, '');
      } else if (trimmed.startsWith('- 目标：') || trimmed.startsWith('- 目标:')) {
        goal = trimmed.replace(/^- \s*目标[：:]\s*/, '');
      } else if (trimmed.startsWith('- 关键情节：') || trimmed.startsWith('- 关键情节:')) {
        inPlot = true;
      } else if (inPlot && trimmed.match(/^-\s+.+/)) {
        plot.push(trimmed);
      }
    }
    
    return {
      title,
      goal,
      plot: plot.join('\n')
    };
  }
}