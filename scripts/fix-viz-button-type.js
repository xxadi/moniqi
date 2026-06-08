/**
 * 修正4个报表页面的"可视化展示"按钮类型为 "operation"
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

const fixes = [
  { name: "主机资产报表", from: '"report"', to: '"operation"' },
  { name: "模拟采集资产报表", from: '"audit"', to: '"operation"' },
  { name: "暴露面资产纳管报表报表", from: '"report"', to: '"operation"' },
  { name: "自定义项校验结果报表", from: '"audit"', to: '"operation"' },
];

for (const fix of fixes) {
  const filePath = path.join(basePath, fix.name, "index.vue");
  let content = fs.readFileSync(filePath, "utf8");

  // 只替换可视化展示按钮那一行
  const re = /(handleFunction\("[^"]*可视化展示",\s*)"([^"]*)"(\))/;
  if (re.test(content)) {
    content = content.replace(re, '$1"operation"$3');
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`FIXED: ${fix.name} (${fix.from} → ${fix.to})`);
  } else {
    console.log(`SKIP: ${fix.name}`);
  }
}
