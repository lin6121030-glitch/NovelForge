import fs from 'fs';
import path from 'path';
import { Agent } from './base.js';
import { chat } from '../llm/llm.js';

export class ValuesAgent extends Agent {
  constructor(projectDir) {
    super('数值代理');
    this.projectDir = projectDir;
  }
  
  async run(chapter, draft = null) {
    if (draft) {
      return await this.extractValues(chapter, draft);
    } else {
      return await this.loadPreviousValues(chapter);
    }
  }
  
  async extractValues(chapter, draft) {
    this.log('正在提取数值...');
    
    const prompt = `请分析以下章节内容，提取你能找到的所有数值。

请用Markdown格式返回，分类如下：
## 类别名称
- 项目: 数值

章节内容：
${draft}`;
    
    const result = await chat([{ role: 'user', content: prompt }]);
    const valuesMarkdown = result.choices[0].message.content;
    
    await this.saveValues(chapter, valuesMarkdown);
    
    this.log('数值已提取并保存');
    
    return { values: this.parseValuesFromMarkdown(valuesMarkdown), valuesMarkdown };
  }
  
  async loadPreviousValues(chapter) {
    if (chapter <= 1) {
      this.log('第一章 - 无上一章数值');
      return { values: {}, valuesMarkdown: '无' };
    }
    
    this.log('正在读取上一章数值...');
    
    const chapterDir = path.join(this.projectDir, 'story', `chapter-${chapter - 1}`);
    const valuesFile = path.join(chapterDir, 'values.md');
    
    if (!fs.existsSync(valuesFile)) {
      this.log('未找到上一章数值文件');
      return { values: {}, valuesMarkdown: '无' };
    }
    
    try {
      const content = fs.readFileSync(valuesFile, 'utf-8');
      const values = this.parseValuesFromMarkdown(content);
      this.log('上一章数值已成功加载');
      return { values, valuesMarkdown: content };
    } catch (e) {
      this.log(`加载上一章数值失败: ${e.message}`);
      return { values: {}, valuesMarkdown: '无' };
    }
  }
  
  async saveValues(chapter, valuesMarkdown) {
    const chapterDir = path.join(this.projectDir, 'story', `chapter-${chapter}`);
    if (!fs.existsSync(chapterDir)) {
      fs.mkdirSync(chapterDir, { recursive: true });
    }
    
    const fullMarkdown = `# 第${chapter}章 数值数据\n\n## 提取时间\n${new Date().toISOString()}\n\n${valuesMarkdown}`;
    const valuesFile = path.join(chapterDir, 'values.md');
    fs.writeFileSync(valuesFile, fullMarkdown);
  }
  
  parseValuesFromMarkdown(markdown) {
    const values = {};
    const lines = markdown.split('\n');
    let currentCategory = '';
    
    for (const line of lines) {
      if (line.startsWith('## ')) {
        currentCategory = line.replace('## ', '').toLowerCase();
        values[currentCategory] = {};
      } else if (line.startsWith('- ') && currentCategory) {
        const colonIdx = line.indexOf('：');
        if (colonIdx > 0) {
          const key = line.substring(2, colonIdx).trim();
          const val = line.substring(colonIdx + 1).trim();
          values[currentCategory][key] = val;
        }
      }
    }
    
    return values;
  }
}