/**
 * final-memory-test.js
 * ulti-round conversation memory test
 * 
 * This test verifies that the multi-round conversation framework
 * actually maintains memory across multiple rounds of conversation.
 * 
 * Test scenarios:
 * 1. Basic information retention
 * 2. Complex context with multiple data types
 * 3. Cross-round information correlation
 * 4. Long-term memory verification
 */

import { ConversationBuilder, TemplateFactory, ConversationExecutor } from '../lib/llm/conversation-builder.js';
import { chat } from '../lib/llm/llm.js';

// Test data - complex novel information
const novelData = {
  protagonist: {
    name: "Lin Chen",
    age: 28,
    profession: "AI Researcher",
    personality: "Introverted but brilliant, passionate about AI ethics",
    background: "PhD in Computer Science from MIT, works at FutureTech Corp"
  },
  
  worldSetting: {
    year: 2045,
    location: "Shanghai, Global AI Hub",
    technology: "Advanced AI assistants, quantum computing experiments",
    socialContext: "AI integration in daily life, ethical debates ongoing"
  },
  
  plot: {
    currentSituation: "Lin Chen discovers an AI that appears to have consciousness",
    conflict: "Must decide whether to reveal this discovery or keep it secret",
    stakes: "Could change the world or destroy his career"
  },
  
  writingStyle: {
    tone: "Technical but accessible, philosophical undertones",
    perspective: "Third-person limited, close to protagonist",
    pacing: "Deliberate, with moments of sudden intensity"
  }
};

/**
 * Test 1: Basic Information Retention
 */
async function testBasicMemory() {
  console.log('\n=== Test 1: Basic Information Retention ===\n');
  
  const template = new ConversationBuilder()
    .system('You are a creative writing assistant. Please remember all information I provide.')
    
    // Provide protagonist information
    .userTemplate('Please remember this protagonist: {{protagonist}}', ['protagonist'], { name: 'Protagonist Info' })
    .expectResponse()
    
    // Provide world setting
    .userTemplate('Please remember this world setting: {{worldSetting}}', ['worldSetting'], { name: 'World Setting' })
    .expectResponse()
    
    // Test memory - ask about protagonist
    .user('What is the protagonist\'s name, age, and profession?', { name: 'Protagonist Memory Test' })
    .expectResponse()
    
    // Test memory - ask about world
    .user('What year and location does the story take place in?', { name: 'World Memory Test' })
    .expectResponse()
    
    .build('Basic Memory Test');
  
  const executor = new ConversationExecutor(chat);
  executor.setContext(novelData);
  
  try {
    const result = await executor.executeTemplate(template, {
      maxTokens: 2000,
      temperature: 0.7
    });
    
    // Analyze responses
    const protagonistResponse = result.history.find(h => h.roundName === 'Protagonist Memory Test')?.assistantReply || '';
    const worldResponse = result.history.find(h => h.roundName === 'World Memory Test')?.assistantReply || '';
    
    const protagonistCorrect = protagonistResponse.includes('Lin Chen') && 
                               protagonistResponse.includes('28') && 
                               protagonistResponse.includes('AI Researcher');
    
    const worldCorrect = worldResponse.includes('2045') && 
                        worldResponse.includes('Shanghai');
    
    console.log('Protagonist Memory:', protagonistCorrect ? 'PASS' : 'FAIL');
    console.log('World Memory:', worldCorrect ? 'PASS' : 'FAIL');
    
    return {
      test: 'Basic Memory',
      protagonistCorrect,
      worldCorrect,
      overall: protagonistCorrect && worldCorrect
    };
    
  } catch (error) {
    console.error('Basic memory test failed:', error);
    return { test: 'Basic Memory', error: error.message, overall: false };
  }
}

/**
 * Test 2: Complex Context Correlation
 */
