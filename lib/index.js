// NovelForge - AI assisted novel writing library
// Main entry point for the library

// Export core functionality
export { initLLM, getClient, getConfig, chat, chatStream } from './llm/llm.js';
export { multiTurnChat, createConversation, addToHistory, getHistory, clearHistory } from './llm/multichat.js';

// Export knowledge graph functionality
export { parseWorldFile } from './utils/parser.js';
export { buildKnowledgeGraph } from './kg/kg-files.js';
export { loadAll, loadOutline, loadWorldRules, loadConstraints, loadStyle, loadCharacters, loadFactions, loadLocations } from './kg/kg-reader.js';

// Export new knowledge graph functionality (book-based)
export { loadStyles, loadSettings, loadOutline as loadBookOutline, loadBook, getBookDir } from './kg/kg-new.js';

// Export agent functionality
export { parseCurrentTask, parseCurrentTaskFromOutline, generateAgentContext } from './agents/agent.js';
export { AgentPipeline } from './agents/pipeline.js';

// Export version
export const version = '1.0.0';
