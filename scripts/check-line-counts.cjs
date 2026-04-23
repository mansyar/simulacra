#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const MAX_LINES = 500;
const SOURCE_DIRS = ['src', 'convex'];
const EXTENSIONS = ['.ts', '.js', '.tsx', '.jsx'];
const EXCLUDE_PATTERNS = ['node_modules', '__tests__', '.test.', '.spec.'];

function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    return lines.length;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return 0;
  }
}

function shouldExclude(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  return EXCLUDE_PATTERNS.some(pattern => relativePath.includes(pattern));
}

function scanDirectory(dir) {
  const oversizedFiles = [];
  
  function scan(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        if (!item.startsWith('.') && !item.includes('node_modules')) {
          scan(fullPath);
        }
      } else if (stats.isFile()) {
        const ext = path.extname(item);
        if (EXTENSIONS.includes(ext) && !shouldExclude(fullPath)) {
          const lineCount = countLines(fullPath);
          if (lineCount > MAX_LINES) {
            oversizedFiles.push({
              path: fullPath,
              lines: lineCount,
              maxAllowed: MAX_LINES
            });
          }
        }
      }
    }
  }
  
  for (const dir of SOURCE_DIRS) {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      scan(fullPath);
    }
  }
  
  return oversizedFiles;
}

// Main execution
console.log('Checking file line counts...\n');

const oversizedFiles = scanDirectory(process.cwd());

if (oversizedFiles.length > 0) {
  console.error('❌ ERROR: The following files exceed the maximum allowed line count of 500 lines:\n');
  
  oversizedFiles.forEach(file => {
    console.error(`  📄 ${file.path}`);
    console.error(`     Lines: ${file.lines} (max: ${file.maxAllowed})`);
    console.error(`     Please refactor this file to reduce its size.\n`);
  });
  
  console.error('Commit blocked. Please refactor the files listed above.');
  process.exit(1);
} else {
  console.log('✅ All files are within the line count limit (max 500 lines).\n');
  process.exit(0);
}
