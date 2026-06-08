<template>
  <div>
    <cs-searchpanel :searchConfig="searchConfig" :searchData="searchData" @handelSearch="search" @handelReset="reset" labelWidth="100px"></cs-searchpanel>
    <div class="mt10 crud-container">
      <div class="mb10 operate-container">
        <div class="function-actions">
          <el-button plain type="primary" icon="el-icon-edit-outline" @click='handleFunction("新增4A资产数据差异防篡改信息", "form")'>新增4A资产数据差异防篡改信息</el-button>
          <el-button plain type="primary" icon="el-icon-edit" @click='handleFunction("修改4A资产数据差异防篡改信息", "form")'>修改4A资产数据差异防篡改信息</el-button>
          <el-button plain type="danger" icon="el-icon-delete" @click='handleFunction("删除4A资产数据差异防篡改信息", "delete")'>删除4A资产数据差异防篡改信息</el-button>
        </div>
        <el-button type="text" icon="el-icon-back" @click="$router.back()">返回上级</el-button>
      </div>
      <cs-pagetable pageTableRef="pageTableRef" :tableData="tableData" :tableColumns="tableColumns" :pageTotal="pageTotal" :page.sync="pageOptions.pageNum" :limit.sync="pageOptions.pageSize" @handleCurrentChange="fetchData" @handleSizeChange="fetchData">
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
  { ID: 1, 防篡改编号: "CY-FC-001", 防篡改名称: "4A资产差异数据签名校验", 校验算法: "RSA签名", 数据范围: "全量差异", 启用状态: "启用", 更新时间: "2026-06-01 10:00:00" },
  { ID: 2, 防篡改编号: "CY-FC-002", 防篡改名称: "4A资产差异数据摘要校验", 校验算法: "SHA-256", 数据范围: "增量差异", 启用状态: "启用", 更新时间: "2026-06-02 14:30:00" },
  { ID: 3, 防篡改编号: "CY-FC-003", 防篡改名称: "4A资产差异数据时间戳校验", 校验算法: "时间戳", 数据范围: "关键字段", 启用状态: "停用", 更新时间: "2026-06-03 09:15:00" },
  { ID: 4, 防篡改编号: "CY-FC-004", 防篡改名称: "4A资产差异数据水印校验", 校验算法: "数字水印", 数据范围: "全量差异", 启用状态: "启用", 更新时间: "2026-06-04 16:20:00" },
  { ID: 5, 防篡改编号: "CY-FC-005", 防篡改名称: "4A资产差异数据哈希校验", 校验算法: "哈希链", 数据范围: "连续差异", 启用状态: "启用", 更新时间: "2026-06-05 08:45:00" },
];
const cols = [
  { prop: "防篡改编号", label: "防篡改编号", type: "text", search: true },
  { prop: "防篡改名称", label: "防篡改名称", type: "text", search: true },
  { prop: "校验算法", label: "校验算法", type: "text", search: true },
  { prop: "数据范围", label: "数据范围", type: "text" },
  { prop: "启用状态", label: "启用状态", type: "select", options: [{ value: "启用", label: "启用" }, { value: "停用", label: "停用" }], search: true },
  { prop: "更新时间", label: "更新时间", type: "text", width: 170 },
  { slot: "operate", label: "操作" },
];
const defaultRow = { 防篡改编号: "", 防篡改名称: "", 校验算法: "SHA-256", 数据范围: "", 启用状态: "启用", 更新时间: "" };

export default {
  name: "4AYN_4AZiChanShuJuChaYiFangCuanGaiXinXiGuanLi",
  data() {
    return {
      searchData: {}, searchConfig: [],
      allTableData: rows.map(r => ({ ...r })), tableData: [], tableColumns: cols,
      pageTotal: 0, pageOptions: { pageNum: 1, pageSize: 10 },
      activeFunction: "",
      formVisible: false, formTitle: "", formData: { ...defaultRow }, formMode: "add",
      detailVisible: false, detailTitle: "", detailFields: [],
    };
  },
  computed: {
    editableColumns() { return this.tableColumns.filter(c => c.prop && c.prop !== "ID"); },
  },
  created() { this.initConfig(); this.fetchData(); },
  methods: {
    initConfig() { this.searchConfig = this.tableColumns.map(i => i.type && i.search && { ...i, field: i.prop }).filter(Boolean); },
    fetchData() { const d = filterData(this.allTableData, this.searchData); const s = (this.pageOptions.pageNum - 1) * this.pageOptions.pageSize; this.tableData = d.slice(s, s + this.pageOptions.pageSize); this.pageTotal = d.length; },
    search() { this.pageOptions.pageNum = 1; this.fetchData(); },
    reset() { this.searchData = {}; this.search(); },
    now() {
      const pad = (v) => String(v).padStart(2, "0");
      const dt = new Date();
      return dt.getFullYear() + "-" + pad(dt.getMonth() + 1) + "-" + pad(dt.getDate()) + " " + pad(dt.getHours()) + ":" + pad(dt.getMinutes()) + ":" + pad(dt.getSeconds());
    },
    nextId() { return this.allTableData.reduce((max, item) => Math.max(max, Number(item.ID) || 0), 0) + 1; },
    handleSelectionChange() {},
    handleFunction(name, extraType) {
      this.activeFunction = name;
      if (extraType === "delete") {
        this.$confirm("确定要执行【" + name + "】吗？", "提示", { type: "warning" }).then(() => {
          const target = this.allTableData[0];
          this.allTableData = this.allTableData.filter(i => i.ID !== target.ID);
          this.fetchData();
          this.$message.success("删除成功");
        }).catch(() => {});
      } else {
        this.formMode = /新增/.test(name) ? "add" : "edit";
        this.formTitle = name;
        this.formData = this.formMode === "add" ? { ...defaultRow } : { ...(this.tableData[0] || defaultRow) };
        this.formVisible = true;
      }
    },
    detail(row) {
      this.detailTitle = "详情";
      this.detailFields = this.tableColumns.filter(c => c.prop).map(c => ({ label: c.label, value: row[c.prop] }));
      this.detailVisible = true;
    },
    edit(row) {
      this.formMode = "edit";
      this.formTitle = "修改";
      this.formData = { ...row };
      this.formVisible = true;
    },
    submitForm() {
      if (this.formMode === "add") {
        this.allTableData.unshift({ ...this.formData, ID: this.nextId() });
      } else {
        const i = this.allTableData.findIndex(r => r.ID === this.formData.ID);
        if (i >= 0) this.$set(this.allTableData, i, { ...this.formData });
      }
      this.formVisible = false;
      this.fetchData();
      this.$message.success(this.formMode === "add" ? "新增成功" : "修改成功");
    },
    deleteRow(row) {
      this.$confirm("确定删除？", "提示", { type: "warning" }).then(() => {
        this.allTableData = this.allTableData.filter(i => i.ID !== row.ID);
        this.fetchData();
        this.$message.success("删除成功");
      }).catch(() => {});
    },
  },
};
</script>

<style scoped>
.function-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.mt10 { margin-top: 10px; } .mb10 { margin-bottom: 10px; } .crud-container { background: #fff; padding: 16px; border-radius: 4px; } .operate-container { display: flex; justify-content: space-between; align-items: center; }
.detail-form .el-form-item { margin-bottom: 8px; }
</style>
