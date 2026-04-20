/**
 *  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
 *  Conversation Builder -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
 *  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -  -
 * 
 *  1.  Purpose
 *      A generic, extensible framework for building multi-turn conversations with LLMs.
 *      Ensures context is provided in a structured, phased manner.
 * 
 *  2.  Core Concepts
 *      - ConversationTemplate: Defines the structure of a multi-turn conversation
 *      - ConversationPhase: A single step in the conversation (e.g., role definition, data provision)
 *      - ContextProvider: Supplies data for a specific phase
 * 
 *  3.  Usage Example
 *      const template = createWriterTemplate("Please do not add chapter titles to the story.");
 *      const template = createWriterTemplate();
 */

/**
 * 对话轮次定义
 * 每轮都可以由调用者完全自定义
 */
export class ConversationRound {
  constructor({
    role, // 'system' | 'user' | 'assistant'
    content, // 可以是字符串或函数(函数接收context参数)
    name = null, // 可选的轮次名称，用于调试
    expectResponse = false, // 是否期望LLM响应
    dataKeys = [], // 需要从context中提取的数据键名
    isTemplate = false // content是否为模板(需要替换{{key}}占位符)
  }) {
    this.role = role;
    this.content = content;
    this.name = name;
    this.expectResponse = expectResponse;
    this.dataKeys = dataKeys;
    this.isTemplate = isTemplate;
  }

  /**
   * 构建此轮次的消息内容
   */
  buildMessage(context = {}) {
    let finalContent = this.content;
    
    // 如果content是函数，调用它
    if (typeof finalContent === 'function') {
      finalContent = finalContent(context);
    }
    
    // 如果是模板，替换占位符
    if (this.isTemplate && typeof finalContent === 'string') {
      for (const key of this.dataKeys) {
        const placeholder = `{{${key}}}`;
        const value = context[key] || '';
        finalContent = finalContent.replace(new RegExp(placeholder, 'g'), value);
      }
    }
    
    return {
      role: this.role,
      content: finalContent
    };
  }
}

/**
 * 通用对话模板
 * 完全由调用者定义轮次和内容
 */
export class ConversationTemplate {
  constructor({
    name,
    description,
    rounds = [], // ConversationRound数组
    maxTokens = 50000,
    temperature = 0.7
  }) {
    this.name = name;
    this.description = description;
    this.rounds = rounds;
    this.maxTokens = maxTokens;
    this.temperature = temperature;
  }

  /**
   * 添加轮次
   */
  addRound(round) {
    this.rounds.push(round);
    return this;
  }

  /**
   * 批量添加轮次
   */
  addRounds(rounds) {
    this.rounds.push(...rounds);
    return this;
  }

  /**
   * 构建初始消息序列(不包含LLM响应)
   */
  buildInitialMessages(context = {}) {
    const messages = [];
    
    for (const round of this.rounds) {
      const message = round.buildMessage(context);
      messages.push(message);
      
      // 如果不期望响应，继续下一轮
      // 如果期望响应，在实际执行时会等待LLM回复
    }
    
    return messages;
  }

  /**
   * 获取需要LLM响应的轮次索引
   */
  getResponseRequiredIndices() {
    const indices = [];
    this.rounds.forEach((round, index) => {
      if (round.expectResponse) {
        indices.push(index);
      }
    });
    return indices;
  }
}

/**
 * 对话执行器
 * 负责执行多轮对话并管理上下文
 * 支持多厂商适配器
 */
import { EnhancedConversationExecutor } from './conversation-adapter.js';

export class ConversationExecutor {
  constructor(chatFunction, config = null) {
    // 使用传入的配置或自动检测
    if (!config) {
      // 使用默认配置，ConfigDetector在EnhancedConversationExecutor中处理
    }
    
    // 使用增强执行器
    this.enhancedExecutor = new EnhancedConversationExecutor(chatFunction, config);
    this.context = {};
    this.history = [];
  }

  initialize() {
    this.enhancedExecutor.initialize();
    return this;
  }

