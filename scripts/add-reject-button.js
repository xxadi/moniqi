/**
 * 在所有JL吉林COSMIC页面的按钮栏添加"结果审核"按钮
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

const REJECT_BUTTON = `
          <el-button plain type="warning" icon="el-icon-s-check" @click='handleFunction("结果审核", "reject")'>结果审核</el-button>`;

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

  // 跳过已添加的
  if (content.includes('handleFunction("结果审核", "reject")')) continue;

  // 在 function-actions div 的最后一个 </el-button> 后面插入
  // 找到 function-actions 区域的最后一个按钮
  const lastButtonRe = /(<\/el-button>\s*\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*<cs-pagetable)/;
  if (lastButtonRe.test(content)) {
    content = content.replace(lastButtonRe, "$1");
    // 在 </div> (function-actions close) 前插入
    const actionDivClose = /(<\/el-button>\s*\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*<cs-pagetable)/;
    content = content.replace(actionDivClose, function(match) {
      // 在第一个 </div> 前插入按钮
      return match.replace(/(<\/el-button>)(\s*<\/div>)/, "$1" + REJECT_BUTTON + "$2");
    });
    fs.writeFileSync(filePath, content, "utf8");
    count++;
  }
}

console.log(`Done. Added reject button to ${count} files.`);
