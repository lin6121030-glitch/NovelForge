/**
 * 测试 extractChapterOutline
 */
import { extractChapterOutline } from '../lib/agents/agent.js';

const outline = `第1章：主角发现自己的魔法天赋
第2章：开始学习魔法
第3章：第一次冒险`;

console.log('=== 测试 extractChapterOutline ===\n');
console.log('原始大纲:');
console.log(outline);
console.log('\n---');
console.log('第1章大纲:');
console.log(extractChapterOutline(outline, 1));
console.log('\n---');
console.log('第2章大纲:');
console.log(extractChapterOutline(outline, 2));
console.log('\n---');
console.log('第3章大纲:');
console.log(extractChapterOutline(outline, 3));