# NovelForge

AI辅助长篇小说创作CLI工具

## 安装

```bash
npm install
```

## 配置

创建 `.novelforge.env` 文件：

```
LLM_PROVIDER=custom
LLM_BASE_URL=https://api.minimax.chat/v1
LLM_API_KEY=your-api-key
LLM_MODEL=MiniMax-M2.7
```

## 使用

```bash
# 初始化项目
node src/cli/index.js init 我的小说

# 构建KG
node src/cli/index.js build 我的小说

# 生成章节
node src/cli/index.js write 我的小说 -c 1

# 查看状态
node src/cli/index.js status 我的小说
```

## 项目结构

```
项目名/
├── world设定.md        # 作者原始设定（8个区块）
├── novelforge/        # 静态KG
└── chapters/        # 生成的章节
```

## 设定文件格式

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