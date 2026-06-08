/**
 * Fix script: repair corruption + add missing dialog data/methods.
 * Run: node scripts/fix-missing-dialog-props.js
 */
const fs = require("fs");
const path = require("path");

const VIEWS_DIR = path.join(__dirname, "..", "src", "views", "资产信息上报调整", "YN云南COSMIC");

// ─── Helpers ────────────────────────────────────────────────────────────────

function findFiles(dir) {
  const results = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) results.push(...findFiles(fp));
    else if (e.name === "index.vue") results.push(fp);
  }
  return results;
}

/**
 * Strip orphaned lines between `};` and `},` patterns that were incorrectly
 * inserted OUTSIDE the data() return block by the previous script.
 *
 * Pattern: after data return's `};`, there may be orphaned prop lines and a `},`
 */
function repairDataSection(content) {
  // Find `};` that closes data() return, followed by orphaned props and `},`
  // Pattern: ... }; \n rejectVisible ... rejectForm: { ... }, \n },
  const orphanedDataRegex = /(\n\s+\};)\s*\n(\s+(reject|approval|notify)\w+[^;]+;[\s\S]*?\},\s*)\n(\s+computed)/;
  while (orphanedDataRegex.test(content)) {
    content = content.replace(orphanedDataRegex, "$1\n$4");
  }
  // Also catch the pattern where orphaned props end with `],},` or similar
  const orphanedDataRegex2 = /(\n\s+\};)\s*\n(\s+(reject|approval|notify)\w+[^;]*?,\s*)\}\s*,?\s*\n(\s+computed)/;
  while (orphanedDataRegex2.test(content)) {
    content = content.replace(orphanedDataRegex2, "$1\n$4");
  }
  return content;
}

/**
 * Strip orphaned methods that were incorrectly inserted outside the methods block.
 * These appear after the last `},` of methods but before the closing `};` of export default.
 */
function repairMethodsSection(content) {
  // Pattern: orphaned methods after the last proper method but before `};` of export default
  // They look like `openRejectDialog(functionName) { ... },` or `openNotifyDialog(functionName ...`
  // Remove any method-like lines between the last `},` and `};` that are NOT valid existing methods

  // Find orphaned openRejectDialog, openNotifyDialog etc that appear after the real methods block
  // They have wrong indentation (no leading spaces)
  const orphanedMethodRegex = /(\n\s+\},)\s*\n(openRejectDialog|openNotifyDialog|handleUploadDialog|openFlowChartDialog)[\s\S]*?\}(,\s*)?\n(\s+\})/;
  while (orphanedMethodRegex.test(content)) {
    content = content.replace(orphanedMethodRegex, "$1\n$4");
  }
  return content;
}

/**
 * Check if dialog template exists in content
 */
function hasDialog(content, marker) {
  return content.includes(marker);
}

/**
 * Check if a property exists in the data() return block
 */
function hasDataProp(content, propName) {
  // Only check within data() return block (between `return {` and the matching `};`)
  const dataMatch = content.match(/data\s*\(\)[\s\S]*?return\s*\{([\s\S]*?)\}\s*;?\s*\},/);
  if (!dataMatch) return true; // Can't find data section, assume it exists to avoid breaking
  const returnBlock = dataMatch[1];
  const regex = new RegExp(`^\\s+${propName}:`, "m");
  return regex.test(returnBlock);
}

/**
 * Check if a method exists in the methods block
 */
function hasMethod(content, methodName) {
  const methodsMatch = content.match(/methods\s*:\s*\{([\s\S]*?)\}\s*,?\s*\n\s+\};?\s*\n?<\/script>/);
  if (!methodsMatch) return true; // Can't find methods section, assume it exists
  const methodsBlock = methodsMatch[1];
  const regex = new RegExp(`^\\s+${methodName}\\(`, "m");
  return regex.test(methodsBlock);
}

// ─── Dialog definitions ────────────────────────────────────────────────────

