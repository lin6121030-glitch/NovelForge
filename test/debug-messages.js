/**
 * 调试：查看实际发送给 API 的消息内容
 */
import { TemplateFactory, ConversationExecutor } from '../lib/llm/conversation-builder.js';

async function debugMessages() {
  const template = TemplateFactory.createWriterTemplate();
  
  const context = {
    characters: '主角：林风，16岁少年',
    factions: '',
    locations: '',
    worldRules: '',
    style: '白话幽默',
    constraints: '每章3000-5000字',
    outline: '第2章：开始学习魔法',
    chapterNum: 2,
    chapterInfo: '当前章节: 2\n> 事件: 开始学习魔法'
  };

  const messages = template.buildInitialMessages(context);

  console.log('=== 发送给 API 的消息 ===\n');
  messages.forEach((m, i) => {
    console.log(`\n--- 消息 ${i} ---`);
    console.log(`role: ${m.role}`);
    console.log(`content: ${m.content}`);
  });
}

debugMessages();