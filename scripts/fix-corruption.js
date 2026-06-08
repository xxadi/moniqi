/**
 * Fix YN云南COSMIC dialog corruption.
 * Run: node scripts/fix-missing-dialog-props.js
 */
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "src", "views", "资产信息上报调整", "YN云南COSMIC");

// Properties that may be orphaned outside data() return
const ORPHAN_PROPS = [
  "rejectVisible", "rejectTitle", "rejectForm",
  "approvalVisible", "approvalTitle", "approvalForm", "approvalSteps", "approvalStateMap",
  "notifyVisible", "notifyTitle", "notifyList", "notifyForm", "notifyDetail",
  "flowVisible", "flowTitle", "flowSteps", "flowStatus", "flowStartTime", "flowCurrentNode",
  "uploadVisible", "uploadTitle", "uploadFileList", "uploadProgress", "uploadRemark", "uploadHistory",
];

function findFiles(dir) {
  const r = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) r.push(...findFiles(fp));
    else if (e.name === "index.vue") r.push(fp);
  }
  return r;
}

/** Check if a line is an orphaned dialog property */
function isOrphanPropLine(line) {
  const trimmed = line.trim();
  for (const prop of ORPHAN_PROPS) {
    if (trimmed.startsWith(prop + ":") || trimmed.startsWith(prop + " ")) return true;
  }
  return false;
}

/** Step 1: Remove orphaned properties between `};` and the next section keyword in data area */
function fixDataSection(content) {
  // Pattern: after `};` (end of return), remove orphaned prop lines until next section
  const dataSectionEnd = /(\n\s+\};)\s*\n(\s*(rejectVisible|approvalVisible|notifyVisible|flowVisible|uploadFileList)[\s\S]*?\n)(\s+computed)/;
  return content.replace(dataSectionEnd, "$1\n$4");
}

/** Step 2: Remove orphaned dialog data props inside the methods/switch area */
function removeOrphanedPropsInMethods(content) {
  // Split content into lines, process, rejoin
  const lines = content.split("\n");
  const result = [];
  let inMethods = false;
  let skipNextOrphans = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track when we're in methods section
    if (/^\s+methods\s*:\s*\{/.test(line)) inMethods = true;
    if (inMethods && /^\s+\};/.test(line) && i > lines.length - 20) inMethods = false;

    // Skip orphaned prop lines in methods area or after data() return
    if (isOrphanPropLine(line)) {
      // Check if we're in data() return — if so, keep it
      // Check surrounding lines to determine context
      const prevLine = i > 0 ? lines[i - 1] : "";
      const nextLine = i < lines.length - 1 ? lines[i + 1] : "";

      // If previous line is `};` or contains `},`, this is orphaned — skip
      if (/^\s*\};/.test(prevLine) || /^\s*\},\s*$/.test(prevLine)) {
        continue;
      }

      // If next few lines also look like props, skip all of them
      // Count consecutive prop lines
      let j = i;
      let propLines = 0;
      while (j < lines.length && isOrphanPropLine(lines[j])) {
        propLines++;
        j++;
      }
      // If we found 2+ consecutive prop lines and we're not in a data return block, skip them
      if (propLines >= 2 && !isInsideDataReturn(lines, i)) {
        continue;
      }
    }

    result.push(line);
  }

  return result.join("\n");
}

/** Check if a line index is inside the data() return { ... } block */
function isInsideDataReturn(lines, idx) {
  let inReturn = false;
  let braceDepth = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^\s+data\s*\(\s*\)/.test(l)) {
      // Start tracking
      continue;
    }
    if (l.includes("return {")) {
      inReturn = true;
      braceDepth = 1;
      continue;
    }
    if (inReturn) {
      for (const ch of l) {
        if (ch === "{") braceDepth++;
        if (ch === "}") braceDepth--;
      }
      if (braceDepth <= 0) {
        // Check if we're at the closing } of return
        if (i >= idx) return true;
        inReturn = false;
      }
    }
    if (i >= idx) return inReturn;
  }
  return false;
}

function main() {
  const files = findFiles(DIR);
  console.log(`Found ${files.length} files`);

  let fixed = 0;
  for (const fp of files) {
    let content = fs.readFileSync(fp, "utf-8");
    const before = content;

    // Fix data section corruption
    content = fixDataSection(content);

    // Remove orphaned props in methods
    content = removeOrphanedPropsInMethods(content);

    // Fix remaining corruption: rejectForm: { ... },},
    content = content.replace(/,\s*\}\s*,?\s*,?\s*\}\s*,?\s*\n(\s+computed)/g, "\n$1");
    content = content.replace(/,\s*\}\s*,?\s*,?\s*\}\s*,?\s*\n(\s+open\w+)/g, "\n$1");

    if (content !== before) {
      fs.writeFileSync(fp, content, "utf-8");
      console.log(`✓ Fixed: ${path.basename(path.dirname(fp))}`);
      fixed++;
    }
  }

  console.log(`\nFixed ${fixed} files`);
}

main();
