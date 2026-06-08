/**
 * 为其他5个有"逐级审批"按钮的页面添加审批弹窗
 * （处置下发工单管理已经手动添加了）
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

const DIALOG_TEMPLATE = `
    <!-- 逐级审批弹窗 -->
    <el-dialog :title="approvalTitle" :visible.sync="approvalVisible" width="700px" append-to-body>
      <el-table :data="approvalSteps" border size="mini" style="width:100%">
        <el-table-column prop="level" label="审批层级" width="100" align="center"></el-table-column>
        <el-table-column prop="approver" label="审批人" width="120" align="center"></el-table-column>
        <el-table-column prop="status" label="审批状态" width="120" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status==='已通过'?'success':scope.row.status==='已驳回'?'danger':scope.row.status==='审批中'?'':'info'" size="mini">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="time" label="审批时间" width="160" align="center"></el-table-column>
        <el-table-column prop="remark" label="审批意见"></el-table-column>
      </el-table>
      <el-divider></el-divider>
      <el-form label-width="100px">
        <el-form-item label="审批进度">
          <el-progress :percentage="approvalProgress" :status="approvalProgress===100?'success':''" style="width:80%"></el-progress>
        </el-form-item>
        <el-form-item label="最终状态">
          <el-tag :type="approvalFinalStatus==='已通过'?'success':approvalFinalStatus==='已驳回'?'danger':'warning'" size="medium">{{ approvalFinalStatus }}</el-tag>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="approvalVisible = false">关 闭</el-button>
      </span>
    </el-dialog>`;

const DATA_PROPS = `
      approvalVisible: false,
      approvalTitle: "逐级审批",
      approvalSteps: [],
      approvalProgress: 0,
      approvalFinalStatus: "",`;

const SWITCH_CASE = `
        case "approval":
          this.openApprovalDialog(functionName, S, now);
          break;`;

const METHOD = `
    openApprovalDialog(functionName, S, now) {
      this.approvalTitle = functionName;
      var levels = ["部门主管", "分管领导", "安全审计", "最终审批"];
      this.approvalSteps = levels.map(function(level, i) {
        var status = i < 2 ? "已通过" : i === 2 ? pick(["已通过", "审批中", "已驳回"], i, S) : "待审批";
        return {
          level: level,
          approver: pick(["张伟", "李娜", "王强", "赵敏", "刘洋", "陈静"], i, S),
          status: status,
          time: status === "待审批" ? "-" : now,
          remark: status === "已通过" ? "同意，符合规范" : status === "已驳回" ? "资料不全，退回补充" : status === "审批中" ? "审核中..." : "-",
        };
      });
      var passed = this.approvalSteps.filter(function(s) { return s.status === "已通过"; }).length;
      this.approvalProgress = Math.round((passed / this.approvalSteps.length) * 100);
      this.approvalFinalStatus = passed === this.approvalSteps.length ? "已通过" : this.approvalSteps.some(function(s) { return s.status === "已驳回"; }) ? "已驳回" : "审批中";
      this.approvalVisible = true;
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
  if (content.includes("openApprovalDialog")) continue;

  // 只处理有"逐级审批"按钮的页面
  if (!content.includes("逐级审批")) continue;

  let changed = false;

  // 1. 插入弹窗模板（在 ImportDialog 前面）
  if (!content.includes("approvalVisible")) {
    const importRe = /(<!--\s*导入\s*-->\s*\n\s*<ImportDialog)/;
    if (importRe.test(content)) {
      content = content.replace(importRe, DIALOG_TEMPLATE + "\n\n$1");
      changed = true;
    }
  }

  // 2. 插入数据属性
  if (!content.includes("approvalVisible:")) {
    content = content.replace(
      /(importTitle: "",)/,
      "$1" + DATA_PROPS
    );
    changed = true;
  }

  // 3. 插入 switch case
  if (!content.includes('case "approval"')) {
    const defaultRe = /(\s*default:\s*\n\s*this\.openOperationDialog)/;
    if (defaultRe.test(content)) {
      content = content.replace(defaultRe, SWITCH_CASE + "\n$1");
      changed = true;
    }
  }

  // 4. 插入方法
  if (!content.includes("openApprovalDialog(functionName")) {
    const openOpRe = /(\n    openOperationDialog\(functionName, S, now\) \{)/;
    if (openOpRe.test(content)) {
      content = content.replace(openOpRe, METHOD + "\n$1");
      changed = true;
    }
  }

  // 5. 修改按钮类型
  const btnRe = /(handleFunction\("[^"]*逐级审批",\s*)"(?:statistics|export)"(\))/;
  if (btnRe.test(content)) {
    content = content.replace(btnRe, '$1"approval"$2');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
    count++;
    console.log(`UPDATED: ${path.basename(path.dirname(filePath))}`);
  }
}

console.log(`\nDone. Updated ${count} files.`);
