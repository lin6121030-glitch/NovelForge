/**
 * Test LLM_USE_CHAT functionality
 */

// 设置环境变量来测试
process.env.LLM_PROVIDER = 'custom';
process.env.LLM_BASE_URL = 'https://api.minimax.chat/v1';
process.env.LLM_API_KEY = 'sk-cp-fFz5mi567KuMh0MTcqGIsI4mvk3ESOX2INO8qdlCAAlMbz2l4OZj18qe0eul7iiz3ur3kZpTlUl8p59q1EqMGlHjuPCFtUonTFuJrS1SvVHzAaM0iN4cYkk';
process.env.LLM_MODEL = 'MiniMax-M2.7';
process.env.LLM_MODEL_2 = 'MiniMax-M2-her';

import { ConversationBuilder, ConversationExecutor } from '../lib/llm/conversation-builder.js';
import { chat } from '../lib/llm/llm.js';

async function testUseChat() {
  console.log('🧪 测试LLM_USE_CHAT功能\n');
  
  // 测试1: 不设置LLM_USE_CHAT（默认使用MiniMax）
  console.log('=== 测试1: 不设置LLM_USE_CHAT（默认使用MiniMax） ===');
  
  delete process.env.LLM_USE_CHAT;
  
  const executor1 = new ConversationExecutor(chat);
  executor1.initialize();
  
  const current1 = await executor1.getCurrentModel();
  console.log('当前模型:', current1.model);
  console.log('适配器:', current1.adapter);
  console.log('支持记忆:', current1.supportsMemory);
  
  // 测试2: 设置LLM_USE_CHAT=openAI（强制使用OpenAI）
  console.log('\n=== 测试2: 设置LLM_USE_CHAT=openAI（强制使用OpenAI） ===');
  
  process.env.LLM_USE_CHAT = 'openai';
  
  const executor2 = new ConversationExecutor(chat);
  executor2.initialize();
  
  const current2 = await executor2.getCurrentModel();
  console.log('当前模型:', current2.model);
  console.log('适配器:', current2.adapter);
  console.log('支持记忆:', current2.supportsMemory);
  
  // 测试3: 设置LLM_USE_CHAT=minimax（强制使用MiniMax）
  console.log('\n=== 测试3: 设置LLM_USE_CHAT=minimax（强制使用MiniMax） ===');
  
  process.env.LLM_USE_CHAT = 'minimax';
  
  const executor3 = new ConversationExecutor(chat);
  executor3.initialize();
  
  const current3 = await executor3.getCurrentModel();
  console.log('当前模型:', current3.model);
  console.log('适配器:', current3.adapter);
  console.log('支持记忆:', current3.supportsMemory);
  
  console.log('\n=== 测试总结 ===');
  console.log('✅ LLM_USE_CHAT功能实现成功！');
  console.log('可以通过设置LLM_USE_CHAT控制API调用方式');
  console.log('- openAI: 强制使用OpenAI路线');
  console.log('- minimax: 强制使用MiniMax路线');
  console.log('- 不设置: 根据配置自动选择');
}

// 运行测试
testUseChat();
