/**
 * 将按钮文本从"结果审核"改为"结果拒绝和驳回"
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
  const old = 'handleFunction("结果审核", "reject")';
  const newBtn = 'handleFunction("结果拒绝和驳回", "reject")';
  if (content.includes(old)) {
    content = content.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newBtn);
    // 也替换按钮文本
    content = content.replace(/>结果审核<\/el-button>/g, '>结果拒绝和驳回</el-button>');
    // 替换弹窗标题
    content = content.replace(/rejectTitle: "结果审核"/g, 'rejectTitle: "结果拒绝和驳回"');
    fs.writeFileSync(filePath, content, "utf8");
    count++;
  }
}

console.log(`Done. Updated ${count} files.`);
