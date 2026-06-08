/**
 * 修复 reject 弹窗模板插入后多余的 </el-dialog> 标签
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

  // 匹配模式：reject弹窗的 </el-dialog> 后面紧跟一个空行和另一个 </el-dialog>
  // 正确的应该是：    </el-dialog>\n\n    <!-- 接收请求监控弹窗 -->
  // 错误的是：        </el-dialog>\n\n</el-dialog>\n\n    <!-- 接收请求监控弹窗 -->
  const bad = /(<\/el-dialog>\s*\n)\s*<\/el-dialog>\s*\n(\s*<!-- 接收请求监控弹窗)/;
  if (bad.test(content)) {
    content = content.replace(bad, "$1\n$2");
    fs.writeFileSync(filePath, content, "utf8");
    count++;
  }
}

console.log(`Done. Fixed ${count} files.`);