  /**
   * 设置上下文数据
   */
  setContext(context) {
    this.context = { ...this.context, ...context };
    this.enhancedExecutor.setContext(context);
    return this;
  }

  /**
   * 清空上下文
   */
  clearContext() {
    this.context = {};
    this.history = [];
    this.enhancedExecutor.clearContext();
    return this;
  }

  /**
   * 执行对话模板
   */
  async executeTemplate(template, options = {}) {
    const result = await this.enhancedExecutor.executeTemplate(template, options);
    
    // 转换为原有格式以保持兼容性
    const history = result.history.map(item => ({
      roundIndex: 0, // 简化索引
      roundName: '对话',
      userMessage: result.messages[result.messages.length - 2]?.content || '',
      assistantReply: result.response
    }));
    
    this.history = history;
    
    return {
      messages: result.messages,
      history: history,
      finalResponse: result.response,
      adapter: result.adapter,
      supportsMemory: result.supportsMemory
    };
  }

  /**
   * 获取可用模型
   */
  getAvailableModels() {
    return this.enhancedExecutor.getAvailableModels();
  }

  /**
   * 切换模型
   */
  switchModel(modelKey = 'primary') {
    this.enhancedExecutor.switchModel(modelKey);
    return this;
  }

  /**
   * 切换到OpenAI
   */
  switchToOpenAI() {
    this.enhancedExecutor.switchToOpenAI();
    return this;
  }

  /**
   * 切换到MiniMax
   */
  switchToMiniMax() {
    this.enhancedExecutor.switchToMiniMax();
    return this;
  }

  /**
   * 获取当前模型信息
   */
  getCurrentModel() {
    return this.enhancedExecutor.getCurrentModel();
  }
}

/**
 * 便捷的对话构建器
 * 提供流式API来快速构建对话
 */
export class ConversationBuilder {
  constructor() {
    this.rounds = [];
  }

  /**
   * 添加系统消息
   */
  system(content, options = {}) {
    this.rounds.push(new ConversationRound({
      role: 'system',
      content,
      ...options
    }));
    return this;
  }

  /**
   * 添加用户消息
   */
  user(content, options = {}) {
    this.rounds.push(new ConversationRound({
      role: 'user',
      content,
      ...options
    }));
    return this;
  }

  /**
   * 添加模板用户消息
   */
  userTemplate(template, dataKeys = [], options = {}) {
    this.rounds.push(new ConversationRound({
      role: 'user',
      content: template,
      dataKeys,
      isTemplate: true,
      ...options
    }));
    return this;
  }

  /**
   * 添加函数式用户消息
   */
  userFunc(contentFunc, options = {}) {
    this.rounds.push(new ConversationRound({
      role: 'user',
      content: contentFunc,
      ...options
    }));
    return this;
  }

  /**
   * 期望响应
   */
  expectResponse() {
    if (this.rounds.length > 0) {
      this.rounds[this.rounds.length - 1].expectResponse = true;
    }
    return this;
  }

  /**
   * 构建模板
   */
  build(name, description = '') {
    return new ConversationTemplate({
      name,
      description,
      rounds: [...this.rounds]
    });
  }

  /**
   * 清空构建器
   */
  clear() {
    this.rounds = [];
    return this;
  }
}

/**
 * 预设模板工厂
 * 提供常用的对话模板
 */
export class TemplateFactory {
  /**
   * 创建Writer Agent模板 - 中文版本
   */
static createWriterTemplate() {
    return new ConversationBuilder()
      .system('你是一个小说作家。', { name: '系统设定' })
      
      // 极简 prompt
      .userTemplate('Write chapter {{chapterNum}}. {{outline}} {{characters}}', ['chapterNum', 'outline', 'characters'], { name: 'Task' })
      
      .build('Writer Agent 模板', '用于小说创作的多轮对话模板');
  }

