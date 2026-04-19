import { loadAll, loadOutline, loadWorldRules, loadConstraints, loadStyle, loadCharacters, loadFactions, loadLocations } from '../kg/kg-reader.js';

export function parseCurrentTask(kgContent, chapter) {
  return { chapterRange: `${chapter}-${chapter}章`, title: '解析中', startChapter: chapter, endChapter: chapter };
}

export function parseCurrentTaskFromOutline(outline, chapter) {
  if (!outline) return null;
  
  const lines = outline.split('\n');
  
  for (const line of lines) {
    // Try to match user's specific format first: "### 1-3: title" or "### 1-3| title"
    let match = line.match(/^###\s+(\d+)-(\d+)\s*[|:]\s*(.+)/);
    
    if (match) {
      const start = parseInt(match[1].trim());
      const end = parseInt(match[2].trim());
      
      if (chapter >= start && chapter <= end) {
        return {
          chapterRange: `${start}-${end}`,
          title: match[3].trim(),
          startChapter: start,
          endChapter: end
        };
      }
    }
    
    // Try to match user's single chapter format: "### 1: title" or "### 1| title"
    match = line.match(/^###\s+(\d+)\s*[|:]\s*(.+)/);
    
    if (match) {
      const chapterNum = parseInt(match[1].trim());
      
      if (chapter === chapterNum) {
        return {
          chapterRange: `${chapterNum}`,
          title: match[2].trim(),
          startChapter: chapterNum,
          endChapter: chapterNum
        };
      }
    }
    
    // Try to match original format with "Chapter" text: "### 1-3: title" or "### 1: title"
    match = line.match(/^###\s+.*?(\d+)-(\d+).*?[|:]\s*(.+)/);
    
    if (match) {
      const start = parseInt(match[1].trim());
      const end = parseInt(match[2].trim());
      
      if (chapter >= start && chapter <= end) {
        return {
          chapterRange: `${start}-${end}`,
          title: match[3].trim(),
          startChapter: start,
          endChapter: end
        };
      }
    }
    
    // Try to match original single chapter format with "Chapter" text: "### 1: title"
    match = line.match(/^###\s+.*?(\d+).*?[|:]\s*(.+)/);
    
    if (match) {
      const chapterNum = parseInt(match[1].trim());
      
      if (chapter === chapterNum) {
        return {
          chapterRange: `${chapterNum}`,
          title: match[2].trim(),
          startChapter: chapterNum,
          endChapter: chapterNum
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
    md += kgFiles.characters + '\n';
  }
  
  if (kgFiles.factions) {
    md += '\n## 组织势力\n';
    md += kgFiles.factions + '\n';
  }
  
  if (kgFiles.locations) {
    md += '\n## 地理环境\n';
    md += kgFiles.locations + '\n';
  }
  
  if (kgFiles.worldRules) {
    md += '\n## 世界观规则\n';
    md += kgFiles.worldRules + '\n';
  }
  
  if (kgFiles.constraints) {
    md += '\n## 创作约束\n';
    md += kgFiles.constraints + '\n';
  }
  
  if (kgFiles.style) {
    md += '\n## 风格指南\n';
    md += kgFiles.style + '\n';
  }
  
  if (kgFiles.outline) {
    md += '\n## 书的大纲\n';
    md += kgFiles.outline + '\n';
  }
  
  return md;
}