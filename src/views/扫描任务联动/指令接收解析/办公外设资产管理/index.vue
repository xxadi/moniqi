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
          <el-button plain type="primary" icon="el-icon-plus" @click='handleFunction("新增办公外设资产信息", "add")'>新增办公外设资产信息</el-button>
          <el-button plain type="primary" icon="el-icon-edit" @click='handleFunction("修改办公外设资产信息", "edit")'>修改办公外设资产信息</el-button>
          <el-button plain type="primary" icon="el-icon-delete" @click='handleFunction("删除办公外设资产信息", "delete")'>删除办公外设资产信息</el-button>
          <el-button plain type="primary" icon="el-icon-view" @click='handleFunction("查询办公外设资产", "detail")'>查询办公外设资产</el-button>
          <el-button plain type="primary" icon="el-icon-data-analysis" @click='handleFunction("办公外设资产统计", "analysis")'>办公外设资产统计</el-button>
          <el-button plain type="primary" icon="el-icon-download" @click='handleFunction("办公外设资产信息下载", "export")'>办公外设资产信息下载</el-button>
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
          </template>
        </el-table-column>
      </cs-pagetable>
    </div>

    <el-dialog :title="formTitle" :visible.sync="formVisible" width="620px" append-to-body>
      <el-form :model="formData" label-width="130px">
        <el-form-item v-for="col in editableColumns" :key="col.prop" :label="col.label">
          <el-select v-if="isStatusField(col.prop)" v-model="formData[col.prop]" style="width: 100%">
            <el-option label="待处理" value="待处理"></el-option>
            <el-option label="执行中" value="执行中"></el-option>
            <el-option label="已完成" value="已完成"></el-option>
            <el-option label="已同步" value="已同步"></el-option>
            <el-option label="异常" value="异常"></el-option>
          </el-select>
          <el-input-number v-else-if="isNumberField(col.prop)" v-model="formData[col.prop]" :min="0" controls-position="right" style="width: 100%"></el-input-number>
          <el-input v-else-if="isLongField(col.prop)" v-model="formData[col.prop]" type="textarea" :rows="3"></el-input>
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

    <el-dialog :title="analysisTitle" :visible.sync="analysisVisible" width="720px" append-to-body>
      <div class="analysis-panel">
        <div v-for="item in analysisMetrics" :key="item.label" class="metric-card">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
      <div class="bar-list">
        <div v-for="item in chartData" :key="item.name" class="bar-row">
          <span>{{ item.name }}</span>
          <div class="bar-track">
            <div class="bar-value" :style="{ width: item.value + '%' }"></div>
          </div>
          <em>{{ item.value }}%</em>
        </div>
      </div>
    </el-dialog>

    <el-dialog :title="deleteConfirmTitle" :visible.sync="deleteConfirmVisible" width="640px" append-to-body>
      <el-table :data="deleteCandidates" border size="small">
        <el-table-column prop="名称" label="名称" show-overflow-tooltip></el-table-column>
        <el-table-column prop="类型" label="类型" width="140"></el-table-column>
        <el-table-column prop="状态" label="状态" width="110"></el-table-column>
        <el-table-column prop="更新时间" label="更新时间" width="170"></el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="deleteConfirmVisible = false">取消</el-button>
        <el-button type="danger" icon="el-icon-delete" @click="confirmNamedDelete">删除</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="secondaryActionTitle" :visible.sync="secondaryActionVisible" width="680px" append-to-body>
      <el-table :data="secondaryActionRows" border size="small">
        <el-table-column prop="name" label="对象名称" show-overflow-tooltip></el-table-column>
        <el-table-column prop="code" label="业务编号" width="160"></el-table-column>
        <el-table-column prop="type" label="类型" width="130"></el-table-column>
        <el-table-column prop="status" label="状态" width="110"></el-table-column>
        <el-table-column prop="remark" label="说明" show-overflow-tooltip></el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="secondaryActionVisible = false">取消</el-button>
        <el-button :type="secondaryActionType === 'delete' ? 'danger' : 'primary'" @click="confirmSecondaryAction">{{ secondaryActionConfirmText }}</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="importTitle" :visible.sync="importVisible" width="560px" append-to-body>
      <el-form label-width="110px">
        <el-form-item label="导入文件">
          <el-upload
            action="#"
            :auto-upload="false"
            :limit="1"
            :file-list="importFileList"
            :on-change="handleImportFileChange"
            :on-remove="handleImportFileRemove"
          >
            <el-button type="primary" icon="el-icon-upload2">选择文件</el-button>
            <span slot="tip" class="el-upload__tip">支持 xlsx/xls 文件，系统会解析当前功能过程对应的数据模板</span>
          </el-upload>
        </el-form-item>
        <el-form-item label="解析进度">
          <el-progress :percentage="importProgress" :status="importProgress === 100 ? 'success' : undefined"></el-progress>
        </el-form-item>
        <el-form-item label="导入说明">
          <el-input v-model="importRemark" type="textarea" :rows="3"></el-input>
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
import { exportXLSX, filterData } from "@/utils/index";

