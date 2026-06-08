const fs = require('fs');
const path = require('path');

const baseDir = 'E:/neusofttoubiao/SDYD2025ZCAQ (2)(1)(1)/jilincosmic/src/views';

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

for (const filePath of allFiles) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('approvalVisible')) continue;
  if (content.includes('approvalStateMap')) continue; // Already updated

  const orig = content;

  // 1. Add approvalStateMap to data
  content = content.replace(
    /(approvalForm:\s*\{[^}]+\})/,
    `$1,\n      approvalStateMap: {}`
  );

  // 2. Replace openApprovalDialog method - use line-by-line approach
  const lines = content.split('\n');
  let methodStart = -1, methodEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('openApprovalDialog(functionName, S, now)') && lines[i].includes('{')) {
      methodStart = i;
    }
    if (methodStart >= 0 && lines[i].includes('this.approvalVisible = true;') && i > methodStart + 3) {
      methodEnd = i;
      // Find the closing }, line
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() === '},') {
          methodEnd = j;
          break;
        }
      }
      break;
    }
  }

  if (methodStart >= 0 && methodEnd >= 0) {
    const indent = lines[methodStart].match(/^(\s*)/)[1];
    const newMethod = [
      `${indent}openApprovalDialog(functionName, S, now) {`,
      `${indent}  this.approvalTitle = functionName;`,
      `${indent}  const billNo = "APV-" + (20260501 + S);`,
      `${indent}  const applicant = pick(["马超", "罗艳", "谢建华", "韩冰", "曹鹏飞"], S, S);`,
      `${indent}  const levels = ["部门主管", "安全主管", "技术总监", "分管领导", "总经理"];`,
      `${indent}  const approvers = ["刘建国", "陈明辉", "张伟", "王芳", "李强"];`,
      `${indent}  const depts = ["安全运维部", "信息安全部", "技术管理部", "运营管理部", "综合管理部"];`,
      `${indent}  if (this.approvalStateMap[billNo]) {`,
      `${indent}    const saved = this.approvalStateMap[billNo];`,
      `${indent}    this.approvalSteps = saved.steps;`,
      `${indent}    this.approvalForm = { ...saved.form, remark: "" };`,
      `${indent}  } else {`,
      `${indent}    const currentIdx = (S % 5 < 3) ? S % 5 : 2;`,
      `${indent}    this.approvalSteps = levels.map((level, i) => {`,
      `${indent}      let status, time, remark;`,
      `${indent}      if (i < currentIdx) { status = "已通过"; time = now; remark = "同意"; }`,
      `${indent}      else if (i === currentIdx) { status = "审批中"; time = "-"; remark = "等待审批"; }`,
      `${indent}      else { status = "待审批"; time = "-"; remark = "-"; }`,
      `${indent}      return { level, approver: approvers[i], dept: depts[i], status, time: i <= currentIdx ? now : "-", remark };`,
      `${indent}    });`,
      `${indent}    this.approvalForm = {`,
      `${indent}      billNo,`,
      `${indent}      applicant,`,
      `${indent}      status: currentIdx >= 4 ? "已完成" : "审批中",`,
      `${indent}      currentStatus: currentIdx >= 4 ? "已完成" : "审批中",`,
      `${indent}      remark: "",`,
      `${indent}    };`,
      `${indent}  }`,
      `${indent}  this.approvalVisible = true;`,
      `${indent}},`,
    ];
    lines.splice(methodStart, methodEnd - methodStart + 1, ...newMethod);
  }

  content = lines.join('\n');

  // 3. Replace approvalAction method - add state save
  if (!content.includes('approvalStateMap[this.approvalForm.billNo]')) {
    const lines2 = content.split('\n');
    let actionStart = -1, actionEnd = -1;
    for (let i = 0; i < lines2.length; i++) {
      if (lines2[i].includes('approvalAction(action)') && lines2[i].includes('{')) {
        actionStart = i;
      }
      if (actionStart >= 0 && lines2[i].includes('this.$message.success(action + "成功");') && i > actionStart + 3) {
        actionEnd = i;
        // Find closing }, line
        for (let j = i + 1; j < lines2.length; j++) {
          if (lines2[j].trim() === '},') {
            actionEnd = j;
            break;
          }
        }
        break;
      }
    }

    if (actionStart >= 0 && actionEnd >= 0) {
      const indent = lines2[actionStart].match(/^(\s*)/)[1];
      // Insert state save before success message
      let msgLine = -1;
      for (let i = actionStart; i <= actionEnd; i++) {
        if (lines2[i].includes('this.$message.success(action + "成功");')) {
          msgLine = i;
          break;
        }
      }
      if (msgLine >= 0) {
        const saveLines = [
          `${indent}  this.approvalStateMap[this.approvalForm.billNo] = {`,
          `${indent}    steps: JSON.parse(JSON.stringify(this.approvalSteps)),`,
          `${indent}    form: { ...this.approvalForm },`,
          `${indent}  };`,
        ];
        lines2.splice(msgLine, 0, ...saveLines);
      }
    }
    content = lines2.join('\n');
  }

  if (content !== orig) {
    fs.writeFileSync(filePath, content, 'utf8');
    updated++;
  }
}

console.log('Updated: ' + updated);
