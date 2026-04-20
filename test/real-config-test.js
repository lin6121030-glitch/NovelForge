/**
 * Real configuration test - reads from .novelforge.env
 */

import { ConversationBuilder, ConversationExecutor } from '../lib/llm/conversation-builder.js';
import { chat } from '../lib/llm/llm.js';

async function testRealConfig() {
  console.log('===  Real Configuration Test ===');
  
  // Don't set any environment variables here
  // Let ConfigParser read from .novelforge.env
  
  const executor = new ConversationExecutor(chat);
  executor.initialize();
  
  const current = await executor.getCurrentModel();
  
  console.log('Configuration loaded from .novelforge.env:');
  console.log('Current Model:', current.model);
  console.log('Provider:', current.provider);
  console.log('API Mode:', current.apiMode);
  console.log('Supports Memory:', current.supportsMemory);
  
  // Test actual conversation
  console.log('\n=== Testing Conversation ===');
  
  const template = new ConversationBuilder()
    .system('You are a helpful AI assistant.')
    .user('Hello, please introduce yourself.')
    .expectResponse()
    .build('Real Config Test');
  
  try {
    const result = await executor.executeTemplate(template, {
      maxTokens: 1000,
      temperature: 0.7
    });
    
    console.log('Conversation successful!');
    console.log('Response:', result.finalResponse?.substring(0, 100) + '...');
    
  } catch (error) {
    console.error('Conversation failed:', error.message);
  }
}

// Run test
testRealConfig();
