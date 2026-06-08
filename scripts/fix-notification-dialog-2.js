/**
 * 直接修复5个页面：添加 notifyVisible 数据属性和 openNotificationDialog 方法
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

const DATA_PROPS = `      notifyVisible: false,
      notifyTitle: "流程通知",
      notifyList: [],
      notifyUnread: 0,`;

const APPROVAL_PROPS = `      approvalVisible: false,
      approvalTitle: "逐级审批",
      approvalSteps: [],
      approvalProgress: 0,
      approvalFinalStatus: "",`;

const NOTIFICATION_METHOD = `
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

const APPROVAL_METHOD = `
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
      var last = this.approvalSteps[this.approvalSteps.length - 1];
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

  // 只处理有"流程通知"弹窗模板但缺少数据属性的页面
  if (!content.includes("notifyVisible")) continue;
  if (content.includes("notifyVisible:")) continue; // 已有数据属性

  let changed = false;

  // 1. 添加数据属性
  if (content.includes("fbResultSuccess: false,")) {
    var propsToAdd = DATA_PROPS;
    // 如果也缺少 approval 数据属性，一起加上
    if (!content.includes("approvalVisible:")) {
      propsToAdd = APPROVAL_PROPS + "\n" + DATA_PROPS;
    }
    content = content.replace(
      "fbResultSuccess: false,",
      "fbResultSuccess: false,\n" + propsToAdd
    );
    changed = true;
  }

  // 2. 添加方法：在 handleReject 方法后面插入
  if (!content.includes("openNotificationDialog(functionName")) {
    var methodsToAdd = NOTIFICATION_METHOD;
    // 如果也缺少 approval 方法，一起加上
    if (!content.includes("openApprovalDialog(functionName")) {
      methodsToAdd = APPROVAL_METHOD + "\n" + NOTIFICATION_METHOD;
    }
    var marker = "      this.rejectAudited = true;\n    },";
    if (content.includes(marker)) {
      content = content.replace(marker, marker + methodsToAdd);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
    count++;
    console.log(`FIXED: ${path.basename(path.dirname(filePath))}`);
  } else {
    console.log(`SKIP: ${path.basename(path.dirname(filePath))}`);
  }
}

console.log(`\nDone. Fixed ${count} files.`);
