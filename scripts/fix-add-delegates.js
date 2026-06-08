/**
 * 为8个报表页面补充缺失的 openValidateDialog 和 openTransformDialog 委托方法
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
    },`;

let count = 0;
for (const name of pages) {
  const filePath = path.join(basePath, name, "index.vue");
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, "utf8");

  // 如果已经有方法定义就跳过
  if (content.includes("openValidateDialog(functionName, S, now) {") &&
      content.includes("openTransformDialog(functionName, S, now) {")) {
    console.log(`SKIP (already has both): ${name}`);
    continue;
  }

  // 在 openOperationDialog 前面插入
  const marker = "    openOperationDialog(functionName, S, now) {";
  const idx = content.indexOf(marker);
  if (idx === -1) {
    console.log(`SKIP (marker not found): ${name}`);
    continue;
  }

  content = content.slice(0, idx) + DELEGATE_METHODS + "\n" + content.slice(idx);
  fs.writeFileSync(filePath, content, "utf8");
  count++;
  console.log(`ADDED: ${name}`);
}

console.log(`\nDone. Updated ${count} files.`);
