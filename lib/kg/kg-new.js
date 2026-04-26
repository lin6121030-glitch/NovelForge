import fs from 'fs';
import path from 'path';

const BOOKS_DIR = 'books';

function getBookDir(bookName) {
  return path.join(BOOKS_DIR, bookName);
}
export { getBookDir };

function getStyleDir(bookName) {
  return path.join(getBookDir(bookName), '文风库');
}
function getSettingDir(bookName) {
  return path.join(getBookDir(bookName), '设定库');
}
function getOutlineDir(bookName) {
  return path.join(getBookDir(bookName), '大纲库');
}

// 加载已生成的文件
export function loadStyles(bookName) {
  const dir = getStyleDir(bookName);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  return files.map(file => ({
    name: file.replace('.md', ''),
    content: fs.readFileSync(path.join(dir, file), 'utf-8')
  }));
}

export function loadSettings(bookName) {
  const dir = getSettingDir(bookName);
  if (!fs.existsSync(dir)) return [];
  
  const settings = [];
  const categories = fs.readdirSync(dir).filter(f => {
    return fs.statSync(path.join(dir, f)).isDirectory();
  });
  
  for (const category of categories) {
    const categoryDir = path.join(dir, category);
    const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.md'));
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(categoryDir, file), 'utf-8');
      const lines = content.split('\n');
      const fields = {};
      const fieldOrder = [];
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('-') && trimmed.includes('：')) {
          const colonIdx = trimmed.indexOf('：');
          const key = trimmed.substring(1, colonIdx).trim();
          const value = trimmed.substring(colonIdx + 1).trim();
          fields[key] = value;
          fieldOrder.push(key);
        }
      }
      
      settings.push({
        name: file.replace('.md', ''),
        category: category,
        fields,
        fieldOrder
      });
    }
  }
  
  return settings;
}

export function loadChapter(bookName, chapterNum) {
  const dir = getOutlineDir(bookName);
  const fileName = `第${chapterNum}章.md`;
  const filePath = path.join(dir, fileName);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const chapter = { index: chapterNum };
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') && trimmed.includes('：')) {
      const colonIdx = trimmed.indexOf('：');
      const key = trimmed.substring(2, colonIdx).trim();
      const value = trimmed.substring(colonIdx + 1).trim();
      chapter[key] = value;
    }
  }
  return chapter;
}

export function loadAllChapters(bookName) {
  const dir = getOutlineDir(bookName);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.match(/^第\d+章\.md$/)).sort((a, b) => {
    return parseInt(a.match(/第(\d+)章/)[1]) - parseInt(b.match(/第(\d+)章/)[1]);
  });
  return files.map(file => loadChapter(bookName, parseInt(file.match(/第(\d+)章/)[1])));
}

export function loadOutline(bookName) {
  return loadAllChapters(bookName);
}

export function loadBook(bookName) {
  return {
    styles: loadStyles(bookName),
    settings: loadSettings(bookName),
    outline: loadOutline(bookName)
  };
}

export function loadAll(projectDir) {
  const bookName = projectDir.split('/').pop();
  return loadBook(bookName);
}

// ==================== 生成函数 ====================

// 文风库：## 文风名 + 内容
function parseStyleBlock(block) {
  const lines = block.split('\n');
  let name = null;
  let content = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ')) {
      name = trimmed.replace('## ', '');
    } else if (name) {
      content.push(line);
    }
  }
  return name ? { name, content: content.join('\n').trim() } : null;
}

// 设定库：## 大类 + ### 具体名 + -key：value
function parseSettingBlock(block) {
  const lines = block.split('\n');
  const settings = [];
  let category = null;
  let currentName = null;
  let fields = {};
  let fieldOrder = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.match(/^##[^#]/)) {
      if (currentName) settings.push({ name: currentName, category, fields, fieldOrder });
      category = trimmed.replace('##', '').trim();
      currentName = null;
      fields = {};
    } else if (trimmed.startsWith('### ')) {
      if (currentName) settings.push({ name: currentName, category, fields, fieldOrder });
      currentName = trimmed.replace('### ', '');
      fields = {};
      fieldOrder = [];
    } else if (trimmed.startsWith('-') && trimmed.includes('：')) {
      const colonIdx = trimmed.indexOf('：');
      const key = trimmed.substring(1, colonIdx).trim();
      const value = trimmed.substring(colonIdx + 1).trim();
      fields[key] = value;
      if (!fieldOrder.includes(key)) fieldOrder.push(key);
    }
  }
  if (currentName) settings.push({ name: currentName, category, fields, fieldOrder });
  return settings;
}

