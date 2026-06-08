<template>
  <div>
    <cs-searchpanel :searchConfig="searchConfig" :searchData="searchData" @handelSearch="search" @handelReset="reset" labelWidth="100px"></cs-searchpanel>
    <div class="mt10 crud-container">
      <div class="mb10 operate-container">
        <div class="function-actions">
          <el-button plain type="primary" icon="el-icon-monitor" @click='handleFunction("4A上报数据对比错误信息监控", "monitor_error")'>4A上报数据对比错误信息监控</el-button>
          <el-button plain type="primary" icon="el-icon-bell" @click='handleFunction("4A上报数据对比错误事件通知", "alert_notify")'>4A上报数据对比错误事件通知</el-button>
          <el-button plain type="danger" icon="el-icon-delete" @click='handleFunction("4A上报数据对比错误事件通知删除", "delete_notify")'>4A上报数据对比错误事件通知删除</el-button>
          <el-button plain type="primary" icon="el-icon-view" @click='handleFunction("4A上报数据对比错误事件通知查询", "query_notify")'>4A上报数据对比错误事件通知查询</el-button>
        </div>
        <el-button type="text" icon="el-icon-back" @click="$router.back()">返回上级</el-button>
      </div>
      <cs-pagetable pageTableRef="pageTableRef" :showSelection="true" :tableData="tableData" :tableColumns="tableColumns" :pageTotal="pageTotal" :page.sync="pageOptions.pageNum" :limit.sync="pageOptions.pageSize" @handleSelectionChange="handleSelectionChange" @handleSelectAll="handleSelectionChange" @handleCurrentChange="fetchData" @handleSizeChange="fetchData">
        <el-table-column slot="operate" label="操作" width="260" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" icon="el-icon-view" @click="detail(scope.row)">详情</el-button>
            <el-button type="text" icon="el-icon-edit" @click="edit(scope.row)">修改</el-button>
            <el-button type="text" icon="el-icon-delete" style="color:#F56C6C" @click="deleteRow(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </cs-pagetable>
    </div>

    <el-dialog :title="formTitle" :visible.sync="formVisible" width="620px" append-to-body>
      <el-form :model="formData" label-width="130px">
        <el-form-item v-for="col in editableColumns" :key="col.prop" :label="col.label">
          <el-select v-if="/级别|状态/.test(col.prop)" v-model="formData[col.prop]" style="width:100%">
            <el-option v-if="/级别/.test(col.prop)" label="紧急" value="紧急"></el-option>
            <el-option v-if="/级别/.test(col.prop)" label="重要" value="重要"></el-option>
            <el-option v-if="/级别/.test(col.prop)" label="一般" value="一般"></el-option>
            <el-option v-if="/状态/.test(col.prop)" label="待处理" value="待处理"></el-option>
            <el-option v-if="/状态/.test(col.prop)" label="已处理" value="已处理"></el-option>
          </el-select>
          <el-input v-else v-model="formData[col.prop]" :disabled="formMode==='detail'"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="formVisible = false">取消</el-button>
        <el-button v-if="formMode!=='detail'" type="primary" @click="submitForm">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="detailTitle" :visible.sync="detailVisible" width="660px" append-to-body>
      <el-form label-width="150px" class="detail-form">
        <el-form-item v-for="item in detailFields" :key="item.label" :label="item.label">
          <span>{{ item.value }}</span>
        </el-form-item>
      </el-form>
    </el-dialog>

    <el-dialog :title="queryTitle" :visible.sync="queryVisible" width="660px" append-to-body>
      <el-table :data="queryResults" border size="mini" style="width:100%">
        <el-table-column prop="序号" label="序号" width="60" align="center"></el-table-column>
        <el-table-column prop="数据项" label="数据项"></el-table-column>
        <el-table-column prop="结果数量" label="结果数量" width="100" align="center"></el-table-column>
        <el-table-column prop="查询耗时" label="查询耗时" width="100" align="center"></el-table-column>
        <el-table-column prop="状态" label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.状态 === '正常' ? 'success' : scope.row.状态 === '查询超时' ? 'danger' : 'warning'" size="mini">{{ scope.row.状态 }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="queryVisible = false">关闭</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="monitorTitle" :visible.sync="monitorVisible" width="640px" append-to-body>
      <el-form label-width="110px" style="margin-bottom:12px;">
        <el-form-item label="处理进度">
          <el-progress :percentage="monitorProgress" :status="monitorProgress === 100 ? 'success' : undefined" style="width:80%"></el-progress>
        </el-form-item>
        <el-form-item v-for="item in monitorStats" :key="item.label" :label="item.label">
          <span>{{ item.value }}</span>
        </el-form-item>
      </el-form>
      <div style="font-size:13px;color:#606266;margin-bottom:8px;font-weight:500;">监控日志</div>
      <el-table :data="monitorLog" border size="mini" style="width:100%">
        <el-table-column prop="time" label="时间" width="160"></el-table-column>
        <el-table-column prop="level" label="级别" width="70" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.level === 'WARN' ? 'warning' : 'info'" size="mini">{{ scope.row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="msg" label="消息"></el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="monitorVisible = false">关闭</el-button>
        <el-button type="primary" @click="monitorVisible = false; $message.success('监控确认完成')">确认</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="alertTitle" :visible.sync="alertVisible" width="620px" append-to-body>
      <el-alert :title="alertData.alertTitle || '通知信息'" :type="alertData.alertType || 'warning'" :closable="false" show-icon style="margin-bottom:16px;"></el-alert>
      <el-form label-width="120px">
        <el-form-item v-for="item in alertFields" :key="item.label" :label="item.label">
          <span :style="{ color: /紧急|重要|未处理/.test(item.value) ? '#F56C6C' : /一般|已处理/.test(item.value) ? '#67C23A' : '' }">{{ item.value }}</span>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="alertVisible = false">关闭</el-button>
        <el-button type="primary" @click="alertVisible = false; $message.success('通知已确认')">确认</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { filterData, exportXLSX, getActionType, getButtonIcon } from "@/utils/index";

