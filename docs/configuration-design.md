# 多模型对话框架配置设计

## 🎯 设计目标

1. **多模型支持**: 支持配置多个LLM模型
2. **智能选择**: 根据配置自动选择最优模型
3. **灵活控制**: 可以强制指定API调用方式
4. **简单易用**: 配置清晰，易于理解和维护

## 📋 推荐配置方案

### 方案A: 分层配置（推荐）

```bash
# === 基础配置 ===
LLM_PROVIDER=custom
LLM_BASE_URL=https://api.minimax.chat/v1
LLM_API_KEY=your_api_key_here

# === 模型配置 ===
# 主要模型（默认使用）
LLM_MODEL_PRIMARY=MiniMax-M2.7

# 次要模型（优先使用）
LLM_MODEL_SECONDARY=MiniMax-M2-her

# 第三模型（可选）
LLM_MODEL_TERTIARY=gpt-4

# === 控制配置 ===
# 默认模型选择策略
LLM_DEFAULT_MODEL=PRIMARY  # PRIMARY | SECONDARY | TERTIARY

# API调用方式控制
LLM_API_MODE=SMART           # SMART | MINIMAX | OPENAI
```

### 方案B: 简化配置

```bash
# === MiniMax配置 ===
LLM_PROVIDER=custom
LLM_BASE_URL=https://api.minimax.chat/v1
LLM_API_KEY=your_api_key_here

# === 模型配置 ===
LLM_MODEL=MiniMax-M2.7        # 主要模型
LLM_MODEL_2=MiniMax-M2-her     # 次要模型

# === 控制标志 ===
LLM_USE_SECONDARY=true          # true: 优先使用LLM_MODEL_2
LLM_FORCE_OPENAI=false         # true: 强制使用OpenAI API
```

## 🔧 配置逻辑设计

### 模型选择优先级

1. **LLM_USE_SECONDARY=true** → 使用 `LLM_MODEL_2`
2. **LLM_FORCE_OPENAI=true** → 使用OpenAI API，忽略其他设置
3. **默认** → 使用 `LLM_MODEL`

### API调用方式

- **SMART**: 根据provider自动选择最佳API调用方式
- **MINIMAX**: 强制使用MiniMax原生API调用
- **OPENAI**: 强制使用OpenAI兼容API调用

## 🎯 具体使用场景

### 场景1: MiniMax M2-her优先

```bash
LLM_PROVIDER=custom
LLM_BASE_URL=https://api.minimax.chat/v1
LLM_API_KEY=your_key
LLM_MODEL=MiniMax-M2.7
LLM_MODEL_2=MiniMax-M2-her
LLM_USE_SECONDARY=true
```

**结果**: 使用MiniMax-M2-her模型，MiniMax API调用

### 场景2: 强制OpenAI

```bash
LLM_PROVIDER=custom
LLM_BASE_URL=https://api.minimax.chat/v1
LLM_API_KEY=your_key
LLM_MODEL=MiniMax-M2.7
LLM_MODEL_2=MiniMax-M2-her
LLM_FORCE_OPENAI=true
```

**结果**: 使用MiniMax-M2.7模型，OpenAI API调用

### 场景3: 智能选择

```bash
LLM_PROVIDER=custom
LLM_BASE_URL=https://api.minimax.chat/v1
LLM_API_KEY=your_key
LLM_MODEL=MiniMax-M2.7
LLM_MODEL_2=MiniMax-M2-her
# 不设置控制标志，使用智能选择
```

**结果**: 根据配置自动选择最优方案

## 🚀 实现建议

### 1. 配置解析器

```javascript
class ConfigParser {
  static parse() {
    return {
      provider: process.env.LLM_PROVIDER,
      baseURL: process.env.LLM_BASE_URL,
      apiKey: process.env.LLM_API_KEY,
      
      // 模型配置
      models: {
        primary: process.env.LLM_MODEL,
        secondary: process.env.LLM_MODEL_2,
        tertiary: process.env.LLM_MODEL_3
      },
      
      // 控制标志
      useSecondary: process.env.LLM_USE_SECONDARY === 'true',
      forceOpenAI: process.env.LLM_FORCE_OPENAI === 'true',
      apiMode: process.env.LLM_API_MODE || 'SMART'
    };
  }
}
```

### 2. 模型选择器

```javascript
class ModelSelector {
  static select(config) {
    if (config.forceOpenAI) {
      return config.models.primary;
    }
    
    if (config.useSecondary && config.models.secondary) {
      return config.models.secondary;
    }
    
    return config.models.primary;
  }
}
```

### 3. API调用器

```javascript
class APICaller {
  static async call(model, messages, config) {
    if (config.apiMode === 'OPENAI' || config.forceOpenAI) {
      return this.callOpenAI(model, messages, config);
    }
    
    if (config.apiMode === 'MINIMAX') {
      return this.callMiniMax(model, messages, config);
    }
    
    // SMART模式：自动选择
    if (config.provider === 'minimax') {
      return this.callMiniMax(model, messages, config);
    }
    
    return this.callOpenAI(model, messages, config);
  }
}
```

## 📝 配置文件示例

### .novelforge.env

```bash
# === 基础配置 ===
LLM_PROVIDER=custom
LLM_BASE_URL=https://api.minimax.chat/v1
LLM_API_KEY=sk-cp-fFz5mi567KuMh0MTcqGIsI4mvk3ESOX2INO8qdlCAAlMbz2l4OZj18qe0eul7iiz3ur3kZpTlUl8p59q1EqMGlHjuPCFtUonTFuJrS1SvVHzAaM0iN4cYkk

# === 模型配置 ===
LLM_MODEL=MiniMax-M2.7
LLM_MODEL_2=MiniMax-M2-her

# === 控制配置 ===
LLM_USE_SECONDARY=true
LLM_FORCE_OPENAI=false
```

## 🎯 优势

1. **清晰易懂**: 配置项名称直观，含义明确
2. **灵活控制**: 可以精确控制模型选择和API调用方式
3. **向后兼容**: 保持现有配置的支持
4. **易于扩展**: 可以轻松添加新的配置选项
5. **调试友好**: 配置逻辑清晰，便于调试

## 🚀 下一步

1. **选择配置方案**: 从方案A或方案B中选择一个
2. **实现配置解析**: 根据选择的方案实现解析器
3. **更新测试**: 创建对应的测试用例
4. **文档更新**: 更新使用文档和示例

你觉得这个设计方案如何？我们可以基于这个设计来实现具体的配置逻辑。
