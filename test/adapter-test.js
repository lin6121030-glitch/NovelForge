/**
 * 测试多厂商适配器架构
 */

import { ConversationBuilder, ConversationExecutor } from '../lib/llm/conversation-builder.js';
import { chat } from '../lib/llm/llm.js';

async function testAdapterDetection() {
  console.log('🧪 测试适配器自动检测...\n');
  
  // 模拟不同的配置环境
  const testConfigs = [
    {
      name: 'MiniMax M2-her 配置',
      env: {
        LLM_PROVIDER: 'minimax',
        LLM_MODEL: 'MiniMax-M2.7',
        LLM_BASE_URL: 'https://api.minimax.chat/v1'
      }
    },
    {
      name: 'OpenAI 配置',
      env: {
        LLM_PROVIDER: 'openai',
        LLM_MODEL: 'gpt-4',
        LLM_BASE_URL: 'https://api.openai.com/v1'
      }
    },
    {
      name: '自定义配置',
      env: {
        LLM_PROVIDER: 'custom',
        LLM_MODEL: 'gpt-4',
        LLM_BASE_URL: 'https://api.minimax.chat/v1'
      }
    }
  ];
  
  for (const config of testConfigs) {
    console.log(`\n--- 测试 ${config.name} ---`);
    
    // 临时设置环境变量
    Object.keys(config.env).forEach(key => {
      process.env[key] = config.env[key];
    });
    
    // 创建执行器（会自动检测配置）
    const executor = new ConversationExecutor(chat);
    
    // 设置测试数据
    executor.setContext({
      characters: '李明：28岁，程序员',
      worldSetting: '2045年上海',
      currentChapter: '第1章：开始'
    });
    
    // 创建测试模板
    const template = new ConversationBuilder()
      .user('请记住角色：{{characters}}', ['characters'], { name: '角色设定' })
      .expectResponse()
      .user('请记住世界观：{{worldSetting}}', ['worldSetting'], { name: '世界观设定' })
      .expectResponse()
      .user('请创作：{{currentChapter}}', ['currentChapter'], { name: '创作任务' })
      .expectResponse()
      .build('适配器测试');
    
    try {
      console.log('执行对话测试...');
      const result = await executor.executeTemplate(template, {
        maxTokens: 2000,
        temperature: 0.7
      });
      
      console.log(`✅ ${config.name} 测试成功`);
      console.log(`使用适配器: ${result.adapter || '未知'}`);
      console.log(`支持上下文记忆: ${result.supportsMemory ? '是' : '否'}`);
      console.log(`响应长度: ${result.response?.length || 0}`);
      console.log(`响应预览: ${(result.response || '').substring(0, 100)}...`);
      
    } catch (error) {
      console.error(`❌ ${config.name} 测试失败:`, error.message);
    }
  }
}

async function testMiniMaxSpecialFeatures() {
  console.log('\n🧪 测试MiniMax特殊功能...\n');
  
  // 设置MiniMax配置
  process.env.LLM_PROVIDER = 'minimax';
  process.env.LLM_MODEL = 'MiniMax-M2.7';
  
  const executor = new ConversationExecutor(chat);
  
  // 测试数据
  executor.setContext({
    characters: '主角：李明，配角：王芳',
    worldSetting: '科技发达的2045年',
    style: '白话幽默风格',
    constraints: '积极向上'
  });
  
  console.log('当前配置检测:');
  console.log('- Provider:', process.env.LLM_PROVIDER);
  console.log('- Model:', process.env.LLM_MODEL);
  console.log('- 是否应该使用MiniMax适配器: true');
  
  // 创建模板
  const template = new ConversationBuilder()
    .user('角色设定：{{characters}}', ['characters'], { name: '角色' })
    .expectResponse()
    .user('世界观：{{worldSetting}}', ['worldSetting'], { name: '世界观' })
    .expectResponse()
    .user('风格：{{style}}', ['style'], { name: '风格' })
    .expectResponse()
    .user('约束：{{constraints}}', ['constraints'], { name: '约束' })
    .expectResponse()
    .user('基于以上信息创作小说开头', { name: '创作' })
    .expectResponse()
    .build('MiniMax特殊功能测试');
  
  try {
    console.log('\n执行MiniMax特殊功能测试...');
    const result = await executor.executeTemplate(template, {
      maxTokens: 3000,
      temperature: 0.7
    });
    
    console.log('\n📊 MiniMax测试结果:');
    console.log('- 适配器类型:', result.adapter);
    console.log('- 支持上下文记忆:', result.supportsMemory);
    console.log('- 消息数量:', result.messages.length);
    console.log('- 响应长度:', result.response?.length || 0);
    
    // 分析消息结构
    console.log('\n📋 消息结构分析:');
    result.messages.forEach((msg, index) => {
      const role = msg.role;
      const content = msg.content.length > 50 ? 
        msg.content.substring(0, 50) + '...' : 
        msg.content;
      console.log(`[${index}] ${role}: ${content}`);
    });
    
  } catch (error) {
    console.error('❌ MiniMax测试失败:', error);
  }
}

async function testExtensibility() {
  console.log('\n🧪 测试扩展性...\n');
  
  // 模拟未来可能的新厂商
  const futureConfigs = [
    {
      name: '未来厂商A - 支持上下文记忆',
      env: {
        LLM_PROVIDER: 'future-a',
        LLM_MODEL: 'FutureModel-v1'
      },
      expectedMemory: true
    },
    {
      name: '未来厂商B - 不支持上下文记忆',
      env: {
        LLM_PROVIDER: 'future-b',
        LLM_MODEL: 'BasicModel-v2'
      },
      expectedMemory: false
    }
  ];
  
  for (const config of futureConfigs) {
    console.log(`\n--- 测试 ${config.name} ---`);
    
    // 设置配置
    Object.keys(config.env).forEach(key => {
      process.env[key] = config.env[key];
    });
    
    const executor = new ConversationExecutor(chat);
    const detectedSupport = executor.enhancedExecutor.adapter.supportsContextMemory();
    
    console.log(`期望支持记忆: ${config.expectedMemory}`);
    console.log(`实际检测支持: ${detectedSupport}`);
    console.log(`检测结果: ${detectedSupport === config.expectedMemory ? '✅ 正确' : '❌ 错误'}`);
    
    // 这里可以扩展新的适配器
    if (config.env.LLM_PROVIDER === 'future-a') {
      console.log('🚀 可以扩展 FutureAAdapter');
    }
  }
}

// 运行所有测试
async function runAdapterTests() {
  console.log('🚀 开始多厂商适配器测试\n');
  
  try {
    // 测试1：适配器检测
    await testAdapterDetection();
    
    // 测试2：MiniMax特殊功能
    await testMiniMaxSpecialFeatures();
    
    // 测试3：扩展性
    await testExtensibility();
    
    console.log('\n🎉 所有适配器测试完成');
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

// 运行测试
runAdapterTests();