const DIALOGS = {
  reject: {
    marker: ':visible.sync="rejectVisible"',
    props: [
      `      rejectVisible: false,`,
      `      rejectTitle: "拒绝和驳回",`,
      `      rejectForm: { type: "", level: "", reason: "", comment: "", suggestion: "" },`,
    ],
    methods: [
      `    openRejectDialog(functionName) {
      this.rejectTitle = functionName;
      this.rejectForm = { type: "", level: "", reason: "", comment: "", suggestion: "" };
      this.rejectVisible = true;
    },`,
      `    confirmReject() {
      if (this.rejectForm.type !== "审核通过" && !this.rejectForm.reason) {
        this.$message.warning("请选择审批原因");
        return;
      }
      this.$message.success(this.rejectForm.type === "审核通过" ? "审批已通过" : "已驳回，原因：" + this.rejectForm.reason);
      this.rejectVisible = false;
    },`,
    ],
  },
  approval: {
    marker: ':visible.sync="approvalVisible"',
    props: [
      `      approvalVisible: false,`,
      `      approvalTitle: "逐级审批",`,
      `      approvalForm: { billNo: "", applicant: "", status: "", currentStatus: "", remark: "" },`,
      `      approvalSteps: [],`,
      `      approvalStateMap: {},`,
    ],
    methods: [
      `    openApprovalDialog(functionName, S, now) {
      this.approvalTitle = functionName;
      const billNo = "APV-" + (20260501 + S);
      const applicant = pick(["马超", "罗艳", "谢建华", "韩冰", "曹鹏飞"], S, S);
      const levels = ["部门主管", "安全主管", "技术总监", "分管领导", "总经理"];
      const approvers = ["刘建国", "陈明辉", "张伟", "王芳", "李强"];
      const depts = ["安全运维部", "信息安全部", "技术管理部", "运营管理部", "综合管理部"];
      if (this.approvalStateMap[billNo]) {
        const saved = this.approvalStateMap[billNo];
        this.approvalSteps = saved.steps;
        this.approvalForm = { ...saved.form, remark: "" };
      } else {
        const currentIdx = (S % 5 < 3) ? S % 5 : 2;
        this.approvalSteps = levels.map((level, i) => {
          let status, time, remark;
          if (i < currentIdx) { status = "已通过"; time = now; remark = "同意"; }
          else if (i === currentIdx) { status = "审批中"; time = "-"; remark = "等待审批"; }
          else { status = "待审批"; time = "-"; remark = "-"; }
          return { level, approver: approvers[i], dept: depts[i], status, time: i <= currentIdx ? now : "-", remark };
        });
        this.approvalForm = { billNo, applicant, status: currentIdx >= 4 ? "已完成" : "审批中", currentStatus: currentIdx >= 4 ? "已完成" : "审批中", remark: "" };
      }
      this.approvalVisible = true;
    },`,
      `    approvalAction(action) {
      this.$confirm("确定【" + action + "】此审批？", "确认操作", {
        confirmButtonText: "确定", cancelButtonText: "取消", type: "warning",
      }).then(() => {
        const current = this.approvalSteps.find(s => s.status === "审批中");
        if (current) {
          current.status = action === "通过" ? "已通过" : "已驳回";
          current.time = this.now();
          current.remark = this.approvalForm.remark || (action === "通过" ? "同意" : "驳回");
        }
        if (action === "通过") {
          const next = this.approvalSteps.find(s => s.status === "待审批");
          if (next) { next.status = "审批中"; this.approvalForm.remark = ""; }
          else { this.approvalForm.status = "已完成"; this.approvalForm.currentStatus = "已完成"; }
        } else {
          this.approvalForm.status = "已驳回"; this.approvalForm.currentStatus = "已驳回";
        }
        this.approvalStateMap[this.approvalForm.billNo] = {
          steps: JSON.parse(JSON.stringify(this.approvalSteps)), form: { ...this.approvalForm },
        };
        this.$message.success("审批" + action + "成功");
      }).catch(() => {});
    },`,
    ],
  },
  notify: {
    marker: ':visible.sync="notifyVisible"',
    props: [
      `      notifyVisible: false,`,
      `      notifyTitle: "流程通知",`,
      `      notifyList: [],`,
      `      notifyForm: { title: "", content: "", type: "系统通知" },`,
      `      notifyDetail: null,`,
    ],
    methods: [
      `    openNotifyDialog(functionName, S, now) {
      this.notifyTitle = functionName;
      const prefix = functionName.replace(/通知|推送|发送/, "").trim() || functionName;
      this.notifyList = [
        { id: 1, title: "审批流程发起通知", type: "审批通知", sender: "系统", time: now, read: false, content: prefix + " 审批流程已发起，请关注" },
        { id: 2, title: "审批结果通知", type: "审批通知", sender: "系统", time: now, read: true, content: prefix + " 审批已通过，请执行后续操作" },
        { id: 3, title: "流程逾期提醒", type: "紧急通知", sender: "系统", time: now, read: false, content: prefix + " 流程已超时，请尽快处理" },
      ];
      this.notifyForm = { title: functionName + "-新通知", content: "您好，" + prefix + " 需要您处理，请及时关注。", type: "系统通知" };
      this.notifyDetail = null;
      this.notifyVisible = true;
    },`,
      `    readNotify(row) {
      this.notifyDetail = row;
      row.read = true;
    },`,
      `    sendNotify() {
      if (!this.notifyForm.title) { this.$message.warning("请输入通知标题"); return; }
      if (!this.notifyForm.content) { this.$message.warning("请输入通知内容"); return; }
      this.notifyList.unshift({
        id: Date.now(), title: this.notifyForm.title,
        type: this.notifyForm.type, sender: "当前用户",
        time: this.now(), read: false,
        content: this.notifyForm.content,
      });
      this.$message.success("通知已发送");
      this.notifyForm.title = "";
      this.notifyForm.content = "";
    },`,
    ],
  },
  flowchart: {
    marker: ':visible.sync="flowVisible"',
    props: [
      `      flowVisible: false,`,
      `      flowTitle: "流程图查看",`,
      `      flowSteps: [],`,
      `      flowStatus: "",`,
      `      flowStartTime: "",`,
      `      flowCurrentNode: "",`,
    ],
    methods: [
      `    openFlowChartDialog(functionName, S, now) {
      this.flowTitle = functionName;
      const flowNodeNames = [
        "发起申请", "部门审批", "安全审批", "技术审批", "分管领导审批",
        "总经理审批", "指令下发", "结果反馈", "归档完成",
      ];
      const doneCount = (S % 5) + 2;
      this.flowSteps = flowNodeNames.map((name, i) => ({
        name, status: i < doneCount ? "已完成" : i === doneCount ? "进行中" : "待处理",
        time: i < doneCount ? now : "-",
        operator: pick(["系统", "admin", "林志强", "何俊杰", "马超"], i, S),
      }));
      this.flowStatus = doneCount >= flowNodeNames.length ? "已完成" : doneCount > 0 ? "进行中" : "等待中";
      this.flowStartTime = now;
      this.flowCurrentNode = this.flowSteps.find(s => s.status === "进行中")?.name || (doneCount >= flowNodeNames.length ? "已结束" : "等待启动");
      this.flowVisible = true;
    },`,
    ],
  },
  upload: {
    marker: ':visible.sync="uploadVisible"',
    props: [
      `      uploadVisible: false,`,
      `      uploadTitle: "附件上传",`,
      `      uploadFileList: [],`,
      `      uploadProgress: 0,`,
      `      uploadRemark: "",`,
      `      uploadHistory: [],`,
    ],
    methods: [
      `    handleUploadDialog(functionName) {
      this.openUploadDialog(functionName);
    },`,
      `    openUploadDialog(functionName) {
      this.uploadTitle = functionName;
      this.uploadFileList = [];
      this.uploadProgress = 0;
      this.uploadRemark = "";
      this.uploadVisible = true;
    },`,
      `    handleUploadChange(file, fileList) {
      this.uploadFileList = fileList;
      this.uploadProgress = 50;
      setTimeout(() => { this.uploadProgress = 100; }, 800);
    },`,
      `    handleUploadRemove(file, fileList) {
      this.uploadFileList = fileList;
      if (!fileList.length) this.uploadProgress = 0;
    },`,
      `    handleUploadExceed() {
      this.$message.warning("最多上传 5 个文件");
    },`,
      `    confirmUpload() {
      const now = this.now();
      const count = this.uploadFileList.length;
      this.uploadFileList.forEach(file => {
        this.uploadHistory.unshift({
          name: file.name || file.raw?.name || '未知文件',
          size: this.formatFileSize(file.size || file.raw?.size || 0),
          time: now,
          remark: this.uploadRemark || '-',
        });
      });
      this.uploadFileList = [];
      this.uploadProgress = 0;
      this.uploadRemark = "";
      this.$message.success("上传成功，共上传 " + count + " 个附件");
    },`,
      `    formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / 1048576).toFixed(1) + ' MB';
    },`,
      `    downloadHistoryFile(row) {
      this.$message.success("开始下载：" + row.name);
    },`,
    ],
  },
};

