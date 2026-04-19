import fs from 'fs';
import path from 'path';

export function parseWorldFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sections = {};
  const regex = /==([^=]+)start==([\s\S]*?)==\1end==/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    sections[match[1].trim()] = match[2].trim();
  }
  
  return sections;
}

export function buildKnowledgeGraph(sections, projectDir, projectName) {
  const kgDir = `${projectDir}/novelforge`;
  
  if (!fs.existsSync(kgDir)) {
    fs.mkdirSync(kgDir, { recursive: true });
  }
  
  if (sections['世界观基石']) {
    fs.writeFileSync(`${kgDir}/world-rules.md`, sections['世界观基石']);
  }
  
  if (sections['创作规则']) {
    fs.writeFileSync(`${kgDir}/constraints.md`, sections['创作规则']);
  }
  
  if (sections['书的大纲']) {
    fs.writeFileSync(`${kgDir}/outline.md`, sections['书的大纲']);
  }
  
  if (sections['风格与样例']) {
    fs.writeFileSync(`${kgDir}/style.md`, sections['风格与样例']);
  }
  
  if (sections['人物关系']) {
    fs.writeFileSync(`${kgDir}/characters.md`, sections['人物关系']);
  }
  
  if (sections['组织势力']) {
    fs.writeFileSync(`${kgDir}/factions.md`, sections['组织势力']);
  }
  
  if (sections['地理环境']) {
    fs.writeFileSync(`${kgDir}/locations.md`, sections['地理环境']);
  }
  
  if (sections['其他内容']) {
    fs.writeFileSync(`${kgDir}/other.md`, sections['其他内容']);
  }
  
  console.log('✓ 知识图谱已生成');
  
  return {
    worldRules: `${kgDir}/world-rules.md`,
    constraints: `${kgDir}/constraints.md`,
    outline: `${kgDir}/outline.md`,
    style: `${kgDir}/style.md`,
    characters: `${kgDir}/characters.md`,
    factions: `${kgDir}/factions.md`,
    locations: `${kgDir}/locations.md`,
    other: `${kgDir}/other.md`
  };
}