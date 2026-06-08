/**
 * 修复通知弹窗：为缺少数据属性和方法的页面补上
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

const DATA_PROPS = `
      notifyVisible: false,
      notifyTitle: "流程通知",
      notifyList: [],
      notifyUnread: 0,`;

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

  // 只处理有"流程通知"按钮的页面
  if (!content.includes("流程通知")) continue;

  let changed = false;

  // 1. 添加数据属性（在 data() 的最后一个属性前）
  if (!content.includes("notifyVisible:")) {
    // 找到 fbResultSuccess: false, 后面插入
    const dataRe = /(fbResultSuccess: false,\s*\n\s*\};)/;
    if (dataRe.test(content)) {
      content = content.replace(dataRe, "$1".replace("};", DATA_PROPS + "\n    };"));
      changed = true;
    } else {
      // fallback: 找到最后一个属性
      const altRe = /(invokeProgress: 0,\s*\n)/;
      if (altRe.test(content)) {
        content = content.replace(altRe, "$1" + DATA_PROPS + "\n");
        changed = true;
      }
    }
  }

  // 2. 添加方法（在 openApprovalDialog 方法后面）
  if (!content.includes("openNotificationDialog(functionName")) {
    // 找到 openApprovalDialog 方法的结束
    const methodRe = /(this\.approvalVisible = true;\s*\n\s\},)/;
    if (methodRe.test(content)) {
      content = content.replace(methodRe, "$1" + METHOD);
      changed = true;
    } else {
      // fallback: 找到最后一个方法前
      const altRe = /(submitForm\(\) \{)/;
      if (altRe.test(content)) {
        content = content.replace(altRe, METHOD + "\n    $1");
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
    count++;
    console.log(`FIXED: ${path.basename(path.dirname(filePath))}`);
  } else {
    console.log(`SKIP (already complete): ${path.basename(path.dirname(filePath))}`);
  }
}

console.log(`\nDone. Fixed ${count} files.`);
