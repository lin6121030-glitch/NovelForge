import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

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
  loadEnv();
  
  const provider = process.env.LLM_PROVIDER || process.env.INKOS_LLM_PROVIDER || 'openai';
  const baseURL = process.env.LLM_BASE_URL || process.env.INKOS_LLM_BASE_URL || 'https://api.openai.com/v1';
  const apiKey = process.env.LLM_API_KEY || process.env.INKOS_LLM_API_KEY || process.env.OPENAI_API_KEY;
  const useChat = process.env.LLM_USE_CHAT || process.env.INKOS_LLM_USE_CHAT || 'openai';
  
  // Support multiple model configurations
  const availableModels = {
    primary: process.env.LLM_MODEL || process.env.INKOS_LLM_MODEL || 'gpt-4o',
    secondary: process.env.LLM_MODEL_2 || process.env.INKOS_LLM_MODEL_2,
    tertiary: process.env.LLM_MODEL_3 || process.env.INKOS_LLM_MODEL_3
  };
  
  // Select appropriate model based on provider and use case
  let selectedModel = availableModels.primary;
  
  if (provider === 'minimax') {
    // For MiniMax, prefer MiniMax models
    if (availableModels.secondary && availableModels.secondary.includes('MiniMax')) {
      selectedModel = availableModels.secondary.replace('MiniMax-', ''); // Convert "MiniMax-M2-her" to "M2-her"
    } else if (availableModels.primary.includes('MiniMax')) {
      selectedModel = availableModels.primary.replace('MiniMax-', ''); // Convert "MiniMax-M2.7" to "M2.7"
    } else {
      // Default MiniMax model if none specified
      selectedModel = 'M2.7';
    }
  }
  
  if (!apiKey) {
    throw new Error('LLM_API_KEY environment variable not set');
  }
  
  config = { 
    provider, 
    baseURL, 
    apiKey, 
    model: selectedModel,
    availableModels,
    useChat  // 添加useChat标志
  };
  
  // Create OpenAI client for all providers to use consistent format
  openaiClient = new OpenAI({
    apiKey,
    baseURL
  });
  
  console.log('LLM configuration:', provider, baseURL, selectedModel);
  console.log('Available models:', Object.values(availableModels).filter(m => m));
  
  return { client: openaiClient, model: selectedModel };
}

// Function to switch models dynamically
export function switchModel(modelKey = 'primary') {
  if (!config.availableModels) {
    throw new Error('No available models configured');
  }
  
  const modelMap = {
    primary: config.availableModels.primary,
    secondary: config.availableModels.secondary,
    tertiary: config.availableModels.tertiary
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
  return config.availableModels || {};
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
  
  // 检查是否强制使用OpenAI路线
  if (config.useChat === 'openai' || config.useChat === 'OpenAI') {
    // 强制使用OpenAI API调用
    const client = getClient();
    const response = await client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: options.stream || false
    });
    
    const rawContent = response.choices[0]?.message?.content;
    if (rawContent) {
      response.choices[0].message.content = cleanResponse(rawContent);
    }
    
    return response;
  } else {
    // 使用原有逻辑（MiniMax or OpenAI）
    // 检查是否是MiniMax
    if (config.provider === 'minimax' || config.baseUrl?.includes('minimax')) {
      // MiniMax API调用
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
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
          top_p: options.top_p || 0.95,
          stream: options.stream || false
        })
      });
      
      if (!response.ok) {
        throw new Error(`MiniMax API Error: ${response.status} ${response.statusText}`);
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
    } else {
      // OpenAI API调用
      const client = getClient();
      const response = await client.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: options.stream || false
      });
      
      const rawContent = response.choices[0]?.message?.content;
      if (rawContent) {
        response.choices[0].message.content = cleanResponse(rawContent);
      }
      
      return response;
    }
  }
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