/**
 * 修复 else if /regex/.test(kw) 缺少括号的语法错误
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
  const bad = '} else if /告警|预警|监控|异常|故障/.test(kw) {';
  const good = '} else if (/告警|预警|监控|异常|故障/.test(kw)) {';
  if (content.includes(bad)) {
    content = content.replace(bad, good);
    fs.writeFileSync(filePath, content, "utf8");
    count++;
  }
}

console.log(`Done. Fixed ${count} files.`);
