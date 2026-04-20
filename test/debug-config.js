/**
 * Debug configuration loading
 */

// 直接检查环境变量
console.log('=== 直接检查环境变量 ===');
console.log('LLM_PROVIDER:', process.env.LLM_PROVIDER);
console.log('LLM_BASE_URL:', process.env.LLM_BASE_URL);
console.log('LLM_MODEL:', process.env.LLM_MODEL);
console.log('LLM_MODEL_2:', process.env.LLM_MODEL_2);

// 检查配置文件是否存在
import fs from 'fs';
import path from 'path';

console.log('\n=== 检查配置文件 ===');
const searchPaths = [
  process.cwd(),
  path.join(process.cwd(), '..'),
  path.join(process.cwd(), '..', 'novel-l'),
  path.join(process.cwd(), '..', 'my-idea')
];

for (const projectDir of searchPaths) {
  const envFile = path.join(projectDir, '.novelforge.env');
  console.log(`检查路径: ${envFile}`);
  console.log(`文件存在: ${fs.existsSync(envFile)}`);
  
  if (fs.existsSync(envFile)) {
    const content = fs.readFileSync(envFile, 'utf-8');
    console.log('文件内容:');
    console.log(content);
    break;
  }
}

console.log('\n=== 测试ConfigDetector ===');
import { ConfigDetector } from '../lib/llm/conversation-adapter.js';

const config = ConfigDetector.detectFromEnv();
console.log('检测到的配置:', config);
