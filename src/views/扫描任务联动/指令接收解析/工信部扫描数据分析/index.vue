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
          <el-button plain type="primary" icon="el-icon-data-analysis" @click='handleFunction("工信部扫描告警", "analysis")'>工信部扫描告警</el-button>
          <el-button plain type="primary" icon="el-icon-data-analysis" @click='handleFunction("工信部扫描结果统计", "analysis")'>工信部扫描结果统计</el-button>
          <el-button plain type="primary" icon="el-icon-s-operation" @click='handleFunction("工信部扫描数据提取", "operation")'>工信部扫描数据提取</el-button>
          <el-button plain type="primary" icon="el-icon-data-analysis" @click='handleFunction("工信部扫描运行分析", "analysis")'>工信部扫描运行分析</el-button>
          <el-button plain type="primary" icon="el-icon-view" @click='handleFunction("工信部扫描分析结果展示", "detail")'>工信部扫描分析结果展示</el-button>
          <el-button plain type="primary" icon="el-icon-download" @click='handleFunction("工信部扫描分析结果下载", "export")'>工信部扫描分析结果下载</el-button>
          <el-button plain type="primary" icon="el-icon-data-analysis" @click='handleFunction("工信部扫描分析结果上报", "analysis")'>工信部扫描分析结果上报</el-button>
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
    "扫描批次": "SCAN-375740-100-6785",
    "扫描对象": "区公司工信部扫描数据分析-部侧联动-01-375740",
    "扫描节点": "节点-06-40",
    "资产数量": 77,
    "异常数量": 1139,
    "扫描状态": "已同步-740"
  },
  {
    "ID": 2,
    "扫描批次": "SCAN-375740-101-9164",
    "扫描对象": "工信部扫描数据分析-扩容核查-02-375740",
    "扫描节点": "节点-04-40",
    "资产数量": 4048,
    "异常数量": 1171,
    "扫描状态": "异常-740"
  },
  {
    "ID": 3,
    "扫描批次": "SCAN-375740-102-2597",
    "扫描对象": "工信部扫描数据分析-异常复核-03-375740",
    "扫描节点": "节点-09-40",
    "资产数量": 4103,
    "异常数量": 4346,
    "扫描状态": "已同步-740"
  },
  {
    "ID": 4,
    "扫描批次": "SCAN-375740-103-2600",
    "扫描对象": "工信部扫描数据分析-资产纳管-04-375740",
    "扫描节点": "节点-08-40",
    "资产数量": 1744,
    "异常数量": 267,
    "扫描状态": "待复核-740"
  },
  {
    "ID": 5,
    "扫描批次": "SCAN-375740-104-4271",
    "扫描对象": "工信部扫描数据分析-部侧联动-05-375740",
    "扫描节点": "区公司节点-05-40",
    "资产数量": 4079,
    "异常数量": 702,
    "扫描状态": "待复核-740"
  },
  {
    "ID": 6,
    "扫描批次": "SCAN-375740-105-5686",
    "扫描对象": "工信部扫描数据分析-资产纳管-06-375740",
    "扫描节点": "节点-06-40",
    "资产数量": 2624,
    "异常数量": 121,
    "扫描状态": "待复核-740"
  },
  {
    "ID": 7,
    "扫描批次": "SCAN-375740-106-7607",
    "扫描对象": "区公司工信部扫描数据分析-自动采集-07-375740",
    "扫描节点": "节点-03-40",
    "资产数量": 490,
    "异常数量": 3814,
    "扫描状态": "已完成-740"
  },
  {
    "ID": 8,
    "扫描批次": "SCAN-375740-107-6612",
    "扫描对象": "工信部扫描数据分析-异常复核-08-375740",
    "扫描节点": "节点-06-40",
    "资产数量": 3113,
    "异常数量": 2786,
    "扫描状态": "待处理-740"
  },
  {
    "ID": 9,
    "扫描批次": "SCAN-375740-108-3657",
    "扫描对象": "工信部扫描数据分析-异常复核-09-375740",
    "扫描节点": "节点-07-40",
    "资产数量": 3760,
    "异常数量": 4819,
    "扫描状态": "已完成-740"
  },
  {
    "ID": 10,
    "扫描批次": "SCAN-375740-109-6437",
    "扫描对象": "工信部扫描数据分析-资产纳管-10-375740",
    "扫描节点": "区公司节点-09-40",
    "资产数量": 1564,
    "异常数量": 251,
    "扫描状态": "待处理-740"
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
    "prop": "扫描批次",
    "label": "扫描批次",
    "type": "text",
    "search": true,
    "showTooltip": true
  },
  {
    "prop": "扫描对象",
    "label": "扫描对象",
    "type": "text",
    "search": true,
    "showTooltip": true
  },
  {
    "prop": "扫描节点",
    "label": "扫描节点",
    "type": "text",
    "search": true,
    "showTooltip": true
  },
  {
    "prop": "资产数量",
    "label": "资产数量",
    "type": "text",
    "search": false,
    "showTooltip": true
  },
  {
    "prop": "异常数量",
    "label": "异常数量",
    "type": "text",
    "search": false,
    "showTooltip": true
  },
  {
    "prop": "扫描状态",
    "label": "扫描状态",
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
  "扫描批次": "",
  "扫描对象": "",
  "扫描节点": "",
  "资产数量": 0,
  "异常数量": 0,
  "扫描状态": "待处理"
};
const importTemplateRow = {
  "扫描批次": "GX-SCAN-20260508-009",
  "扫描对象": "10.24.18.0/24",
  "扫描节点": "扫描节点01",
  "资产数量": 764,
  "异常数量": 18,
  "扫描状态": "扫描中",
  "ID": ""
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
      exportXLSX(this.buildExportRows(functionName), functionName || "工信部扫描数据分析导出");
      this.$message.success("导出成功");
    },
    buildExportRows(functionName) {
      if (/数据|列表|信息|全量/.test(functionName)) return this.allTableData;
      if (/执行状态|日志|监控/.test(functionName)) {
        return [
          { 名称: functionName, 状态: "执行成功", 日志: "功能过程执行完成，结果已归档" },
          { 名称: "工信部扫描数据分析调度任务", 状态: "执行中", 日志: "等待节点返回执行结果" },
          { 名称: "工信部扫描数据分析异常检查", 状态: "已告警", 日志: "发现超时记录，已进入重试队列" },
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
        { 业务名称: "工信部扫描数据分析业务记录", 业务状态: "已处理", 处理时间: "2026-05-08 10:05:00", 说明: "模拟业务记录" },
        { 业务名称: "工信部扫描数据分析复核记录", 业务状态: "待复核", 处理时间: "2026-05-08 10:10:00", 说明: "等待人工确认" },
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
        { label: "三级模块", value: "工信部扫描数据分析" },
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
