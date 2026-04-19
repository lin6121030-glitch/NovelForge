// 测试多轮对话执行
console.log('开始测试多轮对话执行...\n');

try {
  const { ConversationBuilder, ConversationExecutor, TemplateFactory } = await import('../lib/llm/conversation-builder.js');
  
  // 模拟chat函数
  async function mockChat(messages, options) {
    console.log('--- LLM收到消息 ---');
    messages.forEach((msg, i) => {
      const content = msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content;
      console.log(`[${i}] ${msg.role}: ${content}`);
    });
    console.log('------------------');
    
    return {
      choices: [{
        message: {
          content: '好的，我理解了。请继续下一步。'
        }
      }]
    };
  }
  
  // 创建执行器
  const executor = new ConversationExecutor(mockChat);
  
  // 设置测试数据
  executor.setContext({
    testData: '这是测试数据',
    characters: '主角: 张三\n配角: 李四',
    chapterInfo: '第1章: 开始冒险'
  });
  
  // 创建测试模板
  const template = new ConversationBuilder()
    .system('你是一个小说创作助手。')
    .user('你好！我需要你帮我创作小说。请确认你理解了这个角色。', { name: '角色定义' })
    .expectResponse()
    .userTemplate('以下是角色信息：\n{{characters}}\n\n请查看并确认。', ['characters'], { name: '角色信息' })
    .expectResponse()
    .userTemplate('当前章节信息：\n{{chapterInfo}}\n\n基于以上信息，请开始创作。', ['chapterInfo'], { name: '创作任务' })
    .expectResponse()
    .build('测试创作模板');
  
  console.log('模板创建成功，轮次数:', template.rounds.length);
  console.log('需要响应的轮次:', template.getResponseRequiredIndices());
  console.log('\n开始执行多轮对话...\n');
  
  // 执行对话
  const result = await executor.executeTemplate(template, {
    maxTokens: 5000,
    temperature: 0.7
  });
  
  console.log('\n=== 执行结果 ===');
  console.log('最终响应:', result.finalResponse);
  console.log('历史记录数:', result.history.length);
  
  result.history.forEach((record, index) => {
    console.log(`\n[轮次 ${index + 1}] ${record.roundName}`);
    console.log('用户消息:', record.userMessage.substring(0, 100) + '...');
    console.log('AI回复:', record.assistantReply);
  });
  
  console.log('\n✅ 多轮对话执行测试成功！');
  
} catch (error) {
  console.error('❌ 测试失败:', error);
  console.error('错误堆栈:', error.stack);
}