// ─── File repair pipeline ───────────────────────────────────────────────────

function fixFile(filePath) {
  const name = path.basename(path.dirname(filePath));
  let content = fs.readFileSync(filePath, "utf-8");
  let changed = false;

  // Step 1: Repair corruption from previous script
  const repairedData = repairDataSection(content);
  if (repairedData !== content) {
    content = repairedData;
    changed = true;
  }
  const repairedMethods = repairMethodsSection(content);
  if (repairedMethods !== content) {
    content = repairedMethods;
    changed = true;
  }

  // Step 2: Add missing dialog data properties inside data() return
  const dataReturnMatch = content.match(/(data\s*\(\)[\s\S]*?return\s*\{)([\s\S]*?)(\}\s*;?\s*\},)/);
  if (dataReturnMatch) {
    const prefix = dataReturnMatch[1];
    const inner = dataReturnMatch[2];
    const suffix = dataReturnMatch[3];
    let newInner = inner;

    for (const [type, cfg] of Object.entries(DIALOGS)) {
      if (!hasDialog(content, cfg.marker)) continue;
      for (const prop of cfg.props) {
        const propName = prop.split(":").shift().trim();
        const regex = new RegExp(`^\\s+${propName}:`, "m");
        if (!regex.test(newInner)) {
          newInner = newInner.replace(/(\S[\s\S]*?)$/, prop + "\n$1");
          changed = true;
        }
      }
    }

    if (newInner !== inner) {
      content = prefix + newInner + suffix;
    }
  }

  // Step 3: Add missing methods before `openEdit(`
  const methodAnchorMatch = content.match(/(\n\s+openEdit\s*\()/);
  if (!methodAnchorMatch) {
    console.log(`  [SKIP] Cannot find openEdit anchor in ${name}`);
    return changed;
  }

  for (const [type, cfg] of Object.entries(DIALOGS)) {
    if (!hasDialog(content, cfg.marker)) continue;
    for (const methodDef of cfg.methods) {
      const methodName = methodDef.match(/^\s+(\w+)\(/)?.[1];
      if (!methodName) continue;
      if (hasMethod(content, methodName)) continue;

      // Insert before openEdit
      const insertionPoint = content.indexOf(methodAnchorMatch[1]);
      content = content.slice(0, insertionPoint) + "\n" + methodDef + "\n" + content.slice(insertionPoint);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`✓ Fixed: ${name}`);
  }
  return changed;
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  const files = findFiles(VIEWS_DIR);
  console.log(`Found ${files.length} index.vue files`);

  let fixed = 0, skipped = 0;
  for (const fp of files) {
    try {
      if (fixFile(fp)) fixed++;
      else skipped++;
    } catch (e) {
      console.error(`✗ ERROR ${path.basename(path.dirname(fp))}: ${e.message}`);
    }
  }
  console.log(`\nDone: ${fixed} fixed, ${skipped} skipped`);
}

main();
