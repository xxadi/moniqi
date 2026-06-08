/**
 * 将所有JL吉林COSMIC页面 openValidateDialog 中的 校验耗时 改为 查询耗时
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

  // 只替换 openValidateDialog 方法内的 校验耗时
  if (!content.includes("openValidateDialog")) continue;
  if (!content.includes("校验耗时:")) continue;

  // 替换 openValidateDialog 内的 校验耗时
  const re = /(openValidateDialog[\s\S]*?校验耗时:)/;
  if (re.test(content)) {
    content = content.replace(re, function(match) {
      return match.replace("校验耗时:", "查询耗时:");
    });
    fs.writeFileSync(filePath, content, "utf8");
    count++;
  }
}

console.log(`Done. Fixed ${count} files.`);
