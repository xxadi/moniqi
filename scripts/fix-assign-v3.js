const fs = require("fs");
const path = require("path");

const DIALOG_TEMPLATE = `    <!-- 审批指派信息弹窗 -->
    <el-dialog :title="assignTitle" :visible.sync="assignVisible" width="620px" append-to-body>
      <el-form :model="assignForm" label-width="130px">
        <el-form-item label="指派审批人">
          <el-select v-model="assignForm.approver" filterable placeholder="请选择审批人" style="width:100%">
            <el-option v-for="name in assignPeople" :key="name" :label="name" :value="name"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="审批层级">
          <el-select v-model="assignForm.level" placeholder="请选择审批层级" style="width:100%">
            <el-option label="部门主管" value="部门主管"></el-option>
            <el-option label="安全主管" value="安全主管"></el-option>
            <el-option label="技术总监" value="技术总监"></el-option>
            <el-option label="分管领导" value="分管领导"></el-option>
            <el-option label="总经理" value="总经理"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="所属部门">
          <el-select v-model="assignForm.dept" placeholder="请选择所属部门" style="width:100%">
            <el-option label="安全运维部" value="安全运维部"></el-option>
            <el-option label="信息安全部" value="信息安全部"></el-option>
            <el-option label="技术管理部" value="技术管理部"></el-option>
            <el-option label="运营管理部" value="运营管理部"></el-option>
            <el-option label="综合管理部" value="综合管理部"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-radio-group v-model="assignForm.priority">
            <el-radio label="普通">普通</el-radio>
            <el-radio label="紧急">紧急</el-radio>
            <el-radio label="特急">特急</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="截止时间">
          <el-date-picker v-model="assignForm.deadline" type="datetime" placeholder="请选择截止时间" style="width:100%"></el-date-picker>
        </el-form-item>
        <el-form-item label="指派说明">
          <el-input v-model="assignForm.remark" type="textarea" :rows="3" placeholder="请输入指派说明（选填）"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!assignForm.approver || !assignForm.level" @click="confirmAssign">确认指派</el-button>
      </span>
    </el-dialog>`;

const DATA_PROPS = `      assignVisible: false,
      assignTitle: "",
      assignPeople: ["刘建国", "陈明辉", "张伟", "王芳", "李强", "马超", "罗艳", "谢建华", "韩冰", "曹鹏飞"],
      assignForm: { approver: "", level: "", dept: "", priority: "普通", deadline: "", remark: "" },`;

const SWITCH_CASE = `        case "assign":
          this.openAssignDialog(functionName, S, now);
          break;`;

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

// Find all files with 审批指派信息 button
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
  return content.includes("审批指派信息") && content.includes("el-button");
});

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, "utf8");
  const relPath = path.relative(path.resolve(__dirname, ".."), filePath);
  let changed = false;

  // 1. Change button type
  const newContent = content.replace(
    /handleFunction\("([^"]*审批指派信息)",\s*"(form|alert|detail)"\)/g,
    'handleFunction("$1", "assign")'
  );
  if (newContent !== content) { content = newContent; changed = true; }

  // 2. Add dialog template - insert before </template>
  if (!content.includes("assignVisible")) {
    const templateIdx = content.indexOf("</template>");
    if (templateIdx !== -1) {
      content = content.substring(0, templateIdx) + DIALOG_TEMPLATE + "\n  " + content.substring(templateIdx);
      changed = true;
    }
  }

  // 3. Add data properties - insert before "    };\n  }," (end of data())
  if (!content.includes("assignVisible:")) {
    const dataCloseIdx = content.indexOf("    };\n  },");
    if (dataCloseIdx !== -1) {
      content = content.substring(0, dataCloseIdx) + DATA_PROPS + "\n" + content.substring(dataCloseIdx);
      changed = true;
    }
  }

  // 4. Add switch case - insert before default case
  if (!content.includes('case "assign":')) {
    if (content.includes('case "notify":')) {
      content = content.replace(
        /(case "notify":\n\s*this\.openNotifyDialog\(functionName, S, now\);\n\s*break;)/,
        "$1\n" + SWITCH_CASE
      );
      changed = true;
    } else {
      content = content.replace(
        /(default:\n\s*this\.openOperationDialog)/,
        SWITCH_CASE + "\n        $1"
      );
      changed = true;
    }
  }

  // 5. Add methods - insert before openEdit
  if (!content.includes("openAssignDialog")) {
    content = content.replace(
      /(    openEdit\(row\) \{)/,
      METHODS + "\n    $1"
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
    fixed++;
    console.log("OK: " + relPath);
  } else {
    console.log("SKIP (already done): " + relPath);
  }
});

console.log("\nTotal fixed: " + fixed);
