// Example: Using NovelForge as a library
import { 
  initLLM, 
  AgentPipeline, 
  parseWorldFile, 
  buildKnowledgeGraph 
} from '../lib/index.js';

// Example 1: Using the Agent Pipeline
async function examplePipeline() {
  console.log('=== Agent Pipeline Example ===');
  
  // Initialize LLM
  initLLM();
  
  // Create pipeline for a project
  const pipeline = new AgentPipeline('./my-project', 'My Novel');
  
  // Initialize with knowledge graph
  await pipeline.init();
  
  // Generate a chapter
  const result = await pipeline.run(1);
  console.log('Generated chapter:', result.chapter);
  console.log('Word count:', result.draft.length);
}

// Example 2: Building knowledge graph from world file
async function exampleKnowledgeGraph() {
  console.log('=== Knowledge Graph Example ===');
  
  // Parse world setting file
  const sections = parseWorldFile('./my-project/world-setting.md');
  
  // Build knowledge graph
  const files = buildKnowledgeGraph(sections, './my-project', 'My Novel');
  
  console.log('Knowledge graph files:', Object.keys(files));
}

// Run examples
async function runExamples() {
  try {
    await examplePipeline();
    await exampleKnowledgeGraph();
  } catch (error) {
    console.error('Example failed:', error.message);
  }
}

runExamples();
