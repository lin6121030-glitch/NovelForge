/**
 * 多厂商对话适配器
 * 支持不同LLM厂商的上下文记忆特性
 */

/**
 * 适配器基类
 */
export class ConversationAdapter {
  constructor(config) {
    this.config = config;
    this.provider = config.provider || 'openai';
    this.model = config.model || 'gpt-4';
  }

  /**
   * 构建消息 - 子类实现
   */
  buildMessages(rounds, context) {
    throw new Error('buildMessages must be implemented by subclass');
  }

  /**
   * 检查是否支持上下文记忆
   */
  supportsContextMemory() {
    return false;
  }

  /**
   * 获取厂商特定的角色类型
   */
  getRoleTypes() {
    return {
      system: 'system',
      user: 'user',
      assistant: 'assistant'
    };
  }
}

/**
 * MiniMax M2-her 适配器
 * 利用MiniMax的上下文记忆和特殊角色类型
 */
export class MiniMaxAdapter extends ConversationAdapter {
  constructor(config) {
    super(config);
    this.provider = 'minimax';
  }

  supportsContextMemory() {
    return true;
  }

  getRoleTypes() {
    return {
      system: 'system',
      user: 'user',
      assistant: 'assistant',
      user_system: 'user_system',  // MiniMax特殊：用户系统设定
      group: 'group',             // MiniMax特殊：群组对话
      sample_message_user: 'sample_message_user',   // MiniMax特殊：示例用户消息
      sample_message_ai: 'sample_message_ai'       // MiniMax特殊：示例AI消息
    };
  }

  /**
   * 构建MiniMax兼容格式的消息
   * 使用标准角色类型确保API兼容性
   */
  buildMessages(rounds, context) {
    const messages = [];
    
    // 系统设定 - 定义AI的身份、性格、知识范围等
    messages.push({
      role: 'system',
      content: '你是专业的小说创作助手，具备上下文记忆能力。请记住所有提供的信息，用于后续创作。'
    });

    // 构建对话流
    rounds.forEach(round => {
      if (round.isTemplate && round.dataKeys) {
        // 处理模板消息 - 用户的输入
        let content = round.content;
        round.dataKeys.forEach(key => {
          const placeholder = `{{${key}}}`;
          const value = context[key] || '';
          content = content.replace(new RegExp(placeholder, 'g'), value);
        });
        
        messages.push({
          role: 'user',  // 用户的输入
          content: content
        });
        
        // 注意：不要自动添加assistant回复，让API自然响应
      } else {
        // 处理普通消息
        messages.push({
          role: round.role,
          content: round.content
        });
        
        // 注意：不要自动添加assistant回复，让API自然响应
      }
    });

    return messages;
  }
}

/**
 * OpenAI 适配器
 * 标准的多轮对话实现
 */
export class OpenAIAdapter extends ConversationAdapter {
  constructor(config) {
    super(config);
    this.provider = 'openai';
  }

  supportsContextMemory() {
    return false;
  }

  /**
   * 构建标准OpenAI格式的消息
   */
  buildMessages(rounds, context) {
    const messages = [];
    
    // 系统消息
    messages.push({
      role: 'system',
      content: '你是专业的小说创作助手，请记住所有提供的信息。'
    });

    // 逐步添加所有轮次
    rounds.forEach(round => {
      if (round.isTemplate && round.dataKeys) {
        // 处理模板消息
        let content = round.content;
        round.dataKeys.forEach(key => {
          const placeholder = `{{${key}}}`;
          const value = context[key] || '';
          content = content.replace(new RegExp(placeholder, 'g'), value);
        });
        
        messages.push({
          role: round.role,
          content: content
        });
        
        if (round.expectResponse) {
          messages.push({
            role: 'assistant',
            content: '好的，我记住了这个信息。'
          });
        }
      } else {
        // 处理普通消息
        messages.push({
          role: round.role,
          content: round.content
        });
        
        if (round.expectResponse) {
          messages.push({
            role: 'assistant',
            content: '好的，请继续。'
          });
        }
      }
    });

    return messages;
  }
}

/**
 * 适配器工厂
 */
export class AdapterFactory {
  static create(config) {
    const provider = config.provider || 'openai';
    const model = config.model || '';
    
    // MiniMax 特殊处理
    if (provider === 'minimax' || 
        (provider === 'custom' && config.baseURL?.includes('minimax')) || 
        (provider === 'custom' && model.includes('MiniMax'))) {
      return new MiniMaxAdapter(config);
    }
    
    // OpenAI 及其兼容格式
    if (provider === 'openai' || provider === 'custom') {
      return new OpenAIAdapter(config);
    }
    
    // 默认使用OpenAI适配器
    return new OpenAIAdapter(config);
  }
}

