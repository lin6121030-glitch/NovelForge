/**
 * Final demonstration of multi-model conversation framework
 */

import { ConversationBuilder, TemplateFactory, ConversationExecutor } from '../lib/llm/conversation-builder.js';
import { chat } from '../lib/llm/llm.js';

async function demonstrateMultiModelFramework() {
  console.log('🚀 多模型对话框架演示\n');
  
  // 创建执行器
  const executor = new ConversationExecutor(chat);
  executor.initialize();
  
  console.log('=== 当前配置信息 ===');
  const currentModel = await executor.getCurrentModel();
  console.log('模型:', currentModel.model);
  console.log('厂商:', currentModel.provider);
  console.log('支持记忆:', currentModel.supportsMemory);
  
  console.log('\n=== 可用模型 ===');
  const availableModels = executor.getAvailableModels();
  console.log('主要模型:', availableModels.primary);
  console.log('次要模型:', availableModels.secondary || '未配置');
  console.log('第三模型:', availableModels.tertiary || '未配置');
  
  // 演示多轮对话
  console.log('\n=== 多轮对话演示 ===');
  
  const template = new ConversationBuilder()
    .system('你是专业的小说创作助手，请记住所有提供的信息。')
    .userTemplate('主角信息：{{protagonist}}', ['protagonist'])
    .expectResponse()
    .userTemplate('世界观：{{worldSetting}}', ['worldSetting'])
    .expectResponse()
    .userTemplate('创作任务：{{task}}', ['task'])
    .expectResponse()
    .build('小说创作演示');
  
  // 设置上下文
  executor.setContext({
    protagonist: '李明，28岁，AI研究员，性格内向但才华横溢',
    worldSetting: '2045年的上海，AI技术高度发达的未来世界',
    task: '创作一个AI研究员发现意外情况的故事开头'
  });
  
  try {
    console.log('执行多轮对话...');
    const result = await executor.executeTemplate(template, {
      maxTokens: 2000,
      temperature: 0.8
    });
    
    console.log('✅ 对话执行成功');
    console.log('使用适配器:', result.adapter);
    console.log('支持记忆:', result.supportsMemory);
    console.log('消息数量:', result.messages.length);
    console.log('响应长度:', result.finalResponse?.length || 0);
    
    console.log('\n=== 创作结果 ===');
    console.log(result.finalResponse || '无响应');
    
  } catch (error) {
    console.error('❌ 对话执行失败:', error.message);
  }
  
  console.log('\n=== 框架特性总结 ===');
  console.log('✅ 支持动态轮数的多轮对话');
  console.log('✅ 支持调用者控制每轮内容和作用');
  console.log('✅ 支持中文提示语');
  console.log('✅ 支持多厂商适配（MiniMax、OpenAI等）');
  console.log('✅ 支持模型动态切换');
  console.log('✅ 支持上下文记忆检测');
  console.log('✅ 支持占位符模板替换');
  
  console.log('\n=== 使用建议 ===');
  console.log('1. 配置多个模型：');
  console.log('   LLM_MODEL=MiniMax-M2.7');
  console.log('   LLM_MODEL_2=gpt-4');
  console.log('   LLM_PROVIDER=minimax');
  console.log('');
  console.log('2. 根据任务选择模型：');
  console.log('   - 角色设定、世界观构建：使用MiniMax（支持上下文记忆）');
  console.log('   - 创意写作、文本生成：使用OpenAI');
  console.log('');
  console.log('3. 动态切换模型：');
  console.log('   executor.switchToMiniMax() // 切换到MiniMax');
  console.log('   executor.switchToOpenAI()  // 切换到OpenAI');
  
  console.log('\n🎉 多模型对话框架演示完成！');
}

// 运行演示
demonstrateMultiModelFramework();
