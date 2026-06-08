<template>
  <div>
    <cs-searchpanel
      :searchConfig="searchConfig"
      :searchData="searchData"
      @handelSearch="search"
      @handelReset="reset"
      labelWidth="130px"
    ></cs-searchpanel>
    <div class="mt10 crud-container">
      <div class="mb10 operate-container">
        <div class="function-actions">
          <el-button plain type="primary" icon="el-icon-plus" @click="openAdd()">新增错误信息</el-button>
          <el-button plain type="primary" icon="el-icon-view" @click="openQuery()">查询错误信息</el-button>
          <el-button plain type="primary" icon="el-icon-bell" @click="openNotify()">错误通知</el-button>
          <el-button plain type="danger" icon="el-icon-delete" @click="deleteSelected()">删除选定</el-button>
        </div>
      </div>
      <cs-pagetable
        pageTableRef="pageTableRef"
        :showSelection="true"
        :tableData="tableData"
        :tableColumns="tableColumns"
        :pageTotal="pageTotal"
        :page.sync="pageOptions.pageNum"
        :limit.sync="pageOptions.pageSize"
        @handleSelectionChange="handleSelectionChange"
        @handleSelectAll="handleSelectionChange"
        @handleCurrentChange="fetchData"
        @handleSizeChange="fetchData"
      >
        <el-table-column slot="operate" label="操作" :min-width="180" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" icon="el-icon-view" @click="openDetail(scope.row)">详情</el-button>
            <el-button type="text" icon="el-icon-edit" @click="openEdit(scope.row)">修改</el-button>
            <el-button type="text" icon="el-icon-delete" style="color:#F56C6C" @click="deleteRow(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </cs-pagetable>
    </div>

    <el-dialog :title="formTitle" :visible.sync="formVisible" width="560px" append-to-body>
      <el-form :model="formData" label-width="120px">
        <el-form-item label="接口名称">
          <el-select v-model="formData['接口名称']" style="width:100%">
            <el-option label="工信部指令查询接口" value="工信部指令查询接口"></el-option>
            <el-option label="数据上报接口" value="数据上报接口"></el-option>
            <el-option label="资产同步接口" value="资产同步接口"></el-option>
            <el-option label="审批回调接口" value="审批回调接口"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="错误级别">
          <el-select v-model="formData['错误级别']" style="width:100%">
            <el-option label="ERROR" value="ERROR"></el-option>
            <el-option label="WARNING" value="WARNING"></el-option>
            <el-option label="INFO" value="INFO"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="错误信息">
          <el-input v-model="formData['错误信息']" type="textarea" :rows="3"></el-input>
        </el-form-item>
        <el-form-item label="处理状态">
          <el-select v-model="formData['处理状态']" style="width:100%">
            <el-option label="未处理" value="未处理"></el-option>
            <el-option label="处理中" value="处理中"></el-option>
            <el-option label="已处理" value="已处理"></el-option>
            <el-option label="已忽略" value="已忽略"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="'错误详情'" :visible.sync="detailVisible" width="560px" append-to-body>
      <el-form label-width="120px" class="detail-form">
        <el-form-item v-for="item in detailFields" :key="item.label" :label="item.label">
          <span>{{ item.value }}</span>
        </el-form-item>
      </el-form>
    </el-dialog>

    <el-dialog :title="'错误信息查询'" :visible.sync="queryVisible" width="700px" append-to-body>
      <el-form :model="queryForm" label-width="100px" style="margin-bottom:12px;">
        <el-row :gutter="20">
          <el-col :span="10">
            <el-form-item label="接口名称">
              <el-select v-model="queryForm.interface" style="width:100%" clearable>
                <el-option label="全部" value=""></el-option>
                <el-option label="工信部指令查询接口" value="工信部指令查询接口"></el-option>
                <el-option label="数据上报接口" value="数据上报接口"></el-option>
                <el-option label="资产同步接口" value="资产同步接口"></el-option>
                <el-option label="审批回调接口" value="审批回调接口"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="错误级别">
              <el-select v-model="queryForm.level" style="width:100%" clearable>
                <el-option label="全部" value=""></el-option>
                <el-option label="ERROR" value="ERROR"></el-option>
                <el-option label="WARNING" value="WARNING"></el-option>
                <el-option label="INFO" value="INFO"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-button type="primary" icon="el-icon-search" @click="doQuery">查询</el-button>
            <el-button @click="queryForm = {interface:'',level:''}; doQuery()">重置</el-button>
          </el-col>
        </el-row>
      </el-form>
      <el-table :data="queryResults" border size="mini" style="width:100%">
        <el-table-column prop="time" label="时间" width="150"></el-table-column>
        <el-table-column prop="level" label="级别" width="80" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.level === 'ERROR' ? 'danger' : scope.row.level === 'WARNING' ? 'warning' : 'info'" size="mini">{{ scope.row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="interface" label="接口名称"></el-table-column>
        <el-table-column prop="msg" label="错误信息"></el-table-column>
        <el-table-column prop="status" label="处理状态" width="90" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === '已处理' ? 'success' : scope.row.status === '处理中' ? '' : scope.row.status === '未处理' ? 'danger' : 'info'" size="mini">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="queryVisible = false">关闭</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="'错误通知'" :visible.sync="notifyVisible" width="620px" append-to-body>
      <el-form :model="notifyForm" label-width="100px" style="margin-bottom:12px;">
        <el-form-item label="通知标题">
          <el-input v-model="notifyForm.title" placeholder="请输入通知标题"></el-input>
        </el-form-item>
        <el-form-item label="通知级别">
          <el-select v-model="notifyForm.level" style="width:100%">
            <el-option label="紧急" value="紧急"></el-option>
            <el-option label="重要" value="重要"></el-option>
            <el-option label="一般" value="一般"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="通知内容">
          <el-input v-model="notifyForm.content" type="textarea" :rows="3" placeholder="请输入通知内容"></el-input>
        </el-form-item>
        <el-form-item label="目标对象">
          <el-select v-model="notifyForm.target" style="width:100%">
            <el-option label="全部运维人员" value="全部运维人员"></el-option>
            <el-option label="开发团队" value="开发团队"></el-option>
            <el-option label="系统管理员" value="系统管理员"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <el-divider>通知历史</el-divider>
      <el-table :data="notifyHistory" border size="mini" style="width:100%">
        <el-table-column prop="title" label="标题"></el-table-column>
        <el-table-column prop="level" label="级别" width="70" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.level === '紧急' ? 'danger' : scope.row.level === '重要' ? 'warning' : 'info'" size="mini">{{ scope.row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sender" label="发送人" width="100"></el-table-column>
        <el-table-column prop="time" label="时间" width="150"></el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="notifyVisible = false">关闭</el-button>
        <el-button type="primary" icon="el-icon-bell" @click="sendNotify">发送通知</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { filterData } from "@/utils/index";

