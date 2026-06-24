<template>
  <div>
    <cs-searchpanel :searchConfig="searchConfig" :searchData="searchData" @handelSearch="search" @handelReset="reset" labelWidth="100px"></cs-searchpanel>
    <div class="mt10 crud-container">
      <div class="mb10 operate-container">
        <div class="function-actions">
          <el-button plain type="primary" icon="el-icon-edit-outline" @click="handleFunction('新增自动拨测任务设置信息')">新增自动拨测任务设置信息</el-button>
          <el-button plain type="primary" icon="el-icon-edit" @click="handleFunction('修改自动拨测任务设置信息')">修改自动拨测任务设置信息</el-button>
          <el-button plain type="danger" icon="el-icon-delete" @click="handleFunction('删除自动拨测任务设置信息')">删除自动拨测任务设置信息</el-button>
          <el-button plain type="primary" icon="el-icon-view" @click="handleFunction('自动拨测任务错误信息监控')">自动拨测任务错误信息监控</el-button>
          <el-button plain type="primary" icon="el-icon-bell" @click="handleFunction('自动拨测任务错误事件通知')">自动拨测任务错误事件通知</el-button>
          <el-button plain type="primary" icon="el-icon-bell" @click="handleFunction('自动拨测任务错误事件通知删除')">自动拨测任务错误事件通知删除</el-button>
          <el-button plain type="primary" icon="el-icon-bell" @click="handleFunction('自动拨测任务错误事件通知查询')">自动拨测任务错误事件通知查询</el-button>
        </div>
        <el-button type="text" icon="el-icon-back" @click="$router.back()">返回上级</el-button>
      </div>
      <cs-pagetable pageTableRef="pageTableRef" :showSelection="true" :tableData="tableData" :tableColumns="tableColumns" :pageTotal="pageTotal" :page.sync="pageOptions.pageNum" :limit.sync="pageOptions.pageSize" @handleSelectionChange="handleSelectionChange" @handleSelectAll="handleSelectionChange" @handleCurrentChange="fetchData" @handleSizeChange="fetchData">
        <el-table-column slot="operate" label="操作" width="260" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" icon="el-icon-view" @click="openDetail(scope.row)">详情</el-button>
            <el-button type="text" icon="el-icon-edit" @click="openEdit(scope.row)">修改</el-button>
            <el-button type="text" icon="el-icon-delete" style="color:#F56C6C" @click="deleteRow(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </cs-pagetable>
    </div>

    <el-dialog :title="formTitle" :visible.sync="formVisible" width="620px" append-to-body>
      <el-form :model="formData" label-width="130px">
        <el-form-item v-for="col in editableColumns" :key="col.prop" :label="col.label">
          <el-select v-if="/状态/.test(col.prop)" v-model="formData[col.prop]" style="width:100%">
            <el-option label="启用" value="启用"></el-option><el-option label="停用" value="停用"></el-option>
          </el-select>
          <el-input v-else v-model="formData[col.prop]"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="detailTitle" :visible.sync="detailVisible" width="660px" append-to-body>
      <el-form label-width="150px" class="detail-form">
        <el-form-item v-for="item in detailFields" :key="item.label" :label="item.label">
          <span>{{ item.value }}</span>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
import { filterData, exportXLSX, getActionType, getButtonIcon } from "@/utils/index";

