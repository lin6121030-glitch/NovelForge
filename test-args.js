#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .command('write')
  .description('Generate chapter')
  .argument('[target]', 'Target: chapter number/next/rewrite')
  .argument('[project]', 'Project name')
  .option('-c, --chapter <num>', 'Specify chapter number')
  .option('-n, --num <num>', 'Generate count', '1')
  .action(async (target, project, options) => {
    console.log('Raw arguments:');
    console.log('  target:', target, typeof target);
    console.log('  project:', project, typeof project);
    console.log('  options:', options, typeof options);
    
    // Handle arguments reordering for commander
    if (typeof target === 'object') {
      console.log('Case 1: target is object (only options provided)');
      options = target;
      target = 'next';
      project = null;
    } else if (typeof project === 'object') {
      console.log('Case 2: project is object (target and options provided)');
      options = project;
      project = null;
    } else if (typeof project === 'undefined') {
      console.log('Case 3: project is undefined (only target provided)');
      options = {};
      project = null;
    } else {
      console.log('Case 4: both target and project provided');
      options = options || {};
    }
    
    console.log('Processed arguments:');
    console.log('  target:', target);
    console.log('  project:', project);
    console.log('  options:', options);
  });

program.parse();
