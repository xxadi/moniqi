const fs = require('fs');
const path = require('path');

function findVueFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...findVueFiles(fullPath));
    } else if (item.name.endsWith('.vue')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Extract and clean script section
function fixScriptSection(content) {
  const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
  if (!scriptMatch) return content;

  let script = scriptMatch[1];

  // Pattern 1: Inside methods, find }, followed by next method - this is correct, keep as is
  // Pattern 2: At the very end, };\n</script> - this is correct
  // But we need to handle the case where },\n is followed by another } without proper comma

  // Actually the problem is that after the last method, the object is closed with }
  // but babel sees a stray };\n at the end

  // Let's check if the script ends correctly
  const trimmedScript = script.trim();
  if (trimmedScript.endsWith('};')) {
    // This is correct for Vue component exports
  }

  return content;
}

// Better approach: find the exact pattern causing issues
function fixVueFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Check if file has <script> tag
  if (!content.includes('<script>')) return false;

  const scriptStart = content.indexOf('<script>') + 8;
  const scriptEnd = content.indexOf('</script>');

  if (scriptStart === -1 || scriptEnd === -1) return false;

  // Extract script and check for issues
  let script = content.substring(scriptStart, scriptEnd);

  // Pattern: "};\n" at the end of script - this is CORRECT for Vue component
  // But we need to make sure there's no extra content after };
  const scriptTrimmed = script.trimEnd();
  if (scriptTrimmed.endsWith('};')) {
    // This is correct - export default { ... };
    // But we need to make sure there's nothing after
  }

  // Check for common issues:
  // 1. Trailing commas inside objects (before the last property)
  // 2. Missing commas between properties
  // 3. Extra characters after };

  // For now, just re-write the script section with trimmed content
  const before = content.substring(0, scriptStart);
  const after = content.substring(scriptEnd);

  // Clean the script - remove trailing whitespace before </script>
  let newScript = script;

  // Check if script ends with proper };
  const scriptLines = script.split('\n');
  // Remove trailing empty lines
  while (scriptLines.length > 0 && scriptLines[scriptLines.length - 1].trim() === '') {
    scriptLines.pop();
  }

  // Now check the last non-empty line
  if (scriptLines.length > 0) {
    const lastLine = scriptLines[scriptLines.length - 1].trim();
    if (lastLine === '};') {
      // This is correct, but make sure there's a newline before </script>
      newScript = scriptLines.join('\n');
      if (!newScript.endsWith('\n')) {
        newScript += '\n';
      }
    }
  }

  const newContent = before + newScript + after;

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Fixed:', filePath);
    return true;
  }

  return false;
}

// Pattern-based fix for specific issue:
// Looking at the error, line 139 is `};` which ends the export
// But babel sees this as unexpected
// This often happens when there's something wrong with the file ending

// Let me check for the specific pattern that causes babel to fail
function findAndFixScriptIssues(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
  if (!scriptMatch) return false;

  const script = scriptMatch[1];
  const lines = script.split('\n');

  // Check if script properly ends with };
  const nonEmptyLines = lines.filter(l => l.trim() !== '');
  if (nonEmptyLines.length === 0) return false;

  const lastLine = nonEmptyLines[nonEmptyLines.length - 1].trim();

  // If the script ends with }; or }; followed by empty lines, it's correct
  // But if there are issues, we need to fix them

  // Check for the pattern where we have something like:
  //     },
  // };
  // which is valid

  // The problem might be that something is interfering with the parsing

  return false;
}

const srcDir = path.join(__dirname, 'src');
const vueFiles = findVueFiles(srcDir);

let fixedCount = 0;
let checkedCount = 0;

for (const file of vueFiles) {
  checkedCount++;
  if (fixVueFile(file)) {
    fixedCount++;
  }
}

console.log(`Checked ${checkedCount} files, fixed ${fixedCount}`);