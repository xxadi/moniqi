const fs = require('fs');
const path = require('path');

const baseDir = 'E:/neusofttoubiao/SDYD2025ZCAQ (2)(1)(1)/jilincosmic/src/views';

const pick = (items, index, seed) => items[(seed + index) % items.length];

function findFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...findFiles(fullPath));
    else if (entry.name === 'index.vue') results.push(fullPath);
  }
  return results;
}

const allFiles = findFiles(baseDir);
let updated = 0;

const approvalMethods = `
    openApprovalDialog(functionName, S, now) {
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
        this.approvalForm = {
          billNo,
          applicant,
          status: currentIdx >= 4 ? "已完成" : "审批中",
          currentStatus: currentIdx >= 4 ? "已完成" : "审批中",
          remark: "",
        };
      }
      this.approvalVisible = true;
    },
    approvalAction(action) {
      this.$confirm("确定【" + action + "】此审批？", "确认操作", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        const current = this.approvalSteps.find(s => s.status === "审批中");
        if (current) {
          current.status = action === "通过" ? "已通过" : "已驳回";
          current.time = this.now();
          current.remark = this.approvalForm.remark || (action === "通过" ? "同意" : "驳回");
        }
        if (action === "通过") {
          const next = this.approvalSteps.find(s => s.status === "待审批");
          if (next) {
            next.status = "审批中";
            this.approvalForm.remark = "";
          } else {
            this.approvalForm.status = "已完成";
            this.approvalForm.currentStatus = "已完成";
          }
        } else {
          this.approvalForm.status = "已驳回";
          this.approvalForm.currentStatus = "已驳回";
        }
        this.approvalStateMap[this.approvalForm.billNo] = {
          steps: JSON.parse(JSON.stringify(this.approvalSteps)),
          form: { ...this.approvalForm },
        };
        this.$message.success(action + "成功");
      }).catch(() => {});
    },`;

for (const filePath of allFiles) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('approvalVisible')) continue;
  if (content.includes('openApprovalDialog(functionName, S, now) {')) continue; // Method already exists

  const orig = content;

  // Find confirmReject method and add after it
  const confirmIdx = content.indexOf('confirmReject()');
  if (confirmIdx >= 0) {
    const catchIdx = content.indexOf('.catch(() => {});', confirmIdx);
    if (catchIdx >= 0) {
      const closeIdx = content.indexOf('\n    },', catchIdx);
      if (closeIdx >= 0) {
        content = content.substring(0, closeIdx + 6) + '\n' + approvalMethods + content.substring(closeIdx + 5);
      }
    }
  }

  // Add approvalStateMap to data if not present
  if (!content.includes('approvalStateMap')) {
    content = content.replace(
      /(approvalForm:\s*\{[^}]+\})/,
      `$1,\n      approvalStateMap: {}`
    );
  }

  if (content !== orig) {
    fs.writeFileSync(filePath, content, 'utf8');
    updated++;
  }
}

console.log('Updated: ' + updated);