const rows = [
  { ID: 1, 通知编号: "NT-001", 事件名称: "4A上报数据对比超时", 事件级别: "紧急", 发生时间: "2026-06-07 14:23:00", 处理状态: "待处理", 通知方式: "短信", 接收人: "张伟" },
  { ID: 2, 通知编号: "NT-002", 事件名称: "4A上报数据字段不匹配", 事件级别: "重要", 发生时间: "2026-06-07 10:15:00", 处理状态: "已处理", 通知方式: "邮件", 接收人: "李娜" },
  { ID: 3, 通知编号: "NT-003", 事件名称: "4A上报数据量异常", 事件级别: "重要", 发生时间: "2026-06-06 22:00:00", 处理状态: "待处理", 通知方式: "短信", 接收人: "王强" },
  { ID: 4, 通知编号: "NT-004", 事件名称: "4A上报数据格式错误", 事件级别: "一般", 发生时间: "2026-06-06 16:45:00", 处理状态: "已处理", 通知方式: "邮件", 接收人: "赵敏" },
  { ID: 5, 通知编号: "NT-005", 事件名称: "4A上报数据对比连接失败", 事件级别: "紧急", 发生时间: "2026-06-06 08:30:00", 处理状态: "待处理", 通知方式: "短信", 接收人: "刘洋" },
];
const cols = [
  { prop: "通知编号", label: "通知编号", type: "text", search: true },
  { prop: "事件名称", label: "事件名称", type: "text", search: true },
  { prop: "事件级别", label: "事件级别", type: "select", options: [{ value: "紧急", label: "紧急" }, { value: "重要", label: "重要" }, { value: "一般", label: "一般" }], search: true },
  { prop: "发生时间", label: "发生时间", type: "text", width: 170 },
  { prop: "处理状态", label: "处理状态", type: "select", options: [{ value: "待处理", label: "待处理" }, { value: "已处理", label: "已处理" }], search: true },
  { prop: "通知方式", label: "通知方式", type: "text" },
  { prop: "接收人", label: "接收人", type: "text", search: true },
  { slot: "operate", label: "操作" },
];
const defaultRow = { 通知编号: "", 事件名称: "", 事件级别: "一般", 发生时间: "", 处理状态: "待处理", 通知方式: "短信", 接收人: "" };

function pageHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 100000;
  return h;
}
const pick = (items, index, seed) => items[(seed + index) % items.length];

