import { loadBook, getBookDir } from './kg-new.js';

export function loadAll(projectDir) {
  const bookName = projectDir.split('/').pop();
  const book = loadBook(bookName);
  
  return {
    styles: book.styles,
    settings: book.settings,
    outline: book.outline
  };
}

export function loadOutline(projectDir) {
  const bookName = projectDir.split('/').pop();
  const book = loadBook(bookName);
  return book.outline;
}

export function loadWorldRules(projectDir) {
  return null;
}

export function loadConstraints(projectDir) {
  return null;
}

export function loadStyle(projectDir) {
  const bookName = projectDir.split('/').pop();
  const book = loadBook(bookName);
  return book.styles.map(s => s.content).join('\n\n');
}

export function loadCharacters(projectDir) {
  const bookName = projectDir.split('/').pop();
  const book = loadBook(bookName);
  return book.settings.filter(s => s.category === '人物');
}

export function loadFactions(projectDir) {
  const bookName = projectDir.split('/').pop();
  const book = loadBook(bookName);
  return book.settings.filter(s => s.category === '势力');
}

export function loadLocations(projectDir) {
  const bookName = projectDir.split('/').pop();
  const book = loadBook(bookName);
  return book.settings.filter(s => s.category === '地点');
}