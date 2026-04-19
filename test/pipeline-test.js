// 测试完整的Pipeline集成
console.log('开始测试Pipeline集成...\n');

try {
  // 模拟chat函数
  async function mockChat(messages, options) {
    // 找到最后一条用户消息（不是system或assistant）
    let lastUserMsg = '';
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMsg = messages[i].content || '';
        break;
      }
    }
    
    // 根据不同的用户消息返回相应响应
    console.log('检查最后用户消息:', lastUserMsg.substring(0, 100));
    
    if (lastUserMsg.includes('创作指定章节的小说内容') || lastUserMsg.includes('请现在开始创作完整的小说内容')) {
      return {
        choices: [{
          message: {
            content: `第一章：意外的开始

张三睁开眼睛，阳光透过窗帘洒在脸上。"完蛋，迟到了！"

他手忙脚乱地穿衣服，嘴里叼着面包冲出家门。地铁里人挤人，他好不容易挤上去，却发现忘带工牌了。

"真是倒霉的一天啊..."张三叹了口气。

就在这时，手机响了，是一个陌生号码...

（本章完）

字数：约200字`
          }
        }]
      };
    } else if (lastUserMsg.includes('角色定义') || lastUserMsg.includes('创作小说内容')) {
      return {
        choices: [{
          message: {
            content: '我理解了角色要求。作为专业小说作家，我将创作引人入胜的内容。'
          }
        }]
      };
    } else if (lastUserMsg.includes('角色信息')) {
      return {
        choices: [{
          message: {
            content: '角色信息已理解，我清楚了故事中的人物关系。'
          }
        }]
      };
    } else if (lastUserMsg.includes('世界观')) {
      return {
        choices: [{
          message: {
            content: '世界观设定已理解，我掌握了故事背景。'
          }
        }]
      };
    } else if (lastUserMsg.includes('创作指南') || lastUserMsg.includes('约束')) {
      return {
        choices: [{
          message: {
            content: '创作要求已理解，我将遵循白话幽默风格。'
          }
        }]
      };
    } else if (lastUserMsg.includes('故事大纲')) {
      return {
        choices: [{
          message: {
            content: '大纲已理解，我清楚了故事结构。'
          }
        }]
      };
    } else if (lastUserMsg.includes('章节信息')) {
      return {
        choices: [{
          message: {
            content: '章节信息已收到，准备开始创作。'
          }
        }]
      };
    } else {
      return {
        choices: [{
          message: {
            content: '好的，继续。'
          }
        }]
      };
    }
  }
  
  // 导入Pipeline
  const { AgentPipeline } = await import('../lib/agents/pipeline.js');
  
  // 创建Pipeline实例
  const pipeline = new AgentPipeline('./test-data', '测试小说');
  
  // 重写chat方法
  pipeline.chat = mockChat;
  
  // 模拟KG数据
  pipeline.kg = {
    characters: '张三: 主角，程序员\n李四: 同事',
    factions: '科技公司: 工作单位',
    locations: '北京: 故事发生地',
    worldRules: '现代都市背景',
    style: '白话幽默风格',
    constraints: '积极向上',
    outline: '第一章：意外的开始\n第二章：新的挑战',
    chapterInfo: '第1章: 意外的开始'
  };
  
  // 模拟task
  pipeline.task = {
    chapterRange: '1',
    title: '意外的开始',
    startChapter: 1,
    endChapter: 1
  };
  
  console.log('开始测试Writer方法...');
  
  // 测试writer方法
  const draft = await pipeline.writer('创作', pipeline.kg, pipeline.task);
  
  console.log('\n=== 测试结果 ===');
  console.log('生成的内容长度:', draft.length);
  console.log('生成的小说内容:');
  console.log(draft);
  
  // 验证内容
  if (draft.includes('张三') && draft.includes('意外的开始')) {
    console.log('\n✅ Pipeline集成测试成功！');
    console.log('✅ 多轮对话框架正常工作');
    console.log('✅ Writer Agent成功生成内容');
  } else {
    console.log('\n❌ 测试失败：生成的内容不符合预期');
  }
  
} catch (error) {
  console.error('❌ 测试失败:', error);
  console.error('错误堆栈:', error.stack);
}
