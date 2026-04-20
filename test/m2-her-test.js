/**
 * Test MiniMax M2-her model configuration and context memory
 */

import { ConversationBuilder, ConversationExecutor } from '../lib/llm/conversation-builder.js';
import { chat } from '../lib/llm/llm.js';

async function testM2HerConfiguration() {
  console.log('🧪 测试MiniMax M2-her配置\n');
  
  // 创建执行器
  const executor = new ConversationExecutor(chat);
  executor.initialize();
  
  console.log('=== 检查模型配置 ===');
  const availableModels = executor.getAvailableModels();
  console.log('Primary:', availableModels.primary);
  console.log('Secondary:', availableModels.secondary || '未配置');
  console.log('Tertiary:', availableModels.tertiary || '未配置');
  
  console.log('\n=== 测试M2-her模型切换 ===');
  try {
    // 切换到M2-her模型
    await executor.switchModel('secondary'); // 切换到LLM_MODEL_2
    
    const currentModel = await executor.getCurrentModel();
    console.log('切换后模型:', currentModel.model);
    console.log('支持记忆:', currentModel.supportsMemory);
    
    // 测试上下文记忆功能
    console.log('\n=== 测试上下文记忆功能 ===');
    
    const memoryTemplate = new ConversationBuilder()
      .system('你是记忆测试助手，请记住所有信息。')
      .user('请记住：主角叫李明，28岁，AI研究员')
      .expectResponse()
      .user('请记住：他工作在上海的AI实验室')
      .expectResponse()
      .user('现在请告诉我主角的名字、年龄和工作地点')
      .expectResponse()
      .build('记忆测试');
    
    executor.setContext({
      protagonist: '李明，28岁，AI研究员',
      location: '上海AI实验室'
    });
    
    const result = await executor.executeTemplate(memoryTemplate, {
      maxTokens: 1000,
      temperature: 0.7
    });
    
    console.log('✅ M2-her记忆测试成功');
    console.log('响应内容:', result.finalResponse);
    console.log('支持记忆:', result.supportsMemory);
    
    // 检查是否记住信息
    const response = result.finalResponse || '';
    const remembersName = response.includes('李明');
    const remembersAge = response.includes('28');
    const remembersLocation = response.includes('上海');
    
    console.log('\n=== 记忆效果评估 ===');
    console.log('记住名字:', remembersName ? '✅' : '❌');
    console.log('记住年龄:', remembersAge ? '✅' : '❌');
    console.log('记住地点:', remembersLocation ? '✅' : '❌');
    
    const memoryScore = [remembersName, remembersAge, remembersLocation].filter(Boolean).length;
    console.log(`记忆准确率: ${memoryScore}/3 (${(memoryScore/3*100).toFixed(1)}%)`);
    
    return {
      success: true,
      model: currentModel.model,
      supportsMemory: currentModel.supportsMemory,
      memoryScore,
      memoryAccuracy: memoryScore / 3
    };
    
  } catch (error) {
    console.error('❌ M2-her测试失败:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function testModelComparison() {
  console.log('\n🧪 模型对比测试\n');
  
  const executor = new ConversationExecutor(chat);
  executor.initialize();
  
  const testPrompt = '请简单介绍你自己，并说明你的特点。';
  
  // 测试M2.7模型
  console.log('=== 测试MiniMax M2.7 ===');
  try {
    await executor.switchModel('primary'); // 切换到LLM_MODEL
    
    const m27Result = await chat([
      { role: 'system', content: '你是AI助手。' },
      { role: 'user', content: testPrompt }
    ], { maxTokens: 500 });
    
    console.log('M2.7响应:', m27Result.choices[0].message.content.substring(0, 100) + '...');
    
  } catch (error) {
    console.error('M2.7测试失败:', error.message);
  }
  
  // 测试M2-her模型
  console.log('\n=== 测试MiniMax M2-her ===');
  try {
    await executor.switchModel('secondary'); // 切换到LLM_MODEL_2
    
    const m2herResult = await chat([
      { role: 'system', content: '你是具备上下文记忆的AI助手。' },
      { role: 'user', content: testPrompt }
    ], { maxTokens: 500 });
    
    console.log('M2-her响应:', m2herResult.choices[0].message.content.substring(0, 100) + '...');
    
  } catch (error) {
    console.error('M2-her测试失败:', error.message);
  }
}

async function runM2HerTests() {
  console.log('🚀 开始MiniMax M2-her模型测试\n');
  
  try {
    // 测试1: M2-her配置和记忆
    const memoryTest = await testM2HerConfiguration();
    
    // 测试2: 模型对比
    await testModelComparison();
    
    console.log('\n=== 测试总结 ===');
    if (memoryTest.success) {
      console.log('✅ M2-her配置成功');
      console.log(`✅ 记忆准确率: ${(memoryTest.memoryAccuracy * 100).toFixed(1)}%`);
      
      if (memoryTest.memoryAccuracy >= 0.8) {
        console.log('🎉 M2-her上下文记忆功能正常！');
      } else {
        console.log('⚠️ M2-her记忆功能需要优化');
      }
    } else {
      console.log('❌ M2-her配置失败');
    }
    
    console.log('\n=== 使用建议 ===');
    console.log('1. 对于需要上下文记忆的任务，使用M2-her模型');
    console.log('2. 对于一般对话任务，可以使用M2.7模型');
    console.log('3. 根据任务需求动态切换模型以获得最佳效果');
    
  } catch (error) {
    console.error('测试执行失败:', error);
  }
}

// 运行测试
runM2HerTests();
