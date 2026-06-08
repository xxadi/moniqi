/**
 * Comprehensive fix for YN云南COSMIC dialog props/methods.
 *
 * Steps:
 * 1. Remove ALL orphaned dialog property lines from methods area
 * 2. Add missing dialog data properties to data() return
 * 3. Add missing dialog methods before openEdit(
 *
 * Run: node scripts/fix-yn-all.js
 */
const fs = require("fs");
const path = require("path");

const VIEWS_DIR = path.join(__dirname, "..", "src", "views", "资产信息上报调整", "YN云南COSMIC");

// Dialog properties that may be orphaned outside data()
const DIALOG_PROPS = new Set([
  "rejectVisible", "rejectTitle", "rejectForm",
  "approvalVisible", "approvalTitle", "approvalForm", "approvalSteps", "approvalStateMap",
  "notifyVisible", "notifyTitle", "notifyList", "notifyForm", "notifyDetail",
]);

// All valid dialog property lines (used to identify orphaned lines)
const DIALOG_PROP_PREFIXES = [
  "rejectVisible:", "rejectTitle:", "rejectForm:",
  "approvalVisible:", "approvalTitle:", "approvalForm:", "approvalSteps:", "approvalStateMap:",
  "notifyVisible:", "notifyTitle:", "notifyList:", "notifyForm:", "notifyDetail:",
];

function isDialogPropLine(line) {
  const trimmed = line.trim();
  for (const prefix of DIALOG_PROP_PREFIXES) {
    if (trimmed.startsWith(prefix)) return true;
  }
  return false;
}

// Dialog definitions
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
};

// ─── Line-based cleanup of orphaned props ─────────────────────────────────────

function cleanOrphanedProps(lines) {
  // Strategy: track data() return block boundaries by line index
  // Phase 1: Find the data() return block start/end lines
  let dataReturnStart = -1;
  let dataReturnEnd = -1;
  let braceDepth = 0;
  let inReturn = false;
  let foundDataFunc = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^\s*data\s*\(/.test(line)) {
      foundDataFunc = true;
      continue;
    }

    if (foundDataFunc && !inReturn && line.includes("return") && line.includes("{")) {
      inReturn = true;
      braceDepth = 1;
      dataReturnStart = i;
      continue;
    }

    if (inReturn) {
      for (const ch of line) {
        if (ch === "{") braceDepth++;
        if (ch === "}") braceDepth--;
      }
      if (braceDepth <= 0) {
        dataReturnEnd = i;
        break;
      }
    }
  }

  // Phase 2: Clean up — keep only non-dialog-prop lines outside data return
  const result = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Keep all lines inside data return block
    if (dataReturnStart >= 0 && i > dataReturnStart && i <= dataReturnEnd) {
      result.push(line);
      continue;
    }

    // Remove orphaned dialog prop lines
    if (isDialogPropLine(line)) {
      continue; // skip — orphaned outside data()
    }

    result.push(line);
  }

  return result;
}

// ─── Fix data() return closing ────────────────────────────────────────────────

function fixDataReturnClosing(content) {
  // Remove orphaned props between }; and computed:
  return content.replace(/(\n\s+\}\;)\s*\n(\s+(reject|approval|notify)\w+[^;]*?;?[^\n]*\n)+(\s+computed)/g, "$1\n\n$4");
}

// ─── Main fix function ────────────────────────────────────────────────────────

function fixFile(filePath) {
  const name = path.basename(path.dirname(filePath));
  let content = fs.readFileSync(filePath, "utf-8");
  let changed = false;

  // Step 1: Clean orphaned dialog prop lines from methods area
  const lines = content.split("\n");
  const cleanedLines = cleanOrphanedProps(lines);
  let newContent = cleanedLines.join("\n");
  if (newContent !== content) {
    content = newContent;
    changed = true;
  }

  // Step 2: Fix data return closing corruption
  newContent = fixDataReturnClosing(content);
  if (newContent !== content) {
    content = newContent;
    changed = true;
  }

  // Step 3: Add missing dialog data properties inside data() return
  // Match data() { ... return { ... }; (or },) followed by computed:
  const dataReturnMatch = content.match(/(data\s*\([\s\S]*?return\s*\{)([\s\S]*?)(\}\s*;?\s*,?\s*\n\s+computed)/);
  if (!dataReturnMatch) {
    console.log(`  [SKIP] Cannot find data() return in ${name}`);
    return changed;
  }

  const prefix = dataReturnMatch[1];
  let inner = dataReturnMatch[2];
  const suffix = dataReturnMatch[3];
  let dataChanged = false;

  for (const [type, cfg] of Object.entries(DIALOGS)) {
    if (!content.includes(cfg.marker)) continue;
    for (const prop of cfg.props) {
      const propName = prop.split(":").shift().trim();
      const regex = new RegExp(`^\\s+${propName}:`, "m");
      if (!regex.test(inner)) {
        // Add before the closing of data return
        inner = inner.replace(/(\S[\s\S]*?)$/, prop + "\n$1");
        dataChanged = true;
      }
    }
  }

  if (dataChanged) {
    const beforeMatch = content.slice(0, dataReturnMatch.index);
    const afterMatch = content.slice(dataReturnMatch.index + dataReturnMatch[0].length);
    content = beforeMatch + prefix + inner + suffix + afterMatch;
    changed = true;
  }

  // Step 4: Add missing methods
  // Insert new methods before the last method in the methods block
  // Pattern: the closing of methods block is `  },` followed by `};` and `</script>`
  // But we want to insert before the last `    },` that closes a method
  // Find the last method closing: `    },` (4-space indent) followed by method or closing
  // Use the methods block closing as anchor: `  },` followed by `};` and `</script>`
  const methodsCloseMatch = content.match(/(\n\s*\},)\r?\n\s*\}\s*,\s*\r?\n\s*\}\s*;\s*\r?\n\s*<\/script>/);
  if (!methodsCloseMatch) {
    console.log(`  [SKIP] Cannot find methods close in ${name}`);
    return changed;
  }

  for (const [type, cfg] of Object.entries(DIALOGS)) {
    if (!content.includes(cfg.marker)) continue;
    for (const methodDef of cfg.methods) {
      const methodName = methodDef.match(/^\s+(\w+)\(/)?.[1];
      if (!methodName) continue;
      // Check if method already exists
      const methodRegex = new RegExp(`^\\s+${methodName}\\(`, "m");
      if (methodRegex.test(content)) continue;

      // Insert before methods section closing (between last method and `},` for methods block)
      const insertionPoint = content.indexOf(methodsCloseMatch[1]) + methodsCloseMatch[1].length;
      content = content.slice(0, insertionPoint) + "\n" + methodDef + content.slice(insertionPoint);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`✓ Fixed: ${name}`);
  }
  return changed;
}

function findFiles(dir) {
  const results = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) results.push(...findFiles(fp));
    else if (e.name === "index.vue") results.push(fp);
  }
  return results;
}

function main() {
  const files = findFiles(VIEWS_DIR);
  console.log(`Found ${files.length} index.vue files\n`);

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
