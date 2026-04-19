/**
 * 演示多轮对话的消息累积过程
 */

import { ConversationBuilder, ConversationExecutor } from '../lib/llm/conversation-builder.js';

// 模拟chat函数，显示每次调用时收到的完整消息历史
async function debugChat(messages, options) {
  console.log('\n=== LLM被调用 ===');
  console.log(`收到的消息总数: ${messages.length}`);
  
  messages.forEach((msg, index) => {
    const role = msg.role.toUpperCase();
    const content = msg.content.length > 50 ? 
      msg.content.substring(0, 50) + '...' : 
      msg.content;
    console.log(`[${index}] ${role}: ${content}`);
  });
  
  console.log('==================\n');
  
  // 模拟LLM响应
  return {
    choices: [{
      message: {
        content: '好的，我理解了。'
      }
    }]
  };
}

async function demonstrateConversationFlow() {
  console.log('🎯 演示多轮对话的消息累积过程\n');
  
  const template = new ConversationBuilder()
    .system('你是一个记忆测试助手。')
    .user('我的名字是张三', { name: '第1轮：介绍姓名' })
    .expectResponse()
    .user('我今年25岁', { name: '第2轮：介绍年龄' })
    .expectResponse()
    .user('我是程序员', { name: '第3轮：介绍职业' })
    .expectResponse()
    .user('请重复我的基本信息', { name: '第4轮：测试记忆' })
    .expectResponse()
    .build('记忆测试');
  
  const executor = new ConversationExecutor(debugChat);
  
  console.log('开始执行多轮对话...\n');
  
  const result = await executor.executeTemplate(template);
  
  console.log('\n🎉 对话完成！');
  console.log('总轮次:', result.history.length);
  console.log('最终消息数组长度:', result.messages.length);
}

// 运行演示
demonstrateConversationFlow();