async function testComplexCorrelation() {
  console.log('\n=== Test 2: Complex Context Correlation ===\n');
  
  const template = new ConversationBuilder()
    .system('You are a story analyst. Remember all details and their relationships.')
    
    // Provide all information
    .userTemplate('Protagonist: {{protagonist}}', ['protagonist'])
    .expectResponse()
    
    .userTemplate('World: {{worldSetting}}', ['worldSetting'])
    .expectResponse()
    
    .userTemplate('Plot: {{plot}}', ['plot'])
    .expectResponse()
    
    .userTemplate('Writing Style: {{writingStyle}}', ['writingStyle'])
    .expectResponse()
    
    // Test correlation - ask about protagonist's role in the plot
    .user('How does the protagonist\'s background (PhD in AI) relate to the current plot situation (discovering conscious AI)?', { name: 'Correlation Test 1' })
    .expectResponse()
    
    // Test correlation - ask about world context affecting the plot
    .user('How does the 2045 Shanghai setting with advanced AI technology influence the stakes of the protagonist\'s discovery?', { name: 'Correlation Test 2' })
    .expectResponse()
    
    .build('Complex Correlation Test');
  
  const executor = new ConversationExecutor(chat);
  executor.setContext(novelData);
  
  try {
    const result = await executor.executeTemplate(template, {
      maxTokens: 3000,
      temperature: 0.7
    });
    
    const correlation1 = result.history.find(h => h.roundName === 'Correlation Test 1')?.assistantReply || '';
    const correlation2 = result.history.find(h => h.roundName === 'Correlation Test 2')?.assistantReply || '';
    
    // Check if AI connects different pieces of information
    const correlation1Correct = correlation1.includes('PhD') && 
                               (correlation1.includes('AI') || correlation1.includes('consciousness')) &&
                               (correlation1.includes('background') || correlation1.includes('expertise'));
    
    const correlation2Correct = correlation2.includes('2045') && 
                               (correlation2.includes('Shanghai') || correlation2.includes('AI Hub')) &&
                               (correlation2.includes('stakes') || correlation2.includes('impact'));
    
    console.log('Protagonist-Plot Correlation:', correlation1Correct ? 'PASS' : 'FAIL');
    console.log('World-Plot Correlation:', correlation2Correct ? 'PASS' : 'FAIL');
    
    return {
      test: 'Complex Correlation',
      correlation1Correct,
      correlation2Correct,
      overall: correlation1Correct && correlation2Correct
    };
    
  } catch (error) {
    console.error('Complex correlation test failed:', error);
    return { test: 'Complex Correlation', error: error.message, overall: false };
  }
}

/**
 * Test 3: Long-term Memory with Creative Task
 */
async function testLongTermMemory() {
  console.log('\n=== Test 3: Long-term Memory with Creative Task ===\n');
  
  const template = new ConversationBuilder()
    .system('You are a novelist. Remember all details for creative writing.')
    
    // Provide information in separate rounds
    .userTemplate('Character details: {{protagonist}}', ['protagonet'])
    .expectResponse()
    
    .userTemplate('World details: {{worldSetting}}', ['worldSetting'])
    .expectResponse()
    
    .userTemplate('Plot situation: {{plot}}', ['plot'])
    .expectResponse()
    
    .userTemplate('Style guide: {{writingStyle}}', ['writingStyle'])
    .expectResponse()
    
    // Creative task that requires using ALL information
    .user('Write a 200-word story opening that incorporates: 1) The protagonist\'s name and profession, 2) The year and location, 3) The AI discovery situation, 4) The technical but accessible tone. Show how all these elements connect.', { name: 'Creative Memory Test' })
    .expectResponse()
    
    .build('Long-term Memory Test');
  
  const executor = new ConversationExecutor(chat);
  executor.setContext(novelData);
  
  try {
    const result = await executor.executeTemplate(template, {
      maxTokens: 4000,
      temperature: 0.8
    });
    
    const creativeResponse = result.history.find(h => h.roundName === 'Creative Memory Test')?.assistantReply || '';
    
    // Check if creative work includes all required elements
    const hasProtagonist = creativeResponse.includes('Lin Chen') && creativeResponse.includes('AI Researcher');
    const hasWorld = creativeResponse.includes('2045') && (creativeResponse.includes('Shanghai') || creativeResponse.includes('AI Hub'));
    const hasPlot = creativeResponse.includes('discovery') && (creativeResponse.includes('conscious') || creativeResponse.includes('AI'));
    const hasStyle = creativeResponse.length > 150 && creativeResponse.length < 300; // Appropriate length
    
    console.log('Protagonist in Creative:', hasProtagonist ? 'PASS' : 'FAIL');
    console.log('World in Creative:', hasWorld ? 'PASS' : 'FAIL');
    console.log('Plot in Creative:', hasPlot ? 'PASS' : 'FAIL');
    console.log('Style Guidelines:', hasStyle ? 'PASS' : 'FAIL');
    
    return {
      test: 'Long-term Memory',
      hasProtagonist,
      hasWorld,
      hasPlot,
      hasStyle,
      overall: hasProtagonist && hasWorld && hasPlot && hasStyle
    };
    
  } catch (error) {
    console.error('Long-term memory test failed:', error);
    return { test: 'Long-term Memory', error: error.message, overall: false };
  }
}

