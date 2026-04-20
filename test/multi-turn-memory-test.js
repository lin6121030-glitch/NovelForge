/**
 * 多轮对话记忆测试
 */

import { ConversationExecutor } from '../lib/llm/conversation-builder.js';
import { chat } from '../lib/llm/llm.js';

async function testMultiTurnMemory() {
  console.log('=== 🧪 多轮对话记忆测试 ===');
  
  try {
    const executor = new ConversationExecutor(chat);
    executor.initialize();
    
    console.log('\n📋 第一轮对话：');
    
    // 第一轮：设置背景信息
    const result1 = await executor.executeTemplate({
      rounds: [
        {
          content: '我叫张三，是一名程序员，喜欢科幻小说。',
          role: 'user',
          expectResponse: true
        }
      ]
    });
    
    console.log('AI回复1:', result1.choices[0]?.message?.content);
    
    console.log('\n📋 第二轮对话：');
    
    // 第二轮：基于第一轮的上下文提问
    const result2 = await executor.executeTemplate({
      rounds: [
        {
          content: '根据我刚才介绍的信息，你能记住我的名字和职业吗？另外，我想写一部关于AI的小说，有什么建议？',
          role: 'user',
          expectResponse: true
        }
      ]
    });
    
    console.log('AI回复2:', result2.choices[0]?.message?.content);
    
    console.log('\n📋 第三轮对话：');
    
    // 第三轮：测试长期记忆
    const result3 = await executor.executeTemplate({
      rounds: [
        {
          content: '请总结一下我们刚才的对话内容，包括我的个人信息和讨论的小说主题。',
          role: 'user',
          expectResponse: true
        }
      ]
    });
    
    console.log('AI回复3:', result3.choices[0]?.message?.content);
    
    console.log('\n✅ 多轮对话记忆测试完成！');
    
  } catch (error) {
    console.error('❌ 多轮对话测试失败:', error.message);
  }
}

testMultiTurnMemory().catch(console.error);