export default {
  name: "4AYN_4AShangBaoShuJuDuiBiCuoWuShiJianTongZhiGuanLi",
  data() {
    return {
      searchData: {},
      searchConfig: [],
      allTableData: rows.map((r) => ({ ...r })),
      tableData: [],
      selectedRows: [],
      tableColumns: cols,
      pageTotal: 0,
      pageOptions: { pageNum: 1, pageSize: 10 },
      activeFunction: "",
      activeActionType: "",
      formVisible: false,
      formMode: "add",
      formTitle: "新增",
      formData: { ...defaultRow },
      detailVisible: false,
      detailTitle: "详情",
      detailFields: [],
      queryVisible: false,
      queryTitle: "查询结果",
      queryResults: [],
      monitorVisible: false,
      monitorTitle: "监控面板",
      monitorStats: [],
      monitorProgress: 0,
      monitorLog: [],
      alertVisible: false,
      alertTitle: "通知信息",
      alertFields: [],
      alertData: {},
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
    createEmptyRow() {
      return { ...defaultRow };
    },
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
    search() {
      this.pageOptions.pageNum = 1;
      this.fetchData();
    },
    reset() {
      this.searchData = {};
      this.search();
    },
    now() {
      const pad = (value) => String(value).padStart(2, "0");
      const date = new Date();
      return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + " " + pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" + pad(date.getSeconds());
    },
    nextId() {
      return this.allTableData.reduce((max, item) => Math.max(max, Number(item.ID) || 0), 0) + 1;
    },
    handleSelectionChange(selection) {
      this.selectedRows = selection || [];
    },
    handleFunction(functionName, extraType) {
      this.activeFunction = functionName;
      this.activeActionType = extraType;
      if (/^delete/.test(extraType)) {
        if (!this.selectedRows.length) { this.$message.warning("请先选择要删除的记录"); return; }
        this.$confirm("确定要执行【" + functionName + "】删除选中的 " + this.selectedRows.length + " 条记录吗？", "提示", { type: "warning" }).then(() => {
          const ids = new Set(this.selectedRows.map((r) => r.ID));
          this.allTableData = this.allTableData.filter((item) => !ids.has(item.ID));
          this.fetchData();
          this.$message.success("删除成功，共删除 " + ids.size + " 条记录");
        }).catch(() => {});
        return;
      }
      const S = pageHash(functionName);
      const now = this.now();
      if (/通知/.test(functionName)) {
        this.alertTitle = functionName;
        this.alertData = { alertTitle: "错误事件通知", alertType: "warning" };
        this.alertFields = [
          { label: "通知名称", value: functionName },
          { label: "通知编号", value: "ALT-" + String(S).slice(-6) },
          { label: "事件级别", value: pick(["紧急", "重要", "一般"], 0, S) },
          { label: "处理状态", value: pick(["未处理", "处理中", "已处理"], 1, S) },
          { label: "触发时间", value: now },
          { label: "通知方式", value: pick(["短信", "邮件", "系统消息"], 2, S) },
          { label: "接收人", value: pick(["张伟", "李娜", "王强", "赵敏", "刘洋"], 3, S) },
          { label: "处理建议", value: pick(["检查配置", "重启服务", "联系管理员"], 4, S) },
        ];
        this.alertVisible = true;
      } else if (/监控/.test(functionName)) {
        this.monitorTitle = functionName;
        const prefix = functionName.replace(/监控/g, "").trim() || functionName;
        this.monitorStats = [
          { label: "监控目标", value: prefix },
          { label: "在线状态", value: pick(["在线", "离线", "部分异常"], 0, S) },
          { label: "运行时长", value: pick(["2h 15m", "5h 32m", "12h 8m", "24h 45m"], 1, S) },
          { label: "当前负载", value: pick(["23%", "45%", "67%", "89%"], 2, S) + "" },
          { label: "响应延迟", value: pick(["12ms", "28ms", "56ms", "120ms"], 3, S) + "" },
          { label: "错误率", value: pick(["0.1%", "0.5%", "1.2%", "3.8%"], 4, S) },
        ];
        this.monitorProgress = pick([75, 82, 91, 98], 0, S);
        this.monitorLog = [
          { time: now, level: "INFO", msg: functionName + " 监控已启动" },
          { time: now, level: "INFO", msg: "数据采集正常，当前延迟 " + pick(["12ms", "28ms"], 1, S) },
          { time: now, level: pick(["INFO", "WARN"], 4, S), msg: pick(["监控数据已更新", "发现异常波动", "负载超过阈值", "指标恢复正常"], 5, S) },
        ];
        this.monitorVisible = true;
      } else if (/查询/.test(functionName)) {
        this.queryTitle = functionName;
        const count = (S % 3) + 3;
        this.queryResults = Array.from({ length: count }).map((_, i) => ({
          序号: i + 1,
          数据项: pick(["错误事件记录", "通知发送日志", "处理结果", "重试记录", "异常详情"], i, S),
          结果数量: pick([12, 28, 56, 128], i, S),
          查询耗时: pick(["12ms", "28ms", "56ms", "128ms"], i, S) + "",
          状态: pick(["正常", "查询超时", "部分异常", "待处理"], i, S),
        }));
        this.queryVisible = true;
      } else {
        this.$message.info(functionName + " - 功能演示");
      }
    },
    add() {
      this.formMode = "add";
      this.formTitle = "新增通知";
      this.formData = { ...defaultRow };
      this.formVisible = true;
    },
    edit(row) {
      this.formMode = "edit";
      this.formTitle = "修改通知";
      this.formData = { ...row };
      this.formVisible = true;
    },
    detail(row) {
      this.detailTitle = "详情";
      this.detailFields = this.tableColumns.filter((c) => c.prop).map((c) => ({ label: c.label, value: row[c.prop] }));
      this.detailVisible = true;
    },
    submitForm() {
      if (this.formMode === "add") {
        const newRow = { ...this.formData, ID: this.nextId() };
        this.allTableData.unshift(newRow);
      } else if (this.formMode === "edit") {
        const index = this.allTableData.findIndex((r) => r.ID === this.formData.ID);
        if (index >= 0) this.$set(this.allTableData, index, { ...this.formData });
      }
      this.formVisible = false;
      this.fetchData();
      this.$message.success("操作成功");
    },
    deleteRow(row) {
      this.$confirm("确定删除？", "提示", { type: "warning" }).then(() => {
        this.allTableData = this.allTableData.filter((i) => i.ID !== row.ID);
        this.fetchData();
        this.$message.success("删除成功");
      }).catch(() => {});
    },
  },
};
</script>

<style scoped>
.function-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.mt10 { margin-top: 10px; }
.mb10 { margin-bottom: 10px; }
.crud-container { background: #fff; padding: 16px; border-radius: 4px; }
.operate-container { display: flex; justify-content: space-between; align-items: center; }
.detail-form .el-form-item { margin-bottom: 8px; }
</style>
