import fs from 'fs';
import path from 'path';
import { Agent } from './base.js';
import { chat } from '../llm/llm.js';

export class ValuesAgent extends Agent {
  constructor(projectDir) {
    super('数值代理');
    this.projectDir = projectDir;
  }
  
  getChapterDir(chapter) {
    return path.join(this.projectDir, 'story', `chapter-${chapter}`);
  }
  
  async loadPreviousState(chapter) {
    if (chapter <= 1) {
      return { state: '', changes: '' };
    }
    
    const chapterDir = this.getChapterDir(chapter - 1);
    const stateFile = path.join(chapterDir, 'state.md');
    
    if (!fs.existsSync(stateFile)) {
      return { state: '', changes: '' };
    }
    
    return {
      state: fs.readFileSync(stateFile, 'utf-8'),
      changes: ''
    };
  }
  
  async extractState(chapter, draft, previousState = '') {
    this.log('正在提取本章状态...');
    
    const prompt = `请分析章节内容，提取本章结束时的人物状态、物品状态等。

## 上一章状态（如有）
${previousState || '无'}

## 本章内容
${draft}

请用Markdown格式返回本章结束时的状态：
# 第${chapter}章结束时状态

## 人物
- 角色名: 状态描述

## 物品
- 物品名: 状态描述

## 其他状态
- 状态项: 描述`;

    const result = await chat([{ role: 'user', content: prompt }]);
    return result.choices[0].message.content;
  }
  
  async extractChanges(chapter, draft, previousState = '') {
    this.log('正在提取本章变化...');
    
    const prompt = `请分析章节内容，提取本章发生的所有变化（与上一章相比）。

## 上一章状态
${previousState || '无'}

## 本章内容
${draft}

请用Markdown格式返回本章发生的变化：
# 第${chapter}章变化

## 数值变化
- 项目: 变化前 → 变化后

## 新增关系
- 新增或变化的关系描述

## 其他变化
- 其他重要变化`;

    const result = await chat([{ role: 'user', content: prompt }]);
    return result.choices[0].message.content;
  }
  
  async saveChapterFiles(chapter, draft, state, changes) {
    const chapterDir = this.getChapterDir(chapter);
    if (!fs.existsSync(chapterDir)) {
      fs.mkdirSync(chapterDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(chapterDir, 'draft.md'), draft);
    fs.writeFileSync(path.join(chapterDir, 'state.md'), state);
    fs.writeFileSync(path.join(chapterDir, 'changes.md'), changes);
    
    this.log(`已保存: draft.md, state.md, changes.md`);
  }
  
  async run(chapter, draft = null, previousState = '') {
    if (draft) {
      const state = await this.extractState(chapter, draft, previousState);
      const changes = await this.extractChanges(chapter, draft, previousState);
      await this.saveChapterFiles(chapter, draft, state, changes);
      return { state, changes };
    } else {
      return await this.loadPreviousState(chapter);
    }
  }
}