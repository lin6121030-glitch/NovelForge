/**
 * Simple configuration test
 */

import { initLLM, getConfig } from '../lib/llm/llm.js';

console.log('🧪 测试配置检测\n');

// 初始化LLM
try {
  initLLM();
  const config = getConfig();
  
  console.log('配置信息:');
  console.log('Provider:', config.provider);
  console.log('BaseURL:', config.baseURL);
  console.log('Model:', config.model);
  console.log('Available Models:', config.availableModels);
  
  console.log('\n✅ 配置检测成功');
  
} catch (error) {
  console.error('❌ 配置检测失败:', error.message);
}
