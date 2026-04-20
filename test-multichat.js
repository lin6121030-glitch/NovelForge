#!/usr/bin/env node

/**
 * 多轮LLM调用和上下文测试
 * 测试单轮对话 vs 多轮对话的上下文保持能力
 */

import { initLLM, chat } from './lib/llm/llm.js';
import { multiTurnChat, addToHistory, getHistory, clearHistory } from './lib/llm/multichat.js';
import { EnhancedConversationExecutor } from './lib/llm/conversation-adapter.js';

// 初始化LLM
initLLM();

console.log('🚀 开始测试多轮LLM调用和上下文管理...\n');

// 测试1: 单轮对话（无上下文记忆）
async function testSingleTurnChat() {
  console.log('=== 测试1: 单轮对话（无上下文记忆） ===');
  
  try {
    // 第一轮对话
    const response1 = await chat([
      { role: 'system', content: '你是一个小说创作助手。' },
      { role: 'user', content: '请帮我创建一个角色，他叫张三，是个勇敢的战士。' }
    ]);
    
    console.log('第一轮回复:', response1.choices[0].message.content);
    
    // 第二轮对话（独立的，没有上下文）
    const response2 = await chat([
      { role: 'system', content: '你是一个小说创作助手。' },
      { role: 'user', content: '现在让张三去战斗，描述他的动作。' }
    ]);
    
    console.log('第二轮回复:', response2.choices[0].message.content);
    console.log('✅ 单轮对话测试完成\n');
    
  } catch (error) {
    console.error('❌ 单轮对话测试失败:', error.message);
  }
}

// 测试2: 多轮对话（使用multichat.js）
async function testMultiTurnChat() {
  console.log('=== 测试2: 多轮对话（使用multichat.js） ===');
  
  try {
    // 清空历史
    clearHistory();
    
    // 模拟知识图谱和章节信息
    const kgContent = {
      characters: [
        { name: '张三', traits: ['勇敢', '战士'], description: '一个经验丰富的战士' }
      ],
      world: '奇幻世界'
    };
    
    const chapterInfo = {
      chapter: 1,
      title: '初战',
      setting: '森林战场'
    };
    
    // 第一轮对话
    console.log('--- 第一轮对话 ---');
    const result1 = await multiTurnChat(kgContent, chapterInfo, '请帮我创建一个角色，他叫张三，是个勇敢的战士。');
    console.log('回复:', result1.reply);
    console.log('当前历史记录数:', getHistory().length);
    
    // 第二轮对话（应该有上下文）
    console.log('\n--- 第二轮对话 ---');
    const result2 = await multiTurnChat(kgContent, chapterInfo, '现在让张三去战斗，描述他的动作。');
    console.log('回复:', result2.reply);
    console.log('当前历史记录数:', getHistory().length);
    
    // 第三轮对话（进一步测试上下文）
    console.log('\n--- 第三轮对话 ---');
    const result3 = await multiTurnChat(kgContent, chapterInfo, '张三的战斗风格是怎样的？');
    console.log('回复:', result3.reply);
    
    console.log('✅ 多轮对话测试完成\n');
    
  } catch (error) {
    console.error('❌ 多轮对话测试失败:', error.message);
  }
}

// 测试3: 使用EnhancedConversationExecutor
async function testEnhancedConversation() {
  console.log('=== 测试3: 增强对话执行器 ===');
  
  try {
    const executor = new EnhancedConversationExecutor(chat);
    executor.initialize();
    
    // 获取当前模型信息
    const modelInfo = executor.getCurrentModel();
    console.log('当前模型:', modelInfo);
    console.log('支持上下文记忆:', modelInfo.supportsMemory);
    
    // 设置上下文
    executor.setContext({
      protagonist: '张三',
      role: '勇敢的战士',
      setting: '奇幻世界'
    });
    
    // 创建测试模板
    const testTemplate = {
      rounds: [
        {
          role: 'user',
          content: '请帮我创建一个角色，他叫{{protagonist}}，是个{{role}}。',
          isTemplate: true,
          dataKeys: ['protagonist', 'role']
        },
        {
          role: 'user',
          content: '现在让{{protagonist}}去战斗，描述他的动作。',
          isTemplate: true,
          dataKeys: ['protagonist']
        }
      ]
    };
    
    // 执行模板
    const result = await executor.executeTemplate(testTemplate);
    console.log('执行结果:', result.response);
    console.log('使用适配器:', result.adapter);
    console.log('支持记忆:', result.supportsMemory);
    console.log('历史记录数:', result.history.length);
    
    // 测试上下文保持
    console.log('\n--- 测试上下文保持 ---');
    const followUpTemplate = {
      rounds: [
        {
          role: 'user',
          content: '{{protagonist}}的战斗风格是怎样的？',
          isTemplate: true,
          dataKeys: ['protagonist']
        }
      ]
    };
    
    const followUpResult = await executor.executeTemplate(followUpTemplate);
    console.log('后续回复:', followUpResult.response);
    
    console.log('✅ 增强对话执行器测试完成\n');
    
  } catch (error) {
    console.error('❌ 增强对话执行器测试失败:', error.message);
  }
}

// 测试4: 上下文记忆对比测试
async function testContextMemoryComparison() {
  console.log('=== 测试4: 上下文记忆对比测试 ===');
  
  try {
    // 清空历史
    clearHistory();
    
    const testPrompt = '记住这个信息：主角是李四，他是一名法师，擅长火系魔法。';
    
    // 使用多轮对话
    console.log('--- 使用多轮对话 ---');
    const kgContent = { characters: [], world: '魔法世界' };
    const chapterInfo = { chapter: 1, title: '魔法师' };
    
    const result1 = await multiTurnChat(kgContent, chapterInfo, testPrompt);
    console.log('第一轮回复:', result1.reply);
    
    const result2 = await multiTurnChat(kgContent, chapterInfo, '现在让李四施展一个火系法术，描述过程。');
    console.log('第二轮回复:', result2.reply);
    
    // 使用单轮对话对比
    console.log('\n--- 使用单轮对话对比 ---');
    const singleResponse1 = await chat([
      { role: 'system', content: '你是一个小说创作助手。' },
      { role: 'user', content: testPrompt }
    ]);
    console.log('单轮第一轮回复:', singleResponse1.choices[0].message.content);
    
    const singleResponse2 = await chat([
      { role: 'system', content: '你是一个小说创作助手。' },
      { role: 'user', content: '现在让李四施展一个火系法术，描述过程。' }
    ]);
    console.log('单轮第二轮回复:', singleResponse2.choices[0].message.content);
    
    console.log('✅ 上下文记忆对比测试完成\n');
    
  } catch (error) {
    console.error('❌ 上下文记忆对比测试失败:', error.message);
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('🎯 开始完整的多轮LLM调用测试...\n');
  
  await testSingleTurnChat();
  await testMultiTurnChat();
  await testEnhancedConversation();
  await testContextMemoryComparison();
  
  console.log('🎉 所有测试完成！');
  console.log('\n📊 测试总结:');
  console.log('1. 单轮对话: 每次独立，无上下文记忆');
  console.log('2. 多轮对话: 使用multichat.js维护历史记录');
  console.log('3. 增强执行器: 支持厂商适配和模板化对话');
  console.log('4. 上下文对比: 验证多轮对话的上下文保持能力');
}

// 运行测试
runAllTests().catch(console.error);
