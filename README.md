# NovelForge

AI辅助长篇小说创作CLI工具

## 安装

```bash
npm install
```

## 配置

复制 `.novelforge.env.example` 为 `.novelforge.env` 并配置：

```
LLM_PROVIDER=custom
LLM_BASE_URL=https://api.minimax.chat/v1
LLM_API_KEY=your-api-key
LLM_MODEL=MiniMax-M2.7
```

## 使用

```bash
# 创建书籍（基于设定文件）
node bin/novel.js build --title "书名" --brief "设定文件.md"

# 生成章节
node bin/novel.js write 1

# 查看状态
node bin/novel.js status
```

## 设定文件格式

新的设定文件格式支持三个部分：文风库、设定库、故事大纲

```markdown
==文风库start==
## 开局
> 文风内容示例...

## 日常
> 文风内容示例...
==文风库end==

==设定库start==
## 人物
### 主角名
- 身份定义：xxx
- 初始修为：xxx
- 性格核心：xxx

###配角名
- 身份定义：xxx
-xx: xxx
==设定库end==

==故事大纲start==
# 第1章
- 标题：章节标题
- 文风：开局
- 实体：涉及的角色/势力
- 目标：章节目标
- 关键情节：
  - 情节1
  - 情节2

# 第2章
- 标题：xxx
- 文风：日常
- 实体：xxx
- 目标：xxx
- 关键情节：
  - xxx
==故事大纲end==
```

### 格式说明

**文风库**：
- `## 文风名` 作为小节标题
- 内容为示例文本，供LLM参考该文风特点

**设定库**：
- `## 大类`（如人物、装备、势力、地点等）
- `### 具体名`（每个独立设定）
- `- key：value` 格式的属性，key和value都是动态的

**故事大纲**：
- `# 第N章` 标记章节
- `- 标题：`、`- 文风：`、`- 实体：`、`- 目标：`、`- 关键情节：` 为固定字段
- 关键情节支持多行子项缩进格式

## 项目结构

```
books/
└── 书名/
    ├── 文风库/
    │   ├── 开局.md
    │   ├── 日常.md
    │   └── 其他文风.md
    ├── 设定库/
    │   ├── 人物.md
    │   ├── 装备.md
    │   ├── 势力.md
    │   └── 地点.md
    └── 大纲库/
        ├── 第1章.md
        ├── 第2章.md
        └── 第N章.md
```

## CLI命令

- `novel build --title "书名" --brief "设定文件.md"` - 创建书籍项目
- `novel write [章节号]` - 生成章节
- `novel status` - 查看项目状态
- `novel list` - 列出章节
- `novel read [章节号]` - 读取章节
- `novel config --set KEY=value` - 配置LLM