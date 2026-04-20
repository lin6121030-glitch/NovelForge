/**
 * Test model switching functionality for multi-round conversations
 */

import { ConversationBuilder, TemplateFactory, ConversationExecutor } from '../lib/llm/conversation-builder.js';
import { chat } from '../lib/llm/llm.js';

async function testModelSwitching() {
  console.log('🧪 测试多模型切换功能\n');
  
  // 创建对话执行器
  const executor = new ConversationExecutor(chat);
  
  // 初始化
  executor.initialize();
  
  // 设置测试数据
  executor.setContext({
    characters: '主角：李明，28岁，AI研究员',
    worldSetting: '2045年上海，AI技术中心',
    currentChapter: '第1章：意外的发现'
  });
  
  // 检查可用模型
  console.log('📋 可用模型配置:');
  const availableModels = executor.getAvailableModels();
  console.log('Primary:', availableModels.primary);
  console.log('Secondary:', availableModels.secondary);
  console.log('Tertiary:', availableModels.tertiary);
  
  // 检查当前模型
  console.log('\n🎯 当前模型信息:');
  const currentModel = await executor.getCurrentModel();
  console.log('Model:', currentModel.model);
  console.log('Provider:', currentModel.provider);
  console.log('Supports Memory:', currentModel.supportsMemory);
  
  // 创建测试模板
  const template = new ConversationBuilder()
    .system('你是小说创作助手，请记住所有提供的信息。')
    .userTemplate('角色设定：{{characters}}', ['characters'])
    .expectResponse()
    .userTemplate('世界观：{{worldSetting}}', ['worldSetting'])
    .expectResponse()
    .userTemplate('创作任务：{{currentChapter}}', ['currentChapter'])
    .expectResponse()
    .build('模型切换测试');
  
  console.log('\n=== 测试当前配置的对话 ===');
  try {
    const result1 = await executor.executeTemplate(template, {
      maxTokens: 1000,
      temperature: 0.7
    });
    
    console.log('✅ 当前配置对话成功');
    console.log('使用适配器:', result1.adapter);
    console.log('支持记忆:', result1.supportsMemory);
    console.log('响应长度:', result1.finalResponse?.length || 0);
    
  } catch (error) {
    console.error('❌ 当前配置对话失败:', error.message);
  }
  
  // 如果有多个模型，测试切换
  if (availableModels.secondary) {
    console.log('\n=== 测试切换到次要模型 ===');
    try {
      await executor.switchModel('secondary');
      const switchedModel = await executor.getCurrentModel();
      console.log('切换后模型:', switchedModel.model);
      console.log('切换后Provider:', switchedModel.provider);
      
      const result2 = await executor.executeTemplate(template, {
        maxTokens: 1000,
        temperature: 0.7
      });
      
      console.log('✅ 切换模型对话成功');
      console.log('使用适配器:', result2.adapter);
      console.log('响应长度:', result2.finalResponse?.length || 0);
      
    } catch (error) {
      console.error('❌ 切换模型对话失败:', error.message);
    }
  }
  
  // 测试智能切换方法
  console.log('\n=== 测试智能切换方法 ===');
  
  try {
    // 尝试切换到OpenAI
    console.log('尝试切换到OpenAI...');
    await executor.switchToOpenAI();
    const openaiModel = await executor.getCurrentModel();
    console.log('OpenAI模型:', openaiModel.model);
    
  } catch (error) {
    console.log('切换到OpenAI失败:', error.message);
  }
  
  try {
    // 尝试切换到MiniMax
    console.log('尝试切换到MiniMax...');
    await executor.switchToMiniMax();
    const minimaxModel = await executor.getCurrentModel();
    console.log('MiniMax模型:', minimaxModel.model);
    
  } catch (error) {
    console.log('切换到MiniMax失败:', error.message);
  }
  
  console.log('\n🎉 模型切换测试完成');
}

async function testMultiProviderScenario() {
  console.log('\n🧪 测试多厂商使用场景\n');
  
  const executor = new ConversationExecutor(chat);
  executor.initialize();
  
  // 场景1: 使用MiniMax进行角色设定（利用上下文记忆）
  console.log('=== 场景1: 使用MiniMax进行角色设定 ===');
  try {
    await executor.switchToMiniMax();
    const minimaxInfo = await executor.getCurrentModel();
    console.log('使用模型:', minimaxInfo.model, '(支持记忆:', minimaxInfo.supportsMemory + ')');
    
    const characterTemplate = new ConversationBuilder()
      .system('你是角色设定专家，请记住所有角色细节。')
      .user('请记住这个角色：李明，28岁，AI研究员，性格内向但才华横溢')
      .expectResponse()
      .user('请记住这个角色：王芳，26岁，数据科学家，性格开朗善于沟通')
      .expectResponse()
      .user('总结一下这两个角色的关系和特点')
      .expectResponse()
      .build('角色设定');
    
    const result1 = await executor.executeTemplate(characterTemplate, { maxTokens: 1000 });
    console.log('✅ MiniMax角色设定完成');
    console.log('响应长度:', result1.finalResponse?.length || 0);
    
  } catch (error) {
    console.log('MiniMax角色设定失败:', error.message);
  }
  
  // 场景2: 切换到OpenAI进行创意写作
  console.log('\n=== 场景2: 切换到OpenAI进行创意写作 ===');
  try {
    await executor.switchToOpenAI();
    const openaiInfo = await executor.getCurrentModel();
    console.log('使用模型:', openaiInfo.model, '(支持记忆:', openaiInfo.supportsMemory + ')');
    
    const writingTemplate = new ConversationBuilder()
      .system('你是创意写作专家，擅长小说创作。')
      .user('基于角色李明和王芳的设定，写一段他们在AI实验室相遇的场景')
      .expectResponse()
      .build('创意写作');
    
    const result2 = await executor.executeTemplate(writingTemplate, { maxTokens: 1500 });
    console.log('✅ OpenAI创意写作完成');
    console.log('响应长度:', result2.finalResponse?.length || 0);
    
  } catch (error) {
    console.log('OpenAI创意写作失败:', error.message);
  }
  
  console.log('\n🎉 多厂商场景测试完成');
}

// 运行测试
async function runModelSwitchingTests() {
  console.log('🚀 开始模型切换功能测试\n');
  
  try {
    await testModelSwitching();
    await testMultiProviderScenario();
    
    console.log('\n✅ 所有测试完成');
    console.log('\n📝 使用建议:');
    console.log('1. 使用MiniMax进行需要上下文记忆的任务（如角色设定、世界观构建）');
    console.log('2. 使用OpenAI进行创意写作任务');
    console.log('3. 根据任务需求动态切换模型以获得最佳效果');
    
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

// 运行测试
runModelSwitchingTests();
