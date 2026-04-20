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
### API调用方式

- **SMART**: 根据provider自动选择最佳API调用方式
- **MINIMAX**: 强制使用MiniMax原生API调用
- **OPENAI**: 强制使用OpenAI兼容API调用

