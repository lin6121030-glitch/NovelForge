import fs from 'fs';
import path from 'path';
import { Agent } from './base.js';
import { parseCurrentTaskFromOutline } from './agent.js';

export class PlannerAgent extends Agent {
  constructor(projectDir, outline) {
    super('规划者');
    this.projectDir = projectDir;
    this.outline = outline;
  }
  
  async run(chapter) {
    this.log('正在规划章节...');
    
    const outlineDir = path.join(this.projectDir, '大纲库');
    const chapterFile = path.join(outlineDir, `第${chapter}章.md`);
    const chapterContent = fs.existsSync(chapterFile) ? fs.readFileSync(chapterFile, 'utf-8') : '';
    
    const chapterInfo = parseCurrentTaskFromOutline(this.outline, chapter);
    
    this.log('规划完成');
    
    return {
      chapter,
      chapterContent,
      chapterInfo
    };
  }
}