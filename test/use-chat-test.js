/**
 * Test LLM_USE_CHAT functionality
 */

import { ConversationBuilder, ConversationExecutor } from '../lib/llm/conversation-builder.js';
import { chat } from '../lib/llm/llm.js';

async function testUseChat() {
  console.log('🧪 测试LLM_USE_CHAT功能\n');
  
  // 测试1: 检查环境变量
  console.log('=== 环境变量检查 ===');
  console.log('LLM_PROVIDER:', process.env.LLM_PROVIDER);
  console.log('LLM_USE_CHAT:', process.env.LLM_USE_CHAT);
  console.log('LLM_MODEL:', process.env.LLM_MODEL);
  
  // 测试2: 强制使用OpenAI路线
  console.log('\n=== 强制使用OpenAI路线 ===');
  
  const executor = new ConversationExecutor(chat);
  executor.initialize();
  
  executor.setContext({
    protagonist: '李明，28岁，AI研究员',
    worldSetting: '2045年上海，AI技术中心'
  });
  
  const template = new ConversationBuilder()
    .system('你是专业的AI助手，请简洁回答。')
    .user('你好，请介绍一下你自己')
    .expectResponse()
    .build('OpenAI路线测试');
  
  try {
    const result = await executor.executeTemplate(template, {
      maxTokens: 1000,
      temperature: 0.7
    });
    
    console.log('✅ OpenAI路线测试成功');
    console.log('适配器:', result.adapter);
    console.log('支持记忆:', result.supportsMemory);
    console.log('响应:', result.finalResponse?.substring(0, 100) + '...');
    
  } catch (error) {
    console.error('❌ OpenAI路线测试失败:', error.message);
  }
}

// 运行测试
testUseChat();
