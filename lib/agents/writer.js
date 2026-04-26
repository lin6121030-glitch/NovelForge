import { Agent } from './base.js';
import { TemplateFactory, ConversationExecutor } from '../llm/conversation-builder.js';
import { ConfigParser } from '../llm/config-parser.js';

export class WriterAgent extends Agent {
  constructor(chatFn) {
    super('写作者');
    this.chatFn = chatFn;
  }
  
  async run({ chapterInfo, style, relevantSettings, outline, prevValues }) {
    this.log('正在使用多轮对话生成内容...');
    
    const config = ConfigParser.parse();
    const apiMode = config.apiMode || 'OPENAI';
    const adapterType = (apiMode === 'MINIMAX' || apiMode === 'minimax') ? 'minimax' : 'openai';
    
    const template = TemplateFactory.createWriterTemplate(adapterType);
    const executor = new ConversationExecutor(this.chatFn);
    
    const chapterNum = chapterInfo?.startChapter || 1;
    const currentOutline = outline;
    
    // 构建settings字符串
    const settingsStr = Object.entries(relevantSettings || {})
      .map(([cat, items]) => {
        if (!items || items.length === 0) return '';
        return `### ${cat}\n` + items.map(s => `**${s.name}**：${Object.values(s.fields).join('；')}`).join('\n');
      })
      .filter(s => s)
      .join('\n');
    
    // 构建prevValues字符串
    const prevValuesStr = prevValues ? 
      Object.entries(prevValues).map(([cat, vals]) => 
        `### ${cat}\n` + Object.entries(vals).map(([k, v]) => `- ${k}：${v}`).join('\n')
      ).join('\n') : '无';
    
    executor.setContext({
      style: style || '',
      outline: currentOutline || '',
      settings: settingsStr || '无',
      previousValues: prevValuesStr,
      chapterNum: chapterNum
    });
    
    const result = await executor.executeTemplate(template, { maxTokens: 50000 });
    const draft = result.finalResponse || '';
    
    this.log('内容已生成');
    
    return { draft };
  }
}