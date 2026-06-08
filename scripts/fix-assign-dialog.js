const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'src', 'views', '资产信息上报调整', 'YN云南COSMIC');

const targetDirs = [
  '4A资产登录信息审核流程管理',
  '全端口扫描结果审核流程管理',
  '告警白名单审核流程管理',
  '登录采集入库管理',
  '拨测任务结果审核流程管理',
  '拨测正确率审核流程管理',
  '流量分析采集结果汇总管理',
  '流量告警审核流程管理',
  '自动化识别结果审核流程管理',
  '资产状态采集结果审核流程管理',
];

const assignDialogTemplate = `    <!-- 审批指派弹窗 -->
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
        <el-form-item label="指派备注">
          <el-input v-model="assignForm.remark" type="textarea" :rows="3" placeholder="请输入指派备注"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAssign">确认指派</el-button>
      </span>
    </el-dialog>`;

const assignDataProps = `      assignVisible: false,
      assignTitle: "审批指派信息",
      assignPeople: ["刘建国", "陈明辉", "张伟", "王芳", "李强", "马超", "罗艳", "谢建华", "韩冰", "曹鹏飞"],
            assignForm: { approver: "", level: "", dept: "", priority: "普通", deadline: "", remark: "" },
      assignHistory: [],
      assignStateMap: {},`;

const assignMethods = `    openAssignDialog(functionName, S, now) {
      this.assignTitle = functionName;
      this.assignForm = {
        approver: pick(this.assignPeople, 0, S),
        level: pick(["部门主管", "安全主管", "技术总监"], 1, S),
        dept: pick(["安全运维部", "信息安全部", "技术管理部"], 2, S),
        priority: "普通",
        deadline: "",
        remark: "",
      };
      if (this.assignStateMap[functionName]) {
        this.assignHistory = this.assignStateMap[functionName];
      } else {
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
        this.assignForm = { approver: "", level: "", dept: "", priority: "普通", deadline: "", remark: "" };
        this.assignVisible = false;
        this.$message.success("指派成功");
      }).catch(() => {});
    },`;

for (const dirName of targetDirs) {
  const filePath = path.join(dir, dirName, 'index.vue');
  if (!fs.existsSync(filePath)) {
    console.log('SKIP: ' + dirName + '/index.vue not found');
    continue;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Change button type to "assign"
  const btnRegex = /(@click='handleFunction\("新增[^"]*审核指派信息",\s*")([^"]+)("'\)/g;
  const newContent = content.replace(btnRegex, function(match, prefix, type, suffix) {
    if (type !== 'assign') {
      changed = true;
      console.log(dirName + ': Changed button type from "' + type + '" to "assign"');
      return prefix + 'assign' + suffix;
    }
    return match;
  });
  content = newContent;

  // 2. Add "assign" case to switch
  if (!content.includes('case "assign":')) {
    const notifyCaseIdx = content.indexOf('case "notify":');
    if (notifyCaseIdx !== -1) {
      const afterNotify = content.indexOf('break;', notifyCaseIdx);
      if (afterNotify !== -1) {
        const insertPos = afterNotify + 'break;'.length;
        content = content.slice(0, insertPos) + '\n        case "assign":\n          this.openAssignDialog(functionName, S, now);\n          break;' + content.slice(insertPos);
        changed = true;
        console.log(dirName + ': Added "assign" case');
      }
    } else {
      const defaultIdx = content.indexOf(