/**
 * 增强的对话执行器
 * 支持多厂商适配
 */
import { ConfigParser } from './config-parser.js';

export class EnhancedConversationExecutor {
  constructor(chatFunction, config = null) {
    this.chat = chatFunction;
    this.config = ConfigParser.parse();
    this.adapter = AdapterFactory.create(this.config);
    this.context = {};
    this.history = [];
    this.availableModels = null;
    this.initialized = false;
  }

  initialize() {
    if (!this.initialized) {
      this.availableModels = this.getAvailableModels();
      this.initialized = true;
    }
    return this;
  }

  setContext(context) {
    this.context = { ...this.context, ...context };
    return this;
  }

  clearContext() {
    this.context = {};
    this.history = [];
    return this;
  }

  /**
   * 获取可用模型
   */
  getAvailableModels() {
    return this.config.models || {};
  }

  /**
   * 切换模型
   */
  async switchModel(modelKey = 'primary') {
    const { switchModel } = await import('./llm.js');
    const newModel = switchModel(modelKey);
    
    // 重新创建适配器
    this.adapter = AdapterFactory.create(this.config);
    
    console.log(`切换到模型: ${newModel}`);
    return this;
  }

  /**
   * 切换到OpenAI
   */
  async switchToOpenAI() {
    // 查找非MiniMax模型
    if (this.availableModels.primary && !this.availableModels.primary.includes('MiniMax')) {
      return await this.switchModel('primary');
    } else if (this.availableModels.secondary && !this.availableModels.secondary.includes('MiniMax')) {
      return await this.switchModel('secondary');
    } else if (this.availableModels.tertiary && !this.availableModels.tertiary.includes('MiniMax')) {
      return await this.switchModel('tertiary');
    } else {
      console.log('没有找到OpenAI模型，保持当前配置');
      return this;
    }
  }

  /**
   * 切换到MiniMax
   */
  async switchToMiniMax() {
    // 查找MiniMax模型
    if (this.availableModels.primary && this.availableModels.primary.includes('MiniMax')) {
      return await this.switchModel('primary');
    } else if (this.availableModels.secondary && this.availableModels.secondary.includes('MiniMax')) {
      return await this.switchModel('secondary');
    } else if (this.availableModels.tertiary && this.availableModels.tertiary.includes('MiniMax')) {
      return await this.switchModel('tertiary');
    } else {
      console.log('没有找到MiniMax模型，保持当前配置');
      return this;
    }
  }

  /**
   * 获取当前模型信息
   */
  getCurrentModel() {
    const selectedModel = ConfigParser.selectModel(this.config);
    const apiMode = ConfigParser.selectAPIMode(this.config, this.config.provider);
    
    return {
      model: selectedModel,
      provider: this.config.provider,
      apiMode,
      supportsMemory: this.adapter.supportsContextMemory()
    };
  }

  /**
   * 执行对话模板
   */
  async executeTemplate(template, options = {}) {
    const supportsMemory = this.adapter.supportsContextMemory();
    
    console.log(`🎯 使用 ${this.adapter.provider} 适配器`);
    console.log(`📋 支持上下文记忆: ${supportsMemory ? '是' : '否'}`);
    
    let messages;
    
    if (supportsMemory) {
      // 使用厂商特殊格式
      messages = this.adapter.buildMessages(template.rounds, this.context);
      console.log('🚀 使用厂商特殊上下文记忆格式');
    } else {
      // 使用标准累积格式
      messages = this.buildStandardMessages(template, this.context);
      console.log('📝 使用标准多轮对话格式');
    }
    
    try {
      const response = await this.chat(messages, {
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 50000
      });
      
      const reply = response.choices[0].message.content;
      
      // 记录历史
      this.history.push({
        provider: this.adapter.provider,
        supportsMemory,
        context: this.context,
        response: reply,
        timestamp: new Date().toISOString()
      });
      
      return {
        messages,
        response: reply,
        history: this.history,
        adapter: this.adapter.provider,
        supportsMemory
      };
      
    } catch (error) {
      console.error('❌ 对话执行失败:', error);
      throw error;
    }
  }

  /**
   * 标准多轮消息构建（用于不支持上下文记忆的厂商）
   */
  buildStandardMessages(template, context) {
    const messages = [];
    
    // 构建初始消息
    const initialMessages = template.buildInitialMessages(context);
    
    // 逐轮执行，累积历史
    for (let i = 0; i < template.rounds.length; i++) {
      const round = template.rounds[i];
      const message = initialMessages[i];
      
      messages.push(message);
      
      if (round.expectResponse) {
        // 模拟LLM响应
        messages.push({
          role: 'assistant',
          content: '好的，我理解了。'
        });
      }
    }
    
    return messages;
  }
}
