import { loadAll, loadOutline, loadWorldRules, loadConstraints, loadStyle, loadCharacters, loadFactions, loadLocations } from './kg-reader.js';

export function parseCurrentTask(kgContent, chapter) {
  return { chapterRange: `${chapter}-${chapter}章`, title: '解析中', startChapter: chapter, endChapter: chapter };
}

export function parseCurrentTaskFromOutline(outline, chapter) {
  if (!outline) return null;
  
  const lines = outline.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^###\s+第(\d+)-(\d+)章[：:]\s*(.+)/);
    
    if (match) {
      const start = parseInt(match[1].trim());
      const end = parseInt(match[2].trim());
      
      if (chapter >= start && chapter <= end) {
        return {
          chapterRange: `${start}-${end}章`,
          title: match[3].trim(),
          startChapter: start,
          endChapter: end
        };
      }
    }
  }
  
  return null;
}

export function generateAgentContext(kgFiles, chapterInfo, projectName = '小说') {
  let md = `# ${projectName} - 当前任务\n\n`;
  
  if (chapterInfo) {
    md += `## 当前事件范围: ${chapterInfo.chapterRange || chapterInfo.startChapter + '-' + chapterInfo.endChapter + '章'}\n`;
    md += `> 事件: ${chapterInfo.title || ''}\n`;
    md += '\n';
  }
  
  if (kgFiles.characters) {
    md += '\n## 已知角色\n';
    md += kgFiles.characters.slice(0, 1000) + '\n';
  }
  
  if (kgFiles.factions) {
    md += '\n## 组织势力\n';
    md += kgFiles.factions.slice(0, 800) + '\n';
  }
  
  if (kgFiles.locations) {
    md += '\n## 地理环境\n';
    md += kgFiles.locations.slice(0, 600) + '\n';
  }
  
  if (kgFiles.worldRules) {
    md += '\n## 世界观规则\n';
    md += kgFiles.worldRules.slice(0, 1500) + '\n';
  }
  
  if (kgFiles.constraints) {
    md += '\n## 创作约束\n';
    md += kgFiles.constraints.slice(0, 1000) + '\n';
  }
  
  if (kgFiles.style) {
    md += '\n## 风格指南\n';
    md += kgFiles.style.slice(0, 800) + '\n';
  }
  
  if (kgFiles.outline) {
    md += '\n## 书的大纲\n';
    md += kgFiles.outline.slice(0, 1200) + '\n';
  }
  
  return md;
}