/**
 * 调试配置测试
 */

import { ConfigParser } from '../lib/llm/config-parser.js';
import { chat } from '../lib/llm/llm.js';

async function debugConfig() {
  console.log('=== 🔍 调试配置测试 ===');
  
  // 1. 测试ConfigParser
  console.log('\n1. ConfigParser解析:');
  const config = ConfigParser.parse();
  console.log('配置对象:', JSON.stringify(config, null, 2));
  
  console.log('\n2. 模型选择:');
  const selectedModel = ConfigParser.selectModel(config);
  console.log('选择的模型:', selectedModel);
  
  console.log('\n3. API模式选择:');
  const apiMode = ConfigParser.selectAPIMode(config, config.provider);
  console.log('选择的API模式:', apiMode);
  
  // 4. 测试chat函数初始化
  console.log('\n4. 初始化LLM:');
  try {
    const { initLLM, getConfig } = await import('../lib/llm/llm.js');
    initLLM();
    const llmConfig = getConfig();
    console.log('LLM配置:', JSON.stringify(llmConfig, null, 2));
  } catch (error) {
    console.error('LLM初始化失败:', error.message);
  }
}

debugConfig().catch(console.error);
