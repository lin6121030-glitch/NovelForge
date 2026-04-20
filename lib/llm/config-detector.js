import fs from 'fs';
import path from 'path';

/**
 * 配置检测器
 */
export class ConfigDetector {
  static detectFromEnv() {
    // 加载环境变量
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
        break;
      }
    }
    
    const provider = process.env.LLM_PROVIDER || process.env.INKOS_LLM_PROVIDER || 'openai';
    const baseURL = process.env.LLM_BASE_URL || process.env.INKOS_LLM_BASE_URL || 'https://api.openai.com/v1';
    const apiKey = process.env.LLM_API_KEY || process.env.INKOS_LLM_API_KEY || process.env.OPENAI_API_KEY;
    const model = process.env.LLM_MODEL || process.env.INKOS_LLM_MODEL || 'gpt-4o';
    
    // 支持多个模型配置
    const availableModels = {
      primary: model,
      secondary: process.env.LLM_MODEL_2 || process.env.INKOS_LLM_MODEL_2,
      tertiary: process.env.LLM_MODEL_3 || process.env.INKOS_LLM_MODEL_3
    };
    
    // 智能选择模型
    let selectedModel = availableModels.primary;
    
    // 检查LLM_MODEL_DEFAULT标志
    const useModelDefault = process.env.LLM_MODEL_DEFAULT === 'true' || process.env.INKOS_LLM_MODEL_DEFAULT === 'true';
    
    if (provider === 'minimax') {
      // For MiniMax, prefer MiniMax models
      if (useModelDefault && availableModels.secondary && availableModels.secondary.includes('MiniMax')) {
        selectedModel = availableModels.secondary; // Use LLM_MODEL_2 as default
      } else if (availableModels.primary.includes('MiniMax')) {
        selectedModel = availableModels.primary; // Use full name: "MiniMax-M2.7"
      } else {
        // Default MiniMax model if none specified
        selectedModel = 'MiniMax-M2.7';
      }
    }
    
    // 智能模型选择：根据LLM_MODEL_DEFAULT标志决定
    if (useModelDefault && availableModels.secondary && availableModels.secondary.includes('MiniMax')) {
      console.log('🎯 LLM_MODEL_DEFAULT=true，使用默认模型:', availableModels.secondary);
      selectedModel = availableModels.secondary; // Use LLM_MODEL_2 as default
    } else if (availableModels.primary && availableModels.primary.includes('MiniMax')) {
      console.log('🎯 检测到MiniMax模型，使用:', availableModels.primary);
      selectedModel = availableModels.primary; // Use full model name
    } else {
      console.log('🎯 使用默认模型:', selectedModel);
    }
    
    return {
      provider,
      baseURL,
      apiKey,
      model: selectedModel,
      availableModels,
      supportsMemory: this.detectMemorySupport(provider, selectedModel, baseURL)
    };
  }
  
  static detectMemorySupport(provider, model, baseURL) {
    // MiniMax M2-her 支持上下文记忆
    if ((provider === 'minimax' || provider === 'custom' || baseURL?.includes('minimax')) && model && model.includes('M2')) {
      return true;
    }
    
    // 其他厂商暂不支持真正的上下文记忆
    return false;
  }
}
