# 多厂商LLM对话框架设计

# 多厂商LLM对话框架设计

## 引言

随着大语言模型技术的快速发展，市场上涌现出众多各具特色的LLM服务商。从OpenAI的GPT系列、Google的Gemini，到Anthropic的Claude，再到国内的百度文心、阿里通义、智谱GLM等，开发者面临着前所未有的选择。然而，如何在多个厂商之间构建统一、稳定、高效的对话框架，成为工程实践中的重要课题。本文将深入探讨多厂商LLM对话框架的设计要点与最佳实践。

---

## 一、多厂商适配的挑战

### 1.1 API接口的异构性

不同LLM厂商的API设计存在显著差异，这是多厂商适配面临的首要挑战。

**请求格式差异**是首要问题。以OpenAI为例，其Chat Completions API的请求结构为：

```json
{
  "model": "gpt-4",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "max_tokens": 1000
}
```

而Anthropic的Claude API则采用不同的格式：

```json
{
  "model": "claude-3-opus-20240229",
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "max_tokens": 1024,
  "temperature": 0.7,
  "system": "You are a helpful assistant."
}
```

**关键差异点**包括：

- `system`字段的位置：OpenAI将其放在消息数组中作为特殊role，Anthropic则作为独立字段
- `max_tokens`的语义：OpenAI表示回复最大token数，Anthropic表示整个输出最大token数
- 模型标识方式：不同厂商使用完全不同的命名规范
- Token计算方式：各厂商对输入输出的token计算可能有细微差异

### 1.2 响应格式的不一致性

响应格式的差异同样显著：

```python
# OpenAI响应结构
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1700000000,
  "model": "gpt-4",
  "choices": [{
    "index": 0,
    "message": {"role": "assistant", "content": "回复内容"},
    "finish_reason": "stop"
  }],
  "usage": {"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30}
}

# Claude响应结构
{
  "id": "msg_xxx",
  "type": "message",
  "role": "assistant",
  "content": [
    {"type": "text", "text": "回复内容"}
  ],
  "model": "claude-3-opus-20240229",
  "stop_reason": "end_turn",
  "usage": {"input_tokens": 10, "output_tokens": 20}
}
```

这些差异要求框架具备统一的数据抽象层，将不同格式转换为内部统一格式。

### 1.3 功能特性与限制的差异

各厂商在功能支持上存在差异：

| 特性 | OpenAI | Anthropic | Google | 百度 |
|------|--------|-----------|--------|------|
| Function Calling | ✅ | ✅ | ✅ | ✅ |
| Vision | ✅ | ✅ | ✅ | ✅ |
| Streaming | ✅ | ✅ | ✅ | ✅ |
| JSON Mode | ✅ | ✅ | ❌ | ✅ |
| System Prompt Max | 灵活 | 灵活 | 8K | 较长 |
| Batch Requests | ✅ | ✅ | ❌ | ✅ |

### 1.4 成本与限流策略

不同厂商的定价策略和速率限制各不相同：

```python
# 价格差异示例（以2024年参考价格）
PRICING = {
    "gpt-4o": {"input": 5.0, "output": 15.0},  # $ / 1M tokens
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    "claude-3-5-sonnet": {"input": 3.0, "output": 15.0},
    "gemini-1.5-pro": {"input": 1.25, "output": 5.0},  # 128K context
    "ernie-4": {"input": 0.12, "output": 0.12},  # 人民币
}
```

速率限制的差异更大：

```python
RATE_LIMITS = {
    "openai": {
        "gpt-4": {"requests_per_minute": 500, "tokens_per_minute": 80000},
        "gpt-4-turbo": {"requests_per_minute": 1000, "tokens_per_minute": 150000},
    },
    "anthropic": {
        "claude-3-opus": {"requests_per_minute": 50, "tokens_per_minute": 40000},
        "claude-3-sonnet": {"requests_per_minute": 1000, "tokens_per_minute": 200000},
    }
}
```

### 1.5 可靠性与容错需求

单一厂商依赖存在风险：

- 服务中断影响业务连续性
- 区域性故障导致部分地区不可用
- 突发流量导致限流

因此，多厂商框架必须具备智能路由和容错能力。

---

## 二、配置管理方案设计

### 2.1 配置架构概述

一个良好的配置管理系统应具备以下特性：

```
┌─────────────────────────────────────────────────────────┐
│                    配置管理层                            │
├─────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │ 环境配置 │  │ 模型配置 │  │ 路由配置 │  │ 监控配置 │   │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘   │
│       └────────────┴────────────┴────────────┘          │
│                         │                               │
│              ┌──────────┴──────────┐                   │
│              │     配置加载器       │                   │
│              │  (支持热更新)        │                   │
│              └──────────┬──────────┘                   │
└─────────────────────────┼───────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────┐
│                   运行时层                               │
│              ┌──────────┴──────────┐                    │
│              │     模型提供者       │                    │
│              │  (Provider Abstraction) │                │
│              └─────────────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

### 2.2 配置层级设计

```python
# config/settings.py
from typing import Dict, Any
from pydantic import BaseModel, Field
from enum import Enum

class ProviderType(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    BAIDU = "baidu"
    ZHIPU = "zhipu"
    LOCAL = "local"  # 支持本地部署模型

class ProviderConfig(BaseModel):
    """单个厂商配置"""
    provider_type: ProviderType
    api_key: str
    base_url: str = "https://api.openai.com/v1"
    timeout: int = 60
    max_retries: int = 3
    retry_delay: float = 1.0
    rate_limit: Dict[str, Any] = Field(default_factory=dict)
    
    # 成本配置
    pricing: Dict[str, float] = Field(default_factory=dict)
    
    # 可用性配置
    enabled: bool = True
    priority: int = 100  # 数值越小优先级越高
    region: str = "default"

class ModelConfig(BaseModel):
    """模型配置"""
    model_name: str
    provider: ProviderType