  /**
   * 创建Planner Agent模板 - 中文版本
   */
  static createPlannerTemplate() {
    return new ConversationBuilder()
      .system('你是一个创意故事策划师，正在参与结构化对话来接收所有必要的上下文信息。', { name: '系统设定' })
      
      .user('你好！我需要你帮我策划故事结构。作为创意故事策划师，你具备以下能力：\n- 创建详细的章节大纲\n- 规划故事情节和角色发展弧线\n- 确保叙事一致性和节奏控制\n- 将世界观元素自然融入情节结构\n- 平衡动作、角色发展和世界观构建\n\n请确认你理解了这个角色。', { name: '角色定义' })
      .expectResponse()
      
      .userTemplate('以下是可用的角色信息：\n\n{{characters}}\n\n请查看并确认你理解了这些角色。', ['characters'], { name: '角色信息' })
      .expectResponse()
      
      .userTemplate('以下是世界观信息：\n\n## 组织势力\n{{factions}}\n\n## 地理环境\n{{locations}}\n\n## 世界观规则\n{{worldRules}}\n\n请查看并确认你理解了这个世界设定。', ['factions', 'locations', 'worldRules'], { name: '世界观信息' })
      .expectResponse()
      
      .userTemplate('以下是创作指南和约束：\n\n## 风格指南\n{{style}}\n\n## 创作约束\n{{constraints}}\n\n请确认你理解这些要求。', ['style', 'constraints'], { name: '创作约束' })
      .expectResponse()
      
      .user('基于以上所有信息，请创建一个详细的故事计划。\n\n要求：\n- 创建逐章节大纲\n- 定义关键情节和角色发展弧线\n- 确保适当的节奏和叙事流程\n- 自然融入世界观元素\n- 遵循既定风格和约束\n\n请现在提供完整的故事计划。', { name: '策划任务' })
      .expectResponse()
      
      .build('Planner Agent 模板', '用于故事策划的多轮对话模板');
  }

  /**
   * 创建Composer Agent模板 - 中文版本
   */
  static createComposerTemplate() {
    return new ConversationBuilder()
      .system('你是一个文学编辑，正在参与结构化对话来接收所有必要的上下文信息。', { name: '系统设定' })
      
      .user('你好！我需要你帮我整合和润色创意内容。作为文学编辑，你具备以下能力：\n- 将多个内容源整合成连贯的叙事\n- 润色语言并改善流畅度\n- 确保不同内容部分的一致性\n- 在保持作者声音的同时优化散文\n- 优化内容的可读性和吸引力\n\n请确认你理解了这个角色。', { name: '角色定义' })
      .expectResponse()
      
      .userTemplate('以下是需要整合润色的内容：\n\n{{content}}\n\n请查看并确认你理解了这些内容。', ['content'], { name: '待编辑内容' })
      .expectResponse()
      
      .userTemplate('以下是润色指南：\n\n## 风格指南\n{{style}}\n\n## 创作约束\n{{constraints}}\n\n请确认你理解了润色要求。', ['style', 'constraints'], { name: '润色指南' })
      .expectResponse()
      
      .user('基于提供的内容和指南，请整合并润色这些材料。\n\n要求：\n- 无缝整合所有提供的内容\n- 改善语言流畅度和可读性\n- 保持与既定风格的一致性\n- 保留核心意义和意图\n- 确保段落间的平滑过渡\n\n请现在提供润色后的内容。', { name: '编辑任务' })
      .expectResponse()
      
      .build('Composer Agent 模板', '用于内容编辑的多轮对话模板');
  }

  /**
   * 创建自定义简单模板
   */
  static createSimpleTemplate(systemPrompt, userPrompts, options = {}) {
    const builder = new ConversationBuilder();
    
    if (systemPrompt) {
      builder.system(systemPrompt);
    }
    
    userPrompts.forEach((prompt, index) => {
      if (typeof prompt === 'string') {
        builder.user(prompt, { name: `轮次${index + 1}` });
      } else {
        builder.user(prompt.content, { name: prompt.name || `轮次${index + 1}`, ...prompt.options });
      }
      
      // 最后一轮期望响应
      if (index === userPrompts.length - 1) {
        builder.expectResponse();
      }
    });
    
    return builder.build('自定义模板', '用户自定义的简单对话模板');
  }

        }
