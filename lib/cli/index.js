#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { parseWorldFile } from '../utils/parser.js';
import { buildKnowledgeGraph } from '../kg/kg-files.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(chalk.cyan(`
  ════════════════════════════════════════════════════
    NovelForge v1.0.0 - AI辅助长篇小说创作CLI工具
  ════════════════════════════════════════════════════
`));

const program = new Command();

program
  .name('novel')
  .description('NovelForge - AI辅助长篇小说创作CLI工具')
  .version('1.0.0');

program
  .command('init')
  .description('初始化新项目')
  .argument('[name]', '项目名称')
  .action(async (name) => {
    if (!name) {
      const answers = await inquirer.prompt([
        { name: 'name', message: '项目名称:', type: 'input' }
      ]);
      name = answers.name;
    }
    
    const projectDir = path.join(process.cwd(), name);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    
    const template = `# 《${name}》世界设定集

==世界观基石start==

## 一、核心设定
（描述你的世界观基石 - 世界观、力量体系、核心法则）

==世界观基石end==

==创作规则start==

## 一、创作规则
（描述创作规则 - 战斗法则、社会规则、数值体系）

==创作规则end==

==书的大纲start==

## 一、故事大纲
（描述故事主线、章节规划）

==书的大纲end==

==风格与样例start==

## 一、文风特点
（描述期望的文风、句式特点）

==风格与样例end==

==其他内容start==

## 一、势力设定
（描述势力、组织、角色）

