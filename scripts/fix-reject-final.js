/**
 * 1. 把已有的"拒绝和驳回"按钮类型从 "analysis" 改为 "reject"
 * 2. 删除我新增的多余"结果拒绝和驳回"按钮（type="reject" 的 warning 按钮）
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
let fixedType = 0;
let removedBtn = 0;

for (const filePath of files) {
  let content = fs.readFileSync(filePath, "utf8");
  let changed = false;

  // 1. 把已有的"拒绝和驳回"按钮类型从 "analysis" 改为 "reject"
  // 匹配: handleFunction("XXX拒绝和驳回", "analysis")
  const typeFixRe = /(handleFunction\("[^"]*拒绝和驳回",\s*)"analysis"\)/;
  if (typeFixRe.test(content)) {
    content = content.replace(typeFixRe, '$1"reject")');
    fixedType++;
    changed = true;
  }

  // 2. 删除我新增的多余按钮（type="reject" 的 warning 按钮，带 el-icon-s-check）
  // 匹配整行: <el-button plain type="warning" icon="el-icon-s-check" @click='...reject...'>...</el-button>
  const redundantRe = /\s*<el-button plain type="warning" icon="el-icon-s-check" @click='handleFunction\("[^"]*结果拒绝和驳回", "reject"\)'>[^<]*<\/el-button>\s*\n/;
  if (redundantRe.test(content)) {
    content = content.replace(redundantRe, "\n");
    removedBtn++;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
  }
}

console.log(`Fixed ${fixedType} buttons (analysis → reject).`);
console.log(`Removed ${removedBtn} redundant buttons.`);
