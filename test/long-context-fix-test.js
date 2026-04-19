/**
 * 修复长上下文记忆测试
 * 确保LLM能够正确处理长文本信息
 */

import { ConversationBuilder, ConversationExecutor } from '../lib/llm/conversation-builder.js';
import { chat } from '../lib/llm/llm.js';

async function testLongContextMemoryFixed() {
  console.log('🧪 开始修复版长上下文记忆测试...\n');
  
  // 简化但完整的长上下文数据
  const longData = {
    teamInfo: "团队成员：张伟(35岁,资深工程师)、刘婷(28岁,UI设计师)、陈浩(32岁,项目经理)、赵雪(25岁,实习生)、孙强(40岁,技术总监)",
    worldInfo: "世界观：2045年，上海是全球科技中心，AI普及但存在技术瓶颈，量子计算初步应用",
    projectInfo: "项目：开发革命性AI助手'星灵'，已进行两年，遇到瓶颈，张伟发现新算法但风险很大"
  };
  
  const template = new ConversationBuilder()
    .system('你是AI项目顾问，请记住所有信息，我会测试你的记忆。')
    
    // 逐步提供信息
    .userTemplate('请记住团队信息：{{teamInfo}}', ['teamInfo'], { name: '团队信息' })
    .expectResponse()
    
    .userTemplate('请记住世界观：{{worldInfo}}', ['worldInfo'], { name: '世界观' })
    .expectResponse()
    
    .userTemplate('请记住项目信息：{{projectInfo}}', ['projectInfo'], { name: '项目信息' })
    .expectResponse()
    
    // 测试记忆
    .user('请列出所有团队成员的姓名和年龄。', { name: '测试团队记忆' })
    .expectResponse()
    
    .user('故事发生在哪一年？主要地点是哪里？', { name: '测试世界观记忆' })
    .expectResponse()
    
    .user('项目名称是什么？遇到了什么问题？', { name: '测试项目记忆' })
    .expectResponse()
    
    // 综合测试
    .user('基于以上所有信息，请写一个简短的项目总结（100字以内）。', { name: '综合测试' })
    .expectResponse()
    
    .build('修复版长上下文测试');
  
  const executor = new ConversationExecutor(chat);
  executor.setContext(longData);
  
  try {
    const result = await executor.executeTemplate(template, {
      maxTokens: 2000,
      temperature: 0.5
    });
    
    console.log('\n📋 记忆测试结果分析:\n');
    
    let teamMemoryCorrect = false;
    let worldMemoryCorrect = false;
    let projectMemoryCorrect = false;
    let comprehensiveCorrect = false;
    
    // 分析每轮响应
    result.history.forEach((record, index) => {
      const roundName = record.roundName;
      const response = record.assistantReply;
      
      console.log(`--- 第${index + 1}轮: ${roundName} ---`);
      
      if (roundName.includes('团队记忆')) {
        teamMemoryCorrect = response.includes('张伟') && 
                          response.includes('刘婷') && 
                          response.includes('陈浩') &&
                          response.includes('赵雪') &&
                          response.includes('孙强');
        console.log('团队记忆准确性:', teamMemoryCorrect ? '✅ 正确' : '❌ 错误');
      }
      else if (roundName.includes('世界观记忆')) {
        worldMemoryCorrect = response.includes('2045年') && 
                           response.includes('上海');
        console.log('世界观记忆准确性:', worldMemoryCorrect ? '✅ 正确' : '❌ 错误');
      }
      else if (roundName.includes('项目记忆')) {
        projectMemoryCorrect = response.includes('星灵') && 
                             response.includes('瓶颈');
        console.log('项目记忆准确性:', projectMemoryCorrect ? '✅ 正确' : '❌ 错误');
      }
      else if (roundName.includes('综合测试')) {
        comprehensiveCorrect = response.includes('星灵') && 
                              response.includes('张伟') &&
                              response.includes('2045年');
        console.log('综合测试完整性:', comprehensiveCorrect ? '✅ 包含所有元素' : '❌ 缺少元素');
      }
      
      console.log('响应:', response.substring(0, 150) + (response.length > 150 ? '...' : ''));
      console.log('');
    });
    
    // 最终评估
    console.log('='.repeat(50));
    console.log('🎯 修复版长上下文记忆评估:');
    
    const totalCorrect = [teamMemoryCorrect, worldMemoryCorrect, projectMemoryCorrect, comprehensiveCorrect]
      .filter(Boolean).length;
    const totalTests = 4;
    
    console.log(`准确率: ${totalCorrect}/${totalTests} (${(totalCorrect/totalTests*100).toFixed(1)}%)`);
    
    if (totalCorrect === totalTests) {
      console.log('🎉 长上下文记忆完全正确！');
    } else if (totalCorrect >= totalTests * 0.75) {
      console.log('✅ 长上下文记忆基本正确');
    } else {
      console.log('⚠️ 长上下文记忆需要改进');
    }
    
    return {
      success: true,
      teamMemoryCorrect,
      worldMemoryCorrect,
      projectMemoryCorrect,
      comprehensiveCorrect,
      accuracy: totalCorrect / totalTests
    };
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return { success: false, error };
  }
}

