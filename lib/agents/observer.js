import { Agent } from './base.js';
import { chat } from '../llm/llm.js';

export class ObserverAgent extends Agent {
  constructor() {
    super('观察者');
  }
  
  async run(draft) {
    this.log('正在提取事实...');
    
    const prompt = `从以下内容中提取关键事实（角色、地点、物品、事件、状态变化）：

${draft}`;
    
    const result = await chat([{ role: 'user', content: prompt }]);
    const facts = result.choices[0].message.content;
    
    this.log('事实已提取');
    
    return { facts };
  }
}