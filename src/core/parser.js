import fs from 'fs';

const SECTION_REGEX = /==([^=]+)start==([\s\S]*?)==\1end==/g;

export function parseWorldFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sections = {};
  
  let match;
  while ((match = SECTION_REGEX.exec(content)) !== null) {
    sections[match[1].trim()] = match[2].trim();
  }
  
  return sections;
}

export function parseAndBuild(filePath, projectName) {
  const sections = parseWorldFile(filePath);
  console.log('解析到的章节:', Object.keys(sections));
  return buildKnowledgeGraphMD(sections, projectName);
}

function buildKnowledgeGraphMD(sections, projectName) {
  let md = `# ${projectName} 知识图谱\n\n`;
  md += `> 生成时间: ${new Date().toISOString()}\n`;
  md += `> 来源章节: ${Object.keys(sections).join(', ')}\n\n`;
  
  if (sections['世界观基石']) {
    md += buildWorldBase(sections['世界观基石']);
  }
  
  if (sections['创作规则']) {
    md += buildWritingRules(sections['创作规则']);
  }
  
  if (sections['书的大纲']) {
    md += buildOutline(sections['书的大纲']);
  }
  
  if (sections['风格与样例']) {
    md += buildStyle(sections['风格与样例']);
  }
  
  if (sections['其他内容']) {
    md += buildOther(sections['其他内容']);
  }
  
  return md;
}

function buildWorldBase(content) {
  let md = `## 世界观基石 [CRITICAL]\n\n`;
  const lines = content.split('\n');
  
  for (const line of lines) {
    if (line.includes('【') && line.includes('】')) {
      const match = line.match(/【(.+)】(.+)/);
      if (match) md += `**${match[1]}**: ${match[2]}\n`;
    } else if (line.includes('世界名称') || line.includes('时代背景') || line.includes('核心矛盾')) {
      md += `- ${line.trim()}\n`;
    } else if (line.startsWith('境界划分') || line.startsWith('核心资源')) {
      md += `\n### ${line.replace(/^#+/, '').trim()}\n`;
    } else if (line.trim()) {
      md += `${line}\n`;
    }
  }
  
  md += `\n`;
  return md;
}

function buildWritingRules(content) {
  let md = `## 创作规则 [MUST_FOLLOW]\n\n`;
  const lines = content.split('\n');
  
  for (const line of lines) {
    if (line.includes('【禁止】')) {
      const match = line.match(/【禁止】(.+)/);
      if (match) md += `❌ **${match[1]}**\n`;
    } else if (line.includes('【') && line.includes('】')) {
      const match = line.match(/【(.+)】(.+)/);
      if (match) md += `✅ **${match[1]}**: ${match[2]}\n`;
    }
  }
  
  md += `\n`;
  return md;
}

function buildOutline(content) {
  let md = `## 情节大纲\n\n`;
  const lines = content.split('\n');
  let currentBook = '';
  
  for (const line of lines) {
    const book = line.match(/^###\s+第(.+?)卷/);
    if (book) {
      md += `\n### 第${book[1]}卷\n`;
      currentBook = book[1];
      continue;
    }
    
    const eventMatch = line.match(/^###\s+第(\d+)-(\d+)章[：:]\s*(.+)/);
    if (eventMatch) {
      md += `\n#### 事件${eventMatch[1]}-${eventMatch[2]}章: ${eventMatch[3]}\n`;
      continue;
    }
    
    if (line.includes('解构内核') || line.includes('梗概')) {
      const detail = line.match(/^\s*[-|]\s*(.+?)[：:]\s*(.+)/);
      if (detail) {
        md += `- ${detail[1].trim()}: ${detail[2].trim()}\n`;
      }
    }
  }
  
  md += `\n`;
  return md;
}

function buildStyle(content) {
  let md = `## 风格与样例 [STYLE_GUIDE]\n`;
  const lines = content.split('\n');
  
  for (const line of lines) {
    if (line.includes('•') || line.includes('◦')) {
      md += `${line.trim()}\n`;
    } else if (line.includes('叙述视角') || line.includes('对话风格') || line.includes('节奏控制') || line.includes('参考场景')) {
      md += `\n### ${line.replace(/^#+/, '').trim()}\n`;
    } else if (line.trim().startsWith('-')) {
      md += `${line.trim()}\n`;
    }
  }
  
  md += `\n`;
  return md;
}

function buildOther(content) {
  return `## 其他规则\n${content}\n\n`;
}

export function loadKnowledgeGraph(projectDir) {
  const kgPath = `${projectDir}/.novelforge/knowledge-graph.md`;
  if (!fs.existsSync(kgPath)) {
    throw new Error(`知识图谱不存在: ${kgPath}`);
  }
  return fs.readFileSync(kgPath, 'utf-8');
}