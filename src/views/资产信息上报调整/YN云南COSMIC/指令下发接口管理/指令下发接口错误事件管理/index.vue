<template>
  <div>
    <cs-searchpanel :searchConfig="searchConfig" :searchData="searchData" @handelSearch="search" @handelReset="reset" labelWidth="100px"></cs-searchpanel>
    <div class="mt10 crud-container">
      <div class="mb10 operate-container">
        <div>
          <el-button plain type="primary" icon="el-icon-plus" @click="add">新增指令下发接口错误事件</el-button>
          <el-button plain type="primary" icon="el-icon-view" @click="queryNotification">指令下发接口错误事件通知查询</el-button>
          <el-button plain type="danger" icon="el-icon-delete" @click="deleteSelected">指令下发接口错误事件通知删除</el-button>
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
          <el-select v-if="/状态|级别/.test(col.prop)" v-model="formData[col.prop]" style="width:100%">
            <el-option v-if="/级别/.test(col.prop)" label="紧急" value="紧急"></el-option>
            <el-option v-if="/级别/.test(col.prop)" label="重要" value="重要"></el-option>
            <el-option v-if="/级别/.test(col.prop)" label="一般" value="一般"></el-option>
            <el-option v-if="/状态/.test(col.prop)" label="待处理" value="待处理"></el-option>
            <el-option v-if="/状态/.test(col.prop)" label="处理中" value="处理中"></el-option>
            <el-option v-if="/状态/.test(col.prop)" label="已处理" value="已处理"></el-option>
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
    <el-dialog :title="queryTitle" :visible.sync="queryVisible" width="660px" append-to-body>
      <el-table :data="queryResults" border size="mini" style="width:100%">
        <el-table-column prop="序号" label="序号" width="60" align="center"></el-table-column>
        <el-table-column prop="错误编号" label="错误编号"></el-table-column>
        <el-table-column prop="错误名称" label="错误名称"></el-table-column>
        <el-table-column prop="通知状态" label="通知状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.通知状态 === '已通知' ? 'success' : scope.row.通知状态 === '待通知' ? 'warning' : 'info'" size="mini">{{ scope.row.通知状态 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="通知时间" label="通知时间" width="160"></el-table-column>
      </el-table>
      <span slot="footer">
        <el-button type="primary" @click="queryVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>
<script>
import { filterData, exportXLSX } from "@/utils/index";
const rows = [
  { ID: 1, 错误编号: "ERR-001", 错误名称: "指令下发接口连接超时", 错误类型: "网络错误", 错误级别: "紧急", 通知状态: "已通知", 发生时间: "2026-06-01 10:00:00" },
  { ID: 2, 错误编号: "ERR-002", 错误名称: "指令下发接口返回异常", 错误类型: "业务错误", 错误级别: "重要", 通知状态: "已通知", 发生时间: "2026-06-02 14:30:00" },
  { ID: 3, 错误编号: "ERR-003", 错误名称: "指令下发接口参数校验失败", 错误类型: "参数错误", 错误级别: "一般", 通知状态: "待通知", 发生时间: "2026-06-03 09:15:00" },
  { ID: 4, 错误编号: "ERR-004", 错误名称: "指令下发接口鉴权失败", 错误类型: "安全错误", 错误级别: "紧急", 通知状态: "已通知", 发生时间: "2026-06-04 16:20:00" },
  { ID: 5, 错误编号: "ERR-005", 错误名称: "指令下发接口响应超时", 错误类型: "网络错误", 错误级别: "重要", 通知状态: "处理中", 发生时间: "2026-06-05 08:45:00" },
  { ID: 6, 错误编号: "ERR-006", 错误名称: "指令下发接口数据格式错误", 错误类型: "数据错误", 错误级别: "一般", 通知状态: "待通知", 发生时间: "2026-06-06 11:30:00" },
];
const cols = [
  { prop: "错误编号", label: "错误编号", type: "text", search: true },
  { prop: "错误名称", label: "错误名称", type: "text", search: true },
  { prop: "错误类型", label: "错误类型", type: "select", options: [{ value: "网络错误", label: "网络错误" }, { value: "业务错误", label: "业务错误" }, { value: "参数错误", label: "参数错误" }, { value: "安全错误", label: "安全错误" }, { value: "数据错误", label: "数据错误" }], search: true },
  { prop: "错误级别", label: "错误级别", type: "select", options: [{ value: "紧急", label: "紧急" }, { value: "重要", label: "重要" }, { value: "一般", label: "一般" }], search: true },
  { prop: "通知状态", label: "通知状态", type: "select", options: [{ value: "已通知", label: "已通知" }, { value: "待通知", label: "待通知" }, { value: "处理中", label: "处理中" }], search: true },
  { prop: "发生时间", label: "发生时间", type: "text", width: 170 },
  { slot: "operate", label: "操作" },
];
const defaultRow = { 错误编号: "", 错误名称: "", 错误类型: "网络错误", 错误级别: "一般", 通知状态: "待通知", 发生时间: "" };
export default {
  name: "4AYN_ZhiLingXiaFaJieKouCuoWuShiJianGuanLi",
  data() {
    return {
      searchData: {}, searchConfig: [], allTableData: rows.map(r => ({ ...r })), tableData: [], tableColumns: cols, selectedRows: [],
      pageTotal: 0, pageOptions: { pageNum: 1, pageSize: 10 },
      queryVisible: false, queryTitle: "", queryResults: [],
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
    deleteSelected() { if (!this.selectedRows.length) { this.$message.warning("请先选择要删除的记录"); return; } this.$confirm("确定删除选中的 " + this.selectedRows.length + " 条记录？", "提示", { type: "warning" }).then(() => { const ids = new Set(this.selectedRows.map(r => r.ID)); this.allTableData = this.allTableData.filter(i => !ids.has(i.ID)); this.fetchData(); this.$message.success("删除成功"); }).catch(() => {}); },
    queryNotification() { this.queryTitle = "指令下发接口错误事件通知查询"; this.queryResults = this.allTableData.slice(0, 5).map((r, i) => ({ 序号: i + 1, 错误编号: r.错误编号, 错误名称: r.错误名称, 通知状态: r.通知状态, 通知时间: r.发生时间 })); this.queryVisible = true; },
    add() { this.formMode = "add"; this.formTitle = "新增指令下发接口错误事件"; this.formData = { ...defaultRow }; this.formVisible = true; },
    edit(row) { this.formMode = "edit"; this.formTitle = "修改指令下发接口错误事件"; this.formData = { ...row }; this.formVisible = true; },
    detail(row) { this.formMode = "detail"; this.formTitle = "指令下发接口错误事件详情"; this.formData = { ...row }; this.formVisible = true; },
    submitForm() {
      if (this.formMode === "add") { this.allTableData.unshift({ ...this.formData, ID: Date.now() }); } else { const i = this.allTableData.findIndex(r => r.ID === this.formData.ID); if (i >= 0) this.$set(this.allTableData, i, { ...this.formData }); }
      this.formVisible = false; this.fetchData(); this.$message.success("操作成功");
    },
    deleteRow(row) { this.$confirm("确定删除？", "提示", { type: "warning" }).then(() => { this.allTableData = this.allTableData.filter(i => i.ID !== row.ID); this.fetchData(); this.$message.success("删除成功"); }).catch(() => {}); },
    handleImport() { this.importTitle = "导入"; this.importFileList = []; this.importProgress = 0; this.importVisible = true; },
    handleImportFileChange(f) { this.importFileList = [f]; this.importProgress = 50; setTimeout(() => { this.importProgress = 100; }, 800); },
    handleImportFileRemove() { this.importFileList = []; this.importProgress = 0; },
    confirmImport() { for (let i = 0; i < 3; i++) { const row = {}; this.editableColumns.forEach(c => { row[c.prop] = "导入-" + (i + 1); }); this.allTableData.unshift({ ...row, ID: Date.now() + i }); } this.importVisible = false; this.fetchData(); this.$message.success("导入成功"); },
    exportFile() { exportXLSX(this.allTableData, "指令下发接口错误事件"); },
  },
};
</script>
<style scoped>
.mt10 { margin-top: 10px; } .mb10 { margin-bottom: 10px; } .crud-container { background: #fff; padding: 16px; border-radius: 4px; } .operate-container { display: flex; justify-content: space-between; align-items: center; }
</style>