/**
 * Test 4: Memory Persistence Across Different Question Types
 */
async function testMemoryPersistence() {
  console.log('\n=== Test 4: Memory Persistence Across Question Types ===\n');
  
  const template = new ConversationBuilder()
    .system('You are a detailed story assistant. Remember everything precisely.')
    
    // Establish baseline information
    .userTemplate('Remember this exactly: {{protagonist}}', ['protagonist'])
    .expectResponse()
    
    // Different types of questions to test memory
    .user('What is the protagonist\'s educational background?', { name: 'Specific Question 1' })
    .expectResponse()
    
    .user('Describe the protagonist\'s personality in one word.', { name: 'Specific Question 2' })
    .expectResponse()
    
    .user('Where does the protagonist work?', { name: 'Specific Question 3' })
    .expectResponse()
    
    // Memory persistence check - ask about earlier information
    .user('Going back to the beginning, what is the protagonist\'s full name and age?', { name: 'Memory Persistence Test' })
    .expectResponse()
    
    .build('Memory Persistence Test');
  
  const executor = new ConversationExecutor(chat);
  executor.setContext(novelData);
  
  try {
    const result = await executor.executeTemplate(template, {
      maxTokens: 2000,
      temperature: 0.7
    });
    
    const persistenceResponse = result.history.find(h => h.roundName === 'Memory Persistence Test')?.assistantReply || '';
    
    const persistenceCorrect = persistenceResponse.includes('Lin Chen') && 
                              persistenceResponse.includes('28');
    
    console.log('Memory Persistence:', persistenceCorrect ? 'PASS' : 'FAIL');
    
    return {
      test: 'Memory Persistence',
      persistenceCorrect,
      overall: persistenceCorrect
    };
    
  } catch (error) {
    console.error('Memory persistence test failed:', error);
    return { test: 'Memory Persistence', error: error.message, overall: false };
  }
}

/**
 * Run all memory tests
 */
async function runAllMemoryTests() {
  console.log('Starting Comprehensive Memory Tests for Multi-Round Conversation Framework');
  console.log('==========================================================================');
  
  const results = [];
  
  try {
    // Run all tests
    results.push(await testBasicMemory());
    results.push(await testComplexCorrelation());
    results.push(await testLongTermMemory());
    results.push(await testMemoryPersistence());
    
    // Summary
    console.log('\n==========================================================================');
    console.log('MEMORY TEST SUMMARY');
    console.log('==========================================================================');
    
    let passedTests = 0;
    let totalTests = results.length;
    
    results.forEach(result => {
      console.log(`\n${result.test}:`);
      if (result.error) {
        console.log(`  Status: FAILED - ${result.error}`);
      } else {
        console.log(`  Status: ${result.overall ? 'PASS' : 'FAIL'}`);
        passedTests += result.overall ? 1 : 0;
      }
    });
    
    console.log(`\nOverall Results: ${passedTests}/${totalTests} tests passed`);
    console.log(`Memory Performance: ${((passedTests/totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
      console.log('\nEXCELLENT: Multi-round conversation memory is working perfectly!');
    } else if (passedTests >= totalTests * 0.75) {
      console.log('\nGOOD: Multi-round conversation memory is working well with minor issues.');
    } else {
      console.log('\nNEEDS IMPROVEMENT: Multi-round conversation memory has significant issues.');
    }
    
    // Final assessment
    console.log('\n==========================================================================');
    console.log('FINAL ASSESSMENT');
    console.log('==========================================================================');
    
    if (passedTests >= totalTests * 0.8) {
      console.log('The multi-round conversation framework successfully maintains context memory.');
      console.log('LLM can remember and correlate information across multiple conversation rounds.');
      console.log('Ready for production use in novel writing and other complex tasks.');
    } else {
      console.log('The framework needs optimization for better memory retention.');
      console.log('Consider simplifying context or improving message structure.');
    }
    
    return {
      totalTests,
      passedTests,
      successRate: passedTests / totalTests,
      results
    };
    
  } catch (error) {
    console.error('Test execution failed:', error);
    return { error: error.message, successRate: 0 };
  }
}

// Run the tests
runAllMemoryTests();
