/**
 * 修复查询弹窗缺少 </el-dialog> 的问题
 * 在 reject 弹窗前面补上查询弹窗的结束标签
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

  // 匹配：查询弹窗的 footer 后直接跟 reject 弹窗注释（缺少 </el-dialog>）
  // 正确的应该是：
  //     </el-form>  (或 </el-table>)
  //       <span slot="footer">
  //         ...
  //       </span>
  //     </el-dialog>      ← 这个可能被删了
  //
  //     <!-- 结果审核弹窗 -->
  //     <el-dialog ...>

  // 模式：footer span 结束后没有 </el-dialog> 就直接到了 reject 弹窗
  const bad = /(<\/span>\s*\n)(\s*<!-- 结果审核弹窗)/;
  const good = "$1    </el-dialog>\n\n$2";

  if (bad.test(content)) {
    // 检查是否确实缺少 </el-dialog>
    const match = content.match(bad);
    // 往前看是否有对应的 <el-dialog> 没有关闭
    const before = content.substring(0, content.indexOf(match[0]));
    const lastOpen = before.lastIndexOf("<el-dialog");
    const lastClose = before.lastIndexOf("</el-dialog>");
    if (lastOpen > lastClose) {
      content = content.replace(bad, good);
      fs.writeFileSync(filePath, content, "utf8");
      count++;
    }
  }
}

console.log(`Done. Fixed ${count} files.`);
