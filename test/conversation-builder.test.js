/**
 * 测试多轮对话框架
 */

import { 
  ConversationRound, 
  ConversationTemplate, 
  ConversationExecutor, 
  ConversationBuilder, 
  TemplateFactory 
} from '../lib/llm/conversation-builder.js';

// 模拟chat函数
async function mockChat(messages, options) {
  console.log('\n=== 收到消息 ===');
  messages.forEach((msg, index) => {
    console.log(`[${index}] ${msg.role}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`);
  });
  console.log(`选项:`, options);
  
  // 模拟LLM响应
  return {
    choices: [{
      message: {
        content: '好的，我理解了。请继续。'
      }
    }]
  };
}

async function testBasicConversationBuilder() {
  console.log('\n🧪 测试1: 基础对话构建器');
  
  const template = new ConversationBuilder()
    .system('你是一个测试助手。', { name: '系统设定' })
    .user('你好，请确认你理解了角色。', { name: '问候' })
    .expectResponse()
    .userTemplate('这是测试数据: {{testData}}', ['testData'], { name: '数据测试' })
    .expectResponse()
    .build('测试模板', '用于测试的简单模板');
  
  console.log('✓ 模板创建成功');
  console.log('轮次数:', template.rounds.length);
  console.log('需要响应的轮次:', template.getResponseRequiredIndices());
  
  return template;
}

async function testTemplateFactory() {
  console.log('\n🧪 测试2: 模板工厂');
  
  // 测试Writer模板
  const writerTemplate = TemplateFactory.createWriterTemplate();
  console.log('✓ Writer模板创建成功');
  console.log('轮次数:', writerTemplate.rounds.length);
  
  // 测试Planner模板
  const plannerTemplate = TemplateFactory.createPlannerTemplate();
  console.log('✓ Planner模板创建成功');
  console.log('轮次数:', plannerTemplate.rounds.length);
  
  // 测试Composer模板
  const composerTemplate = TemplateFactory.createComposerTemplate();
  console.log('✓ Composer模板创建成功');
  console.log('轮次数:', composerTemplate.rounds.length);
  
  return { writerTemplate, plannerTemplate, composerTemplate };
}

async function testConversationExecutor() {
  console.log('\n🧪 测试3: 对话执行器');
  
  const executor = new ConversationExecutor(mockChat);
  
  // 设置测试上下文
  executor.setContext({
    testData: '这是测试数据内容',
    characters: '角色1: 主角\n角色2: 配角',
    chapterInfo: '第1章: 开始'
  });
  
  // 创建简单模板
  const template = new ConversationBuilder()
    .system('你是一个测试助手。')
    .user('你好，这是测试数据: {{testData}}，请确认。', { name: '测试' })
    .expectResponse()
    .user('角色信息: {{characters}}，章节: {{chapterInfo}}', { name: '信息确认' })
    .expectResponse()
    .build('执行器测试模板');
  
  try {
    const result = await executor.executeTemplate(template, {
      maxTokens: 1000
    });
    
    console.log('✓ 执行成功');
    console.log('最终响应:', result.finalResponse);
    console.log('历史记录数:', result.history.length);
    
    return result;
  } catch (error) {
    console.error('✗ 执行失败:', error);
    return null;
  }
}

async function testWriterTemplateWithContext() {
  console.log('\n🧪 测试4: Writer模板与真实上下文');
  
  const executor = new ConversationExecutor(mockChat);
  
  // 模拟真实的KG数据
  const mockKG = {
    characters: '张三: 主角，25岁，程序员\n李四: 配角，张三的朋友',
    factions: '科技公司: 主角所在的公司\n创业团队: 对立势力',
    locations: '北京市: 故事发生地\n中关村: 科技公司聚集地',
    worldRules: '科技发达，AI普及\n社会竞争激烈',
    style: '语言幽默，贴近生活\n节奏明快，有网感',
    constraints: '避免暴力内容\n保持正能量',
    outline: '第一章: 主角介绍\n第二章: 遇到挑战\n第三章: 解决问题',
    chapterInfo: '当前章节: 第1章\n> 事件: 主角介绍和背景设定'
  };
  
  executor.setContext(mockKG);
  
  const writerTemplate = TemplateFactory.createWriterTemplate();
  
  try {
    // 只执行前两轮进行测试
    const testTemplate = new ConversationBuilder()
      .system(writerTemplate.rounds[0].content)
      .user(writerTemplate.rounds[1].content, { name: '角色定义' })
      .expectResponse()
      .build('Writer测试模板');
    
    const result = await executor.executeTemplate(testTemplate, {
      maxTokens: 2000
    });
    
    console.log('✓ Writer模板测试成功');
    console.log('响应长度:', result.finalResponse.length);
    
    return result;
  } catch (error) {
    console.error('✗ Writer模板测试失败:', error);
    return null;
  }
}

async function runAllTests() {
  console.log('🚀 开始测试多轮对话框架\n');
  
  try {
    // 测试1: 基础构建器
    const basicTemplate = await testBasicConversationBuilder();
    
    // 测试2: 模板工厂
    const templates = await testTemplateFactory();
    
    // 测试3: 执行器
    const executionResult = await testConversationExecutor();
    
    // 测试4: Writer模板
    const writerResult = await testWriterTemplateWithContext();
    
    console.log('\n✅ 所有测试完成');
    console.log('基础模板轮数:', basicTemplate.rounds.length);
    console.log('执行器历史记录:', executionResult?.history.length || 0);
    console.log('Writer模板测试:', writerResult ? '成功' : '失败');
    
  } catch (error) {
    console.error('\n❌ 测试过程中出错:', error);
  }
}

// 运行测试
runAllTests();

export { 
  testBasicConversationBuilder,
  testTemplateFactory,
  testConversationExecutor,
  testWriterTemplateWithContext,
  runAllTests
};
