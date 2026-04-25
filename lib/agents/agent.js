import { loadBook, getBookDir } from '../kg/kg-new.js';

export function parseCurrentTask(kgContent, chapter) {
  return { chapterRange: `${chapter}-${chapter}章`, title: '解析中', startChapter: chapter, endChapter: chapter };
}

export function parseCurrentTaskFromOutline(outline, chapter) {
  if (!outline || !Array.isArray(outline)) return null;
  
  for (const ch of outline) {
    if (ch.index === chapter) {
      return {
        chapterRange: `${chapter}`,
        title: ch.title || '',
        startChapter: ch.index,
        endChapter: ch.index,
        style: ch.style,
        entities: ch.entities,
        goal: ch.goal,
        keyPlot: ch.keyPlot
      };
    }
  }
  
  return null;
}

export function extractChapterOutline(outlineContent, chapter) {
  if (!outlineContent || !Array.isArray(outlineContent)) return '';
  
  for (const ch of outlineContent) {
    if (ch.index === chapter) {
      return `标题：${ch.title || ''}\n文风：${ch.style || ''}\n实体：${ch.entities || ''}\n目标：${ch.goal || ''}\n关键情节：${ch.keyPlot || ''}`;
    }
  }
  
  return '';
}

export function generateAgentContext(kgFiles, chapterInfo, projectName = '小说') {
  let md = `# ${projectName} - 当前任务\n\n`;
  
  if (chapterInfo) {
    md += `## 当前章节: ${chapterInfo.chapterRange || chapterInfo.startChapter + '-' + chapterInfo.endChapter + '章'}\n`;
    md += `> 标题: ${chapterInfo.title || ''}\n`;
    md += `> 文风: ${chapterInfo.style || ''}\n`;
    md += `> 实体: ${chapterInfo.entities || ''}\n`;
    md += `> 目标: ${chapterInfo.goal || ''}\n`;
    if (chapterInfo.keyPlot) {
      md += `> 关键情节:\n`;
      for (const line of chapterInfo.keyPlot.split('\n')) {
        md += `>   - ${line}\n`;
      }
    }
    md += '\n';
  }
  
  // 添加文风库
  if (kgFiles.styles && Array.isArray(kgFiles.styles)) {
    md += '\n## 文风库\n';
    for (const s of kgFiles.styles) {
      md += `### ${s.name}\n${s.content}\n\n`;
    }
  }
  
  // 添加设定库（按类别分组）
  if (kgFiles.settings && Array.isArray(kgFiles.settings)) {
    const byCategory = {};
    for (const s of kgFiles.settings) {
      if (!byCategory[s.category]) byCategory[s.category] = [];
      byCategory[s.category].push(s);
    }
    
    for (const [category, list] of Object.entries(byCategory)) {
      md += `\n## ${category}\n`;
      for (const item of list) {
        md += `### ${item.name}\n`;
        for (const [key, value] of Object.entries(item.fields)) {
          md += `- ${key}: ${value}\n`;
        }
        md += '\n';
      }
    }
  }
  
  return md;
}