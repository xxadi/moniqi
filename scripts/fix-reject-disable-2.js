/**
 * 关闭弹窗时不重置 rejectAudited，审核后按钮保持禁用
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

  // 关闭按钮：移除 rejectAudited = false
  const old = "rejectVisible = false; rejectResult = ''; rejectAudited = false";
  const rep = "rejectVisible = false; rejectResult = ''";
  if (content.includes(old)) {
    content = content.replace(old, rep);
    fs.writeFileSync(filePath, content, "utf8");
    count++;
  }
}

console.log(`Done. Updated ${count} files.`);