const initialRows = [
  { "ID": 1, "错误编号": "ERR-10001", "接口名称": "工信部指令查询接口", "错误级别": "ERROR", "错误信息": "接口连接超时，超过30秒无响应", "发生时间": "2026-05-08 09:12:18", "处理状态": "已处理", "操作人": "system" },
  { "ID": 2, "错误编号": "ERR-10002", "接口名称": "数据上报接口", "错误级别": "WARNING", "错误信息": "数据格式校验失败，期望JSON格式", "发生时间": "2026-05-08 09:35:44", "处理状态": "处理中", "操作人": "admin" },
  { "ID": 3, "错误编号": "ERR-10003", "接口名称": "资产同步接口", "错误级别": "ERROR", "错误信息": "签名校验失败，请求被拒绝", "发生时间": "2026-05-08 10:08:06", "处理状态": "未处理", "操作人": "" },
  { "ID": 4, "错误编号": "ERR-10004", "接口名称": "审批回调接口", "错误级别": "INFO", "错误信息": "回调数据为空，跳过处理", "发生时间": "2026-05-08 10:42:31", "处理状态": "已忽略", "操作人": "system" },
  { "ID": 5, "错误编号": "ERR-10005", "接口名称": "数据上报接口", "错误级别": "ERROR", "错误信息": "数据库连接池耗尽，无法处理请求", "发生时间": "2026-05-08 11:16:09", "处理状态": "未处理", "操作人": "" },
];
const tableColumns = [
  { "prop": "ID", "label": "ID", "type": "text", "width": 80 },
  { "prop": "错误编号", "label": "错误编号", "type": "text", "search": true, "showTooltip": true },
  { "prop": "接口名称", "label": "接口名称", "type": "text", "search": true, "showTooltip": true },
  { "prop": "错误级别", "label": "错误级别", "type": "text", "search": true, "showTooltip": true, "width": 100 },
  { "prop": "错误信息", "label": "错误信息", "type": "text", "search": false, "showTooltip": true },
  { "prop": "发生时间", "label": "发生时间", "type": "text", "search": false, "showTooltip": true, "width": 170 },
  { "prop": "处理状态", "label": "处理状态", "type": "text", "search": true, "showTooltip": true, "width": 100 },
  { "prop": "操作人", "label": "操作人", "type": "text", "search": false, "showTooltip": true, "width": 100 },
  { "slot": "operate", "label": "操作" },
];