async function testContextLimit() {
  console.log('\n🧪 测试上下文长度限制...\n');
  
  // 测试不同长度的上下文
  const testCases = [
    {
      name: '短上下文',
      data: { info: '简单信息测试' },
      expected: true
    },
    {
      name: '中等上下文',
      data: { 
        info: '中等长度信息测试，包含更多细节和描述，用于测试LLM在处理中等长度文本时的记忆能力。' 
      },
      expected: true
    },
    {
      name: '长上下文',
      data: { 
        info: '这是一个很长的信息测试，包含了大量的细节和描述。这个测试的目的是验证LLM在处理长文本时是否能够保持良好的记忆能力。我们需要确保即使信息量很大，LLM也能够准确记住关键信息点，并在后续的对话中正确回忆和使用这些信息。长文本处理是衡量LLM能力的重要指标，特别是在处理复杂的创作任务时。' 
      },
      expected: true
    }
  ];
  
  const executor = new ConversationExecutor(chat);
  
  for (const testCase of testCases) {
    console.log(`测试 ${testCase.name}...`);
    
    const template = new ConversationBuilder()
      .system('请记住我提供的信息。')
      .userTemplate('记住这个信息：{{info}}', ['info'], { name: '信息提供' })
      .expectResponse()
      .user('请重复我刚才提供的信息。', { name: '记忆测试' })
      .expectResponse()
      .build(`${testCase.name}测试`);
    
    executor.setContext(testCase.data);
    
    try {
      const result = await executor.executeTemplate(template, {
        maxTokens: 1000,
        temperature: 0.3
      });
      
      const finalResponse = result.finalResponse;
      const containsKeyInfo = finalResponse.includes(testCase.data.info.substring(0, 20));
      
      console.log(`${testCase.name}结果:`, containsKeyInfo ? '✅ 成功' : '❌ 失败');
      
    } catch (error) {
      console.error(`${testCase.name}错误:`, error.message);
    }
  }
}

// 运行测试
async function runFixedTests() {
  console.log('🚀 开始修复版上下文记忆测试\n');
  
  try {
    // 测试1：修复版长上下文
    const longTest = await testLongContextMemoryFixed();
    
    // 测试2：上下文长度限制
    await testContextLimit();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 修复版测试总结');
    console.log('='.repeat(60));
    
    if (longTest.success) {
      console.log('✅ 长上下文测试完成');
      console.log(`准确率: ${(longTest.accuracy * 100).toFixed(1)}%`);
    } else {
      console.log('❌ 长上下文测试失败');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

// 运行测试
runFixedTests();
