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
  
  async run(chapterContent, latestStates = '') {
    this.log('正在组织上下文...');
    
    // 1. 程序解析文风（支持多个）
    const styleNames = this.parseStyleNames(chapterContent);
    const styleContents = styleNames
      .map(name => {
        const style = this.styles.find(s => s.name === name);
        return style ? `【${name}】\n${style.content}` : '';
      })
      .filter(c => c)
      .join('\n\n');
    
    // 2. LLM分析涉及的实体
    const entities = await this.analyzeEntities(chapterContent);
    
    // 3. LLM合并基础设定 + 最新状态
    const mergedContext = await this.mergeSettingsWithStates(entities, latestStates);
    
    this.log('上下文已组织');
    
    return {
      style: styleContents,
      styleNames,
      entities,
      mergedContext
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
  
  async mergeSettingsWithStates(entities, latestStates) {
    const baseSettingsStr = Object.entries(entities)
      .map(([category, names]) => {
        const items = this.settings.filter(
          s => s.category === category && names.includes(s.name)
        );
        if (items.length === 0) return '';
        return `### ${category}\n` + items.map(s => {
          const fields = Object.entries(s.fields).map(([k, v]) => `- ${k}：${v}`).join('\n');
          return `**${s.name}**\n${fields}`;
        }).join('\n');
      })
      .filter(s => s)
      .join('\n');
    
    const prompt = `你是一个小说助手。请将基础设定和最新状态合并，生成统一的上下文描述。

## 基础设定
${baseSettingsStr || '无'}

## 最新状态（如有，表示本章之前的最新值）
${latestStates || '无'}

## 合并要求
1. 如果最新状态中有值，优先使用最新状态的值覆盖基础设定
2. 补充基础设定中未提及的当前状态
3. 生成自然语言描述，方便创作参考
4. 只保留与故事相关的状态，不要无关细节

请直接输出合并后的上下文描述（不要JSON）：`;

    const result = await chat([
      { role: 'user', content: prompt }
    ]);
    
    return result.choices[0].message.content;
  }
}