// 大纲库：# 第N章 + -key：value + -子项
function parseOutlineBlock(block) {
  const lines = block.split('\n');
  const chapters = [];
  let currentNum = null;
  let fields = {};
  let fieldOrder = [];
  let currentKey = null;
  let currentValue = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# 第')) {
      if (currentKey) fields[currentKey] = currentValue.join('\n').trim();
      if (currentNum) chapters.push({ index: currentNum, ...fields, fieldOrder });
      const match = trimmed.match(/# 第(\d+)章/);
      currentNum = match ? parseInt(match[1]) : chapters.length + 1;
      fields = {};
      fieldOrder = [];
      currentKey = null;
      currentValue = [];
    } else if (trimmed.startsWith('- ') && trimmed.includes('：')) {
      if (currentKey) fields[currentKey] = currentValue.join('\n').trim();
      const colonIdx = trimmed.indexOf('：');
      currentKey = trimmed.substring(2, colonIdx).trim();
      const value = trimmed.substring(colonIdx + 1).trim();
      currentValue = value ? [value] : [];
      if (!fieldOrder.includes(currentKey)) fieldOrder.push(currentKey);
    } else if (currentKey && trimmed.startsWith('- ')) {
      currentValue.push(trimmed.substring(2).trim());
    }
  }
  if (currentKey) fields[currentKey] = currentValue.join('\n').trim();
  if (currentNum) chapters.push({ index: currentNum, ...fields, fieldOrder });
  return chapters;
}

// 识别并解析三个库
function parseRawContent(content) {
  const result = { styles: [], settings: [], chapters: [] };
  
  // 文风库
  const styleMatch = content.match(/==文风库start==([\s\S]*?)==文风库end==/);
  if (styleMatch) {
    const blocks = styleMatch[1].split(/(?=^## )/m);
    for (const block of blocks) {
      const parsed = parseStyleBlock(block);
      if (parsed) result.styles.push(parsed);
    }
  }
  
  // 设定库
  const settingMatch = content.match(/==设定库start==([\s\S]*?)==设定库end==/);
  if (settingMatch) {
    const parsed = parseSettingBlock(settingMatch[1]);
    result.settings.push(...parsed);
  }
  
  // 大纲库
  const outlineMatch = content.match(/==故事大纲start==([\s\S]*?)==故事大纲end==/);
  if (outlineMatch) {
    const parsed = parseOutlineBlock(outlineMatch[1]);
    result.chapters.push(...parsed);
  }
  
  return result;
}

// 生成文件
export function generateBookFiles(bookName, sourceFilePath) {
  const content = fs.readFileSync(sourceFilePath, 'utf-8');
  const { styles, settings, chapters } = parseRawContent(content);
  
  const styleDir = getStyleDir(bookName);
  const settingDir = getSettingDir(bookName);
  const outlineDir = getOutlineDir(bookName);
  
  fs.mkdirSync(styleDir, { recursive: true });
  fs.mkdirSync(settingDir, { recursive: true });
  fs.mkdirSync(outlineDir, { recursive: true });
  
  // 生成文风文件
  for (const s of styles) {
    fs.writeFileSync(path.join(styleDir, `${s.name}.md`), s.content);
  }
  
  // 生成设定文件（按类别生成多级目录）
  const byCategory = {};
  for (const s of settings) {
    if (!byCategory[s.category]) byCategory[s.category] = [];
    byCategory[s.category].push(s);
  }
  for (const [cat, list] of Object.entries(byCategory)) {
    const categoryDir = path.join(settingDir, cat);
    fs.mkdirSync(categoryDir, { recursive: true });
    for (const s of list) {
      let fileContent = '';
      for (const key of s.fieldOrder) {
        if (s.fields[key]) fileContent += `-${key}：${s.fields[key]}\n`;
      }
      fs.writeFileSync(path.join(categoryDir, `${s.name}.md`), fileContent.trim());
    }
  }
  
  // 生成大纲文件
  for (const ch of chapters) {
    let fileContent = '';
    for (const key of ch.fieldOrder) {
      const v = ch[key];
      if (v) {
        if (v.includes('\n')) {
          fileContent += `- ${key}：\n`;
          for (const line of v.split('\n')) {
            fileContent += `  - ${line}\n`;
          }
        } else {
          fileContent += `- ${key}：${v}\n`;
        }
      }
    }
    fs.writeFileSync(path.join(outlineDir, `第${ch.index}章.md`), fileContent.trim());
  }
  
  return { styles, settings, chapters };
}