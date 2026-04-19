# NovelForge 使用指南

## 🚀 快速开始

### 1. 初始化项目
```bash
# 创建新项目
node bin/novel.js init 我的小说

# 编辑世界设定文件
# 编辑 我的小说/world设定.md
```

### 2. 构建知识图谱
```bash
# 构建知识图谱
node bin/novel.js build 我的小说
```

### 3. 配置 LLM
```bash
# 配置 OpenAI
node bin/novel.js config --set LLM_PROVIDER=openai
node bin/novel.js config --set LLM_API_KEY=your-api-key
node bin/novel.js config --set LLM_MODEL=gpt-4o

# 或使用其他服务商
node bin/novel.js config --set LLM_PROVIDER=custom
node bin/novel.js config --set LLM_BASE_URL=https://api.minimax.chat/v1
node bin/novel.js config --set LLM_MODEL=MiniMax-M2.7
```

## ✨ 智能写作功能

### 📝 生成章节

#### 自动检测项目（只有一个项目时可省略项目名）
```bash
# 生成下一章（自动检测）
node bin/novel.js write

# 等同于
node bin/novel.js write next
```

#### 指定章节
```bash
# 生成指定章节
node bin/novel.js write 5

# 使用选项
node bin/novel.js write --chapter 5
```

#### 重写章节
```bash
# 重写最新章节
node bin/novel.js write rewrite

# 重写指定章节
node bin/novel.js write rewrite 3
node bin/novel.js write rewrite3
```

### 📊 项目状态
```bash
# 查看状态（自动检测项目）
node bin/novel.js status

# 查看指定项目状态
node bin/novel.js status 我的小说
```

### 📚 章节管理
```bash
# 列出所有章节
node bin/novel.js list 我的小说

# 读取指定章节
node bin/novel.js read 我的小说 3
```

## 🎯 使用场景示例

### 场景 1：开始写新小说
```bash
# 1. 初始化
node bin/novel.js init 仙侠小说

# 2. 编辑设定文件（手动编辑 仙侠小说/world设定.md）

# 3. 构建知识图谱
node bin/novel.js build 仙侠小说

# 4. 配置 LLM（首次使用）
node bin/novel.js config --set LLM_API_KEY=your-key

# 5. 开始写作
node bin/novel.js write 仙侠小说
```

### 场景 2：继续写作
```bash
# 直接写下一章（自动检测项目）
node bin/novel.js write

# 或指定项目
node bin/novel.js write next 仙侠小说
```

### 场景 3：修改不满意章节
```bash
# 重写最新章节
node bin/novel.js write rewrite

# 重写第 5 章
node bin/novel.js write rewrite 5
```

### 场景 4：查看进度
```bash
# 查看项目状态
node bin/novel.js status

# 查看章节列表
node bin/novel.js list

# 读取第 3 章
node bin/novel.js read 3
```

## 🔧 高级功能

### 多项目管理
当目录中有多个项目时，系统会提示你选择：
```bash
$ node bin/novel.js status
发现多个项目，请指定项目名:
  - 仙侠小说
  - 都市言情
```

### 章节号自动检测
- `write` - 自动生成下一章
- `write next` - 明确指定生成下一章
- `write 5` - 生成第 5 章
- `write rewrite` - 重写最新章节
- `write rewrite 3` - 重写第 3 章

## 📁 项目结构
```
我的小说/
├── world设定.md          # 世界设定文件
├── novelforge/          # 知识图谱目录
│   ├── world-rules.md    # 世界观规则
│   ├── outline.md        # 大纲
│   ├── characters.md     # 角色设定
│   └── ...
└── chapters/            # 章节目录
    ├── ch1.md          # 第 1 章
    ├── ch2.md          # 第 2 章
    └── ...
```

## 🎨 写作技巧

1. **完善的世界设定**：详细编辑 `world设定.md`，包含世界观、角色、大纲等
2. **循序渐进**：先构建知识图谱，再开始写作
3. **及时重写**：对不满意的章节使用 `rewrite` 命令
4. **查看状态**：定期使用 `status` 命令了解写作进度

## 🆘 常见问题

**Q: 如何切换 LLM 服务商？**
A: 使用 `config` 命令重新设置 `LLM_PROVIDER`、`LLM_BASE_URL` 等参数。

**Q: 章节生成失败怎么办？**
A: 检查 LLM 配置是否正确，网络是否通畅，知识图谱是否已构建。

**Q: 如何修改已生成的章节？**
A: 使用 `rewrite` 命令重新生成，或直接编辑 `chapters/chX.md` 文件。

**Q: 支持哪些 LLM 模型？**
A: 支持 OpenAI GPT 系列以及任何兼容 OpenAI API 的模型。
