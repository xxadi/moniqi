<template>
  <div>
    <cs-searchpanel :searchConfig="searchConfig" :searchData="searchData" @handelSearch="search" @handelReset="reset" labelWidth="100px"></cs-searchpanel>
    <div class="mt10 crud-container">
      <div class="mb10 operate-container">
        <div>
          <el-button plain type="primary" icon="el-icon-plus" @click="add">新增指令下发接口防篡改信息</el-button>
          <el-button plain type="primary" icon="el-icon-edit" @click="editSelected">修改指令下发接口防篡改信息</el-button>
          <el-button plain type="danger" icon="el-icon-delete" @click="deleteSelected">删除指令下发接口防篡改信息</el-button>
          <el-button plain type="primary" icon="el-icon-upload2" @click="handleImport">导入</el-button>
          <el-button plain type="primary" icon="el-icon-download" @click="exportFile">导出</el-button>
        </div>
        <el-button type="text" icon="el-icon-back" @click="$router.back()">返回上级</el-button>
      </div>
      <cs-pagetable pageTableRef="pageTableRef" :showSelection="true" :tableData="tableData" :tableColumns="tableColumns" :pageTotal="pageTotal" :page.sync="pageOptions.pageNum" :limit.sync="pageOptions.pageSize" @handleSelectionChange="handleSelectionChange" @handleCurrentChange="fetchData" @handleSizeChange="fetchData">
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
            <el-option label="启用" value="启用"></el-option>
            <el-option label="停用" value="停用"></el-option>
          </el-select>
          <el-input v-else v-model="formData[col.prop]"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </span>
    </el-dialog>
    <el-dialog :title="importTitle" :visible.sync="importVisible" width="560px" append-to-body>
      <el-form label-width="110px">
        <el-form-item label="导入文件">
          <el-upload action="#" :auto-upload="false" :limit="1" :file-list="importFileList" :on-change="handleImportFileChange" :on-remove="handleImportFileRemove">
            <el-button type="primary" icon="el-icon-upload2">选择文件</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="importVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!importFileList.length" @click="confirmImport">开始导入</el-button>
      </span>
    </el-dialog>
  </div>
