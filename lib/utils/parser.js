import fs from 'fs';

const SECTION_REGEX = /==([^=]+)start==([\s\S]*?)==\1end==/g;

export function parseWorldFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sections = {};
  
  let match;
  while ((match = SECTION_REGEX.exec(content)) !== null) {
    sections[match[1].trim()] = match[2].trim();
  }
  
  return sections;
}