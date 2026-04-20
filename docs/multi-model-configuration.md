# 多模型配置指南

## 🎯 概述

多轮对话框架现在支持多个LLM模型配置，可以根据不同任务需求动态切换模型。

## 📋 配置选项

### 环境变量配置

在 `.novelforge.env` 文件中配置以下变量：

```bash
# 基础配置
LLM_PROVIDER=custom                    # 厂商：minimax, openai, custom
LLM_BASE_URL=https://api.minimax.chat/v1  # API地址
LLM_API_KEY=your_api_key_here          # API密钥

# 多模型配置
LLM_MODEL=MiniMax-M2.7              # 主要模型
LLM_MODEL_2=MiniMax-M2-her           # 次要模型（支持上下文记忆）
LLM_MODEL_3=gpt-4                    # 第三模型（可选）
```

### 推荐配置

#### MiniMax配置（推荐）
```bash
LLM_PROVIDER=custom
LLM_BASE_URL=https://api.minimax.chat/v1
LLM_API_KEY=your_minimax_api_key
LLM_MODEL=MiniMax-M2.7
LLM_MODEL_2=MiniMax-M2-her
```

#### 混合配置（MiniMax + OpenAI）
```bash
LLM_PROVIDER=custom
LLM_BASE_URL=https://api.minimax.chat/v1
LLM_API_KEY=your_minimax_api_key
LLM_MODEL=MiniMax-M2.7
LLM_MODEL_2=gpt-4
```

## 🚀 模型特性

### MiniMax模型

| 模型 | 特性 | 适用场景 |
|--------|------|----------|
| MiniMax-M2.7 | 基础对话 | 一般对话任务 |
| MiniMax-M2-her | **上下文记忆** | 角色设定、世界观构建、复杂对话 |

### OpenAI模型

| 模型 | 特性 | 适用场景 |
|--------|------|----------|
| gpt-4 | 创意写作 | 小说创作、文本生成 |
| gpt-3.5-turbo | 快速响应 | 简单对话、草稿生成 |

## 💡 使用建议

### 1. 任务驱动的模型选择

```javascript
import { ConversationExecutor } from './lib/llm/conversation-builder.js';

const executor = new ConversationExecutor(chat);
executor.initialize();

// 角色设定任务 - 使用MiniMax M2-her
await executor.switchModel('secondary'); // 切换到LLM_MODEL_2

// 创意写作任务 - 使用OpenAI
await executor.switchToOpenAI();

// 检查当前模型
const current = await executor.getCurrentModel();
console.log('当前模型:', current.model);
console.log('支持记忆:', current.supportsMemory);
```

### 2. 智能切换方法

```javascript
// 切换到MiniMax（优先选择支持记忆的模型）
await executor.switchToMiniMax();

// 切换到OpenAI（优先选择非MiniMax模型）
await executor.switchToOpenAI();

// 手动切换到指定模型
await executor.switchModel('primary');   // LLM_MODEL
await executor.switchModel('secondary'); // LLM_MODEL_2
await executor.switchModel('tertiary');  // LLM_MODEL_3
```

### 3. 最佳实践

#### 角色设定和世界观构建
```javascript
// 使用MiniMax M2-her进行角色设定
await executor.switchToMiniMax();
const characterTemplate = new ConversationBuilder()
  .system('你是角色设定专家，请记住所有角色细节。')
  .userTemplate('角色信息：{{character}}', ['character'])
  .expectResponse()
  .userTemplate('背景设定：{{background}}', ['background'])
  .expectResponse()
  .build('角色设定');

const result = await executor.executeTemplate(characterTemplate);
```

#### 创意写作
```javascript
// 使用OpenAI进行创意写作
await executor.switchToOpenAI();
const writingTemplate = new ConversationBuilder()
  .system('你是创意写作专家，擅长小说创作。')
  .userTemplate('基于角色{{characters}}创作：{{plot}}', ['characters', 'plot'])
  .expectResponse()
  .build('创意写作');

const result = await executor.executeTemplate(writingTemplate);
```

## 🔧 配置检测

框架会自动检测配置：

```javascript
const executor = new ConversationExecutor(chat);
executor.initialize();

// 检查可用模型
const models = executor.getAvailableModels();
console.log('可用模型:', models);

// 检查当前模型
const current = await executor.getCurrentModel();
console.log('当前配置:', current);
```

## ⚠️ 注意事项

1. **API密钥安全**：不要在代码中硬编码API密钥
2. **模型兼容性**：确保API地址与模型匹配
3. **上下文记忆**：只有MiniMax M2-her支持真正的上下文记忆
4. **Token限制**：不同模型的Token限制可能不同

## 🚨 故障排除

### 常见错误

1. **"unknown model"错误**
   - 检查LLM_MODEL配置是否正确
   - 确认API地址与模型匹配

2. **"missing required parameter"错误**
   - 检查API密钥是否正确
   - 确认API地址格式正确

3. **模型切换失败**
   - 检查目标模型是否在配置中
   - 使用`getAvailableModels()`检查可用模型

### 调试方法

```javascript
// 启用详细日志
const executor = new ConversationExecutor(chat);
executor.initialize();

console.log('配置信息:', await executor.getCurrentModel());
console.log('可用模型:', executor.getAvailableModels());

// 测试基础连接
try {
  const response = await chat([{ role: 'user', content: 'test' }]);
  console.log('连接成功:', response.choices[0].message.content);
} catch (error) {
  console.error('连接失败:', error.message);
}
```

## 📈 性能优化

1. **批量处理**：在单次对话中完成多个相关任务
2. **模型选择**：根据任务复杂度选择合适模型
3. **上下文管理**：利用MiniMax的上下文记忆减少重复信息
4. **Token优化**：合理控制对话长度避免超出限制

---

**配置完成后，框架会自动选择最适合的模型并支持动态切换！**
