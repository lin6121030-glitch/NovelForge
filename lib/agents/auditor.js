import { Agent } from './base.js';
import { chat } from '../llm/llm.js';

export class AuditorAgent extends Agent {
  constructor() {
    super('审核者');
  }
  
  async run(draft, facts) {
    this.log('正在审核...');
    
    const prompt = `根据事实矛盾和AI模式审核以下内容：

## 内容
${draft}

## 提取的事实
${facts}

如果内容有严重问题需要修订，请指出问题。如果内容质量合格，返回"审核通过"。`;
    
    const result = await chat([{ role: 'user', content: prompt }]);
    const report = result.choices[0].message.content;
    
    const passed = report.includes('审核通过') || report.includes('合格');
    
    this.log(passed ? '审核通过' : '需要修订');
    
    return { report, passed };
  }
}