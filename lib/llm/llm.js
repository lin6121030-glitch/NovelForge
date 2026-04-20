import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { ConfigParser } from './config-parser.js';

let openaiClient = null;
let config = {};

function loadEnv() {
  const searchPaths = [
    process.cwd(),
    path.join(process.cwd(), '..'),
    path.join(process.cwd(), '..', 'novel-l'),
    path.join(process.cwd(), '..', 'my-idea')
  ];
  
  for (const projectDir of searchPaths) {
    const envFile = path.join(projectDir, '.novelforge.env');
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf-8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            process.env[key] = valueParts.join('=');
          }
        }
      }
      return;
    }
  }
}

export function initLLM() {
  // Use ConfigParser to get configuration
  const parsedConfig = ConfigParser.parse();
  
  const provider = parsedConfig.provider;
  const baseURL = parsedConfig.baseURL;
  const apiKey = parsedConfig.apiKey;
  const useChat = parsedConfig.apiMode === 'OPENAI' ? 'openai' : parsedConfig.apiMode.toLowerCase();
  
  // Select model using ConfigParser
  const selectedModel = ConfigParser.selectModel(parsedConfig);
  
  if (!apiKey) {
    throw new Error('LLM_API_KEY environment variable not set');
  }
  
  config = {
    provider, 
    baseURL, 
    apiKey, 
    model: selectedModel,
    models: parsedConfig.models,
    useChat  // Add useChat flag
  };
  
  // 使用通用的baseURL，不强制转换
  let actualBaseURL = baseURL;
  
  console.log('🎯 使用API端点:', actualBaseURL);
  
  console.log('LLM configuration:', provider, baseURL, selectedModel);
  console.log('Available models:', Object.values(config.models).filter(m => m));
  
  return { client: openaiClient, model: selectedModel };
}

// Function to switch models dynamically
export function switchModel(modelKey = 'primary') {
  if (!config.models) {
    throw new Error('No available models configured');
  }
  
  const modelMap = {
    primary: config.models.primary,
    secondary: config.models.secondary,
    tertiary: config.models.tertiary
  };
  
  const newModel = modelMap[modelKey];
  if (!newModel) {
    throw new Error(`Model ${modelKey} not available`);
  }
  
  config.model = newModel;
  console.log(`Switched to model: ${newModel}`);
  
  return newModel;
}

// Function to get available models
export function getAvailableModels() {
  return config.models || {};
}

export function getClient() {
  if (!openaiClient) {
    initLLM();
  }
  return openaiClient;
}

export function getConfig() {
  return config;
}

function cleanResponse(content) {
  if (!content) return content;
  
  let cleaned = content;
  
  cleaned = cleaned.replace(/<THINK>[\s\S]*?<\/THINK>/gi, '');
  cleaned = cleaned.replace(/<THINK>[\s\S]*/gi, '');
  cleaned = cleaned.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.replace(/<Think>[\s\S]*?<\/Think>/gi, '');
  cleaned = cleaned.replace(/<Thought>[\s\S]*?<\/Thought>/gi, '');
  cleaned = cleaned.replace(/<THINK>.*/gi, '');
  cleaned = cleaned.replace(/.*<\/THINK>/gi, '');
  
  cleaned = cleaned.trim();
  return cleaned;
}

export async function chat(messages, options = {}) {
  // 确保配置已初始化
  if (!config.model) {
    initLLM();
  }
  
  const model = config.model;
  const temperature = options.temperature || 0.7;
  const maxTokens = options.maxTokens || 4000;
  
  console.log(`🎯 API调用: ${config.baseURL}，模型: ${model}`);
  
  // 直接使用配置的参数，不做任何转换
  const response = await fetch(`${config.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
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
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  const rawContent = data.choices[0]?.message?.content;
  
  return {
    choices: [{
      message: {
        content: cleanResponse(rawContent)
      }
    }]
  };
}

export async function* chatStream(messages, options = {}) {
  const model = config.model || 'gpt-4o';
  const temperature = options.temperature || 0.7;
  const maxTokens = options.maxTokens || 4000;
  
  let buffer = '';
  
  const stream = await client.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true
  });
  
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      buffer += content;
      
      if (buffer.includes('</think>')) {
        const parts = buffer.split('</think>');
        buffer = parts.pop();
      }
      
      yield content;
    }
  }
}