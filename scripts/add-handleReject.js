/**
 * 在 openRejectDialog 方法后面添加 handleReject 方法
 */
const fs = require("fs");
const path = require("path");

const basePath = path.join(
  __dirname,
  "..",
  "src",
  "views",
  "资产信息上报调整",
  "JL吉林COSMIC"
);

const METHOD = `
    handleReject(result) {
      this.rejectResult = result;
      this.rejectResultTime = this.now();
    },`;

function findVueFiles(dir) {
  const results = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results.push(...findVueFiles(full));
    } else if (item === "index.vue") {
      results.push(full);
    }
  }
  return results;
}

const files = findVueFiles(basePath);
let count = 0;

for (const filePath of files) {
  let content = fs.readFileSync(filePath, "utf8");

  if (content.includes("handleReject(result)")) continue;

  const marker = "      this.rejectVisible = true;\n    },";
  const idx = content.indexOf(marker);
  if (idx === -1) continue;

  const insertPos = idx + marker.length;
  content = content.slice(0, insertPos) + METHOD + content.slice(insertPos);
  fs.writeFileSync(filePath, content, "utf8");
  count++;
}

console.log(`Done. Added handleReject to ${count} files.`);
