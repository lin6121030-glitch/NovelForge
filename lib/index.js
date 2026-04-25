// NovelForge - AI assisted novel writing library
// Main entry point for the library

// Export core functionality
export { initLLM, getClient, getConfig, chat, chatStream } from './llm/llm.js';
export { multiTurnChat, createConversation, addToHistory, getHistory, clearHistory } from './llm/multichat.js';

// Export knowledge graph functionality (new format)
export { loadStyles, loadSettings, loadOutline as loadBookOutline, loadBook, getBookDir, generateBookFiles } from './kg/kg-new.js';
export { loadAll, loadOutline, loadWorldRules, loadConstraints, loadStyle, loadCharacters, loadFactions, loadLocations } from './kg/kg-reader.js';

// Export agent functionality
export { parseCurrentTask, parseCurrentTaskFromOutline, generateAgentContext } from './agents/agent.js';
export { AgentPipeline } from './agents/pipeline.js';

// Export version
export const version = '1.0.0';