</template>
<script>
import { filterData, exportXLSX } from "@/utils/index";
const rows = [
  { ID: 1, 防篡改编号: "FC-001", 防篡改名称: "指令下发接口签名校验", 校验算法: "RSA签名", 数据范围: "全量下发", 启用状态: "启用", 更新时间: "2026-06-01 10:00:00" },
  { ID: 2, 防篡改编号: "FC-002", 防篡改名称: "指令下发数据摘要校验", 校验算法: "SHA-256", 数据范围: "关键字段", 启用状态: "启用", 更新时间: "2026-06-02 14:30:00" },
  { ID: 3, 防篡改编号: "FC-003", 防篡改名称: "指令下发时间戳校验", 校验算法: "时间戳", 数据范围: "全量下发", 启用状态: "停用", 更新时间: "2026-06-03 09:15:00" },
  { ID: 4, 防篡改编号: "FC-004", 防篡改名称: "指令下发数字水印校验", 校验算法: "数字水印", 数据范围: "敏感字段", 启用状态: "启用", 更新时间: "2026-06-04 16:20:00" },
  { ID: 5, 防篡改编号: "FC-005", 防篡改名称: "指令下发哈希链校验", 校验算法: "哈希链", 数据范围: "连续下发", 启用状态: "启用", 更新时间: "2026-06-05 08:45:00" },
];
const cols = [
  { prop: "防篡改编号", label: "防篡改编号", type: "text", search: true },
  { prop: "防篡改名称", label: "防篡改名称", type: "text", search: true },
  { prop: "校验算法", label: "校验算法", type: "text", search: true },
  { prop: "数据范围", label: "数据范围", type: "select", options: [{ value: "全量下发", label: "全量下发" }, { value: "关键字段", label: "关键字段" }, { value: "敏感字段", label: "敏感字段" }, { value: "连续下发", label: "连续下发" }] },
  { prop: "启用状态", label: "启用状态", type: "select", options: [{ value: "启用", label: "启用" }, { value: "停用", label: "停用" }], search: true },
  { prop: "更新时间", label: "更新时间", type: "text", width: 170 },
  { slot: "operate", label: "操作" },
];
const defaultRow = { 防篡改编号: "", 防篡改名称: "", 校验算法: "SHA-256", 数据范围: "全量下发", 启用状态: "启用", 更新时间: "" };
export default {
  name: "4AYN_ZhiLingXiaFaJieKouFangCuanGaiXinXiGuanLi",
  data() {
    return {
      searchData: {}, searchConfig: [], allTableData: rows.map(r => ({ ...r })), tableData: [], tableColumns: cols, selectedRows: [],
      pageTotal: 0, pageOptions: { pageNum: 1, pageSize: 10 },
      formVisible: false, formTitle: "新增", formData: { ...defaultRow }, formMode: "add",
      importVisible: false, importTitle: "导入", importFileList: [], importProgress: 0,
    };
  },
  computed: { editableColumns() { return this.tableColumns.filter(c => c.prop && c.prop !== "ID"); } },
  created() { this.initConfig(); this.fetchData(); },
  methods: {
    initConfig() { this.searchConfig = this.tableColumns.map(i => i.type && i.search && { ...i, field: i.prop }).filter(Boolean); },
    fetchData() { const d = filterData(this.allTableData, this.searchData); const s = (this.pageOptions.pageNum - 1) * this.pageOptions.pageSize; this.tableData = d.slice(s, s + this.pageOptions.pageSize); this.pageTotal = d.length; },
    search() { this.pageOptions.pageNum = 1; this.fetchData(); },
    reset() { this.searchData = {}; this.search(); },
    handleSelectionChange(selection) { this.selectedRows = selection || []; },
    editSelected() { if (!this.selectedRows.length) { this.$message.warning("请先选择要修改的记录"); return; } this.edit(this.selectedRows[0]); },
    deleteSelected() { if (!this.selectedRows.length) { this.$message.warning("请先选择要删除的记录"); return; } this.$confirm("确定删除选中的 " + this.selectedRows.length + " 条记录？", "提示", { type: "warning" }).then(() => { const ids = new Set(this.selectedRows.map(r => r.ID)); this.allTableData = this.allTableData.filter(i => !ids.has(i.ID)); this.fetchData(); this.$message.success("删除成功"); }).catch(() => {}); },
    add() { this.formMode = "add"; this.formTitle = "新增指令下发接口防篡改信息"; this.formData = { ...defaultRow }; this.formVisible = true; },
    edit(row) { this.formMode = "edit"; this.formTitle = "修改指令下发接口防篡改信息"; this.formData = { ...row }; this.formVisible = true; },
    detail(row) { this.formMode = "detail"; this.formTitle = "指令下发接口防篡改信息详情"; this.formData = { ...row }; this.formVisible = true; },
    submitForm() {
      if (this.formMode === "add") { this.allTableData.unshift({ ...this.formData, ID: Date.now() }); } else { const i = this.allTableData.findIndex(r => r.ID === this.formData.ID); if (i >= 0) this.$set(this.allTableData, i, { ...this.formData }); }
      this.formVisible = false; this.fetchData(); this.$message.success("操作成功");
    },
    deleteRow(row) { this.$confirm("确定删除？", "提示", { type: "warning" }).then(() => { this.allTableData = this.allTableData.filter(i => i.ID !== row.ID); this.fetchData(); this.$message.success("删除成功"); }).catch(() => {}); },
    handleImport() { this.importTitle = "导入"; this.importFileList = []; this.importProgress = 0; this.importVisible = true; },
    handleImportFileChange(f) { this.importFileList = [f]; this.importProgress = 50; setTimeout(() => { this.importProgress = 100; }, 800); },
    handleImportFileRemove() { this.importFileList = []; this.importProgress = 0; },
    confirmImport() { for (let i = 0; i < 3; i++) { const row = {}; this.editableColumns.forEach(c => { row[c.prop] = "导入-" + (i + 1); }); this.allTableData.unshift({ ...row, ID: Date.now() + i }); } this.importVisible = false; this.fetchData(); this.$message.success("导入成功"); },
    exportFile() { exportXLSX(this.allTableData, "指令下发接口防篡改信息"); },
  },
};
</script>
<style scoped>
.mt10 { margin-top: 10px; } .mb10 { margin-bottom: 10px; } .crud-container { background: #fff; padding: 16px; border-radius: 4px; } .operate-container { display: flex; justify-content: space-between; align-items: center; }
</style>
