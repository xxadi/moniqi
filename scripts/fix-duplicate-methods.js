/**
 * 删除8个报表页面中重复的 openValidateDialog/openTransformDialog/openWorkflowDialog 委托方法
 * 只保留原始的实现（如果有的话），或者只保留一个委托版本
 */
const fs = require("fs");
const path = require("path");

const pages = [
  "IP纳管对比报表",
  "主机资产报表",
  "备案验证结果报表",
  "模拟采集资产报表",
  "暴露面资产纳管报表报表",
  "自定义项校验结果报表",
  "虚拟资产纳管报表",
  "资产类别缺失报表",
];

const basePath = path.join(
  "__dirname",
  "..",
  "src",
  "views",
  "资产信息上报调整",
  "JL吉林COSMIC"
).replace("__dirname", require("path").resolve(__dirname, ".."));

// 要删除的重复委托方法（紧挨着 openOperationDialog 前面插入的那组）
const DUPLICATE_BLOCK = `
    openValidateDialog(functionName, S, now) {
      this.openOperationDialog(functionName, S, now);
    },
    openTransformDialog(functionName, S, now) {
      this.openOperationDialog(functionName, S, now);
    },
    openWorkflowDialog(functionName, S, now) {
      this.openOperationDialog(functionName, S, now);
    },`;

let count = 0;
for (const name of pages) {
  const filePath = path.join(basePath, name, "index.vue");
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, "utf8");

  // 删除重复的委托方法块
  if (content.includes(DUPLICATE_BLOCK)) {
    content = content.replace(DUPLICATE_BLOCK, "");
    fs.writeFileSync(filePath, content, "utf8");
    count++;
    console.log(`REMOVED DUPLICATE: ${name}`);
  } else {
    console.log(`SKIP (no duplicate): ${name}`);
  }
}

console.log(`\nDone. Fixed ${count} files.`);
