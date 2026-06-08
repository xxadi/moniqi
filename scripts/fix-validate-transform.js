/**
 * 将所有JL吉林COSMIC页面中的 openValidateDialog 和 openTransformDialog 委托方法
 * 替换为独立的实现，使每个按钮弹窗内容不同
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

// 新的 openValidateDialog 实现（使用 queryTitle/queryResults/queryVisible）
const NEW_VALIDATE = `    openValidateDialog(functionName, S, now) {
      this.queryTitle = functionName;
      const count = (S % 3) + 3;
      this.queryResults = Array.from({ length: count }).map(function(_, i) {
        return {
          序号: i + 1,
          数据项: pick(["格式校验", "范围校验", "一致性校验", "完整性校验", "唯一性校验", "合规性校验", "时效性校验"], i, S),
          结果数量: pick([12, 28, 56, 128, 256], i, S),
          校验耗时: pick(["12ms", "28ms", "56ms", "128ms", "256ms"], i, S) + "",
          状态: pick(["通过", "未通过", "警告", "跳过"], i, S),
        };
      });
      this.queryVisible = true;
    },`;

// 新的 openTransformDialog 实现（使用 invokeTitle/invokeSteps/invokeVisible）
const NEW_TRANSFORM = `    openTransformDialog(functionName, S, now) {
      this.invokeTitle = functionName;
      this.invokeSteps = [
        { step: "读取源数据", status: pick(["已完成", "进行中", "等待中"], 0, S), time: pick(["56ms", "128ms", "-"], 1, S) + "" },
        { step: "字段映射", status: pick(["已完成", "进行中", "等待中"], 2, S), time: pick(["23ms", "56ms", "-"], 3, S) + "" },
        { step: "类型转换", status: pick(["已完成", "进行中", "等待中"], 4, S), time: pick(["18ms", "35ms", "-"], 5, S) + "" },
        { step: "数据聚合", status: pick(["已完成", "进行中", "等待中"], 6, S), time: pick(["86ms", "186ms", "-"], 7, S) + "" },
        { step: "写入目标", status: pick(["已完成", "进行中", "等待中"], 8, S), time: pick(["35ms", "86ms", "-"], 9, S) + "" },
      ];
      this.invokeCurrentStep = this.invokeSteps.findIndex(function(s) { return s.status === "进行中"; }) + 1;
      this.invokeProgress = Math.round((this.invokeSteps.filter(function(s) { return s.status === "已完成"; }).length / this.invokeSteps.length) * 100);
      this.invokeVisible = true;
    },`;

// 委托版本的正则
const DELEGATE_VALIDATE_RE = /\n    openValidateDialog\(functionName, S, now\) \{\s*\n      this\.openOperationDialog\(functionName, S, now\);\s*\n    \},/;
const DELEGATE_TRANSFORM_RE = /\n    openTransformDialog\(functionName, S, now\) \{\s*\n      this\.openOperationDialog\(functionName, S, now\);\s*\n    \},/;

// 递归查找所有 index.vue
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
let validateCount = 0;
let transformCount = 0;

for (const filePath of files) {
  let content = fs.readFileSync(filePath, "utf8");
  let changed = false;

  // 替换委托版 openValidateDialog
  if (DELEGATE_VALIDATE_RE.test(content)) {
    content = content.replace(DELEGATE_VALIDATE_RE, "\n" + NEW_VALIDATE);
    validateCount++;
    changed = true;
  }

  // 替换委托版 openTransformDialog
  if (DELEGATE_TRANSFORM_RE.test(content)) {
    content = content.replace(DELEGATE_TRANSFORM_RE, "\n" + NEW_TRANSFORM);
    transformCount++;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
  }
}

console.log(`Replaced ${validateCount} delegate openValidateDialog methods.`);
console.log(`Replaced ${transformCount} delegate openTransformDialog methods.`);
console.log(`Done.`);
