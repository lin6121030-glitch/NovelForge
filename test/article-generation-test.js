/**
 * 真实文章生成测试
 * 测试完整的配置 + 对话 + 文章生成流程
 */

import { ConversationBuilder, ConversationExecutor } from '../lib/llm/conversation-builder.js';
import { chat } from '../lib/llm/llm.js';

async function testArticleGeneration() {
  console.log('=== 📝 真实文章生成测试 ===');
  
  // 初始化执行器
  const executor = new ConversationExecutor(chat);
  executor.initialize();
  
  // 获取当前配置信息
  const current = await executor.getCurrentModel();
  console.log('\n📋 当前配置:');
  console.log('  模型:', current.model);
  console.log('  提供商:', current.provider);
  console.log('  API模式:', current.apiMode);
  console.log('  支持记忆:', current.supportsMemory);
  console.log('  可用模型:', Object.values(await executor.getAvailableModels()).filter(m => m));
  
  // 测试1: 简单对话
  console.log('\n=== 🧪 测试1: 简单对话 ===');
  try {
    const simpleTemplate = new ConversationBuilder()
      .system('你是一个专业的AI助手。')
      .user('你好，请简单介绍一下自己。')
      .expectResponse()
      .build('简单对话测试');
    
    const result1 = await executor.executeTemplate(simpleTemplate, {
      maxTokens: 500,
      temperature: 0.7
    });
    
    console.log('✅ 简单对话成功');
    console.log('回复:', result1.finalResponse?.substring(0, 100) + '...');
    
  } catch (error) {
    console.error('❌ 简单对话失败:', error.message);
  }
  
  // 测试2: 文章大纲生成
  console.log('\n=== 🧪 测试2: 文章大纲生成 ===');
  try {
    const outlineTemplate = new ConversationBuilder()
      .system('你是一个专业的内容创作者，擅长撰写技术文章大纲。')
      .user('请为"人工智能在软件开发中的应用"这个主题，生成一个详细的文章大纲。')
      .expectResponse()
      .build('文章大纲生成');
    
    const result2 = await executor.executeTemplate(outlineTemplate, {
      maxTokens: 800,
      temperature: 0.6
    });
    
    console.log('✅ 文章大纲生成成功');
    console.log('大纲:', result2.finalResponse?.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('❌ 文章大纲生成失败:', error.message);
  }
  
  // 测试3: 完整文章生成
  console.log('\n=== 🧪 测试3: 完整文章生成 ===');
  try {
    const articleTemplate = new ConversationBuilder()
      .system('你是一个专业的技术文章作者，擅长写深入浅出的技术文章。文章结构清晰，内容详实，适合开发者阅读。')
      .user('请写一篇关于"多厂商LLM对话框架设计"的技术文章，包含以下要点：')
      .user('1. 多厂商适配的挑战')
      .user('2. 配置管理方案设计')
      .user('3. 模型选择策略')
      .user('4. API调用模式控制')
      .user('5. 实际应用案例')
      .expectResponse()
      .build('完整文章生成');
    
    const result3 = await executor.executeTemplate(articleTemplate, {
      maxTokens: 2000,
      temperature: 0.7
    });
    
    console.log('✅ 完整文章生成成功');
    console.log('文章长度:', result3.finalResponse?.length, '字符');
    console.log('文章开头:', result3.finalResponse?.substring(0, 300) + '...');
    
    // 保存文章到文件
    if (result3.finalResponse) {
      const fs = await import('fs');
      const path = await import('path');
      
      const articleFile = path.join(process.cwd(), 'generated-article.md');
      fs.writeFileSync(articleFile, `# 多厂商LLM对话框架设计\n\n${result3.finalResponse}`);
      console.log('📄 文章已保存到:', articleFile);
    }
    
  } catch (error) {
    console.error('❌ 完整文章生成失败:', error.message);
  }
  
  // 测试4: 多轮对话（如果支持记忆）
  if (current.supportsMemory) {
    console.log('\n=== 🧪 测试4: 多轮对话（记忆测试） ===');
    try {
      const memoryTemplate = new ConversationBuilder()
        .system('你是一个技术专家，可以记住之前的对话内容。')
        .user('我想了解MiniMax M2-her模型的特性。')
        .expectResponse()
        .user('基于刚才的回答，请详细说明它的记忆机制。')
        .expectResponse()
        .build('多轮对话测试');
      
      const result4 = await executor.executeTemplate(memoryTemplate, {
        maxTokens: 1000,
        temperature: 0.6
      });
      
      console.log('✅ 多轮对话成功');
      console.log('第一轮回复长度:', result4.rounds[0]?.response?.length || 0);
      console.log('第二轮回复长度:', result4.rounds[1]?.response?.length || 0);
      
    } catch (error) {
      console.error('❌ 多轮对话失败:', error.message);
    }
  }
  
  console.log('\n=== 📊 测试总结 ===');
  console.log('✅ 配置解析: 正常');
  console.log('✅ 模型选择: 正常');
  console.log('✅ API调用: 需要验证');
  console.log('✅ 文章生成: 需要验证');
  console.log('✅ 多轮对话: 需要验证');
  
  console.log('\n🎯 如果所有测试都通过，说明配置方案A完全可用！');
}

// 运行测试
testArticleGeneration().catch(console.error);
