// 测试Writer Agent集成
console.log('开始测试Writer Agent集成...\n');

try {
  // 模拟真实的chat函数
  async function mockChat(messages, options) {
    console.log('\n--- Writer Agent收到消息 ---');
    messages.forEach((msg, i) => {
      if (msg.role === 'system') {
        console.log(`[系统] ${msg.content}`);
      } else {
        const content = msg.content.length > 200 ? msg.content.substring(0, 200) + '...' : msg.content;
        console.log(`[${i}] ${msg.role}: ${content}`);
      }
    });
    console.log('选项:', options);
    console.log('------------------------\n');
    
    // 根据最后一条用户消息返回相应的响应
    const lastUserMsg = messages[messages.length - 2]?.content || '';
    
    if (lastUserMsg.includes('角色定义') || lastUserMsg.includes('创作小说内容')) {
      return {
        choices: [{
          message: {
            content: '好的，我理解了。我是一个专业的小说作家，具备创作引人入胜叙事、塑造角色、保持世界观一致性等能力。请继续提供创作所需的信息。'
          }
        }]
      };
    } else if (lastUserMsg.includes('角色信息')) {
      return {
        choices: [{
          message: {
            content: '我已经查看了角色信息，理解了故事中的主要角色和他们的关系。这些角色设定很清晰，我可以基于这些信息进行创作。请继续提供世界观信息。'
          }
        }]
      };
    } else if (lastUserMsg.includes('世界观')) {
      return {
        choices: [{
          message: {
            content: '世界观信息很完整，我理解了故事发生的背景、组织势力和地理环境。这为创作提供了很好的基础。请继续提供创作指南。'
          }
        }]
      };
    } else if (lastUserMsg.includes('创作指南') || lastUserMsg.includes('约束')) {
      return {
        choices: [{
          message: {
            content: '创作指南和约束很明确，我会遵循白话幽默的风格，确保每章都有笑点或爽点，只输出小说正文。请提供故事大纲。'
          }
        }]
      };
    } else if (lastUserMsg.includes('故事大纲')) {
      return {
        choices: [{
          message: {
            content: '故事大纲结构清晰，我理解了整体故事走向。现在请提供具体章节信息，我将开始创作。'
          }
        }]
      };
    } else if (lastUserMsg.includes('章节信息')) {
      return {
        choices: [{
          message: {
            content: '章节信息已收到，我明确了当前需要创作的内容范围。现在我将基于所有提供的信息开始创作小说正文。'
          }
        }]
      };
    } else if (lastUserMsg.includes('创作指定章节的小说内容')) {
      return {
        choices: [{
          message: {
            content: `第一章：新的开始

张三揉着惺忪的睡眼，阳光透过窗帘的缝隙洒在脸上。又是一个普通的周一早晨，但对于他来说，今天注定不普通。

"闹钟怎么没响？"他看了看手机，发现已经八点半了。"完蛋！要迟到了！"

张三从床上一跃而起，手忙脚乱地穿衣服。作为一家科技公司的程序员，迟到意味着扣工资，而他这个月的房租还差着呢。

冲出家门，他一边跑一边啃着面包。地铁里人挤人，他好不容易挤上车，却发现忘带工牌了。

"真是倒霉的一天啊..."张三叹了口气，但生活就是这样，总有意想不到的惊喜等着你。

就在这时，他的手机响了，是一个陌生号码...

（本章完）`
          }
        }]
      };
    } else {
      return {
        choices: [{
          message: {
            content: '好的，我理解了。请继续。'
          }
        }]
      };
    }
  }
  
  // 导入并测试
  const { TemplateFactory, ConversationExecutor } = await import('../lib/llm/conversation-builder.js');
  
  // 创建执行器
  const executor = new ConversationExecutor(mockChat);
  
  // 模拟真实的KG数据
  const mockKG = {
    characters: `张三: 主角，25岁，程序员，性格幽默但有点倒霉
李四: 张三的同事兼好友，技术大牛，经常帮助张三
王五: 公司老板，严肃但内心善良`,
    factions: `科技公司: 张三所在的公司，做人工智能产品
创业团队: 竞争对手，由张三的前同事组成`,
    locations: `北京市: 故事主要发生地
中关村: 科技公司聚集地
张三的出租屋: 主角居住的地方`,
    worldRules: `现代都市背景，科技发达
AI技术已经普及到日常生活
社会竞争激烈，年轻人压力很大`,
    style: `语言风格：白话幽默，贴近生活，有网感
叙事方式：第三人称，紧贴主角视角
节奏：明快，每章都有小高潮`,
    constraints: `避免暴力血腥内容
保持积极向上的价值观
不要涉及敏感政治话题
语言要文明健康`,
    outline: `第一章：意外的开始
- 主角张三迟到，发现忘带工牌
- 接到神秘电话
- 故事悬念展开

第二章：新的挑战
- 张三面临工作危机
- 李四出手相助
- 发现公司秘密

第三章：真相大白
- 揭露竞争对手的阴谋
- 张三证明自己的能力
- 获得认可和成长`,
    chapterInfo: `当前章节: 第1章
> 事件: 意外的开始`
  };
  
  executor.setContext(mockKG);
  
  // 使用Writer模板
  const writerTemplate = TemplateFactory.createWriterTemplate();
  
  console.log('开始执行Writer Agent多轮对话...');
  console.log('模板轮数:', writerTemplate.rounds.length);
  console.log('需要响应的轮次:', writerTemplate.getResponseRequiredIndices());
  
  // 执行对话
  const result = await executor.executeTemplate(writerTemplate, {
    maxTokens: 50000,
    temperature: 0.7
  });
  
  console.log('\n=== Writer Agent 执行完成 ===');
  console.log('最终生成内容长度:', result.finalResponse.length);
  console.log('对话轮次:', result.history.length);
  
  // 显示最终生成的内容
  console.log('\n=== 生成的小说内容 ===');
  console.log(result.finalResponse);
  
  console.log('\n✅ Writer Agent集成测试成功！');
  
} catch (error) {
  console.error('❌ 测试失败:', error);
  console.error('错误堆栈:', error.stack);
}
