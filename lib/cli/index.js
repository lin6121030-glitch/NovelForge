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
  .argument('[project]', '项目名')
  .action(async (project) => {
    if (!project) {
      console.log(chalk.red('✗ 请指定项目名'));
      return;
    }
    
    const projectDir = path.join(process.cwd(), project);
    const worldFile = path.join(projectDir, 'world设定.md');
    
    if (!fs.existsSync(projectDir)) {
      console.log(chalk.red('✗ 项目不存在: ' + project));
      return;
    }
    
    if (!fs.existsSync(worldFile)) {
      console.log(chalk.red('✗ 设定文件不存在: world设定.md'));
      return;
    }
    
    console.log(chalk.blue('⏳ 解析设定文件...'));
    console.log(chalk.blue('⏳ 拆分为独立文件...'));
    
    const sections = parseWorldFile(worldFile);
    const files = buildKnowledgeGraph(sections, projectDir, project);
    
    console.log(chalk.green('✓ 知识图谱已构建（独立文件）'));
    console.log(chalk.yellow('  下一步: novel write ' + project));
  });

program
  .command('write')
  .description('生成下一章')
  .option('-c, --chapter <num>', '指定章节号')
  .option('-n, --num <num>', '生成数量', '1')
  .argument('[project]', '项目名')
  .action(async (project, options) => {
    if (!project) {
      console.log(chalk.red('✗ 请指定项目名'));
      return;
    }
    
    const projectDir = path.join(process.cwd(), project);
    const kgDir = path.join(projectDir, 'novelforge');
    
    if (!fs.existsSync(projectDir)) {
      console.log(chalk.red('✗ 项目不存在'));
      return;
    }
    
    if (!fs.existsSync(kgDir)) {
      console.log(chalk.red('✗ 请先运行: novel build ' + project));
      return;
    }
    
    let chapterNum = 1;
    if (options.chapter) {
      chapterNum = parseInt(options.chapter);
    }
    
    console.log(chalk.blue('⏳ 初始化LLM...'));
    const { initLLM } = await import('../llm/llm.js');
    initLLM();
    
    console.log(chalk.blue('⏳ 加载Pipeline...'));
    const { AgentPipeline } = await import('../agents/pipeline.js');
    
    const pipeline = new AgentPipeline(projectDir, project);
    await pipeline.init();
    
    console.log(chalk.yellow(`\n开始生成第${chapterNum}章...\n`));
    
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
    
    const chapterDir = path.join(projectDir, 'chapters');
    if (!fs.existsSync(chapterDir)) {
      fs.mkdirSync(chapterDir, { recursive: true });
    }
    
    const chapterFile = path.join(chapterDir, `ch${chapterNum}.md`);
    fs.writeFileSync(chapterFile, result.draft);
    console.log(chalk.gray(`  已保存: ${chapterFile}`));
  });

program
  .command('status')
  .description('查看项目状态')
  .argument('[project]', '项目名')
  .action(async (project) => {
    if (!project) {
      console.log(chalk.red('✗ 请指定项目名'));
      return;
    }
    
    const projectDir = path.join(process.cwd(), project);
    const kgDir = path.join(projectDir, 'novelforge');
    const chapterDir = path.join(projectDir, 'chapters');
    
    if (!fs.existsSync(projectDir)) {
      console.log(chalk.red('✗ 项目不存在'));
      return;
    }
    
    console.log(chalk.cyan(`\n=== ${project} 项目状态 ===\n`));
    
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
        console.log(chalk.gray(`  最新: ${chapters.sort().pop()}`));
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
    if (!project) {
      console.log(chalk.red('✗ 请指定项目名'));
      return;
    }
    
    const projectDir = path.join(process.cwd(), project);
    const chapterDir = path.join(projectDir, 'chapters');
    
    if (!fs.existsSync(chapterDir)) {
      console.log(chalk.yellow('暂无章节'));
      return;
    }
    
    const chapters = fs.readdirSync(chapterDir)
      .filter(f => f.endsWith('.md'))
      .sort();
    
    console.log(chalk.cyan(`\n=== ${project} 章节列表 ===\n`));
    
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
    if (!project || !chapter) {
      console.log(chalk.red('✗ 请指定项目名和章节号'));
      console.log(chalk.gray('  用法: novel read 我的小说 3'));
      return;
    }
    
    const projectDir = path.join(process.cwd(), project);
    const chapterFile = path.join(projectDir, 'chapters', `ch${chapter}.md`);
    
    if (!fs.existsSync(chapterFile)) {
      console.log(chalk.red(`✗ 章节 ${chapter} 不存在`));
      return;
    }
    
    const content = fs.readFileSync(chapterFile, 'utf-8');
    console.log(chalk.cyan(`\n=== 第${chapter}章 ===\n`));
    console.log(content);
  });

program.parse();