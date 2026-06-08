/**
 * Fix corrupted methods closing in YN云南COSMIC files.
 * Corruption pattern: `}  };` (closing merged into one line)
 * Correct pattern: `},\n  },\n};`
 * Run: node scripts/fix-closing-corruption.js
 */
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "src", "views", "资产信息上报调整", "YN云南COSMIC");

function findFiles(dir) {
  const results = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) results.push(...findFiles(fp));
    else if (e.name === "index.vue") results.push(fp);
  }
  return results;
}

function fixCorruptedClosing(content) {
  // Find the corrupted pattern before </script>
  // Pattern: `}  };` or `} };` with possible \r\n
  // We need to find it right before </script> (it's the export default closing)

  const scriptEndIdx = content.lastIndexOf("</script>");
  if (scriptEndIdx < 0) return content;

  // Get the tail before </script>
  const beforeScript = content.slice(0, scriptEndIdx);

  // Match the corrupted closing pattern at the end
  // Pattern: some whitespace, then }  }; or } };, then whitespace/newlines
  const corruptedMatch = beforeScript.match(/([ \t]*)\}[ \t]*\}\s*;(\s*)$/);
  if (!corruptedMatch) return content;

  const indentation = corruptedMatch[1]; // leading whitespace before `}  };`
  const trailing = corruptedMatch[2]; // trailing whitespace/newlines

  // Determine method indentation (typically 4 spaces)
  const methodIndent = indentation.length >= 4 ? indentation : "    ";
  // Determine methods block indentation (typically 2 spaces, half of method indent)
  const blockIndent = methodIndent.length >= 4 ? methodIndent.slice(0, methodIndent.length / 2) : "  ";

  // Replace the corrupted closing with proper structure
  const fixed = beforeScript.replace(
    /([ \t]*)\}[ \t]*\}\s*;(\s*)$/,
    `${methodIndent}},\n${blockIndent}},\n};${trailing}`
  );

  return fixed + content.slice(scriptEndIdx);
}

function fixFile(filePath) {
  const name = path.basename(path.dirname(filePath));
  let content = fs.readFileSync(filePath, "utf-8");
  const before = content;

  // Check if file has valid closing pattern
  const validRe = /(\n\s*\},\s*)\r?\n\s*\}\s*,\s*\r?\n\s*\}\s*;\s*\r?\n\s*<\/script>/;
  if (validRe.test(content)) return false; // already valid

  // Fix corrupted closing
  content = fixCorruptedClosing(content);

  if (content !== before) {
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`✓ Fixed: ${name}`);
    return true;
  }
  console.log(`  No change: ${name}`);
  return false;
}

function main() {
  const files = findFiles(DIR);
  console.log(`Found ${files.length} files\n`);

  let fixed = 0, skipped = 0;
  for (const fp of files) {
    try {
      if (fixFile(fp)) fixed++;
      else skipped++;
    } catch (e) {
      console.error(`✗ ERROR ${path.basename(path.dirname(fp))}: ${e.message}`);
    }
  }
  console.log(`\nDone: ${fixed} fixed, ${skipped} skipped/valid`);
}

main();
