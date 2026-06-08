/**
 * 审核通过/驳回后禁用按钮，防止重复审核
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
  let changed = false;

  // 1. 在拒绝按钮上添加 :disabled="rejectAudited"
  if (!content.includes('disabled')) {
    // 找到拒绝和驳回按钮，添加 disabled
    const btnRe = /(<el-button[^>]*@click='handleFunction\("[^"]*拒绝和驳回", "reject"\)'[^>]*>)/;
    if (btnRe.test(content)) {
      content = content.replace(btnRe, function(match) {
        if (match.includes("disabled")) return match;
        return match.replace(/>$/, ' :disabled="rejectAudited">');
      });
      changed = true;
    }
  }

  // 2. 添加 rejectAudited 数据属性
  if (!content.includes("rejectAudited:")) {
    content = content.replace(
      /(rejectResult: "",)/,
      "$1\n      rejectAudited: false,"
    );
    changed = true;
  }

  // 3. 在 handleReject 方法中设置 rejectAudited = true
  if (content.includes("handleReject(result)") && !content.includes("rejectAudited = true")) {
    content = content.replace(
      /(this\.rejectResultTime = this\.now\(\);)/,
      "$1\n      this.rejectAudited = true;"
    );
    changed = true;
  }

  // 4. 关闭弹窗时重置 rejectAudited
  if (content.includes("rejectResult = ''") && !content.includes("rejectAudited = false")) {
    content = content.replace(
      /(rejectVisible = false; rejectResult = '')/,
      "$1; rejectAudited = false"
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
    count++;
  }
}

console.log(`Done. Updated ${count} files.`);
