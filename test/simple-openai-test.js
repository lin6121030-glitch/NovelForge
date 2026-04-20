/**
 * 简单OpenAI测试
 */

import { chat } from '../lib/llm/llm.js';

async function testSimpleOpenAI() {
  console.log('=== 🧪 简单OpenAI测试 ===');
  
  try {
    const messages = [
      { role: 'system', content: '你是一个AI助手。' },
      { role: 'user', content: '请简单回复"Hello World"' }
    ];
    
    console.log('发送消息:', messages);
    
    const response = await chat(messages, {
      maxTokens: 50,
      temperature: 0.7
    });
    
    console.log('✅ OpenAI API调用成功');
    console.log('回复:', response.choices[0]?.message?.content);
    
  } catch (error) {
    console.error('❌ OpenAI API调用失败:', error.message);
    
    // 如果是超时，说明API Key或网络有问题
    if (error.message.includes('timeout')) {
      console.log('💡 提示：可能是网络问题或API Key无效');
    }
  }
}

testSimpleOpenAI().catch(console.error);
