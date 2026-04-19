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
  const model = process.env.LLM_MODEL || process.env.INKOS_LLM_MODEL || 'gpt-4o';
  
  if (!apiKey) {
    throw new Error('LLM_API_KEY 环境变量未设置');
  }
  
  config = { provider, baseURL, apiKey, model };
  
  openaiClient = new OpenAI({
    apiKey,
    baseURL
  });
  
  console.log('✓ LLM配置:', provider, baseURL, model);
  
  return { client: openaiClient, model };
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
  const client = getClient();
  const model = config.model || 'gpt-4o';
  const temperature = options.temperature || 0.7;
  const maxTokens = options.maxTokens || 4000;
  
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

export async function* chatStream(messages, options = {}) {
  const client = getClient();
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