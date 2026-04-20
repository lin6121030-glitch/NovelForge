/**
 * 多轮对话上下文保持测试
 * 测试伪多轮方式：把多轮对话内容一次性打包发送
 */

import { chat } from '../lib/llm/llm.js';
import { ConversationBuilder, TemplateFactory } from '../lib/llm/conversation-builder.js';

async function testMultiTurnContext() {
  console.log('=== 多轮对话上下文测试 ===\n');

  // 创建一个多轮对话模板
  const template = new ConversationBuilder()
    .system('你是一个问答助手，请基于之前的对话历史回答问题。')
    
    // 第一轮：定义角色
    .user('我们来进行一个测试游戏。我会连续问你5个问题，请记住我们的对话历史。')
    .expectResponse()
    
    // 第二轮：第一个问题
    .user('问题1：请说出你的名字')
    .expectResponse()
    
    // 第三轮：第二个问题（引用之前的上下文）
    .user('问题2：请重复问题1的答案')
    .expectResponse()
    
    // 第四轮：第三个问题
    .user('问题3：请说出我们这局游戏的主题')
    .expectResponse()
    
    // 第五轮：总结
    .user('问题4：请总结我们之间的对话历史')
    .expectResponse()
    
    .build('多轮对话测试');

  console.log('模板轮数:', template.rounds.length);

  // 构建消息
  const context = {};
  const messages = template.buildInitialMessages(context);

  console.log('\n📋 构建的消息序列:');
  messages.forEach((m, i) => {
    console.log(`\n[${i}] role: ${m.role}`);
    console.log(`    content: ${m.content.substring(0, 100)}...`);
  });

  console.log('\n\n=== 发送API请求 ===\n');

  try {
    const response = await chat(messages, {
      maxTokens: 2000,
      temperature: 0.7
    });

    const reply = response.choices[0]?.message?.content;
    console.log('✅ 回复:\n');
    console.log(reply);

  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

testMultiTurnContext().catch(console.error);