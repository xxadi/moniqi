<template>
  <div>
    <cs-searchpanel :searchConfig="searchConfig" :searchData="searchData" @handelSearch="search" @handelReset="reset" labelWidth="100px"></cs-searchpanel>
    <div class="mt10 crud-container">
      <div class="mb10 operate-container">
        <div class="function-actions">
          <el-button plain type="primary" icon="el-icon-edit-outline" @click='handleFunction("新增4A资产数据差异汇总报表信息", "add_summary")'>新增4A资产数据差异汇总报表信息</el-button>
          <el-button plain type="primary" icon="el-icon-edit" @click='handleFunction("修改4A资产数据差异汇总报表信息", "modify_summary")'>修改4A资产数据差异汇总报表信息</el-button>
          <el-button plain type="danger" icon="el-icon-delete" @click='handleFunction("删除4A资产数据差异汇总报表信息", "delete_summary")'>删除4A资产数据差异汇总报表信息</el-button>
          <el-button plain type="primary" icon="el-icon-view" @click='handleFunction("查询4A资产数据差异汇总报表详情", "query_summary")'>查询4A资产数据差异汇总报表详情</el-button>
          <el-button plain type="primary" icon="el-icon-download" @click='handleFunction("4A资产数据差异汇总报表导出", "export_summary")'>4A资产数据差异汇总报表导出</el-button>
          <el-button plain type="primary" icon="el-icon-upload2" @click='handleFunction("4A资产数据差异汇总报表导入", "import_summary")'>4A资产数据差异汇总报表导入</el-button>
          <el-button plain type="primary" icon="el-icon-monitor" @click='handleFunction("4A资产数据差异汇总报表监控", "monitor_summary")'>4A资产数据差异汇总报表监控</el-button>
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
          <el-select v-if="/状态|周期|格式/.test(col.prop)" v-model="formData[col.prop]" style="width:100%">
            <el-option v-if="/状态/.test(col.prop)" label="启用" value="启用"></el-option>
            <el-option v-if="/状态/.test(col.prop)" label="停用" value="停用"></el-option>
            <el-option v-if="/周期/.test(col.prop)" label="日报" value="日报"></el-option>
            <el-option v-if="/周期/.test(col.prop)" label="周报" value="周报"></el-option>
            <el-option v-if="/周期/.test(col.prop)" label="月报" value="月报"></el-option>
            <el-option v-if="/格式/.test(col.prop)" label="Excel" value="Excel"></el-option>
            <el-option v-if="/格式/.test(col.prop)" label="PDF" value="PDF"></el-option>
          </el-select>
          <el-input v-else v-model="formData[col.prop]" :disabled="formMode==='detail'"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="formVisible = false">取消</el-button>
        <el-button v-if="formMode!=='detail'" type="primary" @click="submitForm">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog title="导入汇总报表" :visible.sync="importVisible" width="560px" append-to-body>
      <el-form label-width="110px">
        <el-form-item label="导入文件">
          <el-upload action="#" :auto-upload="false" :limit="1" :file-list="importFileList" :on-change="handleImportFileChange" :on-remove="handleImportFileRemove">
            <el-button type="primary" icon="el-icon-upload2">选择文件</el-button>
            <span slot="tip" class="el-upload__tip">支持 xlsx/xls 文件</span>
          </el-upload>
        </el-form-item>
        <el-form-item label="导入进度">
          <el-progress :percentage="importProgress" :status="importProgress === 100 ? 'success' : undefined"></el-progress>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="importVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!importFileList.length" @click="confirmImport">开始导入</el-button>
      </span>
    </el-dialog>

    <el-dialog title="汇总报表监控" :visible.sync="monitorVisible" width="700px" append-to-body>
      <el-form label-width="120px" style="margin-bottom:16px;">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="监控状态">
              <el-tag type="success">运行中</el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最近生成">
              <span>{{ now() }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="生成周期">
              <span>日报</span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <el-table :data="monitorLogs" border size="mini" style="width:100%">
        <el-table-column prop="time" label="时间" width="160"></el-table-column>
        <el-table-column prop="type" label="类型" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.type === '成功' ? 'success' : scope.row.type === '失败' ? 'danger' : 'info'" size="mini">{{ scope.row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="消息"></el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="monitorVisible = false">关闭</el-button>
        <el-button type="primary" @click="monitorVisible = false; $message.success('监控已刷新')">刷新</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { filterData } from "@/utils/index";

const rows = [
  { ID: 1, 报表编号: "RPT-DIFF-001", 报表名称: "4A资产数据差异日报-20260601", 报表周期: "日报", 统计范围: "全量数据", 数据总量: 12580, 差异记录: 256, 处理完成率: "94.2%", 生成时间: "2026-06-01 08:00:00", 状态: "启用" },
  { ID: 2, 报表编号: "RPT-DIFF-002", 报表名称: "4A资产数据差异周报-第22周", 报表周期: "周报", 统计范围: "增量数据", 数据总量: 85620, 差异记录: 1280, 处理完成率: "92.8%", 生成时间: "2026-06-02 08:00:00", 状态: "启用" },
  { ID: 3, 报表编号: "RPT-DIFF-003", 报表名称: "4A资产数据差异月报-5月", 报表周期: "月报", 统计范围: "全量数据", 数据总量: 356800, 差异记录: 5120, 处理完成率: "96.5%", 生成时间: "2026-06-01 08:00:00", 状态: "启用" },
  { ID: 4, 报表编号: "RPT-DIFF-004", 报表名称: "4A资产数据差异日报-20260602", 报表周期: "日报", 统计范围: "异常数据", 数据总量: 320, 差异记录: 48, 处理完成率: "87.5%", 生成时间: "2026-06-02 08:00:00", 状态: "启用" },
  { ID: 5, 报表编号: "RPT-DIFF-005", 报表名称: "4A资产数据差异日报-20260603", 报表周期: "日报", 统计范围: "全量数据", 数据总量: 13250, 差异记录: 198, 处理完成率: "95.8%", 生成时间: "2026-06-03 08:00:00", 状态: "停用" },
];

const cols = [
  { prop: "报表编号", label: "报表编号", type: "text", search: true },
  { prop: "报表名称", label: "报表名称", type: "text", search: true },
  { prop: "报表周期", label: "报表周期", type: "select", options: [{ value: "日报", label: "日报" }, { value: "周报", label: "周报" }, { value: "月报", label: "月报" }], search: true },
  { prop: "统计范围", label: "统计范围", type: "text" },
  { prop: "数据总量", label: "数据总量", type: "text" },
  { prop: "差异记录", label: "差异记录", type: "text" },
  { prop: "处理完成率", label: "处理完成率", type: "text" },
  { prop: "生成时间", label: "生成时间", type: "text", width: 170 },
  { prop: "状态", label: "状态", type: "select", options: [{ value: "启用", label: "启用" }, { value: "停用", label: "停用" }], search: true },
  { slot: "operate", label: "操作" },
];

const defaultRow = { 报表编号: "", 报表名称: "", 报表周期: "日报", 统计范围: "全量数据", 数据总量: 0, 差异记录: 0, 处理完成率: "0%", 生成时间: "", 状态: "启用" };

export default {
  name: "4AYN_4AZiChanShuJuChaYiHuiZongBaoBiaoGuanLi",
  data() {
    return {
      searchData: {},
      searchConfig: [],
      allTableData: rows.map(r => ({ ...r })),
      tableData: [],
      selectedRows: [],
      tableColumns: cols,
      pageTotal: 0,
      pageOptions: { pageNum: 1, pageSize: 10 },
      formVisible: false,
      formMode: "add",
      formTitle: "新增",
      formData: { ...defaultRow },
      importVisible: false,
      importFileList: [],
      importProgress: 0,
      monitorVisible: false,
      monitorLogs: [],
    };
  },
  computed: {
    editableColumns() { return this.tableColumns.filter(c => c.prop && c.prop !== "ID"); },
  },
  created() { this.initConfig(); this.fetchData(); },
  methods: {
    initConfig() { this.searchConfig = this.tableColumns.map(i => i.type && i.search && { ...i, field: i.prop }).filter(Boolean); },
    fetchData() {
      const d = filterData(this.allTableData, this.searchData);
      const s = (this.pageOptions.pageNum - 1) * this.pageOptions.pageSize;
      this.tableData = d.slice(s, s + this.pageOptions.pageSize);
      this.pageTotal = d.length;
    },
    search() { this.pageOptions.pageNum = 1; this.fetchData(); },
    reset() { this.searchData = {}; this.search(); },
    now() {
      const pad = v => String(v).padStart(2, "0");
      const dt = new Date();
      return dt.getFullYear() + "-" + pad(dt.getMonth() + 1) + "-" + pad(dt.getDate()) + " " + pad(dt.getHours()) + ":" + pad(dt.getMinutes()) + ":" + pad(dt.getSeconds());
    },
    nextId() { return this.allTableData.reduce((max, item) => Math.max(max, Number(item.ID) || 0), 0) + 1; },
    handleSelectionChange(sel) { this.selectedRows = sel || []; },
    handleFunction(functionName, type) {
      if (type === "add_summary") {
        this.formMode = "add";
        this.formTitle = "新增汇总报表";
        this.formData = { ...defaultRow };
        this.formVisible = true;
      } else if (type === "modify_summary") {
        if (!this.selectedRows.length) { this.$message.warning("请先选择要修改的记录"); return; }
        this.formMode = "edit";
        this.formTitle = "修改汇总报表";
        this.formData = { ...this.selectedRows[0] };
        this.formVisible = true;
      } else if (type === "delete_summary") {
        if (!this.selectedRows.length) { this.$message.warning("请先选择要删除的记录"); return; }
        this.$confirm("确定要删除选中的 " + this.selectedRows.length + " 条记录吗？", "提示", { type: "warning" }).then(() => {
          const ids = new Set(this.selectedRows.map(r => r.ID));
          this.allTableData = this.allTableData.filter(i => !ids.has(i.ID));
          this.fetchData();
          this.$message.success("删除成功");
        }).catch(() => {});
      } else if (type === "query_summary") {
        if (!this.selectedRows.length) { this.$message.warning("请先选择要查看的记录"); return; }
        this.formMode = "detail";
        this.formTitle = "汇总报表详情";
        this.formData = { ...this.selectedRows[0] };
        this.formVisible = true;
      } else if (type === "export_summary") {
        const data = this.selectedRows.length ? this.selectedRows : this.tableData;
        this.$message.success("正在导出 " + data.length + " 条汇总报表数据...");
      } else if (type === "import_summary") {
        this.importFileList = [];
        this.importProgress = 0;
        this.importVisible = true;
      } else if (type === "monitor_summary") {
        this.monitorLogs = [
          { time: this.now(), type: "成功", message: "日报生成完成，共12580条数据" },
          { time: this.now(), type: "成功", message: "差异检测完成，发现256条差异" },
          { time: this.now(), type: "提示", message: "正在生成周报统计..." },
        ];
        this.monitorVisible = true;
      }
    },
    edit(row) {
      this.formMode = "edit";
      this.formTitle = "修改汇总报表";
      this.formData = { ...row };
      this.formVisible = true;
    },
    detail(row) {
      this.formMode = "detail";
      this.formTitle = "汇总报表详情";
      this.formData = { ...row };
      this.formVisible = true;
    },
    submitForm() {
      if (this.formMode === "add") {
        this.allTableData.unshift({ ...this.formData, ID: this.nextId(), 生成时间: this.now() });
      } else {
        const i = this.allTableData.findIndex(r => r.ID === this.formData.ID);
        if (i >= 0) this.$set(this.allTableData, i, { ...this.formData });
      }
      this.formVisible = false;
      this.fetchData();
      this.$message.success("操作成功");
    },
    deleteRow(row) {
      this.$confirm("确定删除该报表吗？", "提示", { type: "warning" }).then(() => {
        this.allTableData = this.allTableData.filter(i => i.ID !== row.ID);
        this.fetchData();
        this.$message.success("删除成功");
      }).catch(() => {});
    },
    handleImportFileChange(file) { this.importFileList = [file]; this.importProgress = 50; setTimeout(() => { this.importProgress = 100; }, 800); },
    handleImportFileRemove() { this.importFileList = []; this.importProgress = 0; },
    confirmImport() {
      for (let i = 0; i < 3; i++) {
        this.allTableData.unshift({
          ...defaultRow,
          ID: this.nextId(),
          报表编号: "RPT-IMP-" + String(Date.now() + i).slice(-6),
          报表名称: "导入报表-" + (i + 1),
          生成时间: this.now(),
        });
      }
      this.importVisible = false;
      this.fetchData();
      this.$message.success("导入成功，共导入3条数据");
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
</style>
