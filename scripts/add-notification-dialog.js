/**
 * 为5个有"流程通知"按钮的页面添加通知弹窗
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
    <!-- 流程通知弹窗 -->
    <el-dialog :title="notifyTitle" :visible.sync="notifyVisible" width="680px" append-to-body>
      <el-table :data="notifyList" border size="mini" style="width:100%">
        <el-table-column prop="time" label="时间" width="160" align="center"></el-table-column>
        <el-table-column prop="type" label="类型" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.type==='系统通知'?'':scope.row.type==='审批通知'?'warning':'success'" size="mini">{{ scope.row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sender" label="发送人" width="100" align="center"></el-table-column>
        <el-table-column prop="content" label="通知内容"></el-table-column>
        <el-table-column prop="read" label="状态" width="80" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.read?'info':'danger'" size="mini">{{ scope.row.read?'已读':'未读' }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-divider></el-divider>
      <el-form label-width="100px">
        <el-form-item label="未读数量">
          <el-badge :value="notifyUnread" :type="notifyUnread>0?'danger':'success'" style="margin-right:12px;">
            <el-button size="small" @click="notifyList.forEach(function(n){ n.read = true; }); notifyUnread = 0;">全部标为已读</el-button>
          </el-badge>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="notifyVisible = false">关 闭</el-button>
      </span>
    </el-dialog>`;

const DATA_PROPS = `
      notifyVisible: false,
      notifyTitle: "流程通知",
      notifyList: [],
      notifyUnread: 0,`;

const SWITCH_CASE = `
        case "notification":
          this.openNotificationDialog(functionName, S, now);
          break;`;

const METHOD = `
    openNotificationDialog(functionName, S, now) {
      this.notifyTitle = functionName;
      var types = ["系统通知", "审批通知", "业务通知"];
      var senders = ["系统管理员", "安全审计员", "运维工程师", "流程引擎", "自动任务", "李娜"];
      var contents = [
        "工单已创建，请及时处理",
        "审批流程已启动，等待部门主管审批",
        "处置任务已下发，预计完成时间2小时",
        "数据同步完成，已更新资产清单",
        "告警已确认，处理方案已制定",
        "流程超时提醒，请加快处理进度",
        "审批已通过，进入下一环节",
        "驳回通知：资料不全，请补充后重新提交",
        "系统维护通知：今晚22:00-23:00暂停服务",
        "安全扫描完成，发现3个高危漏洞",
      ];
      var count = (S % 4) + 4;
      this.notifyList = Array.from({ length: count }).map(function(_, i) {
        var isRead = i < count - 2;
        return {
          time: now,
          type: pick(types, i, S),
          sender: pick(senders, i, S),
          content: pick(contents, i, S),
          read: isRead,
        };
      });
      this.notifyUnread = this.notifyList.filter(function(n) { return !n.read; }).length;
      this.notifyVisible = true;
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
  if (content.includes("openNotificationDialog")) continue;

  // 只处理有"流程通知"按钮的页面
  if (!content.includes("流程通知")) continue;

  let changed = false;

  // 1. 插入弹窗模板（在 approval 弹窗后面）
  if (!content.includes("notifyVisible")) {
    const approvalEndRe = /(<!-- 逐级审批弹窗 -->[\s\S]*?<\/el-dialog>)/;
    if (approvalEndRe.test(content)) {
      content = content.replace(approvalEndRe, "$1\n" + DIALOG_TEMPLATE);
      changed = true;
    } else {
      // fallback: insert before ImportDialog
      const importRe = /(<!--\s*导入\s*-->\s*\n\s*<ImportDialog)/;
      if (importRe.test(content)) {
        content = content.replace(importRe, DIALOG_TEMPLATE + "\n\n$1");
        changed = true;
      }
    }
  }

  // 2. 插入数据属性
  if (!content.includes("notifyVisible:")) {
    content = content.replace(
      /(approvalFinalStatus: "",)/,
      "$1" + DATA_PROPS
    );
    changed = true;
  }

  // 3. 插入 switch case
  if (!content.includes('case "notification"')) {
    const approvalCaseRe = /(case "approval":\s*\n\s*this\.openApprovalDialog[^;]*;\s*\n\s*break;)/;
    if (approvalCaseRe.test(content)) {
      content = content.replace(approvalCaseRe, "$1" + SWITCH_CASE);
      changed = true;
    }
  }

  // 4. 插入方法
  if (!content.includes("openNotificationDialog(functionName")) {
    const approvalMethodRe = /(this\.approvalVisible = true;\s*\n\s\},)/;
    if (approvalMethodRe.test(content)) {
      content = content.replace(approvalMethodRe, "$1" + METHOD);
      changed = true;
    }
  }

  // 5. 修改按钮类型
  const btnRe = /(handleFunction\("[^"]*流程通知",\s*)"(?:audit|feedback)"(\))/;
  if (btnRe.test(content)) {
    content = content.replace(btnRe, '$1"notification"$2');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
    count++;
    console.log(`UPDATED: ${path.basename(path.dirname(filePath))}`);
  }
}

console.log(`\nDone. Updated ${count} files.`);
