/**
 * 模型转换测试
 */

import { chat } from '../lib/llm/llm.js';

async function testModelConversion() {
  console.log('=== 🔄 模型转换测试 ===');
  
  try {
    // 测试简单的对话调用
    const messages = [
      { role: 'system', content: '你是一个AI助手。' },
      { role: 'user', content: '你好，请回复一个简短的问候。' }
    ];
    
    console.log('发送消息:', messages);
    console.log('期望: 应该看到模型转换日志');
    
    const response = await chat(messages, {
      maxTokens: 100,
      temperature: 0.7
    });
    
    console.log('✅ API调用成功');
    console.log('回复:', response.choices[0]?.message?.content);
    
  } catch (error) {
    console.error('❌ API调用失败:', error.message);
    console.error('错误详情:', error);
  }
}

testModelConversion().catch(console.error);
