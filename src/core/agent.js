import { loadAll, loadOutline, loadWorldRules, loadConstraints, loadStyle, loadCharacters, loadFactions, loadLocations } from './kg-reader.js';

export function parseCurrentTask(kgContent, chapter) {
  return { chapterRange: `${chapter}-${chapter}章`, title: '解析中', startChapter: chapter, endChapter: chapter };
}

export function parseCurrentTaskFromOutline(outline, chapter) {
  if (!outline) return null;
  
  const lines = outline.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const eventMatch = line.match(/^###\s+第(\d+)-(\d+)章[：:]\s*(.+)/);
    
    if (eventMatch) {
      const start = parseInt(eventMatch[1].trim());
      const end = parseInt(eventMatch[2].trim());
      let title = eventMatch[3].trim();
      let core = null;
      let summary = null;
      
      if (title.includes('解构内核')) {
        const parts = title.split('|');
        title = parts[0].trim();
        for (const p of parts) {
          if (p.includes('内核')) core = p.replace('解构内核', '').replace('：', '').replace(':', '').trim();
          if (p.includes('梗概')) summary = p.replace('梗概', '').replace('：', '').replace(':', '').trim();
        }
      }
      
      if (chapter >= start && chapter <= end) {
        const currentEvent = {
          chapterRange: `${start}-${end}章`,
          title: title,
          startChapter: start,
          endChapter: end
        };
        
        if (core) currentEvent.core = core;
        if (summary) currentEvent.summary = summary;
        
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const l = lines[j];
          
          if (!currentEvent.core) {
            const coreMatch = l.match(/- (.+?内核)[：:]\s*(.+)/);
            if (coreMatch) currentEvent.core = coreMatch[2].trim();
          }
          
          if (!currentEvent.summary) {
            const sumMatch = l.match(/- 梗概[：:]\s*(.+)/);
            if (sumMatch) currentEvent.summary = sumMatch[1].trim();
          }
          
          if (currentEvent.core || currentEvent.summary) break;
        }
        
        return currentEvent;
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
    if (chapterInfo.core) md += `> 解构内核: ${chapterInfo.core}\n`;
    if (chapterInfo.summary) md += `> 梗概: ${chapterInfo.summary}\n`;
    md += '\n';
  }
  
  if (kgFiles.characters) {
    md += '\n## 已知角色 [必须遵守人设]\n';
    md += kgFiles.characters.slice(0, 800) + '\n';
  }
  
  if (kgFiles.factions) {
    md += '\n## 组织势力 [禁止偏离立场]\n';
    md += kgFiles.factions.slice(0, 600) + '\n';
  }
  
  if (kgFiles.locations) {
    md += '\n## 地理环境 [严格据此场景]\n';
    md += kgFiles.locations.slice(0, 500) + '\n';
  }
  
  if (kgFiles.worldRules) {
    md += '\n## 世界观规则\n';
    md += kgFiles.worldRules.slice(0, 1200) + '\n';
  }
  
  if (kgFiles.constraints) {
    md += '\n## 创作约束 [必须遵守]\n';
    md += kgFiles.constraints.slice(0, 800) + '\n';
  }
  
  if (kgFiles.style) {
    md += '\n## 风格指南 [遵循作者的设定]\n';
    md += kgFiles.style.slice(0, 600) + '\n';
  }
  
  return md;
}