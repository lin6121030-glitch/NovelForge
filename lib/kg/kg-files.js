import fs from 'fs';
import path from 'path';
import { generateBookFiles, loadBook } from './kg-new.js';

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
  // 新格式使用books目录，不再使用novelforge目录
  // 这里保留接口兼容性，返回新目录结构
  const bookDir = `books/${projectName}`;
  
  if (!fs.existsSync(bookDir)) {
    fs.mkdirSync(bookDir, { recursive: true });
  }
  
  // generateBookFiles 已经在CLI中调用了，这里只返回新格式的位置信息
  console.log('✓ 知识图谱已生成（新格式）');
  
  return {
    bookDir,
    styles: `${bookDir}/文风库`,
    settings: `${bookDir}/设定库`,
    outline: `${bookDir}/大纲库`
  };
}