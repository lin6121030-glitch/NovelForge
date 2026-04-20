/**
 * 真实写作测试
 */

import { ConversationExecutor } from '../lib/llm/conversation-builder.js';
import { chat } from '../lib/llm/llm.js';
import fs from 'fs';

async function testRealWriting() {
  console.log('=== 📝 真实写作测试 ===');
  
  try {
    const executor = new ConversationExecutor(chat);
    executor.initialize();
    
    // 设置写作上下文
    const writingContext = {
      author: '张三',
      genre: '科幻小说',
      theme: '人工智能与人类的关系',
      style: '现代科幻风格'
    };
    
    executor.setContext(writingContext);
    
    console.log('\n📋 第一轮：设定写作背景');
    
    // 第一轮：设定写作背景
    const result1 = await executor.executeTemplate({
      rounds: [
        {
          content: '我想写一部{{genre}}，主题是{{theme}}，作者风格是{{style}}。请帮我设定故事的背景和主要人物。',
          role: 'user',
          isTemplate: true,
          dataKeys: ['genre', 'theme', 'style'],
          expectResponse: true
        }
      ]
    });
    
    console.log('AI回复1:', result1.choices[0]?.message?.content);
    
    console.log('\n📋 第二轮：设计主要人物');
    
    // 第二轮：设计主要人物
    const result2 = await executor.executeTemplate({
      rounds: [
        {
          content: '很好！现在请帮我设计3个主要人物，包括姓名、性格、职业和背景故事。要符合{{theme}}的主题。',
          role: 'user',
          isTemplate: true,
          dataKeys: ['theme'],
          expectResponse: true
        }
      ]
    });
    
    console.log('AI回复2:', result2.choices[0]?.message?.content);
    
    console.log('\n📋 第三轮：开始写作第一章');
    
    // 第三轮：开始写作第一章
    const result3 = await executor.executeTemplate({
      rounds: [
        {
          content: '现在开始写第一章，约2000字。要记住前面的所有设定信息。',
          role: 'user',
          expectResponse: true
        }
      ]
    });
    
    console.log('AI回复3:', result3.choices[0]?.message?.content);
    
    console.log('\n📋 第四轮：检查记忆');
    
    // 第四轮：检查记忆
    const result4 = await executor.executeTemplate({
      rounds: [
        {
          content: '请总结一下我们刚才讨论的所有内容，包括作者信息、故事主题、人物设定和第一章的内容。',
          role: 'user',
          expectResponse: true
        }
      ]
    });
    
    console.log('AI回复4:', result4.choices[0]?.message?.content);
    
    // 保存完整文章
    const fullContent = `
# ${writingContext.genre}：${writingContext.theme}

## 作者信息
- 作者：${writingContext.author}
- 风格：${writingContext.style}

## 故事背景
${result1.choices[0]?.message?.content || ''}

## 主要人物
${result2.choices[0]?.message?.content || ''}

## 第一章
${result3.choices[0]?.message?.content || ''}

## 记忆总结
${result4.choices[0]?.message?.content || ''}
    `;
    
    fs.writeFileSync('real-writing-output.md', fullContent, 'utf-8');
    console.log('\n📄 完整文章已保存到: real-writing-output.md');
    
    console.log('\n✅ 真实写作测试完成！');
    
  } catch (error) {
    console.error('❌ 真实写作测试失败:', error.message);
  }
}

testRealWriting().catch(console.error);
