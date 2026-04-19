import fs from 'fs';
import path from 'path';

const KG_DIR = 'novelforge';

function loadFile(projectDir, fileName) {
  const filePath = path.join(projectDir, KG_DIR, fileName);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}

export function loadWorldSetting(projectDir) {
  return loadFile(projectDir, 'world-setting.md');
}

export function loadWorldRules(projectDir) {
  return loadFile(projectDir, 'world-rules.md');
}

export function loadConstraints(projectDir) {
  return loadFile(projectDir, 'constraints.md');
}

export function loadStyle(projectDir) {
  return loadFile(projectDir, 'style.md');
}

export function loadOutline(projectDir) {
  return loadFile(projectDir, 'outline.md');
}

export function loadCharacters(projectDir) {
  return loadFile(projectDir, 'characters.md');
}

export function loadFactions(projectDir) {
  return loadFile(projectDir, 'factions.md');
}

export function loadLocations(projectDir) {
  return loadFile(projectDir, 'locations.md');
}

export function loadOther(projectDir) {
  return loadFile(projectDir, 'other.md');
}

export function loadAll(projectDir) {
  return {
    worldRules: loadWorldRules(projectDir),
    constraints: loadConstraints(projectDir),
    style: loadStyle(projectDir),
    outline: loadOutline(projectDir),
    characters: loadCharacters(projectDir),
    factions: loadFactions(projectDir),
    locations: loadLocations(projectDir),
    other: loadOther(projectDir)
  };
}