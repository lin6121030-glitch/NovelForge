/**
 * Simple ConfigParser test
 */

import { ConfigParser } from '../lib/llm/config-parser.js';

console.log('🧪 测试ConfigParser\n');

// 设置测试环境变量
process.env.LLM_PROVIDER = 'custom';
process.env.LLM_BASE_URL = 'https://api.minimax.chat/v1';
process.env.LLM_API_KEY = 'test-key';
process.env.LLM_MODEL_PRIMARY = 'MiniMax-M2.7';
process.env.LLM_MODEL_SECONDARY = 'MiniMax-M2-her';
process.env.LLM_DEFAULT_MODEL = 'SECONDARY';
process.env.LLM_API_MODE = 'SMART';

try {
  const config = ConfigParser.parse();
  console.log('✅ ConfigParser解析成功');
  console.log('Provider:', config.provider);
  console.log('Models:', config.models);
  console.log('Default Model Strategy:', config.defaultModelStrategy);
  console.log('API Mode:', config.apiMode);
  
  const selectedModel = ConfigParser.selectModel(config);
  console.log('Selected Model:', selectedModel);
  
  const apiMode = ConfigParser.selectAPIMode(config, config.provider);
  console.log('Selected API Mode:', apiMode);
  
  console.log('🎉 ConfigParser测试成功！');
  
} catch (error) {
  console.error('❌ ConfigParser测试失败:', error.message);
}
