/**
 * 简单模板测试
 */

import { ConversationExecutor } from '../lib/llm/conversation-builder.js';
import { chat } from '../lib/llm/llm.js';

async function testSimpleTemplate() {
  console.log('=== 🧪 简单模板测试 ===');
  
  try {
    const executor = new ConversationExecutor(chat);
    executor.initialize();
    
    console.log('\n📋 测试简单模板：');
    
    // 测试简单模板
    const result = await executor.executeTemplate({
      rounds: [
        {
          content: '你好，请回复"测试成功"',
          role: 'user'
        }
      ]
    });
    
    console.log('AI回复:', result.choices[0]?.message?.content);
    console.log('✅ 简单模板测试完成！');
    
  } catch (error) {
    console.error('❌ 简单模板测试失败:', error.message);
  }
}

testSimpleTemplate().catch(console.error);
