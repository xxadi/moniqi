const fs = require("fs");
const path = require("path");

const NEW_DIALOG_TEMPLATE = `    <!-- 审批指派信息弹窗 -->
    <el-dialog :title="assignTitle" :visible.sync="assignVisible" width="680px" append-to-body>
      <div v-if="assignHistory.length" style="margin-bottom:16px;">
        <div style="font-size:13px;color:#606266;margin-bottom:8px;font-weight:500;">指派历史记录</div>
        <el-table :data="assignHistory" border size="mini" style="width:100%" max-height="200">
          <el-table-column prop="approver" label="审批人" width="90"></el-table-column>
          <el-table-column prop="level" label="审批层级" width="90"></el-table-column>
          <el-table-column prop="dept" label="所属部门" width="110"></el-table-column>
          <el-table-column prop="priority" label="优先级" width="70" align="center">
            <template slot-scope="scope">
              <el-tag :type="scope.row.priority === '特急' ? 'danger' : scope.row.priority === '紧急' ? 'warning' : 'info'" size="mini">{{ scope.row.priority }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="time" label="指派时间" width="160"></el-table-column>
          <el-table-column prop="status" label="状态" width="80" align="center">
            <template slot-scope="scope">
              <el-tag :type="scope.row.status === '已确认' ? 'success' : scope.row.status === '已驳回' ? 'danger' : 'warning'" size="mini">{{ scope.row.status }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
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

const OLD_DIALOG_REGEX = /    <!-- 审批指派信息弹窗 -->\n    <el-dialog :title="assignTitle" :visible\.sync="assignVisible" width="620px" append-to-body>\n      <el-form :model="assignForm" label-width="130px">[\s\S]*?<\/el-dialog>/;

const NEW_DATA_PROPS = `      assignForm: { approver: "", level: "", dept: "", priority: "普通", deadline: "", remark: "" },
      assignHistory: [],
      assignStateMap: {},`;

const OLD_DATA_PROPS = /assignForm: \{ approver: "", level: "", dept: "", priority: "普通", deadline: "", remark: "" \},/;

const NEW_METHODS = `    openAssignDialog(functionName, S, now) {
      this.assignTitle = functionName;
      this.assignForm = {
        approver: pick(this.assignPeople, 0, S),
        level: pick(["部门主管", "安全主管", "技术总监"], 1, S),
        dept: pick(["安全运维部", "信息安全部", "技术管理部"], 2, S),
        priority: "普通",
        deadline: "",
        remark: "",
      };
      // Load history from stateMap
      if (this.assignStateMap[functionName]) {
        this.assignHistory = this.assignStateMap[functionName];
      } else {
        // Generate initial history
        const statuses = ["已确认", "已确认", "审批中", "已驳回", "已确认"];
        this.assignHistory = Array.from({ length: 3 }, (_, i) => ({
          approver: pick(this.assignPeople, i, S),
          level: pick(["部门主管", "安全主管", "技术总监", "分管领导"], i, S),
          dept: pick(["安全运维部", "信息安全部", "技术管理部", "运营管理部"], i, S),
          priority: pick(["普通", "紧急", "普通"], i, S),
          time: now,
          status: statuses[(S + i) % 5],
        }));
        this.assignStateMap[functionName] = this.assignHistory;
      }
      this.assignVisible = true;
    },
    confirmAssign() {
      this.$confirm("确定将审批指派给【" + this.assignForm.approver + "】（" + this.assignForm.level + "）？", "确认指派", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        const record = {
          approver: this.assignForm.approver,
          level: this.assignForm.level,
          dept: this.assignForm.dept,
          priority: this.assignForm.priority,
          time: this.now(),
          status: "已确认",
        };
        this.assignHistory.unshift(record);
        this.assignStateMap[this.assignTitle] = JSON.parse(JSON.stringify(this.assignHistory));
        this.assignVisible = false;
        this.$message.success("指派成功，已通知审批人 " + this.assignForm.approver);
      }).catch(() => {});
    },`;

const OLD_METHODS = /    openAssignDialog\(functionName, S, now\) \{\n      this\.assignTitle = functionName;\n      this\.assignForm = \{[^}]+\};\n      this\.assignVisible = true;\n    \},\n    confirmAssign\(\) \{[\s\S]*?this\.\$message\.success\("指派成功，已通知审批人 " \+ this\.assignForm\.approver\);\n      \}\)\.catch\(\(\) => \{\}\);\n    \},/;

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
  return content.includes("assignForm") && content.includes("openAssignDialog");
});

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, "utf8");
  const relPath = path.relative(path.resolve(__dirname, ".."), filePath);
  let changed = false;

  // 1. Replace dialog template
  if (!content.includes("assignHistory")) {
    const newContent = content.replace(OLD_DIALOG_REGEX, NEW_DIALOG_TEMPLATE);
    if (newContent !== content) { content = newContent; changed = true; }
  }

  // 2. Add history data properties
  if (!content.includes("assignHistory:")) {
    const newContent = content.replace(OLD_DATA_PROPS, NEW_DATA_PROPS);
    if (newContent !== content) { content = newContent; changed = true; }
  }

  // 3. Replace methods
  if (!content.includes("assignStateMap[functionName]")) {
    const newContent = content.replace(OLD_METHODS, NEW_METHODS);
    if (newContent !== content) { content = newContent; changed = true; }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
    fixed++;
    console.log("OK: " + relPath);
  } else {
    console.log("SKIP: " + relPath);
  }
});

console.log("\nTotal fixed: " + fixed);
