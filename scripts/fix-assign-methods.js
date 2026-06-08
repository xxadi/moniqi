const fs = require("fs");
const path = require("path");

const METHODS = `    openAssignDialog(functionName, S, now) {
      this.assignTitle = functionName;
      this.assignForm = {
        approver: pick(this.assignPeople, 0, S),
        level: pick(["部门主管", "安全主管", "技术总监"], 1, S),
        dept: pick(["安全运维部", "信息安全部", "技术管理部"], 2, S),
        priority: "普通",
        deadline: "",
        remark: "",
      };
      this.assignVisible = true;
    },
    confirmAssign() {
      this.$confirm("确定将审批指派给【" + this.assignForm.approver + "】（" + this.assignForm.level + "）？", "确认指派", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        this.assignVisible = false;
        this.$message.success("指派成功，已通知审批人 " + this.assignForm.approver);
      }).catch(() => {});
    },`;

const viewsDir = path.resolve(__dirname, "../src/views");
let fixed = 0;

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) results = results.concat(walkDir(filePath));
    else if (file === "index.vue") results.push(filePath);
  });
  return results;
}

const files = walkDir(viewsDir).filter(f => {
  const content = fs.readFileSync(f, "utf8");
  return content.includes("assignPeople") && !content.includes("openAssignDialog(functionName, S, now) {");
});

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, "utf8");
  const relPath = path.relative(path.resolve(__dirname, ".."), filePath);

  // Find "openEdit(row) {" and insert methods before it
  const idx = content.indexOf("    openEdit(row) {");
  if (idx !== -1) {
    content = content.substring(0, idx) + METHODS + "\n\n    " + content.substring(idx + 4); // +4 to skip "    "
    fs.writeFileSync(filePath, content, "utf8");
    fixed++;
    console.log("OK: " + relPath);
  } else {
    console.log("SKIP (no openEdit): " + relPath);
  }
});

console.log("\nTotal fixed: " + fixed);
