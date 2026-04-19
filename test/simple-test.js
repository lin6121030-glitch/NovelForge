// 简单测试多轮对话框架
console.log('开始测试...');

try {
  // 测试导入
  const { ConversationBuilder, TemplateFactory } = await import('../lib/llm/conversation-builder.js');
  console.log('✓ 导入成功');
  
  // 测试创建简单模板
  const template = new ConversationBuilder()
    .system('你是一个测试助手')
    .user('你好')
    .build('测试模板');
  
  console.log('✓ 模板创建成功');
  console.log('轮次数:', template.rounds.length);
  
  // 测试模板工厂
  const writerTemplate = TemplateFactory.createWriterTemplate();
  console.log('✓ Writer模板创建成功');
  console.log('Writer模板轮数:', writerTemplate.rounds.length);
  
  console.log('\n✅ 所有基础测试通过');
  
} catch (error) {
  console.error('❌ 测试失败:', error);
  console.error('错误堆栈:', error.stack);
}
