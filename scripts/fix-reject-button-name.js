/**
 * 将"结果拒绝和驳回"按钮名称改为"XXX结果拒绝和驳回"，XXX为页面名称前缀
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

  // 从文件路径提取页面名称
  const dirName = path.basename(path.dirname(filePath));

  // 从已有按钮提取前缀（找第一个按钮的名称前缀）
  const firstBtnMatch = content.match(/handleFunction\("([^"]+?)(?:可视化展示|数据提取|数据识别|分级|实时计算|聚合|数据审查|新增|查看|列表|结果审核|结果拒绝)/);
  let prefix = "";
  if (firstBtnMatch) {
    prefix = firstBtnMatch[1];
  } else {
    // 用目录名作为前缀
    prefix = dirName;
  }

  const oldBtn = '>结果拒绝和驳回</el-button>';
  const newBtnText = prefix + '结果拒绝和驳回';
  const newBtn = '>' + newBtnText + '</el-button>';

  if (content.includes(oldBtn)) {
    content = content.replace(oldBtn, newBtn);
    // 也替换 handleFunction 参数
    content = content.replace(
      'handleFunction("结果拒绝和驳回", "reject")',
      'handleFunction("' + newBtnText + '", "reject")'
    );
    // 替换弹窗默认标题
    content = content.replace(
      'rejectTitle: "结果拒绝和驳回"',
      'rejectTitle: "' + newBtnText + '"'
    );
    fs.writeFileSync(filePath, content, "utf8");
    count++;
  }
}

console.log(`Done. Updated ${count} files.`);
