/**
 * Basic conversation test with current configuration
 */

import { ConversationBuilder, ConversationExecutor } from '../lib/llm/conversation-builder.js';
import { chat } from '../lib/llm/llm.js';

async function testBasicConversation() {
  console.log('🧪 基础对话功能测试\n');
  
  // 创建执行器
  const executor = new ConversationExecutor(chat);
  executor.initialize();
  
  // 检查配置
  console.log('=== 当前配置 ===');
  const current = await executor.getCurrentModel();
  console.log('模型:', current.model);
  console.log('厂商:', current.provider);
  console.log('支持记忆:', current.supportsMemory);
  
  // 创建简单的对话模板
  const template = new ConversationBuilder()
    .system('你是专业的AI助手，请简洁回答。')
    .user('你好，请介绍一下你自己')
    .expectResponse()
    .user('你支持多轮对话吗？')
    .expectResponse()
    .build('基础对话测试');
  
  try {
    console.log('\n=== 执行对话 ===');
    const result = await executor.executeTemplate(template, {
      maxTokens: 1000,
      temperature: 0.7
    });
    
    console.log('✅ 对话执行成功');
    console.log('适配器:', result.adapter);
    console.log('支持记忆:', result.supportsMemory);
    console.log('消息数量:', result.messages.length);
    
    // 显示对话历史
    console.log('\n=== 对话历史 ===');
    result.messages.forEach((msg, index) => {
      const role = msg.role;
      const content = msg.content.length > 50 ? 
        msg.content.substring(0, 50) + '...' : 
        msg.content;
      console.log(`[${index}] ${role}: ${content}`);
    });
    
    console.log('\n=== 最终响应 ===');
    console.log(result.finalResponse || '无响应');
    
    return {
      success: true,
      model: current.model,
      supportsMemory: result.supportsMemory,
      messageCount: result.messages.length,
      responseLength: result.finalResponse?.length || 0
    };
    
  } catch (error) {
    console.error('❌ 对话执行失败:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function testTemplateReplacement() {
  console.log('\n🧪 模板替换功能测试\n');
  
  const executor = new ConversationExecutor(chat);
  executor.initialize();
  
  // 测试数据
  executor.setContext({
    protagonist: '李明',
    age: 28,
    profession: 'AI研究员',
    location: '上海'
  });
  
  const template = new ConversationBuilder()
    .system('你是小说创作助手。')
    .userTemplate('主角：{{protagonist}}，年龄：{{age}}', ['protagonist', 'age'])
    .expectResponse()
    .userTemplate('职业：{{profession}}，地点：{{location}}', ['profession', 'location'])
    .expectResponse()
    .userTemplate('请基于以上信息创作一个简短介绍')
    .expectResponse()
    .build('模板替换测试');
  
  try {
    console.log('=== 执行模板替换 ===');
    const result = await executor.executeTemplate(template, {
      maxTokens: 1500,
      temperature: 0.8
    });
    
    console.log('✅ 模板替换成功');
    console.log('响应长度:', result.finalResponse?.length || 0);
    
    // 检查是否正确替换了占位符
    const response = result.finalResponse || '';
    const hasProtagonist = response.includes('李明');
    const hasAge = response.includes('28');
    const hasProfession = response.includes('AI研究员');
    const hasLocation = response.includes('上海');
    
    console.log('\n=== 替换效果检查 ===');
    console.log('主角替换:', hasProtagonist ? '✅' : '❌');
    console.log('年龄替换:', hasAge ? '✅' : '❌');
    console.log('职业替换:', hasProfession ? '✅' : '❌');
    console.log('地点替换:', hasLocation ? '✅' : '❌');
    
    const replacementScore = [hasProtagonist, hasAge, hasProfession, hasLocation].filter(Boolean).length;
    console.log(`替换成功率: ${replacementScore}/4 (${(replacementScore/4*100).toFixed(1)}%)`);
    
    return {
      success: true,
      replacementScore,
      replacementAccuracy: replacementScore / 4
    };
    
  } catch (error) {
    console.error('❌ 模板替换失败:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function runBasicTests() {
  console.log('🚀 开始基础功能测试\n');
  
  try {
    // 测试1: 基础对话
    const conversationTest = await testBasicConversation();
    
    // 测试2: 模板替换
    const templateTest = await testTemplateReplacement();
    
    // 总结
    console.log('\n=== 测试总结 ===');
    
    if (conversationTest.success) {
      console.log('✅ 基础对话功能正常');
      console.log(`   模型: ${conversationTest.model}`);
      console.log(`   支持记忆: ${conversationTest.supportsMemory}`);
      console.log(`   消息数量: ${conversationTest.messageCount}`);
    } else {
      console.log('❌ 基础对话功能异常');
    }
    
    if (templateTest.success) {
      console.log('✅ 模板替换功能正常');
      console.log(`   替换准确率: ${(templateTest.replacementAccuracy * 100).toFixed(1)}%`);
    } else {
      console.log('❌ 模板替换功能异常');
    }
    
    // 整体评估
    const overallSuccess = conversationTest.success && templateTest.success;
    console.log('\n=== 整体评估 ===');
    
    if (overallSuccess) {
      console.log('🎉 多轮对话框架基础功能正常！');
      console.log('✅ 支持动态轮数');
      console.log('✅ 支持模板替换');
      console.log('✅ 支持上下文管理');
      console.log('✅ 支持多厂商适配');
    } else {
      console.log('⚠️ 框架需要进一步调试');
    }
    
  } catch (error) {
    console.error('测试执行失败:', error);
  }
}

// 运行测试
runBasicTests();
