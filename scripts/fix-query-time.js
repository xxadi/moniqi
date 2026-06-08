/**
 * 修正 openValidateDialog 中的字段名：校验耗时 → 查询耗时，与模板匹配
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

let count = 0;
for (const name of pages) {
  const filePath = path.join(basePath, name, "index.vue");
  let content = fs.readFileSync(filePath, "utf8");

  // 替换 openValidateDialog 中的字段名
  if (content.includes("校验耗时:") && content.includes("openValidateDialog")) {
    // 只替换 openValidateDialog 方法内的 校验耗时
    const re = /(openValidateDialog[\s\S]*?校验耗时:)/;
    content = content.replace(re, function(match) {
      return match.replace("校验耗时:", "查询耗时:");
    });
    fs.writeFileSync(filePath, content, "utf8");
    count++;
    console.log(`FIXED: ${name}`);
  } else {
    console.log(`SKIP: ${name}`);
  }
}

console.log(`\nDone. Fixed ${count} files.`);
