/**
 * MiniMax原生API测试
 */

import { chat } from '../lib/llm/llm.js';

async function testMiniMaxNative() {
  console.log('=== 🧪 MiniMax原生API测试 ===');
  
  // 临时设置环境变量为MINIMAX模式
  process.env.LLM_API_MODE = 'MINIMAX';
  
  try {
    const messages = [
      { role: 'system', content: '你是一个AI助手。' },
      { role: 'user', content: '请简单回复"Hello MiniMax"' }
    ];
    
    console.log('发送消息:', messages);
    console.log('使用MiniMax原生API');
    
    const response = await chat(messages, {
      maxTokens: 100,
      temperature: 0.7
    });
    
    console.log('✅ MiniMax API调用成功');
    console.log('回复:', response.choices[0]?.message?.content);
    
  } catch (error) {
    console.error('❌ MiniMax API调用失败:', error.message);
  }
}

testMiniMaxNative().catch(console.error);
