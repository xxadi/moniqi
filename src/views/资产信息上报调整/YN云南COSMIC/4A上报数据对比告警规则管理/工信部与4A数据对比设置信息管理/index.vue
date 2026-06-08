<template>
  <div>
    <cs-searchpanel :searchConfig="searchConfig" :searchData="searchData" @handelSearch="search" @handelReset="reset" labelWidth="100px"></cs-searchpanel>
    <div class="mt10 crud-container">
      <div class="mb10 operate-container">
        <div class="function-actions">
          <el-button plain type="primary" icon="el-icon-edit-outline" @click="handleFunction('新增工信部与4A数据对比设置信息')">新增工信部与4A数据对比设置信息</el-button>
          <el-button plain type="primary" icon="el-icon-edit" @click="handleFunction('修改工信部与4A数据对比设置信息')">修改工信部与4A数据对比设置信息</el-button>
          <el-button plain type="danger" icon="el-icon-delete" @click="handleFunction('删除工信部与4A数据对比设置信息')">删除工信部与4A数据对比设置信息</el-button>
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
  { ID: 1, 设置编号: "GX-SZ-001", 设置名称: "工信部与4A对比周期设置", 对比方式: "全量对比", 对比频率: "每日", 启用状态: "启用", 更新时间: "2026-06-01 10:00:00" },
  { ID: 2, 设置编号: "GX-SZ-002", 设置名称: "工信部与4A字段映射设置", 对比方式: "增量对比", 对比频率: "实时", 启用状态: "启用", 更新时间: "2026-06-02 14:30:00" },
  { ID: 3, 设置编号: "GX-SZ-003", 设置名称: "工信部与4A差异阈值设置", 对比方式: "全量对比", 对比频率: "每日", 启用状态: "停用", 更新时间: "2026-06-03 09:15:00" },
  { ID: 4, 设置编号: "GX-SZ-004", 设置名称: "工信部与4A过滤规则设置", 对比方式: "增量对比", 对比频率: "实时", 启用状态: "启用", 更新时间: "2026-06-04 16:20:00" },
  { ID: 5, 设置编号: "GX-SZ-005", 设置名称: "工信部与4A报警阈值设置", 对比方式: "全量对比", 对比频率: "每日", 启用状态: "启用", 更新时间: "2026-06-05 08:45:00" },
];
const cols = [
  { prop: "设置编号", label: "设置编号", type: "text", search: true },
  { prop: "设置名称", label: "设置名称", type: "text", search: true },
  { prop: "对比方式", label: "对比方式", type: "select", options: [{ value: "全量对比", label: "全量对比" }, { value: "增量对比", label: "增量对比" }], search: true },
  { prop: "对比频率", label: "对比频率", type: "select", options: [{ value: "每日", label: "每日" }, { value: "实时", label: "实时" }], search: true },
  { prop: "启用状态", label: "启用状态", type: "select", options: [{ value: "启用", label: "启用" }, { value: "停用", label: "停用" }], search: true },
  { prop: "更新时间", label: "更新时间", type: "text", width: 170 },
  { slot: "operate", label: "操作" },
];
const defaultRow = { 设置编号: "", 设置名称: "", 对比方式: "全量对比", 对比频率: "每日", 启用状态: "启用", 更新时间: "" };

export default {
  name: "4AYN_GongXinBuYu4AShuJuDuiBiSheZhiXinXiGuanLi",
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
    openEdit(row) {
      this.formMode = "edit";
      this.formTitle = "修改";
      this.formData = { ...row };
      this.formVisible = true;
    },
    openDetail(row) {
      this.detailTitle = "详情";
      this.detailFields = this.editableColumns.map((col) => ({
        label: col.label,
        value: row[col.prop] || "-",
      }));
      this.detailVisible = true;
    },
    submitForm() {
      if (this.formMode === "add") {
        const newRow = { ...this.formData, ID: this.nextId() };
        this.allTableData.unshift(newRow);
      } else {
        const index = this.allTableData.findIndex((item) => item.ID === this.formData.ID);
        if (index !== -1) {
          this.$set(this.allTableData, index, { ...this.formData });
        }
      }
      this.formVisible = false;
      this.fetchData();
      this.$message.success("操作成功");
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
