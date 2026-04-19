/**
 * 测试LLM多轮对话的上下文记忆能力
 * 验证LLM是否真的记住了之前的信息
 */

import { ConversationBuilder, ConversationExecutor } from '../lib/llm/conversation-builder.js';
import { chat } from '../lib/llm/llm.js';

// 测试数据
const testData = {
  character1: "李明：28岁，程序员，性格内向但技术很强，喜欢猫",
  character2: "王芳：26岁，产品经理，性格开朗，是李明的同事",
  location: "北京中关村科技园",
  plot: "李明正在开发一个重要的AI项目，遇到了技术难题"
};

async function testContextMemory() {
  console.log('🧪 开始测试LLM上下文记忆能力...\n');
  
  // 创建对话模板 - 逐步提供信息
  const template = new ConversationBuilder()
    .system('你是一个故事创作助手，请记住我提供的所有信息，后续我会测试你是否记得。')
    
    // 第1轮：提供角色1信息
    .userTemplate('请记住这个角色信息：{{character1}}', ['character1'], { name: '角色1介绍' })
    .expectResponse()
    
    // 第2轮：提供角色2信息
    .userTemplate('现在请记住第二个角色：{{character2}}', ['character2'], { name: '角色2介绍' })
    .expectResponse()
    
    // 第3轮：提供场景信息
    .userTemplate('故事发生在：{{location}}', ['location'], { name: '场景设定' })
    .expectResponse()
    
    // 第4轮：提供情节信息
    .userTemplate('基本情节是：{{plot}}', ['plot'], { name: '情节设定' })
    .expectResponse()
    
    // 第5轮：测试记忆 - 要求回忆角色1
    .user('请告诉我第一个角色的详细信息，包括姓名、年龄、职业和性格特点。', { name: '测试角色1记忆' })
    .expectResponse()
    
    // 第6轮：测试记忆 - 要求回忆角色2
    .user('现在请描述第二个角色的信息。', { name: '测试角色2记忆' })
    .expectResponse()
    
    // 第7轮：测试记忆 - 要求回忆场景
    .user('故事发生在哪里？请详细描述。', { name: '测试场景记忆' })
    .expectResponse()
    
    // 第8轮：测试记忆 - 要求回忆情节
    .user('基本情节是什么？主角遇到了什么问题？', { name: '测试情节记忆' })
    .expectResponse()
    
    // 第9轮：综合测试 - 要求基于所有信息创作
    .user('基于以上所有信息，请写一个简短的故事开头（100字左右），要包含所有角色、场景和情节元素。', { name: '综合创作测试' })
    .expectResponse()
    
    .build('上下文记忆测试模板');
  
  // 创建执行器
  const executor = new ConversationExecutor(chat);
  executor.setContext(testData);
  
  console.log('开始执行多轮对话测试...\n');
  console.log('='.repeat(50));
  
  try {
    const result = await executor.executeTemplate(template, {
      maxTokens: 2000,
      temperature: 0.7
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ 多轮对话执行完成');
    console.log('总轮次:', result.history.length);
    console.log('\n📋 记忆测试结果分析:\n');
    
    // 分析每轮的响应，检查记忆准确性
    result.history.forEach((record, index) => {
      const roundName = record.roundName;
      const response = record.assistantReply;
      
      console.log(`--- 第${index + 1}轮: ${roundName} ---`);
      
      if (roundName.includes('角色1记忆')) {
        const hasCorrectInfo = response.includes('李明') && 
                             response.includes('28岁') && 
                             response.includes('程序员') && 
                             response.includes('内向');
        console.log('角色1记忆准确性:', hasCorrectInfo ? '✅ 正确' : '❌ 错误');
      }
      else if (roundName.includes('角色2记忆')) {
        const hasCorrectInfo = response.includes('王芳') && 
                             response.includes('26岁') && 
                             response.includes('产品经理') && 
                             response.includes('开朗');
        console.log('角色2记忆准确性:', hasCorrectInfo ? '✅ 正确' : '❌ 错误');
      }
      else if (roundName.includes('场景记忆')) {
        const hasCorrectInfo = response.includes('北京') && 
                             response.includes('中关村');
        console.log('场景记忆准确性:', hasCorrectInfo ? '✅ 正确' : '❌ 错误');
      }
      else if (roundName.includes('情节记忆')) {
        const hasCorrectInfo = response.includes('AI项目') && 
                             response.includes('技术难题');
        console.log('情节记忆准确性:', hasCorrectInfo ? '✅ 正确' : '❌ 错误');
      }
      else if (roundName.includes('综合创作')) {
        const hasAllElements = response.includes('李明') && 
                            response.includes('王芳') && 
                            response.includes('中关村') && 
                            response.includes('AI项目');
        console.log('综合创作完整性:', hasAllElements ? '✅ 包含所有元素' : '❌ 缺少元素');
      }
      
      console.log('AI响应:', response.substring(0, 150) + (response.length > 150 ? '...' : ''));
      console.log('');
    });
    
    // 最终评估
    console.log('='.repeat(50));
    console.log('🎯 上下文记忆能力评估:');
    
    // 检查最终响应是否包含所有信息
    const finalResponse = result.finalResponse;
    const memoryScore = {
      character1: finalResponse.includes('李明') ? 1 : 0,
      character2: finalResponse.includes('王芳') ? 1 : 0,
      location: finalResponse.includes('中关村') ? 1 : 0,
      plot: finalResponse.includes('AI项目') ? 1 : 0
    };
    
    const totalScore = Object.values(memoryScore).reduce((a, b) => a + b, 0);
    const maxScore = Object.keys(memoryScore).length;
    
    console.log(`记忆准确率: ${totalScore}/${maxScore} (${(totalScore/maxScore*100).toFixed(1)}%)`);
    
    if (totalScore === maxScore) {
      console.log('🎉 LLM完美保持了上下文记忆！');
    } else if (totalScore >= maxScore * 0.75) {
      console.log('✅ LLM较好地保持了上下文记忆');
    } else {
      console.log('⚠️ LLM上下文记忆有待改进');
    }
    
    return {
      success: true,
      memoryScore,
      totalScore,
      maxScore,
      history: result.history
    };
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return { success: false, error };
  }
}

async function testLongContextMemory() {
  console.log('\n🧪 开始测试长上下文记忆能力...\n');
  
  // 创建更长的测试数据
  const longData = {
    characters: `
角色列表：
1. 张伟：35岁，资深工程师，性格稳重，有家庭
2. 刘婷：28岁，UI设计师，单身，追求完美
3. 陈浩：32岁，项目经理，已婚，善于沟通
4. 赵雪：25岁，实习生，聪明好学，刚毕业
5. 孙强：40岁，技术总监，经验丰富，要求严格
`,
    worldSetting: `
世界观设定：
- 时间：2045年，近未来
- 地点：上海，全球科技中心
- 背景：人工智能已经普及，但仍有技术瓶颈
- 社会状况：科技发展迅速，贫富差距扩大
- 技术水平：量子计算初步应用，脑机接口实验阶段
`,
    plotDetails: `
详细情节：
公司正在开发一个革命性的AI助手"星灵"，能够理解人类情感。
项目已经进行两年，投入巨大，但遇到关键瓶颈。
张伟发现了一个可能解决问题的算法，但有风险。
刘婷对用户界面设计有创新想法。
陈浩需要在进度和质量之间平衡。
赵雪无意中发现了一个重要线索。
孙强面临投资人压力，必须尽快看到成果。
`
  };
  
  const template = new ConversationBuilder()
    .system('你是AI项目顾问，请仔细记住所有项目信息。')
    
    .userTemplate('请记住团队信息：{{characters}}', ['characters'], { name: '团队信息' })
    .expectResponse()
    
    .userTemplate('请记住世界观设定：{{worldSetting}}', ['worldSetting'], { name: '世界观' })
    .expectResponse()
    
    .userTemplate('请记住详细情节：{{plotDetails}}', ['plotDetails'], { name: '详细情节' })
    .expectResponse()
    
    .user('现在请详细描述每个角色的背景和特点。', { name: '角色回忆测试' })
    .expectResponse()
    
    .user('这个AI项目的核心目标是什么？遇到了什么具体困难？', { name: '项目回忆测试' })
    .expectResponse()
    
    .build('长上下文记忆测试');
  
  const executor = new ConversationExecutor(chat);
  executor.setContext(longData);
  
  try {
    const result = await executor.executeTemplate(template, {
      maxTokens: 3000,
      temperature: 0.5
    });
    
    console.log('✅ 长上下文测试完成');
    
    // 分析记忆保持情况
    const finalResponse = result.finalResponse;
    const memoryCheck = {
      allCharacters: finalResponse.includes('张伟') && finalResponse.includes('刘婷') && 
                   finalResponse.includes('陈浩') && finalResponse.includes('赵雪') && 
                   finalResponse.includes('孙强'),
      worldSetting: finalResponse.includes('2045年') && finalResponse.includes('上海'),
      plotDetails: finalResponse.includes('星灵') && finalResponse.includes('算法')
    };
    
    console.log('长上下文记忆结果:');
    console.log('角色记忆:', memoryCheck.allCharacters ? '✅ 完整' : '❌ 缺失');
    console.log('世界观记忆:', memoryCheck.worldSetting ? '✅ 完整' : '❌ 缺失');
    console.log('情节记忆:', memoryCheck.plotDetails ? '✅ 完整' : '❌ 缺失');
    
    return { success: true, memoryCheck };
    
  } catch (error) {
    console.error('❌ 长上下文测试失败:', error);
    return { success: false, error };
  }
}

// 运行所有测试
async function runContextMemoryTests() {
  console.log('🚀 开始LLM上下文记忆能力全面测试\n');
  
  try {
    // 测试1：基础上下文记忆
    const basicTest = await testContextMemory();
    
    // 测试2：长上下文记忆
    const longTest = await testLongContextMemory();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 综合测试报告');
    console.log('='.repeat(60));
    
    if (basicTest.success && longTest.success) {
      console.log('🎉 所有测试通过！');
      console.log('LLM多轮对话上下文记忆能力验证成功');
    } else {
      console.log('⚠️ 部分测试失败，需要进一步调查');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  }
}

// 运行测试
runContextMemoryTests();
