#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

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

// Simulate the write command logic
const target = 'next';
const project = 'test-multi-turn';
const options = {};

const projectDir = path.join(process.cwd(), project);
const chapterDir = path.join(projectDir, 'chapters');

console.log('Project dir:', projectDir);
console.log('Chapter dir:', chapterDir);

// Determine chapter number
let chapterNum;
let isRewrite = false;

if (options.chapter) {
  chapterNum = parseInt(options.chapter);
  console.log('Using options.chapter:', chapterNum);
} else if (target === 'next') {
  chapterNum = getNextChapterNumber(chapterDir);
  console.log(chalk.blue(`\ud83d\udcdd \u68c0\u6d4b\u5230\u6700\u65b0\u7ae0\u8282\u4e3a ${chapterNum - 1}\uff0c\u5c06\u751f\u6210\u7b2c ${chapterNum} \u7ae0`));
} else if (target === 'rewrite' || (target && target.startsWith('rewrite'))) {
  // ... rewrite logic
} else if (target && !isNaN(parseInt(target))) {
  chapterNum = parseInt(target);
  console.log('Using target as number:', chapterNum);
} else {
  chapterNum = getNextChapterNumber(chapterDir);
  console.log(chalk.blue(`\ud83d\udcdd \u5c06\u751f\u6210\u7b2c ${chapterNum} \u7ae0`));
}

console.log('Final chapter number:', chapterNum);
