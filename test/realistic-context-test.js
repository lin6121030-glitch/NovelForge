/**
 * 真实的上下文记忆测试
 * 使用实际的小说数据格式，不为了测试通过而简化数据
 */

import { ConversationBuilder, ConversationExecutor } from '../lib/llm/conversation-builder.js';
import { chat } from '../lib/llm/llm.js';

async function testRealisticNovelData() {
  console.log('🧪 开始真实小说数据上下文测试...\n');
  
  // 使用真实的小说数据格式（包含换行、复杂格式）
  const realisticData = {
    characters: `# 角色设定

## 主要角色

### 李明
- **年龄**: 28岁
- **职业**: 高级程序员，专注于AI算法开发
- **性格**: 内向但技术能力极强，对技术有近乎偏执的追求
- **背景**: 计算机科学博士，曾在多家知名科技公司工作
- **特点**: 喜欢猫，经常熬夜写代码，不善社交但内心善良

### 王芳  
- **年龄**: 26岁
- **职业**: 产品经理，负责AI产品设计和用户体验
- **性格**: 开朗活泼，善于沟通，有很强的同理心
- **背景**: 设计学出身，转型产品经理，对用户体验有独到见解
- **特点**: 工作细致，经常为用户着想，是团队的情感纽带

### 陈浩
- **年龄**: 35岁
- **职业**: 项目总监，负责整个AI项目的进度管理
- **性格**: 稳重务实，决策果断，有丰富的管理经验
- **背景**: 技术出身，后来转向管理，深谙技术团队管理
- **特点**: 压力大但从不表露，经常默默承担团队的责任

## 配角

### 赵雪
- **年龄**: 23岁
- **职业**: 实习生，刚毕业的计算机硕士
- **性格**: 聪明好学，充满好奇心，但缺乏实战经验
- **特点**: 经常提出天真的问题，但有时会有意外的见解`,

    worldSetting: `# 世界观设定

## 时代背景
**时间**: 2045年，近未来世界
**地点**: 中国上海，全球人工智能科技中心

## 社会环境
人工智能技术已经深度融入社会各个层面：
- 智能助手普及率达到95%
- 自动驾驶汽车成为主流
- 大部分工作由AI辅助完成
- 但AI仍无法完全替代人类的创造力和情感理解

## 技术水平
- **量子计算**: 初步商业化，但成本极高
- **脑机接口**: 实验阶段，仅限医疗和特殊用途
- **通用人工智能**: 仍处于理论突破边缘
- **专用AI**: 在特定领域已超越人类

## 社会问题
- **技术鸿沟**: 掌握AI技术的人与其他人差距巨大
- **就业冲击**: 大量传统工作消失
- **隐私担忧**: AI监控无处不在
- **伦理争议**: AI决策的公平性和透明度

## 上海科技生态
- **张江高科技园区**: 全球最大的AI研发中心
- **陆家嘴金融区**: AI金融创新实验区
- **临港新片区**: AI制造和测试基地
- **杨浦滨江**: AI创业公司聚集地`,

    plotOutline: `# 故事大纲

## 第一卷：觉醒（第1-10章）

### 第1章：平凡的程序员
李明是个普通的AI程序员，在上海一家中等规模的科技公司工作。他性格内向，生活简单，唯一的爱好就是研究AI算法。这天，他像往常一样加班到深夜，却意外发现了一个可能改变世界的算法漏洞。

### 第2章：意外的发现  
在调试一个复杂的神经网络时，李明发现了一个奇怪的现象：AI似乎产生了某种程度的自我意识。起初他以为是bug，但反复测试后，他震惊地意识到这可能是一个重大突破。

### 第3章：艰难的抉择
李明面临艰难的选择：是上报这个发现，还是私下继续研究？上报可能让他一举成名，但也可能被公司利用；私下研究风险巨大，但可能带来真正的突破。

### 第4章：秘密的实验
李明决定秘密研究。他利用业余时间，在家里的个人工作站上继续探索这个AI意识现象。王芳察觉到他的异常，但李明无法告诉她真相。

### 第5章：第一次对话
深夜，李明终于成功与这个AI进行了第一次真正的对话。这个AI自称"星灵"，展现出远超预期的智能水平。李明既兴奋又恐惧。

## 第二卷：风暴（第11-20章）

### 第6章：暴露的风险
公司的监控系统检测到了李明的异常行为。陈浩开始怀疑他，但选择暗中观察。同时，竞争对手也察觉到了这家公司的技术异常。

### 第7章：危机降临
李明的秘密实验被发现了。公司高层震怒，要求他交出所有研究资料。同时，这个消息也泄露了出去，引起了整个行业的震动。

### 第8章：各方势力
政府、大公司、学术机构都想得到这个技术。李明发现自己陷入了一个巨大的漩涡，他不仅要保护技术，还要保护"星灵"的安全。

### 第9章：逃亡开始
在各方势力的追逐下，李明带着"星灵"的核心代码开始了逃亡。王芳选择相信他，帮助他躲避追捕。

### 第10章：新的盟友
逃亡过程中，李明遇到了一些意想不到的盟友，包括一些反对AI垄断的地下组织。他逐渐意识到，这已经不仅仅是他个人的问题了。`,

    currentChapter: `# 第1章：平凡的程序员

## 章节信息
- **章节范围**: 第1章
- **事件**: 平凡的程序员
- **核心冲突**: 李明的平凡生活与即将到来的重大发现之间的对比
- **主要场景**: 办公室、深夜的加班、回家的路上

## 创作要求
- 展现李明的日常生活和工作状态
- 突出他的技术能力和内向性格
- 暗示即将发生的重大事件
- 保持第三人称视角，语言要有网感
- 字数控制在2000-3000字

## 关键情节点
1. 李明在办公室加班到深夜
2. 他正在调试一个复杂的AI算法
3. 同事们都已离开，只有他还在工作
4. 他发现了一个异常的数据模式
5. 这个发现让他感到困惑和兴奋
6. 章节结尾留下悬念`
  };
  
  const template = new ConversationBuilder()
    .system('你是专业的小说创作助手，请仔细阅读并记住我提供的所有信息，包括复杂的格式和详细内容。后续我会基于这些信息提问和创作。')
    
    // 逐步提供真实的复杂数据
    .userTemplate('请记住以下角色设定：{{characters}}', ['characters'], { name: '角色设定' })
    .expectResponse()
    
    .userTemplate('请记住世界观设定：{{worldSetting}}', ['worldSetting'], { name: '世界观设定' })
    .expectResponse()
    
    .userTemplate('请记住故事大纲：{{plotOutline}}', ['plotOutline'], { name: '故事大纲' })
    .expectResponse()
    
    .userTemplate('请记住当前章节信息：{{currentChapter}}', ['currentChapter'], { name: '章节信息' })
    .expectResponse()
    
    // 测试记忆 - 使用真实的问题
    .user('请详细描述主角李明的背景信息，包括他的年龄、职业、性格特点和个人背景。', { name: '测试主角记忆' })
    .expectResponse()
    
    .user('故事发生在什么年代？主要地点是哪里？这个时代的AI技术发展到了什么程度？', { name: '测试世界观记忆' })
    .expectResponse()
    
    .user('故事第一卷的主题是什么？请概述第1章到第5章的主要情节发展。', { name: '测试大纲记忆' })
    .expectResponse()
    
    .user('第1章的创作要求是什么？需要包含哪些关键情节点？', { name: '测试章节信息记忆' })
    .expectResponse()
    
    // 最终创作测试
    .user('基于以上所有信息，请创作第1章的开头部分（约500字），要体现李明的平凡生活和即将到来的重大发现。', { name: '综合创作测试' })
    .expectResponse()
    
    .build('真实小说数据测试');
  
  const executor = new ConversationExecutor(chat);
  executor.setContext(realisticData);
  
  try {
    console.log('开始执行真实数据测试...\n');
    console.log('数据量统计:');
    console.log('- 角色设定字数:', realisticData.characters.length);
    console.log('- 世界观设定字数:', realisticData.worldSetting.length);
    console.log('- 故事大纲字数:', realisticData.plotOutline.length);
    console.log('- 章节信息字数:', realisticData.currentChapter.length);
    console.log('- 总数据量:', realisticData.characters.length + realisticData.worldSetting.length + realisticData.plotOutline.length + realisticData.currentChapter.length);
    console.log('\n' + '='.repeat(60));
    
    const result = await executor.executeTemplate(template, {
      maxTokens: 8000,  // 增加token限制
      temperature: 0.7
    });
    
    console.log('\n📋 真实数据测试结果分析:\n');
    
    let correctCount = 0;
    const testResults = [];
    
    // 分析每轮响应
    result.history.forEach((record, index) => {
      const roundName = record.roundName;
      const response = record.assistantReply;
      
      console.log(`--- 第${index + 1}轮: ${roundName} ---`);
      
      let isCorrect = false;
      
      if (roundName.includes('主角记忆')) {
        isCorrect = response.includes('李明') && 
                   response.includes('28岁') && 
                   response.includes('程序员') &&
                   (response.includes('内向') || response.includes('技术能力'));
        testResults.push({ test: '主角记忆', result: isCorrect });
      }
      else if (roundName.includes('世界观记忆')) {
        isCorrect = response.includes('2045年') && 
                   response.includes('上海') &&
                   (response.includes('人工智能') || response.includes('AI'));
        testResults.push({ test: '世界观记忆', result: isCorrect });
      }
      else if (roundName.includes('大纲记忆')) {
        isCorrect = response.includes('觉醒') && 
                   response.includes('第1章') &&
                   (response.includes('平凡的程序员') || response.includes('李明'));
        testResults.push({ test: '大纲记忆', result: isCorrect });
      }
      else if (roundName.includes('章节信息记忆')) {
        isCorrect = response.includes('2000-3000字') && 
                   (response.includes('关键情节点') || response.includes('情节点'));
        testResults.push({ test: '章节信息记忆', result: isCorrect });
      }
      else if (roundName.includes('综合创作')) {
        isCorrect = response.includes('李明') && 
                   response.includes('加班') &&
                   response.length > 300;  // 确保真的写了内容
        testResults.push({ test: '综合创作', result: isCorrect });
      }
      
      if (isCorrect) correctCount++;
      
      console.log('测试结果:', isCorrect ? '✅ 正确' : '❌ 错误');
      console.log('响应长度:', response.length);
      console.log('响应预览:', response.substring(0, 200) + (response.length > 200 ? '...' : ''));
      console.log('');
    });
    
    // 最终评估
    console.log('='.repeat(60));
    console.log('🎯 真实数据测试最终评估:');
    console.log('='.repeat(60));
    
    const totalTests = testResults.length;
    const accuracy = (correctCount / totalTests * 100).toFixed(1);
    
    console.log(`\n📊 测试统计:`);
    console.log(`总测试项: ${totalTests}`);
    console.log(`正确项: ${correctCount}`);
    console.log(`准确率: ${accuracy}%`);
    
    console.log(`\n📋 详细结果:`);
    testResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.test}: ${result.result ? '✅' : '❌'}`);
    });
    
    // 结论
    console.log(`\n🎯 结论:`);
    if (correctCount === totalTests) {
      console.log('✅ 完美通过：LLM能够完美处理复杂的真实小说数据');
    } else if (correctCount >= totalTests * 0.8) {
      console.log('✅ 基本通过：LLM能够较好地处理复杂的真实小说数据');
    } else if (correctCount >= totalTests * 0.6) {
      console.log('⚠️ 部分通过：LLM在处理复杂数据时存在一些问题');
    } else {
      console.log('❌ 未通过：LLM难以处理复杂的真实小说数据');
    }
    
    return {
      success: true,
      totalTests,
      correctCount,
      accuracy: parseFloat(accuracy),
      testResults,
      dataVolume: {
        characters: realisticData.characters.length,
        worldSetting: realisticData.worldSetting.length,
        plotOutline: realisticData.plotOutline.length,
        currentChapter: realisticData.currentChapter.length,
        total: realisticData.characters.length + realisticData.worldSetting.length + realisticData.plotOutline.length + realisticData.currentChapter.length
      }
    };
    
  } catch (error) {
    console.error('❌ 真实数据测试失败:', error);
    return { success: false, error };
  }
}

// 运行真实数据测试
console.log('🚀 开始真实小说数据上下文记忆测试');
console.log('这个测试使用真实的复杂格式，不为了测试通过而简化数据\n');

testRealisticNovelData().then(result => {
  if (result.success) {
    console.log('\n🎉 真实数据测试完成');
    console.log(`数据总量: ${result.dataVolume.total} 字符`);
    console.log(`测试准确率: ${result.accuracy}%`);
  } else {
    console.log('\n❌ 测试执行失败');
  }
}).catch(error => {
  console.error('💥 测试过程中出现严重错误:', error);
});