const rows = [
  { ID: 1, 任务编号: "BCT-001", 任务名称: "HTTP拨测任务-北京节点", 拨测类型: "HTTP", 目标地址: "https://bj.example.com", 执行频率: "每5分钟", 启用状态: "启用", 更新时间: "2026-06-01 10:00:00" },
  { ID: 2, 任务编号: "BCT-002", 任务名称: "ICMP拨测任务-上海节点", 拨测类型: "ICMP", 目标地址: "10.0.1.100", 执行频率: "每10分钟", 启用状态: "启用", 更新时间: "2026-06-02 14:30:00" },
  { ID: 3, 任务编号: "BCT-003", 任务名称: "DNS拨测任务-广州节点", 拨测类型: "DNS", 目标地址: "gz.example.com", 执行频率: "每15分钟", 启用状态: "停用", 更新时间: "2026-06-03 09:15:00" },
  { ID: 4, 任务编号: "BCT-004", 任务名称: "TCP拨测任务-深圳节点", 拨测类型: "TCP", 目标地址: "sz.example.com:443", 执行频率: "每5分钟", 启用状态: "启用", 更新时间: "2026-06-04 16:20:00" },
  { ID: 5, 任务编号: "BCT-005", 任务名称: "HTTP拨测任务-成都节点", 拨测类型: "HTTP", 目标地址: "https://cd.example.com", 执行频率: "每30分钟", 启用状态: "启用", 更新时间: "2026-06-05 08:45:00" },
];
const cols = [
  { prop: "任务编号", label: "任务编号", type: "text", search: true },
  { prop: "任务名称", label: "任务名称", type: "text", search: true },
  { prop: "拨测类型", label: "拨测类型", type: "select", options: [{ value: "HTTP", label: "HTTP" }, { value: "ICMP", label: "ICMP" }, { value: "DNS", label: "DNS" }, { value: "TCP", label: "TCP" }], search: true },
  { prop: "目标地址", label: "目标地址", type: "text" },
  { prop: "执行频率", label: "执行频率", type: "text" },
  { prop: "启用状态", label: "启用状态", type: "select", options: [{ value: "启用", label: "启用" }, { value: "停用", label: "停用" }], search: true },
  { prop: "更新时间", label: "更新时间", type: "text", width: 170 },
  { slot: "operate", label: "操作" },
];
const defaultRow = { 任务编号: "", 任务名称: "", 拨测类型: "HTTP", 目标地址: "", 执行频率: "每5分钟", 启用状态: "启用", 更新时间: "" };

export default {
  name: "BoCeZhouQiZiDongBoCeRenWuSheZhiXinXi",
  data() {
    return {
      searchData: {},
      searchConfig: [],
      allTableData: rows.map((item) => ({ ...item })),
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
      return d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
    },
    nextId() { return this.allTableData.reduce((max, item) => Math.max(max, Number(item.ID) || 0), 0) + 1; },
    handleSelectionChange(selection) { this.selectedRows = selection || []; },
    handleFunction(name) {
      this.activeFunction = name;
      const type = getActionType(name);
      if (/新增|修改/.test(name)) {
        this.formMode = /新增/.test(name) ? "add" : "edit";
        this.formTitle = name;
        this.formData = this.formMode === "add" ? { ...defaultRow } : { ...(this.tableData[0] || defaultRow) };
        this.formVisible = true;
      } else if (type === "delete") {
        if (!this.selectedRows.length) { this.$message.warning("请先选择要删除的记录"); return; }
        this.$confirm("确定要执行【" + name + "】删除选中的 " + this.selectedRows.length + " 条记录吗？", "提示", { type: "warning" }).then(() => {
          const ids = new Set(this.selectedRows.map((r) => r.ID));
          this.allTableData = this.allTableData.filter((item) => !ids.has(item.ID));
          this.fetchData();
          this.$message.success("删除成功，共删除 " + ids.size + " 条记录");
        }).catch(() => {});
      } else {
        this.$message.info(name + " - 功能演示");
      }
    },
    openEdit(row) { this.formMode = "edit"; this.formTitle = "修改"; this.formData = { ...row }; this.formVisible = true; },
    openDetail(row) {
      this.detailTitle = "详情";
      this.detailFields = this.editableColumns.map((col) => ({ label: col.label, value: row[col.prop] || "-" }));
      this.detailVisible = true;
    },
    submitForm() {
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
    deleteRow(row) {
      this.$confirm("确定删除该记录吗？", "删除确认", { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" }).then(() => {
        this.allTableData = this.allTableData.filter((item) => item.ID !== row.ID);
        this.fetchData();
        this.$message.success("删除成功");
      }).catch(() => {});
    },
  },
};
</script>

<style scoped>
.function-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.mt10 { margin-top: 10px; }
.mb10 { margin-bottom: 10px; }
.crud-container { background: #fff; padding: 16px; border-radius: 4px; }
.operate-container { display: flex; justify-content: space-between; align-items: center; }
.detail-form .el-form-item { margin-bottom: 8px; }
</style>
