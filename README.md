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
# 构建KG（解析作者设定）
node src/cli/index.js build 我的小说

# 生成章节
node src/cli/index.js write 我的小说 -c 1

# 查看状态
node src/cli/index.js status 我的小说
```

## KG解析文件说明

运行 `novel build` 后，会在 `novelforge/` 目录生成以下文件：

| 文件 | 内容 | 使用时机 |
|------|------|----------|
| world-rules.md | 世界观基石 | 写入世界观设定时 |
| constraints.md | 创作规则 | 检查约束时 |
| outline.md | 书的大纲 | 确定章节范围时 |
| style.md | 风格与样例 | 写作时参考风格 |
| characters.md | 人物关系 | 创作角色时参考 |
| factions.md | 组织势力 | 涉及组织时参考 |
| locations.md | 地理环境 | 场景描写时参考 |
| other.md | 其他内容 | 特殊设定参考 |

这些文件在 `novel write` 时会被加载，注入到LLM上下文中。

## 项目结构

```
项目名/
├── world设定.md        # 作者原始设定（8个区块）
├── novelforge/        # 静态KG（由build命令生成）
└── chapters/        # 生成的章节
```

## 设定文件格式

```
==世界观基石start==
（用户随便写）
==世界观基石end==

==创作规则start==
（用户随便写）
==创作规则end==

==书的大纲start==
（用户随便写）
==书的大纲end==

==风格与样例start==
（用户随便写）
==风格与样例end==

==人物关系start==
（用户随便写）
==人物关系end==

==组织势力start==
（用户随便写）
==组织势力end==

==地理环境start==
（用户随便写）
==地理环境end==

==其他内容start==
（用户随便写）
==其他内容end==
```

## CLI命令

- `novel init [名称]` - 初始化项目
- `novel build [项目]` - 构建KG
- `novel write [项目] -c [章节]` - 生成章节
- `novel status [项目]` - 查看项目状态
- `novel list [项目]` - 列出章节
- `novel read [项目] [章节]` - 读取章节
- `novel config --set KEY=value` - 配置LLM