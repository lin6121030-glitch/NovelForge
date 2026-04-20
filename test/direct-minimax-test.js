/**
 * Direct MiniMax API test based on user's example
 */

import OpenAI from 'openai';

// 直接按照你的示例调用
async function testDirectMiniMax() {
  console.log('🧪 直接测试MiniMax API\n');
  
  try {
    const client = new OpenAI({
      apiKey: 'sk-cp-fFz5mi567KuMh0MTcqGIsI4mvk3ESOX2INO8qdlCAAlMbz2l4OZj18qe0eul7iiz3ur3kZpTlUl8p59q1EqMGlHjuPCFtUonTFuJrS1SvVHzAaM0iN4cYkk',
      baseURL: 'https://api.minimax.chat/v1'
    });

    const response = await client.chat.completions.create({
      model: "M2.7",
      messages: [
        {
          role: "system",
          name: "AI助手",
          content: "你是一个友好、专业的AI助手"
        },
        {
          role: "user", 
          name: "用户",
          content: "你好，请介绍一下你自己"
        }
      ],
      temperature: 1.0,
      top_p: 0.95,
      max_tokens: 2048
    });

    console.log('✅ MiniMax API调用成功');
    console.log('响应:', response.choices[0].message.content);
    
    return {
      success: true,
      response: response.choices[0].message.content
    };
    
  } catch (error) {
    console.error('❌ MiniMax API调用失败:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// 运行测试
testDirectMiniMax();
