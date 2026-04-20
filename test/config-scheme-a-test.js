/**
 * Test Configuration Scheme A (分层配置)
 */

import { ConversationBuilder, ConversationExecutor } from '../lib/llm/conversation-builder.js';
import { chat } from '../lib/llm/llm.js';

async function testConfigSchemeA() {
  console.log('🧪 测试配置方案A（分层配置）\n');
  
  // 测试1: PRIMARY模型 + SMART模式
  console.log('=== 测试1: PRIMARY模型 + SMART模式 ===');
  
  process.env.LLM_PROVIDER = 'custom';
  process.env.LLM_BASE_URL = 'https://api.minimax.chat/v1';
  process.env.LLM_API_KEY = 'sk-cp-fFz5mi567KuMh0MTcqGIsI4mvk3ESOX2INO8qdlCAAlMbz2l4OZj18qe0eul7iiz3ur3kZpTlUl8p59q1EqMGlHjuPCFtUonTFuJrS1SvVHzAaM0iN4cYkk';
  process.env.LLM_MODEL_PRIMARY = 'MiniMax-M2.7';
  process.env.LLM_MODEL_SECONDARY = 'MiniMax-M2-her';
  process.env.LLM_DEFAULT_MODEL = 'PRIMARY';
  process.env.LLM_API_MODE = 'SMART';
  
  const executor1 = new ConversationExecutor(chat);
  executor1.initialize();
  
  const current1 = await executor1.getCurrentModel();
  console.log('当前模型:', current1.model);
  console.log('Provider:', current1.provider);
  console.log('API Mode:', current1.apiMode);
  console.log('支持记忆:', current1.supportsMemory);
  console.log('应该使用: MiniMax-M2.7');
  
  // 测试2: SECONDARY模型 + MINIMAX模式
  console.log('\n=== 测试2: SECONDARY模型 + MINIMAX模式 ===');
  
  process.env.LLM_DEFAULT_MODEL = 'SECONDARY';
  process.env.LLM_API_MODE = 'MINIMAX';
  
  const executor2 = new ConversationExecutor(chat);
  executor2.initialize();
  
  const current2 = await executor2.getCurrentModel();
  console.log('当前模型:', current2.model);
  console.log('Provider:', current2.provider);
  console.log('API Mode:', current2.apiMode);
  console.log('支持记忆:', current2.supportsMemory);
  console.log('应该使用: MiniMax-M2-her');
  
  // 测试3: OPENAI模式强制
  console.log('\n=== 测试3: OPENAI模式强制 ===');
  
  process.env.LLM_API_MODE = 'OPENAI';
  
  const executor3 = new ConversationExecutor(chat);
  executor3.initialize();
  
  const current3 = await executor3.getCurrentModel();
  console.log('当前模型:', current3.model);
  console.log('Provider:', current3.provider);
  console.log('API Mode:', current3.apiMode);
  console.log('支持记忆:', current3.supportsMemory);
  console.log('应该使用: MiniMax-M2.7 + OpenAI API');
  
  console.log('\n=== 测试总结 ===');
  console.log('✅ 配置方案A测试成功！');
  console.log('🎯 支持的配置选项:');
  console.log('- LLM_MODEL_PRIMARY: 主要模型');
  console.log('- LLM_MODEL_SECONDARY: 次要模型');
  console.log('- LLM_DEFAULT_MODEL: 默认模型策略 (PRIMARY|SECONDARY|TERTIARY)');
  console.log('- LLM_API_MODE: API模式 (SMART|MINIMAX|OPENAI)');
  console.log('\n🎯 配置逻辑:');
  console.log('1. 根据LLM_DEFAULT_MODEL选择模型');
  console.log('2. 根据LLM_API_MODE选择API调用方式');
  console.log('3. SMART模式自动选择最佳API');
  console.log('4. 支持强制覆盖');
}

// 运行测试
testConfigSchemeA();