const initialRows = [
  {
    "ID": 1,
    "资产编号": "ASSET-110376-100-5418",
    "资产名称": "区公司办公外设资产管理-资产纳管-01-110376",
    "资产类型": "资产资源-自动化-110",
    "所属区域": "-资产资源-办公外设资产管理-资产纳管-110376-001",
    "纳管状态": "待处理-376",
    "最近同步": "2026-05-14 17:22:30"
  },
  {
    "ID": 2,
    "资产编号": "ASSET-110376-101-7701",
    "资产名称": "办公外设资产管理-资产纳管-02-110376",
    "资产类型": "资产资源-复核-110",
    "所属区域": "-资产资源-办公外设资产管理-自动采集-110376-002",
    "纳管状态": "异常-376",
    "最近同步": "2026-05-15 16:22:03"
  },
  {
    "ID": 3,
    "资产编号": "ASSET-110376-102-6804",
    "资产名称": "办公外设资产管理-自动采集-03-110376",
    "资产类型": "资产资源-省侧-110",
    "所属区域": "-资产资源-办公外设资产管理-自动采集-110376-003",
    "纳管状态": "已完成-376",
    "最近同步": "2026-05-08 12:38:45"
  },
  {
    "ID": 4,
    "资产编号": "ASSET-110376-103-9163",
    "资产名称": "办公外设资产管理-扩容核查-04-110376",
    "资产类型": "资产资源-省侧-110",
    "所属区域": "-资产资源-办公外设资产管理-资产纳管-110376-004",
    "纳管状态": "待处理-376",
    "最近同步": "2026-05-14 08:33:22"
  },
  {
    "ID": 5,
    "资产编号": "ASSET-110376-104-3253",
    "资产名称": "办公外设资产管理-扩容核查-05-110376",
    "资产类型": "资产资源-核心-110",
    "所属区域": "-资产资源-办公外设资产管理-异常复核-110376-005",
    "纳管状态": "待复核-376",
    "最近同步": "2026-05-14 14:39:20"
  },
  {
    "ID": 6,
    "资产编号": "ASSET-110376-105-5820",
    "资产名称": "办公外设资产管理-自动采集-06-110376",
    "资产类型": "资产资源-部侧-110",
    "所属区域": "-资产资源-办公外设资产管理-异常复核-110376-006",
    "纳管状态": "异常-376",
    "最近同步": "2026-05-25 10:05:40"
  },
  {
    "ID": 7,
    "资产编号": "ASSET-110376-106-3419",
    "资产名称": "办公外设资产管理-部侧联动-07-110376",
    "资产类型": "资产资源-省侧-110",
    "所属区域": "区公司-资产资源-办公外设资产管理-部侧联动-110376-007",
    "纳管状态": "异常-376",
    "最近同步": "2026-05-08 13:54:55"
  },
  {
    "ID": 8,
    "资产编号": "ASSET-110376-107-8302",
    "资产名称": "办公外设资产管理-部侧联动-08-110376",
    "资产类型": "资产资源-复核-110",
    "所属区域": "区公司-资产资源-办公外设资产管理-资产纳管-110376-008",
    "纳管状态": "待复核-376",
    "最近同步": "2026-05-15 10:54:50"
  },
  {
    "ID": 9,
    "资产编号": "ASSET-110376-108-1581",
    "资产名称": "办公外设资产管理-异常复核-09-110376",
    "资产类型": "资产资源-边界-110",
    "所属区域": "区公司-资产资源-办公外设资产管理-资产纳管-110376-009",
    "纳管状态": "待复核-376",
    "最近同步": "2026-05-16 16:19:04"
  },
  {
    "ID": 10,
    "资产编号": "ASSET-110376-109-8423",
    "资产名称": "办公外设资产管理-自动采集-10-110376",
    "资产类型": "资产资源-复核-110",
    "所属区域": "区公司-资产资源-办公外设资产管理-异常复核-110376-010",
    "纳管状态": "异常-376",
    "最近同步": "2026-05-18 10:17:27"
  }
];
const tableColumns = [
  {
    "prop": "ID",
    "label": "ID",
    "type": "text",
    "width": 80
  },
  {
    "prop": "资产编号",
    "label": "资产编号",
    "type": "text",
    "search": true,
    "showTooltip": true
  },
  {
    "prop": "资产名称",
    "label": "资产名称",
    "type": "text",
    "search": true,
    "showTooltip": true
  },
  {
    "prop": "资产类型",
    "label": "资产类型",
    "type": "text",
    "search": true,
    "showTooltip": true
  },
  {
    "prop": "所属区域",
    "label": "所属区域",
    "type": "text",
    "search": false,
    "showTooltip": true
  },
  {
    "prop": "纳管状态",
    "label": "纳管状态",
    "type": "text",
    "search": false,
    "showTooltip": true
  },
  {
    "prop": "最近同步",
    "label": "最近同步",
    "type": "text",
    "search": false,
    "showTooltip": true
  },
  {
    "slot": "operate",
    "label": "操作"
  }
];
const defaultRow = {
  "ID": "",
  "资产编号": "",
  "资产名称": "",
  "资产类型": "",
  "所属区域": "",
  "纳管状态": "待处理",
  "最近同步": ""
};
const importTemplateRow = {
  "资产编号": "GX-ASSET-2026050808",
  "资产名称": "资源池-web-01",
  "资产类型": "组件库",
  "所属区域": "",
  "纳管状态": "已纳管",
  "ID": ""
};