==其他内容end==
`;
    
    fs.writeFileSync(path.join(projectDir, 'world设定.md'), template);
    console.log(chalk.green('✓ 项目已创建: ' + name));
    console.log(chalk.yellow('  请编辑 world设定.md 后运行: novel build ' + name));
  });

program
  .command('config')
  .description('配置LLM')
  .option('-s, --set <key=value>', '设置配置')
  .option('-l, --list', '查看配置')
  .action(async (options) => {
    const configFile = path.join(process.cwd(), '.novelforge.env');
    
    if (options.list || options.show) {
      if (fs.existsSync(configFile)) {
        console.log(chalk.gray('当前配置:'));
        const content = fs.readFileSync(configFile, 'utf-8');
        console.log(chalk.cyan(content));
      } else {
        console.log(chalk.yellow('未配置。请运行: novel config --set LLM_PROVIDER=custom'));
      }
      return;
    }
    
    if (options.set) {
      const [key, value] = options.set.split('=');
      if (!key || !value) {
        console.log(chalk.red('格式错误，请使用: --set KEY=value'));
        return;
      }
      
      let content = '';
      if (fs.existsSync(configFile)) {
        content = fs.readFileSync(configFile, 'utf-8');
      }
      
      content += `${key}=${value}\n`;
      fs.writeFileSync(configFile, content);
      console.log(chalk.green('✓ 已设置: ' + key + '=' + value));
      return;
    }
    
    console.log(chalk.cyan('配置说明:'));
    console.log(chalk.gray('  novel config --set LLM_PROVIDER=custom'));
    console.log(chalk.gray('  novel config --set LLM_BASE_URL=https://api.minimax.chat/v1'));
    console.log(chalk.gray('  novel config --set LLM_API_KEY=sk-xxx'));
    console.log(chalk.gray('  novel config --set LLM_MODEL=MiniMax-M2.7'));
    console.log(chalk.gray('  novel config --list'));
  });

program
  .command('build')
  .description('构建知识图谱')
  .option('-t, --title <title>', '书名')
  .option('-b, --brief <file>', '设定文件路径')
  .argument('[project]', '项目名（可选，如果使用--title则忽略）')
  .action(async (project, options) => {
    let projectDir, projectName, worldFile;
    
    // Handle new --title and --brief options
    if (options.title && options.brief) {
      projectName = options.title;
      
      // Create books directory if it doesn't exist
      const booksDir = path.join(process.cwd(), 'books');
      if (!fs.existsSync(booksDir)) {
        fs.mkdirSync(booksDir, { recursive: true });
      }
      
      // Create project directory under books/
      projectDir = path.join(booksDir, projectName);
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true });
      }
      
      // Use the specified brief file
      worldFile = path.resolve(options.brief);
      
      if (!fs.existsSync(worldFile)) {
        console.log(chalk.red('✗ 设定文件不存在: ' + options.brief));
        return;
      }
      
      console.log(chalk.blue(`📚 创建书籍项目: ${projectName}`));
      console.log(chalk.gray(`  项目目录: ${projectDir}`));
      console.log(chalk.gray(`  设定文件: ${worldFile}`));
      
    } else if (project) {
      // Legacy mode: use project name and world设定.md
      projectName = project;
      projectDir = path.join(process.cwd(), project);
      worldFile = path.join(projectDir, 'world设定.md');
      
      if (!fs.existsSync(projectDir)) {
        console.log(chalk.red('✗ 项目不存在: ' + project));
        return;
      }
      
      if (!fs.existsSync(worldFile)) {
        console.log(chalk.red('✗ 设定文件不存在: world设定.md'));
        return;
      }
    } else {
      console.log(chalk.red('✗ 请指定项目名，或使用 --title 和 --brief 选项'));
      console.log(chalk.gray('  用法1: novel build my-project'));
      console.log(chalk.gray('  用法2: novel build --title "书名" --brief 设定文件.md'));
      return;
    }
    
    console.log(chalk.blue('⏳ 解析设定文件...'));
    console.log(chalk.blue('⏳ 拆分为独立文件...'));
    
    const sections = parseWorldFile(worldFile);
    const files = buildKnowledgeGraph(sections, projectDir, projectName);
    
    console.log(chalk.green('✓ 知识图谱已构建（独立文件）'));
    console.log(chalk.yellow(`  下一步: novel write ${projectName}`));
  });

function findProjectDir(projectName) {
  if (projectName) {
    // First try in books/ directory (higher priority)
    const booksDir = path.join(process.cwd(), 'books');
    if (fs.existsSync(booksDir)) {
      let projectDir = path.join(booksDir, projectName);
      if (fs.existsSync(projectDir)) {
        return { projectDir, projectName };
      }
    }
    
    // Then try direct path
    let projectDir = path.join(process.cwd(), projectName);
    if (fs.existsSync(projectDir)) {
      return { projectDir, projectName };
    }
    
    return null;
  }
  
  // Auto-detect project if only one exists
  let items = [];
  
  // Check current directory
  try {
    const currentDirItems = fs.readdirSync(process.cwd()).filter(item => {
      const itemPath = path.join(process.cwd(), item);
      return fs.statSync(itemPath).isDirectory() && 
             fs.existsSync(path.join(itemPath, 'novelforge'));
    });
    items = items.concat(currentDirItems.map(item => ({ name: item, path: path.join(process.cwd(), item) })));
  } catch (e) {
    // Ignore errors
  }
  
  // Check books/ directory
  const booksDir = path.join(process.cwd(), 'books');
  if (fs.existsSync(booksDir)) {
    try {
      const booksDirItems = fs.readdirSync(booksDir).filter(item => {
        const itemPath = path.join(booksDir, item);
        return fs.statSync(itemPath).isDirectory() && 
               fs.existsSync(path.join(itemPath, 'novelforge'));
      });
      items = items.concat(booksDirItems.map(item => ({ name: item, path: path.join(booksDir, item) })));
    } catch (e) {
      // Ignore errors
    }
  }
  
  if (items.length === 1) {
    return { projectDir: items[0].path, projectName: items[0].name };
  } else if (items.length === 0) {
    return null;
  } else {
    console.log(chalk.yellow('发现多个项目，请指定项目名:'));
    items.forEach(item => console.log(chalk.gray(`  - ${item.name}`)));
    return null;
  }
}

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

program
  .command('write')
  .description('生成章节')
  .argument('[target]', '目标: 章节号/next/rewrite')
  .argument('[project]', '项目名')
  .option('-c, --chapter <num>', '指定章节号')
  .option('-n, --num <num>', '生成数量', '1')
  .action(async (target, project, options) => {
    // Handle arguments reordering for commander
    if (typeof target === 'object') {
      // When only options are provided
      options = target;
      target = 'next';
      project = null;
    } else if (typeof project === 'object') {
      // When target and options are provided
      options = project;
      project = null;
    } else if (typeof project === 'undefined') {
      // When only target is provided
      options = {};
      project = null;
    } else {
      // When both target and project are provided
      options = options || {};
    }
    
    // Find project
    const projectInfo = findProjectDir(project);
    if (!projectInfo) {
      if (project) {
        console.log(chalk.red('✗ 项目不存在: ' + project));
      } else {
        console.log(chalk.red('✗ 未找到项目，请指定项目名或确保在包含项目的目录中'));
      }
      return;
    }
    
    const { projectDir, projectName } = projectInfo;
    const kgDir = path.join(projectDir, 'novelforge');
    const chapterDir = path.join(projectDir, 'chapters');
    
    if (!fs.existsSync(kgDir)) {
      console.log(chalk.red('✗ 请先运行: novel build ' + projectName));
      return;
    }
    
    // Determine chapter number
    let chapterNum;
    let isRewrite = false;
    
    if (options.chapter) {
      chapterNum = parseInt(options.chapter);
    } else if (target === 'next') {
      chapterNum = getNextChapterNumber(chapterDir);
      console.log(chalk.blue(`📝 检测到最新章节为 ${chapterNum - 1}，将生成第 ${chapterNum} 章`));
    } else if (target === 'rewrite' || (target && target.startsWith('rewrite'))) {
      const rewriteMatch = target.match(/rewrite\s*(\d+)?/);
      if (rewriteMatch[1]) {
        chapterNum = parseInt(rewriteMatch[1]);
      } else {
        chapterNum = getNextChapterNumber(chapterDir) - 1;
        if (chapterNum < 1) chapterNum = 1;
      }
      isRewrite = true;
      console.log(chalk.blue(`🔄 将重写第 ${chapterNum} 章`));
    } else if (target && !isNaN(parseInt(target))) {
      chapterNum = parseInt(target);
    } else {
      chapterNum = getNextChapterNumber(chapterDir);
      console.log(chalk.blue(`📝 将生成第 ${chapterNum} 章`));
    }
    
    console.log(chalk.blue('⏳ 初始化LLM...'));
    const { initLLM } = await import('../llm/llm.js');
    initLLM();
    
    console.log(chalk.blue('⏳ 加载Pipeline...'));
    const { AgentPipeline } = await import('../agents/pipeline.js');
    
    const pipeline = new AgentPipeline(projectDir, projectName);
    await pipeline.init();
    
    const action = isRewrite ? '重写' : '生成';
    console.log(chalk.yellow(`\n开始${action}第${chapterNum}章...\n`));
    
    let result;
    try {
      result = await pipeline.run(chapterNum);
    } catch (e) {
      console.log(chalk.red('生成出错: ' + e.message));
      return;
    }
    
    if (!result?.draft) {
      console.log(chalk.red('生成失败，无内容'));
      return;
    }
    
    console.log(chalk.green('\n✓ 生成完成！'));
    console.log(chalk.gray(`  章节: ${result.chapter}`));
    console.log(chalk.gray(`  字数: ${result.draft?.length || 0}`));
    console.log(chalk.gray(`  审计: ${result.passed ? '通过' : '需修订'}`));
    
    if (!fs.existsSync(chapterDir)) {
      fs.mkdirSync(chapterDir, { recursive: true });
    }
    
    const chapterFile = path.join(chapterDir, `ch${chapterNum}.md`);
    fs.writeFileSync(chapterFile, result.draft);
    console.log(chalk.gray(`  已保存: ${chapterFile}`));
  });

program
  .command('preview')
  .description('预览发送给LLM的提示词')
  .argument('[target]', '目标: 章节号/next')
  .argument('[project]', '项目名')
  .option('-c, --chapter <num>', '指定章节号')
  .action(async (target, project, options) => {
    if (typeof target === 'object') {
      options = target;
      target = 'next';
      project = null;
    } else if (typeof project === 'object') {
      options = project;
      project = null;
    } else if (typeof project === 'undefined') {
      options = {};
      project = null;
    }
    
    const projectInfo = findProjectDir(project);
    if (!projectInfo) {
      console.log(chalk.red('✗ 项目不存在'));
      return;
    }
    
    const { projectDir, projectName } = projectInfo;
    const kgDir = path.join(projectDir, 'novelforge');
    
    if (!fs.existsSync(kgDir)) {
      console.log(chalk.red('✗ 请先运行: novel build ' + projectName));
      return;
    }
    
    let chapterNum = 1;
    if (options.chapter) {
      chapterNum = parseInt(options.chapter);
    } else if (target === 'next') {
      const chapterDir = path.join(projectDir, 'chapters');
      if (fs.existsSync(chapterDir)) {
        const chapters = fs.readdirSync(chapterDir)
          .filter(f => f.endsWith('.md'))
          .map(f => {
            const match = f.match(/ch(\d+)\.md/);
            return match ? parseInt(match[1]) : 0;
          })
          .filter(n => n > 0)
          .sort((a, b) => b - a);
        chapterNum = chapters.length > 0 ? chapters[0] + 1 : 1;
      }
    } else if (target && !isNaN(parseInt(target))) {
      chapterNum = parseInt(target);
    }
    
    console.log(chalk.blue(`\n🔍 预览第 ${chapterNum} 章提示词\n`));
    
    const { AgentPipeline } = await import('../agents/pipeline.js');
    const pipeline = new AgentPipeline(projectDir, projectName);
    await pipeline.init();
    
    const preview = await pipeline.previewPrompt(chapterNum);
    
    console.log(chalk.cyan('=== 适配器信息 ==='));
    console.log(`类型: ${preview.adapterType}`);
    console.log(`章节: ${preview.chapterInfo?.title || '未找到'}`);
    
    console.log(chalk.cyan('\n=== 完整提示词 ===\n'));
    for (const msg of preview.messages) {
      console.log(chalk.yellow(`[${msg.role}]`));
      console.log(msg.content);
      console.log('');
    }
  });

program
  .command('status')
  .description('查看项目状态')
  .argument('[project]', '项目名')
  .action(async (project) => {
    // Find project (auto-detect if not specified)
    const projectInfo = findProjectDir(project);
    if (!projectInfo) {
      if (project) {
        console.log(chalk.red('✗ 项目不存在: ' + project));
      } else {
        console.log(chalk.red('✗ 未找到项目，请指定项目名或确保在包含项目的目录中'));
      }
      return;
    }
    
    const { projectDir, projectName } = projectInfo;
    const kgDir = path.join(projectDir, 'novelforge');
    const chapterDir = path.join(projectDir, 'chapters');
    
    console.log(chalk.cyan(`\n=== ${projectName} 项目状态 ===\n`));
    
    if (fs.existsSync(kgDir)) {
      const kgFiles = fs.readdirSync(kgDir);
      console.log(chalk.green('✓ 知识图谱: 已构建'));
      console.log(chalk.gray(`  文件: ${kgFiles.length}个`));
    } else {
      console.log(chalk.yellow('○ 知识图谱: 未构建'));
    }
    
    if (fs.existsSync(chapterDir)) {
      const chapters = fs.readdirSync(chapterDir).filter(f => f.endsWith('.md'));
      console.log(chalk.green(`✓ 章节: ${chapters.length}章`));
      if (chapters.length > 0) {
        const latestChapter = chapters.sort().pop();
        console.log(chalk.gray(`  最新: ${latestChapter}`));
        
        // Show next chapter number
        const nextChapter = getNextChapterNumber(chapterDir);
        console.log(chalk.blue(`  下一章: 第${nextChapter}章`));
      }
    } else {
      console.log(chalk.yellow('○ 章节: 无'));
    }
    
    if (fs.existsSync(path.join(projectDir, 'world设定.md'))) {
      console.log(chalk.green('✓ 设定文件: world设定.md'));
    }
    
    console.log('');
  });

program
  .command('list')
  .description('列出章节')
  .argument('[project]', '项目名')
  .action(async (project) => {
    // Find project (auto-detect if not specified)
    const projectInfo = findProjectDir(project);
    if (!projectInfo) {
      if (project) {
        console.log(chalk.red('✗ 项目不存在: ' + project));
      } else {
        console.log(chalk.red('✗ 未找到项目，请指定项目名或确保在包含项目的目录中'));
      }
      return;
    }
    
    const { projectDir, projectName } = projectInfo;
    const chapterDir = path.join(projectDir, 'chapters');
    
    if (!fs.existsSync(chapterDir)) {
      console.log(chalk.yellow('暂无章节'));
      return;
    }
    
    const chapters = fs.readdirSync(chapterDir)
      .filter(f => f.endsWith('.md'))
      .sort();
    
    console.log(chalk.cyan(`\n=== ${projectName} 章节列表 ===\n`));
    
    chapters.forEach(f => {
      const content = fs.readFileSync(path.join(chapterDir, f), 'utf-8');
      const words = content.length;
      console.log(`  ${f.replace('.md', '')} (${words}字)`);
    });
    
    console.log(chalk.gray(`\n共${chapters.length}章\n`));
  });

program
  .command('read')
  .description('读取章节')
  .argument('[project]', '项目名')
  .argument('[chapter]', '章节号')
  .action(async (project, chapter) => {
    // Handle arguments reordering for commander
    if (typeof project === 'undefined') {
      // No arguments provided - auto-detect project and ask for chapter
      const projectInfo = findProjectDir(null);
      if (!projectInfo) {
        console.log(chalk.red('✗ 未找到项目，请指定项目名或确保在包含项目的目录中'));
        console.log(chalk.gray('  用法: novel read 我的小说 3'));
        return;
      }
      
      // Ask for chapter number
      const answers = await inquirer.prompt([
        { name: 'chapter', message: '章节号:', type: 'input' }
      ]);
      chapter = answers.chapter;
      project = projectInfo.projectName;
    } else if (typeof project === 'string' && !chapter) {
      // Only project provided - auto-detect and treat as chapter number
      const projectInfo = findProjectDir(null);
      if (projectInfo) {
        chapter = project;
        project = projectInfo.projectName;
      } else {
        // Treat as project name, ask for chapter
        const projectInfo = findProjectDir(project);
        if (!projectInfo) {
          console.log(chalk.red('✗ 项目不存在: ' + project));
          return;
        }
        
        const answers = await inquirer.prompt([
          { name: 'chapter', message: '章节号:', type: 'input' }
        ]);
        chapter = answers.chapter;
      }
    }
    
    // Find project
    const projectInfo = findProjectDir(project);
    if (!projectInfo) {
      console.log(chalk.red('✗ 项目不存在: ' + project));
      return;
    }
    
    if (!chapter) {
      console.log(chalk.red('✗ 请指定章节号'));
      console.log(chalk.gray('  用法: novel read 我的小说 3'));
      return;
    }
    
    const { projectDir, projectName } = projectInfo;
    const chapterFile = path.join(projectDir, 'chapters', `ch${chapter}.md`);
    
    if (!fs.existsSync(chapterFile)) {
      console.log(chalk.red(`✗ 章节 ${chapter} 不存在`));
      return;
    }
    
    const content = fs.readFileSync(chapterFile, 'utf-8');
    console.log(chalk.cyan(`\n=== ${projectName} 第${chapter}章 ===\n`));
    console.log(content);
  });

program.parse();