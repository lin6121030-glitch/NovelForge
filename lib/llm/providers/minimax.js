/**
 * MiniMax 独立调用类
 * 完全独立的消息构建和 HTTP 调用，不依赖共享的 chat()
 */

import { ConfigParser } from '../config-parser.js';

let config = null;

function getConfig() {
  if (!config) {
    config = ConfigParser.parse();
  }
  return config;
}

export class MiniMaxProvider {
  constructor() {
    this.config = getConfig();
    this.model = this.selectModel();
  }

  selectModel() {
    const { models, defaultModelStrategy } = this.config;
    
    switch (defaultModelStrategy) {
      case 'SECONDARY':
        if (models.secondary) return models.secondary;
      case 'TERTIARY':
        if (models.tertiary) return models.tertiary;
      case 'PRIMARY':
      default:
        return models.primary || 'MiniMax-M2.7';
    }
  }

  async chat(messages, options = {}) {
    const { baseURL, apiKey } = this.config;
    const model = options.model || this.model;
    const temperature = options.temperature || 0.7;
    const maxTokens = options.maxTokens || 50000;

    console.log(`🚀 MiniMax API调用: ${baseURL}，模型: ${model}`);

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: options.stream || false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MiniMax API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    return {
      choices: [{
        message: {
          content: content || ''
        }
      }]
    };
  }

  async *chatStream(messages, options = {}) {
    const { baseURL, apiKey } = this.config;
    const model = options.model || this.model;
    const temperature = options.temperature || 0.7;
    const maxTokens = options.maxTokens || 50000;

    console.log(`🚀 MiniMax 流式API调用: ${baseURL}，模型: ${model}`);

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`MiniMax API Error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        
        const data = trimmed.slice(6).trim();
        if (data === '[DONE]') return;

        try {
          const chunk = JSON.parse(data);
          const content = chunk.choices[0]?.delta?.content;
          if (content) yield content;
        } catch (e) {
          // 跳过解析错误
        }
      }
    }
  }

  getModel() {
    return this.model;
  }

  supportsMemory() {
    return this.model.includes('M2');
  }
}

let instance = null;

export function getMiniMaxProvider() {
  if (!instance) {
    instance = new MiniMaxProvider();
  }
  return instance;
}