const actionOrdinalMap = {
  "新增办公外设资产信息": {
    "actionType": "add",
    "order": 1
  },
  "修改办公外设资产信息": {
    "actionType": "edit",
    "order": 1
  },
  "删除办公外设资产信息": {
    "actionType": "delete",
    "order": 1
  }
};

export default {
  name: "GuangxiFunctionProcessPage",
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
      formVisible: false,
      formMode: "add",
      formTitle: "新增",
      formData: { ...defaultRow },
      detailVisible: false,
      detailTitle: "详情",
      detailFields: [],
      analysisVisible: false,
      analysisTitle: "分析",
      analysisMetrics: [
        { label: "处理总量", value: 0 },
        { label: "成功数量", value: 0 },
        { label: "成功率", value: "0%" },
      ],
      analysisBars: [],
      importVisible: false,
      importTitle: "导入",
      importFunctionName: "",
      importFileList: [],
      importProgress: 0,
      importRemark: "请选择本地Excel文件，系统将解析并导入符合当前功能过程模板的数据。",
      secondaryActionVisible: false,
      secondaryActionTitle: "操作确认",
      secondaryActionType: "",
      secondaryActionConfirmText: "确定",
      secondaryActionRows: [],
      deleteConfirmVisible: false,
      deleteConfirmTitle: "删除确认",
      deleteCandidates: [],
    };
  },
  computed: {
    editableColumns() {
      return this.tableColumns.filter((item) => item.prop && item.prop !== "ID");
    },
    chartData() {
      return this.analysisBars.length
        ? this.analysisBars
        : [
            { name: "受理", value: 78 },
            { name: "执行", value: 66 },
            { name: "完成", value: 92 },
          ];
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
      const data = filterData(this.allTableData, this.searchData);
      const start = (this.pageOptions.pageNum - 1) * this.pageOptions.pageSize;
      this.tableData = data.slice(start, start + this.pageOptions.pageSize);
      this.pageTotal = data.length;
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
    nextId() {
      return this.allTableData.reduce((max, item) => Math.max(max, Number(item.ID) || 0), 0) + 1;
    },
    getPrimaryNameField() {
      return this.editableColumns.find((item) => /名称/.test(item.prop)) || this.editableColumns[0];
    },
    getStatusField() {
      return this.editableColumns.find((item) => /状态|结果|级别/.test(item.prop));
    },
    isStatusField(prop) {
      return /状态|结果|级别/.test(prop);
    },
    isNumberField(prop) {
      return /数量|次数/.test(prop);
    },
    isLongField(prop) {
      return /摘要|日志|说明|原因|范围|地址|对象/.test(prop);
    },
    handleSelectionChange(selection) {
      this.selectedRows = selection || [];
    },
    handleFunction(functionName, actionType = "operation") {
      if (["add", "edit", "delete"].includes(actionType) && !this.isPrimaryAction(functionName, actionType)) {
        this.openSecondaryAction(functionName, actionType);
        return;
      }
      if (actionType === "add") return this.openAdd(functionName);
      if (actionType === "edit") return this.openSelectedEdit(functionName);
      if (actionType === "delete") return this.deleteSelected();
      if (actionType === "import") return this.openImport(functionName);
      if (actionType === "export") return this.exportRows(functionName);
      if (actionType === "detail") return this.openBusinessDetail(functionName);
      if (actionType === "analysis") return this.openBusinessAnalysis(functionName);
      return this.openOperation(functionName);
    },
    openAdd(functionName) {
      this.formMode = "add";
      this.formTitle = functionName || "新增";
      const row = { ...defaultRow };
      const primary = this.getPrimaryNameField();
      const status = this.getStatusField();
      if (primary) row[primary.prop] = functionName;
      if (status) row[status.prop] = "待处理";
      this.formData = row;
      this.formVisible = true;
    },
    openEdit(row) {
      this.formMode = "edit";
      this.formTitle = "修改";
      this.formData = { ...row };
      this.formVisible = true;
    },
    openSelectedEdit(functionName) {
      if (this.selectedRows.length !== 1) {
        this.$message.warning("请先勾选一条需要修改的数据");
        return;
      }
      this.formMode = "edit";
      this.formTitle = functionName || "修改";
      this.formData = { ...this.selectedRows[0] };
      this.formVisible = true;
    },
    openOperation(functionName) {
      this.formMode = "operation";
      this.formTitle = functionName;
      const row = { ...(this.selectedRows[0] || this.allTableData[0] || defaultRow) };
      const status = this.getStatusField();
      if (status) row[status.prop] = /同步|上传|上报|纳管|采集/.test(functionName) ? "已同步" : "已完成";
      this.formData = row;
      this.formVisible = true;
    },
    submitForm() {
      const primary = this.getPrimaryNameField();
      if (primary && !this.formData[primary.prop]) {
        this.$message.warning("请填写" + primary.label);
        return;
      }
      if (this.formMode === "add") {
        this.allTableData.unshift({ ...this.formData, ID: this.nextId() });
      } else {
        const index = this.allTableData.findIndex((item) => item.ID === this.formData.ID);
        if (index > -1) this.$set(this.allTableData, index, { ...this.formData });
        else this.allTableData.unshift({ ...this.formData, ID: this.nextId() });
      }
      this.formVisible = false;
      this.pageOptions.pageNum = 1;
      this.fetchData();
      this.$message.success(this.formMode === "add" ? "新增成功" : "修改成功");
    },
    handleDeleteFunction(functionName) {
      if (/数据删除|删除数据|列表删除|批量删除|删除.*列表/.test(functionName)) {
        this.deleteSelected();
        return;
      }
      this.openNamedDelete(functionName);
    },
    openNamedDelete(functionName) {
      this.deleteConfirmTitle = functionName || "删除确认";
      const code = this.buildBusinessCode ? this.buildBusinessCode(functionName || "DELETE") : String(Date.now()).slice(-8);
      this.deleteCandidates = [
        { 名称: functionName + "对象一", 类型: "规则配置", 状态: "待删除", 更新时间: "2026-05-08 09:30:00" },
        { 名称: functionName + "对象二", 类型: "接口参数", 状态: "待确认", 更新时间: "2026-05-08 10:15:00" },
        { 名称: functionName + "-" + code.slice(0, 4), 类型: "业务记录", 状态: "可删除", 更新时间: "2026-05-08 11:05:00" },
      ];
      this.deleteConfirmVisible = true;
    },
    confirmNamedDelete() {
      this.deleteConfirmVisible = false;
      this.deleteCandidates = [];
      this.$message.success("删除成功");
    },
    deleteSelected() {
      if (!this.selectedRows.length) {
        this.$message.warning("请先勾选需要删除的数据");
        return;
      }
      const ids = this.selectedRows.map((item) => item.ID);
      this.$confirm("确定删除已勾选的 " + ids.length + " 条数据吗？", "删除确认", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        this.allTableData = this.allTableData.filter((item) => !ids.includes(item.ID));
        this.fetchData();
        this.$message.success("删除成功");
      });
    },
    openImport(functionName) {
      this.importTitle = functionName || "导入";
      this.importFunctionName = functionName;
      this.importFileList = [];
      this.importProgress = 0;
      this.importRemark = "请选择本地Excel文件，系统将解析并导入符合当前功能过程模板的数据。";
      this.importVisible = true;
    },
    handleImportFileChange(file, fileList) {
      this.importFileList = fileList.slice(-1);
      this.importProgress = 35;
      this.importRemark = "已选择文件：" + file.name + "，等待开始解析。";
    },
    handleImportFileRemove(file, fileList) {
      this.importFileList = fileList;
      this.importProgress = 0;
      this.importRemark = "请选择本地Excel文件，系统将解析并导入符合当前功能过程模板的数据。";
    },
    confirmImport() {
      this.importProgress = 100;
      const row = { ...importTemplateRow, ID: this.nextId() };
      const primary = this.getPrimaryNameField();
      const status = this.getStatusField();
      if (primary && /名称/.test(primary.prop)) row[primary.prop] = this.importFunctionName + "导入记录";
      if (status) row[status.prop] = "已完成";
      this.allTableData.unshift(row);
      this.importVisible = false;
      this.pageOptions.pageNum = 1;
      this.fetchData();
      this.$message.success("文件解析完成，已写入1条有效记录");
    },
    exportRows(functionName) {
      exportXLSX(this.buildExportRows(functionName), functionName || "办公外设资产管理导出");
      this.$message.success("导出成功");
    },
    buildExportRows(functionName) {
      if (/数据|列表|信息|全量/.test(functionName)) return this.allTableData;
      if (/执行状态|日志|监控/.test(functionName)) {
        return [
          { 名称: functionName, 状态: "执行成功", 日志: "功能过程执行完成，结果已归档" },
          { 名称: "办公外设资产管理调度任务", 状态: "执行中", 日志: "等待节点返回执行结果" },
          { 名称: "办公外设资产管理异常检查", 状态: "已告警", 日志: "发现超时记录，已进入重试队列" },
        ];
      }
      if (/统计|分析|报表|报告/.test(functionName)) {
        return [
          { 指标名称: "处理总量", 指标值: 238, 统计周期: "今日", 说明: functionName },
          { 指标名称: "成功数量", 指标值: 221, 统计周期: "今日", 说明: "成功完成业务处理" },
          { 指标名称: "异常数量", 指标值: 17, 统计周期: "今日", 说明: "需要人工复核" },
        ];
      }
      return [
        { 业务名称: functionName, 业务状态: "正常", 处理时间: "2026-05-08 10:00:00", 说明: "按功能过程生成的导出数据" },
        { 业务名称: "办公外设资产管理业务记录", 业务状态: "已处理", 处理时间: "2026-05-08 10:05:00", 说明: "模拟业务记录" },
        { 业务名称: "办公外设资产管理复核记录", 业务状态: "待复核", 处理时间: "2026-05-08 10:10:00", 说明: "等待人工确认" },
      ];
    },
    openDetail(row) {
      this.detailTitle = "详情";
      this.detailFields = Object.keys(row).map((key) => ({ label: key, value: row[key] }));
      this.detailVisible = true;
    },
    openBusinessDetail(functionName) {
      this.detailTitle = functionName || "详情";
      this.detailFields = this.buildBusinessDetail(functionName);
      this.detailVisible = true;
    },
    buildBusinessDetail(functionName) {
      const code = this.buildBusinessCode(functionName);
      const fields = [
        { label: "功能过程", value: functionName },
        { label: "三级模块", value: "办公外设资产管理" },
        { label: "二级模块", value: "指令接收解析" },
        { label: "来源文档", value: "广西扩容工程功能点拆分表" },
      ];
      if (/上报|上传|同步|接口/.test(functionName)) {
        fields.push(
          { label: "接口编号", value: "GX-API-" + code },
          { label: "对接系统", value: "工信部平台" },
          { label: "调用状态", value: "200 OK" },
          { label: "最近调用", value: "2026-05-08 10:12:09" },
        );
      } else if (/稽核|核查|校验|审查/.test(functionName)) {
        fields.push(
          { label: "规则编号", value: "GX-RULE-" + code },
          { label: "核查结果", value: "发现2条待复核记录" },
          { label: "命中次数", value: "128" },
          { label: "处理建议", value: "进入人工复核队列" },
        );
      } else if (/扫描|采集|探测/.test(functionName)) {
        fields.push(
          { label: "任务批次", value: "GX-TASK-" + code },
          { label: "覆盖资产", value: "482" },
          { label: "异常数量", value: "7" },
          { label: "任务状态", value: "执行中" },
        );
      } else if (/分析|统计|报表|报告|可视化/.test(functionName)) {
        fields.push(
          { label: "统计编号", value: "GX-TJ-" + code.slice(0, 6) },
          { label: "处理总量", value: "238" },
          { label: "完成率", value: "91.6%" },
          { label: "统计周期", value: "今日" },
        );
      } else {
        fields.push(
          { label: "业务编号", value: "GX-BIZ-" + code },
          { label: "处理状态", value: "正常" },
          { label: "处理时间", value: "2026-05-08 10:00:00" },
          { label: "业务摘要", value: functionName + "已完成业务模拟处理" },
        );
      }
      return fields;
    },
    openBusinessAnalysis(functionName) {
      const code = this.buildBusinessCode(functionName);
      this.analysisTitle = functionName;
      if (/扫描|采集|探测/.test(functionName)) {
        this.analysisMetrics = [
          { label: "任务批次", value: 42 },
          { label: "覆盖资产", value: 1286 },
          { label: "异常率", value: "2.1%" },
        ];
        this.analysisBars = [
          { name: "覆盖率", value: 86 },
          { name: "完成率", value: 79 },
          { name: "准确率", value: 93 },
        ];
      } else if (/上报|上传|同步|接口/.test(functionName)) {
        this.analysisMetrics = [
          { label: "调用批次", value: 64 },
          { label: "成功调用", value: 61 },
          { label: "成功率", value: "95.3%" },
        ];
        this.analysisBars = [
          { name: "已接收", value: 88 },
          { name: "已处理", value: 82 },
          { name: "已回执", value: 76 },
        ];
      } else {
        this.analysisMetrics = [
          { label: "统计编号", value: "GX-TJ-" + code.slice(0, 6) },
          { label: "处理总量", value: 238 },
          { label: "完成率", value: "91.6%" },
        ];
        this.analysisBars = [
          { name: "待处理", value: 18 },
          { name: "处理中", value: 54 },
          { name: "已完成", value: 92 },
        ];
      }
      this.applyFunctionAnalysisVariant(functionName);

      this.analysisVisible = true;
    },
    applyFunctionAnalysisVariant(functionName) {
      const code = this.buildBusinessCode(functionName || "分析");
      const seed = Number(code.slice(-2)) || 0;
      const first = 70 + (seed % 19);
      const second = 55 + (seed % 31);
      const third = 82 + (seed % 15);
      if (!this.analysisMetrics.length) return;
      this.analysisMetrics = this.analysisMetrics.map((item, index) => {
        if (index === 0) return { label: item.label, value: /编号/.test(item.label) ? item.value : 180 + seed };
        if (index === 1) return { label: item.label, value: typeof item.value === "number" ? 120 + seed : item.value };
        return { label: item.label, value: /率/.test(item.label) ? (80 + (seed % 18)) + "." + (seed % 10) + "%" : item.value };
      });
      this.analysisBars = [
        { name: functionName.slice(0, 4) || "受理", value: first },
        { name: /告警|预警|异常/.test(functionName) ? "处置" : "执行", value: second },
        { name: /报告|报表|统计/.test(functionName) ? "生成" : "完成", value: third },
      ];
    },
    isPrimaryAction(functionName, actionType) {
      const meta = actionOrdinalMap[functionName];
      return !meta || meta.actionType !== actionType || meta.order === 1;
    },
    buildSecondaryActionRow(functionName, actionType) {
      const code = this.buildBusinessCode(functionName + actionType);
      const shortCode = code.slice(0, 6);
      const actionLabelMap = {
        add: "新增",
        edit: "修改",
        delete: "删除",
      };
      const actionLabel = actionLabelMap[actionType] || "处理";
      const actionPrefixMap = {
        add: "NEW",
        edit: "UPD",
        delete: "DEL",
      };
      const sceneRules = [
        {
          pattern: /状态查询|查询状态|状态信息/,
          prefix: "STATE",
          type: "状态查询配置",
          subject: "扫描任务状态回执查询",
          status: { add: "待启用", edit: "待复核", delete: "停用待确认" },
          remark: "查询周期5分钟，关联回执接口 /scan/task/status，保留最近7天状态快照",
        },
        {
          pattern: /参数/,
          prefix: "PARAM",
          type: "任务参数模板",
          subject: "扫描任务参数集",
          status: { add: "草稿", edit: "待发布", delete: "已停用" },
          remark: "包含扫描范围、并发阈值、超时时间和回调地址，发布后同步到调度节点",
        },
        {
          pattern: /错误处理|异常处理|失败处理/,
          prefix: "ERR",
          type: "异常处理策略",
          subject: "任务接收异常重试策略",
          status: { add: "待生效", edit: "灰度中", delete: "待下线" },
          remark: "命中解析失败、重复指令、超时未回执时自动进入重试队列并记录处置日志",
        },
        {
          pattern: /通知规则|告警规则|预警规则|告警/,
          prefix: "ALM",
          type: "告警通知规则",
          subject: "扫描接收异常通知",
          status: { add: "待启用", edit: "待审批", delete: "禁用待确认" },
          remark: "连续3次失败触发短信和工单通知，通知对象为资产安全值班组",
        },
        {
          pattern: /稽核|核查|校验|完整性/,
          prefix: "AUDIT",
          type: "稽核校验规则",
          subject: "扫描数据完整性核查",
          status: { add: "待校验", edit: "规则调优", delete: "待归档" },
          remark: "校验任务编号、IP段、时间窗和回执状态，异常记录进入人工复核池",
        },
        {
          pattern: /分类|分组|标签/,
          prefix: "CLASS",
          type: "数据分类策略",
          subject: "资产扫描结果分类",
          status: { add: "待训练", edit: "待验证", delete: "待解绑" },
          remark: "按资产类型、端口暴露、风险等级自动归类，影响统计看板口径",
        },
        {
          pattern: /调度|任务/,
          prefix: "TASK",
          type: "调度任务实例",
          subject: "扫描任务调度实例",
          status: { add: "待排队", edit: "调度中", delete: "取消待确认" },
          remark: "执行窗口为02:00-05:00，绑定扫描器集群GX-SCAN-02并启用失败重试",
        },
        {
          pattern: /指令|下发|接收|解析/,
          prefix: "CMD",
          type: "联动指令记录",
          subject: "资产扫描联动指令",
          status: { add: "待解析", edit: "待重发", delete: "撤销待确认" },
          remark: "来自省侧资产安全平台，包含目标IP段、扫描模板和回执地址",
        },
        {
          pattern: /接口|调用|同步/,
          prefix: "API",
          type: "接口同步配置",
          subject: "资产安全接口同步",
          status: { add: "待联调", edit: "联调中", delete: "停用待确认" },
          remark: "接口鉴权方式为AK/SK，最近一次联调耗时186ms，返回码200",
        },
        {
          pattern: /日志|执行状态/,
          prefix: "LOG",
          type: "执行日志记录",
          subject: "任务执行状态日志",
          status: { add: "待采集", edit: "待补录", delete: "清理待确认" },
          remark: "记录节点执行状态、失败原因、重试次数和最终回执结果",
        },
        {
          pattern: /资产|IP|IPv4|IPv6/,
          prefix: "ASSET",
          type: "资产扫描对象",
          subject: "重点资产扫描对象",
          status: { add: "待纳管", edit: "待复核", delete: "移除待确认" },
          remark: "覆盖核心网、业务支撑网和互联网暴露面，最近同步时间2026-05-08 10:30:00",
        },
      ];
      const scene = sceneRules.find((item) => item.pattern.test(functionName)) || {
        prefix: "BIZ",
        type: "业务配置记录",
        subject: functionName.replace(/^(新增|修改|删除)/, "") || "业务配置项",
        status: { add: "待提交", edit: "待确认", delete: "删除待确认" },
        remark: "按当前功能过程生成的业务确认记录，提交后写入当前模块操作流水",
      };
      const ordinalMeta = actionOrdinalMap[functionName];
      const order = ordinalMeta && ordinalMeta.order ? ordinalMeta.order : 1;
      const ownerPool = ["核心机房", "汇聚节点", "业务专区", "互联网出口", "运维单元"];
      const owner = ownerPool[Number(code.slice(-1)) % ownerPool.length];
      return {
        name: scene.subject + "-" + owner + "-" + shortCode,
        code: (actionPrefixMap[actionType] || "OPT") + "-" + scene.prefix + "-" + shortCode + "-" + String(order).padStart(2, "0"),
        type: scene.type,
        status: scene.status[actionType] || "待处理",
        remark: actionLabel + "来源：" + functionName + "；" + scene.remark,
      };
    },
    openSecondaryAction(functionName, actionType) {
      this.activeFunction = functionName;
      this.activeActionType = actionType;
      this.secondaryActionType = actionType;
      const titleMap = {
        add: "新增确认",
        edit: "修改确认",
        delete: "删除确认",
      };
      const buttonMap = {
        add: "确认新增",
        edit: "确认修改",
        delete: "确认删除",
      };
      this.secondaryActionTitle = (titleMap[actionType] || "操作确认") + " - " + functionName;
      this.secondaryActionConfirmText = buttonMap[actionType] || "确定";
      this.secondaryActionRows = [this.buildSecondaryActionRow(functionName, actionType)];
      this.secondaryActionVisible = true;
    },
    confirmSecondaryAction() {
      const messageMap = {
        add: "新增成功",
        edit: "修改成功",
        delete: "删除成功",
      };
      this.secondaryActionVisible = false;
      this.$message.success(messageMap[this.secondaryActionType] || "操作成功");
    },
    buildBusinessCode(text) {
      let hash = 0;
      for (let i = 0; i < text.length; i += 1) {
        hash = (hash * 31 + text.charCodeAt(i)) % 100000000;
      }
      return String(hash).padStart(8, "0");
    },
  },
};
</script>

<style scoped>
.crud-container {
  padding: 10px 0;
}
.operate-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.function-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.detail-form ::v-deep .el-form-item {
  margin-bottom: 8px;
}
.analysis-panel {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.metric-card {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  background: #fff;
}
.metric-card span,
.bar-row span {
  color: #606266;
}
.metric-card strong {
  display: block;
  margin-top: 8px;
  font-size: 20px;
  color: #303133;
  font-weight: 600;
}
.bar-row {
  display: grid;
  grid-template-columns: 90px 1fr 46px;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}
.bar-track {
  height: 10px;
  border-radius: 6px;
  background: #ebeef5;
  overflow: hidden;
}
.bar-value {
  height: 100%;
  border-radius: 6px;
  background: #409eff;
}
.bar-row em {
  color: #409eff;
  font-style: normal;
  text-align: right;
}
.mt10 {
  margin-top: 10px;
}
.mb10 {
  margin-bottom: 10px;
}
</style>