export default {
  name: "YNBugNotify",
  data() {
    return {
      searchData: {},
      searchConfig: [],
      allTableData: initialRows.map((item) => ({ ...item })),
      tableData: [],
      selectedRows: [],
      tableColumns,
      pageTotal: 0,
      pageOptions: { pageNum: 1, pageSize: 10 },
      detailVisible: false,
      detailFields: [],
      formVisible: false,
      formMode: "add",
      formTitle: "新增错误信息",
      formData: { "错误编号": "", "接口名称": "", "错误级别": "ERROR", "错误信息": "", "处理状态": "未处理", "操作人": "" },
      notifyVisible: false,
      notifyForm: { title: "", content: "", level: "一般", target: "" },
      notifyHistory: [],
      notifyStateMap: {},
      queryVisible: false,
      queryForm: { interface: "", level: "" },
      queryResults: [],
    };
  },
  computed: {
    editableColumns() {
      return this.tableColumns.filter((item) => item.prop && item.prop !== "ID");
    },
  },
  created() {
    this.initConfig();
    this.fetchData();
  },
  methods: {
    goBack() { this.$router.go(-1); },
    initConfig() {
      this.searchConfig = this.tableColumns
        .map((item) => item.type && item.search && { ...item, field: item.prop })
        .filter(Boolean);
    },
    fetchData() {
      const mockData = filterData(this.allTableData, this.searchData);
      const start = (this.pageOptions.pageNum - 1) * this.pageOptions.pageSize;
      const end = start + this.pageOptions.pageSize;
      this.tableData = mockData.slice(start, end);
      this.pageTotal = mockData.length;
      this.selectedRows = [];
    },
    search() { this.pageOptions.pageNum = 1; this.fetchData(); },
    reset() { this.searchData = {}; this.search(); },
    now() {
      const pad = (v) => String(v).padStart(2, "0");
      const d = new Date();
      return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
    },
    handleSelectionChange(selection) { this.selectedRows = selection || []; },
    nextId() { return this.allTableData.reduce((max, item) => Math.max(max, Number(item.ID) || 0), 0) + 1; },

    openEdit(row) {
      this.formMode = "edit";
      this.formTitle = "修改错误信息";
      this.formData = { ...row };
      this.formVisible = true;
    },
    openDetail(row) {
      this.detailFields = this.editableColumns.map((col) => ({ label: col.label, value: row[col.prop] || "-" }));
      this.detailVisible = true;
    },
    openAdd() {
      this.formMode = "add";
      this.formTitle = "新增错误信息";
      this.formData = {
        "错误编号": "ERR-" + String(Date.now()).slice(-8),
        "接口名称": "",
        "错误级别": "ERROR",
        "错误信息": "",
        "发生时间": this.now(),
        "处理状态": "未处理",
        "操作人": "",
      };
      this.formVisible = true;
    },
    submitForm() {
      if (!this.formData["接口名称"]) { this.$message.warning("请选择接口名称"); return; }
      if (this.formMode === "add") {
        this.allTableData.unshift({ ...this.formData, ID: this.nextId() });
      } else {
        const idx = this.allTableData.findIndex((item) => item.ID === this.formData.ID);
        if (idx !== -1) this.$set(this.allTableData, idx, { ...this.formData });
      }
      this.formVisible = false;
      this.fetchData();
      this.$message.success("操作成功");
    },
    openNotify() {
      this.notifyForm = { title: "", content: "", level: "一般", target: "" };
      if (!this.notifyStateMap["default"]) {
        const titles = ["接口超时告警通知", "签名校验失败通知", "数据库连接异常通知", "磁盘空间不足通知"];
        const senders = ["刘建国", "陈明辉", "张伟", "王芳"];
        const now = this.now();
        this.notifyStateMap["default"] = titles.map((t, i) => ({
          title: t, level: i < 2 ? "紧急" : "重要", sender: senders[i], time: now,
        }));
      }
      this.notifyHistory = this.notifyStateMap["default"];
      this.notifyVisible = true;
    },
    sendNotify() {
      if (!this.notifyForm.title) { this.$message.warning("请输入通知标题"); return; }
      const record = {
        title: this.notifyForm.title,
        level: this.notifyForm.level,
        sender: "系统管理员",
        time: this.now(),
      };
      this.notifyHistory.unshift(record);
      this.notifyStateMap["default"] = JSON.parse(JSON.stringify(this.notifyHistory));
      this.notifyForm = { title: "", content: "", level: "一般", target: "" };
      this.$message.success("通知发送成功");
    },
    openQuery() {
      this.queryForm = { interface: "", level: "" };
      this.queryResults = this.allTableData.map((item) => ({
        time: item["发生时间"],
        level: item["错误级别"],
        interface: item["接口名称"],
        msg: item["错误信息"],
        status: item["处理状态"],
      }));
      this.queryVisible = true;
    },
    doQuery() {
      let results = this.allTableData;
      if (this.queryForm.interface) results = results.filter(r => r["接口名称"].includes(this.queryForm.interface));
      if (this.queryForm.level) results = results.filter(r => r["错误级别"] === this.queryForm.level);
      this.queryResults = results.map((item) => ({
        time: item["发生时间"],
        level: item["错误级别"],
        interface: item["接口名称"],
        msg: item["错误信息"],
        status: item["处理状态"],
      }));
    },
    deleteSelected() {
      if (!this.selectedRows.length) { this.$message.warning("请先选择要删除的记录"); return; }
      this.$confirm("确定删除选中的 " + this.selectedRows.length + " 条错误事件通知？", "确认删除", {
        confirmButtonText: "确定", cancelButtonText: "取消", type: "warning",
      }).then(() => {
        const ids = new Set(this.selectedRows.map((r) => r.ID));
        this.allTableData = this.allTableData.filter((item) => !ids.has(item.ID));
        this.fetchData();
        this.$message.success("删除成功");
      }).catch(() => {});
    },
    deleteRow(row) {
      this.$confirm("确定删除该记录吗？", "删除确认", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        this.allTableData = this.allTableData.filter((item) => item.ID !== row.ID);
        this.fetchData();
        this.$message.success("删除成功");
      }).catch(() => {});
    },
  },
};
</script>

<style scoped>
.mt10 { margin-top: 10px; }
.mb10 { margin-bottom: 10px; }
.crud-container { background: #fff; padding: 16px; border-radius: 4px; }
.operate-container { display: flex; justify-content: space-between; align-items: center; }
.function-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.detail-form .el-form-item { margin-bottom: 8px; }
</style>
