/**
 * Test the fixed configuration and model selection
 */

import { initLLM, chat, switchModel, getAvailableModels } from '../lib/llm/llm.js';

async function testConfiguration() {
  console.log('Testing LLM Configuration...\n');
  
  try {
    // Initialize LLM
    const config = initLLM();
    console.log('Initial configuration loaded successfully');
    
    // Test current model
    console.log('\nCurrent model selection:');
    console.log('Selected model:', config.model);
    console.log('Available models:', getAvailableModels());
    
    // Test a simple chat call
    console.log('\nTesting chat call...');
    const response = await chat([
      { role: 'user', content: 'Hello, this is a test message.' }
    ], { maxTokens: 100 });
    
    console.log('Chat response:', response.choices[0].message.content);
    console.log('Configuration test: PASSED');
    
    return true;
    
  } catch (error) {
    console.error('Configuration test: FAILED');
    console.error('Error:', error.message);
    return false;
  }
}

// Run the test
testConfiguration();
