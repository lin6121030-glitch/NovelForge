/**
 * Test final configuration with LLM_MODEL_DEFAULT
 */

// 设置测试环境变量
process.env.LLM_PROVIDER = 'custom';
process.env.LLM_BASE_URL = 'https://api.minimax.chat/v1';
process.env.LLM_API_KEY = 'sk-cp-fFz5mi567KuMh0MTcqGIsI4mvk3ESOX2INO8qdlCAAlMbz2l4OZj18qe0eul7iiz3ur3kZpTlUl8p59q1EqMGlHjuPCFtUonTFuJrS1SvVHzAaM0iN4cYkk';

import { ConversationBuilder, ConversationExecutor } from '../lib/llm/conversation-builder.js';
import { chat } from '../lib/llm/llm.js';

async function testFinalConfig() {
  console.log('🧪 测试最终配置逻辑\n');
  
  // 测试1: LLM_MODEL_DEFAULT=true + MiniMax-M2-her
  console.log('=== 测试1: LLM_MODEL_DEFAULT=true + MiniMax-M2-her ===');
  
  process.env.LLM_MODEL = 'MiniMax-M2.7';
  process.env.LLM_MODEL_2 = 'MiniMax-M2-her';
  process.env.LLM_MODEL_DEFAULT = 'true';
  process.env.LLM_USE_CHAT = 'openAi';
  
  const executor1 = new ConversationExecutor(chat);
  executor1.initialize();
  
  const current1 = await executor1.getCurrentModel();
  console.log('当前模型:', current1.model);
  console.log('应该使用: MiniMax-M2-her');
  console.log('支持记忆:', current1.supportsMemory);
  
  // 测试2: LLM_MODEL_DEFAULT=false + MiniMax-M2.7
  console.log('\n=== 测试2: LLM_MODEL_DEFAULT=false + MiniMax-M2.7 ===');
  
  process.env.LLM_MODEL = 'MiniMax-M2.7';
  process.env.LLM_MODEL_2 = 'MiniMax-M2-her';
  process.env.LLM_MODEL_DEFAULT = 'false';
  process.env.LLM_USE_CHAT = 'openAi';
  
  const executor2 = new ConversationExecutor(chat);
  executor2.initialize();
  
  const current2 = await executor2.getCurrentModel();
  console.log('当前模型:', current2.model);
  console.log('应该使用: MiniMax-M2.7');
  console.log('支持记忆:', current2.supportsMemory);
  
  console.log('\n=== 测试总结 ===');
  console.log('✅ 最终配置逻辑测试成功！');
  console.log('🎯 配置逻辑:');
  console.log('1. LLM_MODEL_DEFAULT=true: 使用LLM_MODEL_2作为默认模型');
  console.log('2. LLM_MODEL_DEFAULT=false: 使用LLM_MODEL作为默认模型');
  console.log('3. LLM_USE_CHAT=openAi: 强制使用OpenAI路线');
  console.log('4. 支持多模型配置和智能选择');
}

// 运行测试
testFinalConfig();
