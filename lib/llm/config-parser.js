/**
 * 配置解析器 - 方案A：分层配置
 */

import fs from 'fs';
import path from 'path';

/**
 * ConfigParser class
 */
export class ConfigParser {
  static loadEnvironment() {
    // Load environment variables from .novelforge.env
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
        console.log('Environment loaded from:', envFile);
        break;
      }
    }
  }
  
  static parse() {
    // Load environment variables first
    this.loadEnvironment();
    
    // === 基础配置 ===
    const provider = process.env.LLM_PROVIDER || process.env.INKOS_LLM_PROVIDER || 'openai';
    const baseURL = process.env.LLM_BASE_URL || process.env.INKOS_LLM_BASE_URL || 'https://api.openai.com/v1';
    const apiKey = process.env.LLM_API_KEY || 
                  process.env.INKOS_LLM_API_KEY || 
                  process.env.OPENAI_API_KEY ||
                  process.env.API_KEY ||
                  process.env.OPENAI_KEY;
    
    // === 模型配置 ===
    const models = {
      primary: process.env.LLM_MODEL_PRIMARY || process.env.LLM_MODEL || process.env.INKOS_LLM_MODEL || 'gpt-4o',
      secondary: process.env.LLM_MODEL_SECONDARY || process.env.LLM_MODEL_2 || process.env.INKOS_LLM_MODEL_2,
      tertiary: process.env.LLM_MODEL_TERTIARY || process.env.LLM_MODEL_3 || process.env.INKOS_LLM_MODEL_3
    };
    
    // === 控制配置 ===
    let defaultModelStrategy = process.env.LLM_DEFAULT_MODEL || process.env.INKOS_LLM_DEFAULT_MODEL || 'PRIMARY';
    let apiMode = process.env.LLM_API_MODE || process.env.INKOS_LLM_API_MODE || 'SMART';
    
    // Clean up comments and whitespace
    defaultModelStrategy = defaultModelStrategy.split('#')[0].trim();
    apiMode = apiMode.split('#')[0].trim();
    
    console.log('🔧 配置解析结果:');
    console.log('  Provider:', provider);
    console.log('  Base URL:', baseURL);
    console.log('  Models:', models);
    console.log('  Default Model Strategy:', defaultModelStrategy);
    console.log('  API Mode:', apiMode);
    
    return {
      provider,
      baseURL,
      apiKey,
      models,
      defaultModelStrategy,
      apiMode
    };
  }
  
  /**
   * 选择模型
   */
  static selectModel(config) {
    const { models, defaultModelStrategy } = config;
    
    switch (defaultModelStrategy) {
      case 'SECONDARY':
        if (models.secondary) {
          console.log('🎯 使用SECONDARY模型:', models.secondary);
          return models.secondary;
        }
        // fallthrough to PRIMARY
      case 'TERTIARY':
        if (models.tertiary) {
          console.log('🎯 使用TERTIARY模型:', models.tertiary);
          return models.tertiary;
        }
        // fallthrough to PRIMARY
      case 'PRIMARY':
      default:
        console.log('🎯 使用PRIMARY模型:', models.primary);
        return models.primary;
    }
  }
  
  /**
   * 选择API调用方式
   */
  static selectAPIMode(config, provider) {
    const { apiMode } = config;
    
    switch (apiMode) {
      case 'MINIMAX':
        console.log('🎯 强制使用MiniMax API');
        return 'MINIMAX';
      case 'OPENAI':
        console.log('🎯 强制使用OpenAI API');
        return 'OPENAI';
      case 'SMART':
      default:
        // 智能选择
        if (provider === 'minimax' || provider === 'custom') {
          console.log('🎯 智能选择：MiniMax API');
          return 'MINIMAX';
        } else {
          console.log('🎯 智能选择：OpenAI API');
          return 'OPENAI';
        }
    }
  }
  
  /**
   * 检测模型是否支持上下文记忆
   */
  static detectMemorySupport(provider, model, apiMode) {
    // MiniMax M2-her 支持上下文记忆
    if ((provider === 'minimax' || provider === 'custom') && model && model.includes('M2')) {
      return true;
    }
    
    // 其他厂商暂不支持真正的上下文记忆
    return false;
  }
}
