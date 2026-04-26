import fs from 'fs';
import path from 'path';
import { Agent } from './base.js';
import { chat } from '../llm/llm.js';

export class ComposerAgent extends Agent {
  constructor(projectDir, styles, settings) {
    super('编辑者');
    this.projectDir = projectDir;
    this.styles = styles;
    this.settings = settings;
  }
  
  async run(chapterContent) {
    this.log('正在组织上下文...');
    
    // 1. 程序解析文风（支持多个）
    const styleNames = this.parseStyleNames(chapterContent);
    const styleContents = styleNames
      .map(name => this.styles.find(s => s.name === name)?.content)
      .filter(c => c)
      .join('\n\n');
    
    // 2. LLM分析涉及的实体
    const entities = await this.analyzeEntities(chapterContent);
    
    // 3. 从设定库提取相关设定
    const relevantSettings = {};
    for (const [category, names] of Object.entries(entities)) {
      if (Array.isArray(names) && names.length > 0) {
        relevantSettings[category] = this.settings.filter(
          s => s.category === category && names.includes(s.name)
        );
      }
    }
    
    this.log('上下文已组织');
    
    return {
      style: styleContents,
      styleNames,
      entities,
      relevantSettings
    };
  }
  
  parseStyleNames(chapterContent) {
    const pattern = /文风[：:]\s*([^\n]+)/;
    const match = chapterContent.match(pattern);
    if (!match) return ['开局'];
    
    let content = match[1].trim();
    content = content.replace(/^[（(（\[【《]/, '').replace(/[）)）\]\]\】》]$/, '');
    
    const names = content
      .split(/[,，、、\s]+/)
      .map(s => s.trim())
      .filter(s => s && s.length > 0);
    
    return names.length > 0 ? names : ['开局'];
  }
  
  getCategories() {
    const settingDir = path.join(this.projectDir, '设定库');
    if (!fs.existsSync(settingDir)) return [];
    return fs.readdirSync(settingDir).filter(f => {
      return fs.statSync(path.join(settingDir, f)).isDirectory();
    });
  }
  
  async analyzeEntities(chapterContent) {
    const categories = this.getCategories();
    const categoriesStr = categories.join('、');
    const allSettings = this.settings.map(s => `${s.category}：${s.name}`).join('\n');
    
    const prompt = `你是一个小说助手。现在需要从章节内容中提取涉及的实体。

## 设定库中可用的实体
${allSettings}

## 章节内容
${chapterContent}

请分析章节内容，返回涉及的实体。用JSON格式返回：
{
  "人物": ["角色1", "角色2"],
  "势力": ["势力1"]
}`;

    const result = await chat([
      { role: 'user', content: prompt }
    ]);
    const response = result.choices[0].message.content;
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      this.log('解析实体JSON失败');
    }
    return {};
  }
}