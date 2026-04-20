/**
 * 调试：完整打印发送给 API 的所有消息
 */
import { TemplateFactory, ConversationExecutor } from '../lib/llm/conversation-builder.js';
import { extractChapterOutline } from '../lib/agents/agent.js';

const chapterNum = 2;
const chapterInfo = { startChapter: 2, title: '开始学习魔法', chapterRange: '2' };
const outline = `第1章：主角发现自己的魔法天赋
第2章：开始学习魔法
第3章：第一次冒险`;

// 模拟 pipeline 的 context 设置
const kgFiles = {
  characters: '主角：林风，16岁少年',
  factions: '',
  locations: '',
  worldRules: '',
  style: '白话幽默',
  constraints: '每章3000-5000字',
  outline: outline
};

const currentOutline = extractChapterOutline(outline, chapterNum);
const prevChapter = chapterNum - 1;

const context = {
  characters: kgFiles.characters || '',
  style: kgFiles.style || '',
  outline: currentOutline || '',
  chapterNum: chapterNum,
  prevChapter: prevChapter,
  chapterInfo: `当前章节: ${chapterInfo.chapterRange}\n> 事件: ${chapterInfo.title}`
};

console.log('=== Context ===');
console.log(JSON.stringify(context, null, 2));

console.log('\n=== Template ===');
const template = TemplateFactory.createWriterTemplate();

console.log('\n=== 轮次数据 ===');
template.rounds.forEach((r, i) => {
  console.log(`轮次${i}: role=${r.role}, isTemplate=${r.isTemplate}, dataKeys=${r.dataKeys}`);
});

console.log('\n=== buildInitialMessages ===');
const messages = template.buildInitialMessages(context);

messages.forEach((m, i) => {
  console.log(`\n--- 消息 ${i} (${m.role}) ---`);
  console.log(m.content);
});