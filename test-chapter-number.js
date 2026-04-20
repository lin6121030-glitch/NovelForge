#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

function getNextChapterNumber(chapterDir) {
  if (!fs.existsSync(chapterDir)) {
    return 1;
  }
  
  const chapters = fs.readdirSync(chapterDir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const match = f.match(/ch(\d+)\.md/);
      return match ? parseInt(match[1]) : 0;
    })
    .filter(n => n > 0)
    .sort((a, b) => b - a);
  
  return chapters.length > 0 ? chapters[0] + 1 : 1;
}

const chapterDir = path.join(process.cwd(), 'test-multi-turn', 'chapters');
console.log('Chapter directory:', chapterDir);
console.log('Exists:', fs.existsSync(chapterDir));

if (fs.existsSync(chapterDir)) {
  const files = fs.readdirSync(chapterDir);
  console.log('Files:', files);
  
  const chapters = files
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const match = f.match(/ch(\d+)\.md/);
      return match ? parseInt(match[1]) : 0;
    })
    .filter(n => n > 0)
    .sort((a, b) => b - a);
  
  console.log('Parsed chapters:', chapters);
  console.log('Next chapter number:', getNextChapterNumber(chapterDir));
}
