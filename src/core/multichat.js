let conversationHistory = [];

export function createConversation(systemPrompt, userPrompt) {
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];
}

export function addToHistory(role, content) {
  conversationHistory.push({ role, content });
  
  if (conversationHistory.length > 20) {
    conversationHistory = conversationHistory.slice(-20);
  }
}

export function getHistory() {
  return conversationHistory;
}

export function clearHistory() {
  conversationHistory = [];
}

export function buildMultiTurnMessages(systemContext, newUserPrompt, maxHistory = 10) {
  const messages = [];
  
  messages.push({ role: 'system', content: systemContext });
  
  const recentHistory = conversationHistory.slice(-maxHistory);
  for (const msg of recentHistory) {
    messages.push(msg);
  }
  
  messages.push({ role: 'user', content: newUserPrompt });
  
  return messages;
}

export async function multiTurnChat(kgContent, chapterInfo, userInput, options = {}) {
  const { chat } = await import('./llm.js');
  const { generateAgentContext, parseCurrentTask } = await import('./agent.js');
  
  const agentContext = generateAgentContext(kgContent, chapterInfo);
  
  const messages = buildMultiTurnMessages(agentContext, userInput, options.maxHistory || 10);
  
  const response = await chat(messages, {
    temperature: options.temperature || 0.7,
    maxTokens: options.maxTokens || 4000
  });
  
  const reply = response.choices[0].message.content;
  
  addToHistory('user', userInput);
  addToHistory('assistant', reply);
  
  return {
    reply,
    chunks: response,
    context: agentContext
  };
}