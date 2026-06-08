/**
 * 为所有JL吉林COSMIC页面添加"驳回"弹窗功能
 * 包含：弹窗模板、数据属性、switch case、方法
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

// 新的弹窗模板（插入到查询结果弹窗后面）
const DIALOG_TEMPLATE = `
    <!-- 结果审核弹窗（通过/驳回） -->
    <el-dialog :title="rejectTitle" :visible.sync="rejectVisible" width="600px" append-to-body>
      <el-form label-width="120px">
        <el-form-item v-for="item in rejectFields" :key="item.label" :label="item.label">
          <span :style="{ color: /失败|超时|异常|驳回/.test(item.value) ? '#F56C6C' : /成功|通过|已完成/.test(item.value) ? '#67C23A' : '' }">{{ item.value }}</span>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="rejectVisible = false">取 消</el-button>
        <el-button type="danger" @click="rejectVisible = false; $message.warning('已驳回')">驳 回</el-button>
        <el-button type="primary" @click="rejectVisible = false; $message.success('已通过')">通 过</el-button>
      </span>
    </el-dialog>`;

// 新的数据属性
const DATA_PROPS = `
      rejectVisible: false,
      rejectTitle: "结果审核",
      rejectFields: [],`;

// switch case
const SWITCH_CASE = `
        case "reject":
          this.openRejectDialog(functionName, S, now);
          break;`;

// 方法实现
const METHOD = `
    openRejectDialog(functionName, S, now) {
      this.rejectTitle = functionName + " - 结果审核";
      this.rejectFields = [
        { label: "审核编号", value: "REV-" + String(S).slice(-6) },
        { label: "审核名称", value: functionName },
        { label: "提交时间", value: now },
        { label: "提交人", value: pick(["系统管理员", "审计员", "操作员", "自动任务"], 0, S) },
        { label: "结果状态", value: pick(["待审核", "待审核", "待审核", "处理中"], 1, S) },
        { label: "数据来源", value: pick(["自动采集", "手动录入", "接口同步", "批量导入"], 2, S) },
        { label: "数据条数", value: pick([128, 256, 512, 1024], 3, S) + "条" },
        { label: "审核说明", value: functionName + "的结果数据待审核确认" },
      ];
      this.rejectVisible = true;
    },`;

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
  if (content.includes("openRejectDialog")) continue;

  let changed = false;

  // 1. 插入弹窗模板（在查询结果弹窗后面）
  const queryDialogEnd = /(<\/el-dialog>\s*\n\s*<!-- 接收请求监控弹窗)/;
  if (queryDialogEnd.test(content)) {
    content = content.replace(queryDialogEnd, DIALOG_TEMPLATE + "\n\n$1");
    changed = true;
  }

  // 2. 插入数据属性（在 queryResults: [], 后面）
  const queryResultsProp = /(queryResults: \[\],)/;
  if (queryResultsProp.test(content)) {
    content = content.replace(queryResultsProp, "$1" + DATA_PROPS);
    changed = true;
  }

  // 3. 插入 switch case（在 default: 前面）
  const defaultCase = /(\s*default:\s*\n\s*this\.openOperationDialog)/;
  if (defaultCase.test(content)) {
    content = content.replace(defaultCase, SWITCH_CASE + "\n$1");
    changed = true;
  }

  // 4. 插入方法（在 openOperationDialog 前面）
  const openOpMarker = /(\n    openOperationDialog\(functionName, S, now\) \{)/;
  if (openOpMarker.test(content)) {
    content = content.replace(openOpMarker, METHOD + "\n$1");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
    count++;
  }
}

console.log(`Done. Updated ${count} files.`);
