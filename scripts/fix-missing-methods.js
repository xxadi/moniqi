/**
 * 为所有JL吉林COSMIC页面补充缺失的方法（openValidateDialog, openTransformDialog, openWorkflowDialog）
 * 这些方法委托给 openOperationDialog
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

const DELEGATE_METHODS = `
    openValidateDialog(functionName, S, now) {
      this.openOperationDialog(functionName, S, now);
    },
    openTransformDialog(functionName, S, now) {
      this.openOperationDialog(functionName, S, now);
    },
    openWorkflowDialog(functionName, S, now) {
      this.openOperationDialog(functionName, S, now);
    },`;

// 递归查找所有 index.vue
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

  // 只处理包含 openOperationDialog 的文件
  if (!content.includes("openOperationDialog")) continue;

  // 检查是否已经有方法定义（而不是 switch case 中的调用）
  if (content.includes("openValidateDialog(functionName, S, now) {")) continue;

  // 在 openOperationDialog 方法前面插入
  const marker = "    openOperationDialog(functionName, S, now) {";
  const idx = content.indexOf(marker);
  if (idx === -1) {
    console.log(`SKIP (marker not found): ${filePath}`);
    continue;
  }

  content = content.slice(0, idx) + DELEGATE_METHODS + "\n" + content.slice(idx);
  fs.writeFileSync(filePath, content, "utf8");
  count++;
}

console.log(`Done. Updated ${count} files.`);
