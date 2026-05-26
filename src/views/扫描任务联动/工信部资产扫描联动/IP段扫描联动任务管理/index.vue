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
          <el-button plain type="primary" icon="el-icon-plus" @click='handleFunction("新增IP段扫描联动任务", "add")'>新增IP段扫描联动任务</el-button>
          <el-button plain type="primary" icon="el-icon-delete" @click='handleFunction("删除IP段扫描联动任务", "delete")'>删除IP段扫描联动任务</el-button>
          <el-button plain type="primary" icon="el-icon-edit" @click='handleFunction("修改IP段扫描联动任务", "edit")'>修改IP段扫描联动任务</el-button>
          <el-button plain type="primary" icon="el-icon-view" @click='handleFunction("查询IP段扫描联动任务", "detail")'>查询IP段扫描联动任务</el-button>
          <el-button plain type="primary" icon="el-icon-s-operation" @click='handleFunction("IP段扫描联动任务启用/禁用", "operation")'>IP段扫描联动任务启用/禁用</el-button>
          <el-button plain type="primary" icon="el-icon-s-operation" @click='handleFunction("IP段扫描联动失败告警", "operation")'>IP段扫描联动失败告警</el-button>
          <el-button plain type="primary" icon="el-icon-data-analysis" @click='handleFunction("IP段扫描联动结果统计", "analysis")'>IP段扫描联动结果统计</el-button>
          <el-button plain type="primary" icon="el-icon-s-operation" @click='handleFunction("IP段扫描联动数据提取", "operation")'>IP段扫描联动数据提取</el-button>
          <el-button plain type="primary" icon="el-icon-data-analysis" @click='handleFunction("IP段扫描联动运行分析", "analysis")'>IP段扫描联动运行分析</el-button>
          <el-button plain type="primary" icon="el-icon-view" @click='handleFunction("IP段扫描联动分析结果展示", "detail")'>IP段扫描联动分析结果展示</el-button>
          <el-button plain type="primary" icon="el-icon-download" @click='handleFunction("IP段扫描联动分析结果下载", "export")'>IP段扫描联动分析结果下载</el-button>
          <el-button plain type="primary" icon="el-icon-data-analysis" @click='handleFunction("IP段扫描联动分析结果上报", "analysis")'>IP段扫描联动分析结果上报</el-button>
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
            <el-option label="已下发" value="已下发"></el-option>
            <el-option label="已入库" value="已入库"></el-option>
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
            <span slot="tip" class="el-upload__tip">支持 xlsx/xls 文件，系统会解析当前页面对应的数据模板</span>
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
    "任务编号": "ST-51474",
    "扫描目标": "10.25.6.0/24",
    "扫描器节点": "分布式扫描-节点B",
    "端口覆盖率": "78%",
    "存活主机数": 28,
    "任务状态": "部分完成",
    "计划时间": "2026-05-08 16:08:25"
  },
  {
    "ID": 2,
    "任务编号": "ST-59393",
    "扫描目标": "172.20.14.0/24",
    "扫描器节点": "中心扫描引擎",
    "端口覆盖率": "85%",
    "存活主机数": 45,
    "任务状态": "执行中",
    "计划时间": "2026-05-09 08:33:11"
  },
  {
    "ID": 3,
    "任务编号": "ST-67312",
    "扫描目标": "10.30.9.0/24",
    "扫描器节点": "边缘探测器",
    "端口覆盖率": "92%",
    "存活主机数": 89,
    "任务状态": "已完成",
    "计划时间": "2026-05-09 09:47:56"
  },
  {
    "ID": 4,
    "任务编号": "ST-75231",
    "扫描目标": "192.168.10.0/24",
    "扫描器节点": "被动嗅探器",
    "端口覆盖率": "96%",
    "存活主机数": 134,
    "任务状态": "待执行",
    "计划时间": "2026-05-08 09:12:18"
  },
  {
    "ID": 5,
    "任务编号": "ST-83150",
    "扫描目标": "10.50.20.0/24",
    "扫描器节点": "主动扫描器",
    "端口覆盖率": "100%",
    "存活主机数": 256,
    "任务状态": "执行失败",
    "计划时间": "2026-05-08 09:35:44"
  },
  {
    "ID": 6,
    "任务编号": "ST-91069",
    "扫描目标": "10.24.18.0/24",
    "扫描器节点": "分布式扫描-节点A",
    "端口覆盖率": "67%",
    "存活主机数": 12,
    "任务状态": "已暂停",
    "计划时间": "2026-05-08 10:08:06"
  },
  {
    "ID": 7,
    "任务编号": "ST-98988",
    "扫描目标": "10.25.6.0/24",
    "扫描器节点": "分布式扫描-节点B",
    "端口覆盖率": "78%",
    "存活主机数": 28,
    "任务状态": "排队中",
    "计划时间": "2026-05-08 10:42:31"
  },
  {
    "ID": 8,
    "任务编号": "ST-106907",
    "扫描目标": "172.20.14.0/24",
    "扫描器节点": "中心扫描引擎",
    "端口覆盖率": "85%",
    "存活主机数": 45,
    "任务状态": "部分完成",
    "计划时间": "2026-05-08 11:16:09"
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
    "prop": "任务编号",
    "label": "任务编号",
    "type": "text",
    "search": true,
    "showTooltip": true
  },
  {
    "prop": "扫描目标",
    "label": "扫描目标",
    "type": "text",
    "search": true,
    "showTooltip": true
  },
  {
    "prop": "扫描器节点",
    "label": "扫描器节点",
    "type": "text",
    "search": true,
    "showTooltip": true
  },
  {
    "prop": "端口覆盖率",
    "label": "端口覆盖率",
    "type": "text",
    "search": false,
    "showTooltip": true
  },
  {
    "prop": "存活主机数",
    "label": "存活主机数",
    "type": "text",
    "search": false,
    "showTooltip": true
  },
  {
    "prop": "任务状态",
    "label": "任务状态",
    "type": "text",
    "search": false,
    "showTooltip": true
  },
  {
    "prop": "计划时间",
    "label": "计划时间",
    "type": "text",
    "search": false,
    "showTooltip": true,
    "width": 170
  },
  {
    "slot": "operate",
    "label": "操作"
  }
];
const defaultRow = {
  "ID": "",
  "任务编号": "",
  "扫描目标": "",
  "扫描器节点": "",
  "端口覆盖率": "",
  "存活主机数": "",
  "任务状态": "待处理",
  "计划时间": ""
};
const importTemplateRow = {
  "任务编号": "ST-114826",
  "扫描目标": "10.30.9.0/24",
  "扫描器节点": "边缘探测器",
  "端口覆盖率": "92%",
  "存活主机数": 89,
  "任务状态": "执行中",
  "计划时间": "2026-05-08 14:03:52",
  "ID": "",
  "导入来源": "IP段扫描联动任务管理导入模板.xlsx"
};

export default {
  name: "GeneratedFeaturePage66",
  data() {
    return {
      searchData: {},
      searchConfig: [],
      allTableData: initialRows.map((item) => ({ ...item })),
      tableData: [],
      selectedRows: [],
      tableColumns,
      pageTotal: 0,
      pageOptions: {
        pageNum: 1,
        pageSize: 10,
      },
      activeFunction: "",
      activeActionType: "",
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
      importRemark: "请选择本地Excel文件，系统将解析并导入符合当前页面模板的数据。",
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
    getPrimaryNameField() {
      return this.editableColumns.find((item) => /名称/.test(item.prop)) || this.editableColumns.find((item) => /类型/.test(item.prop)) || this.editableColumns[0];
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
      return /摘要|日志|说明|原因|范围|地址/.test(prop);
    },
    handleSelectionChange(selection) {
      this.selectedRows = selection || [];
    },
    handleFunction(functionName, actionType = "operation") {
      this.activeFunction = functionName;
      this.activeActionType = actionType;

      if (actionType === "add") {
        this.openAdd(functionName);
        return;
      }
      if (actionType === "edit") {
        this.openSelectedEdit(functionName);
        return;
      }
      if (actionType === "delete") {
        this.deleteSelected();
        return;
      }
      if (actionType === "import") {
        this.openImport(functionName);
        return;
      }
      if (actionType === "export") {
        this.exportRows(functionName);
        return;
      }
      if (actionType === "detail") {
        this.openSelectedDetail(functionName);
        return;
      }
      if (actionType === "analysis") {
        this.openBusinessAnalysis(functionName);
        return;
      }

      this.openOperation(functionName);
    },
    openAdd(functionName) {
      this.formMode = "add";
      this.formTitle = functionName || "新增";
      const row = this.createEmptyRow();
      const primary = this.getPrimaryNameField();
      const status = this.getStatusField();
      if (primary) row[primary.prop] = functionName || row[primary.prop];
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
      const target = this.selectedRows[0] || this.allTableData[0] || this.createEmptyRow();
      const row = { ...target };
      const status = this.getStatusField();
      const primary = this.getPrimaryNameField();
      if (primary && !row[primary.prop]) row[primary.prop] = functionName;
      if (status) row[status.prop] = /下发|发送|派发/.test(functionName) ? "已下发" : "已完成";
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
        this.allTableData.unshift({
          ...this.formData,
          ID: this.nextId(),
        });
      } else {
        const index = this.allTableData.findIndex((item) => item.ID === this.formData.ID);
        if (index > -1) {
          this.$set(this.allTableData, index, { ...this.formData });
        } else {
          this.allTableData.unshift({
            ...this.formData,
            ID: this.nextId(),
          });
        }
      }
      this.formVisible = false;
      this.pageOptions.pageNum = 1;
      this.fetchData();
      this.$message.success(this.formMode === "add" ? "新增成功" : "修改成功");
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
      this.importRemark = "请选择本地Excel文件，系统将解析并导入符合当前页面模板的数据。";
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
      this.importRemark = "请选择本地Excel文件，系统将解析并导入符合当前页面模板的数据。";
    },
    confirmImport() {
      this.importProgress = 100;
      this.importMockRow(this.importFunctionName || this.importTitle);
      this.importVisible = false;
    },
    importMockRow(functionName) {
      const row = {
        ...importTemplateRow,
        ID: this.nextId(),
      };
      delete row.导入来源;
      const primary = this.getPrimaryNameField();
      const status = this.getStatusField();
      if (primary && /名称/.test(primary.prop)) row[primary.prop] = functionName + "导入记录";
      if (status) row[status.prop] = "已完成";
      this.allTableData.unshift(row);
      this.pageOptions.pageNum = 1;
      this.fetchData();
      this.$message.success("文件解析完成，已写入1条有效记录");
    },
    exportRows(functionName) {
      const rows = this.buildExportRows(functionName);
      exportXLSX(rows, functionName || "IP段扫描联动任务管理导出");
      this.$message.success("导出成功");
    },
    buildExportRows(functionName) {
      if (/数据导出|信息导出|列表导出|全量/.test(functionName)) {
        return this.allTableData;
      }
      if (/执行状态|日志/.test(functionName)) {
        return [
          { 名称: functionName.replace(/导出/g, ""), 状态: "执行成功", 日志: "任务已完成，回执校验通过" },
          { 名称: "IP段扫描联动任务管理任务调度", 状态: "执行中", 日志: "正在等待节点返回执行结果" },
          { 名称: "IP段扫描联动任务管理异常检查", 状态: "已告警", 日志: "发现1条超时记录，已进入重试队列" },
        ];
      }
      if (/统计|分析|报表|报告/.test(functionName)) {
        return [
          { 指标名称: "处理总量", 指标值: 238, 统计周期: "今日", 说明: functionName },
          { 指标名称: "成功数量", 指标值: 221, 统计周期: "今日", 说明: "成功完成业务处理" },
          { 指标名称: "异常数量", 指标值: 17, 统计周期: "今日", 说明: "需要人工复核" },
        ];
      }
      if (/参数|字段/.test(functionName)) {
        return [
          { 参数名称: "taskId", 参数值: "TASK-260508001", 校验结果: "通过" },
          { 参数名称: "ipRange", 参数值: "10.24.18.0/24", 校验结果: "通过" },
          { 参数名称: "callbackUrl", 参数值: "/asset-security/callback", 校验结果: "通过" },
        ];
      }
      if (/接口|调用/.test(functionName)) {
        return [
          { 接口名称: functionName, 请求方式: "POST", 调用状态: "200 OK", 平均耗时: "186ms" },
          { 接口名称: "IP段扫描联动任务管理状态同步接口", 请求方式: "GET", 调用状态: "200 OK", 平均耗时: "93ms" },
          { 接口名称: "IP段扫描联动任务管理回执接口", 请求方式: "POST", 调用状态: "202 ACCEPTED", 平均耗时: "141ms" },
        ];
      }
      if (/扫描|采集/.test(functionName)) {
        return [
          { 批次编号: "BATCH-260508", 资产数量: 482, 成功数量: 475, 异常数量: 7 },
          { 批次编号: "BATCH-260507", 资产数量: 316, 成功数量: 309, 异常数量: 7 },
          { 批次编号: "BATCH-260506", 资产数量: 528, 成功数量: 521, 异常数量: 7 },
        ];
      }
      if (/资产/.test(functionName)) {
        return [
          { 资产编号: "ASSET-26050801", 资产类型: "服务器", 纳管状态: "已纳管", 最近同步: "2026-05-08 10:30:00" },
          { 资产编号: "ASSET-26050802", 资产类型: "网络设备", 纳管状态: "已纳管", 最近同步: "2026-05-08 10:21:00" },
          { 资产编号: "ASSET-26050803", 资产类型: "虚拟资源", 纳管状态: "待核验", 最近同步: "2026-05-08 09:58:00" },
        ];
      }
      return [
        { 业务名称: functionName, 业务状态: "正常", 处理时间: "2026-05-08 10:00:00", 说明: "按按钮含义生成的业务导出数据" },
        { 业务名称: "IP段扫描联动任务管理业务记录", 业务状态: "已处理", 处理时间: "2026-05-08 10:05:00", 说明: "模拟业务记录" },
        { 业务名称: "IP段扫描联动任务管理复核记录", 业务状态: "待复核", 处理时间: "2026-05-08 10:10:00", 说明: "等待人工确认" },
      ];
    },
    openDetail(row) {
      this.detailTitle = "详情";
      this.detailFields = Object.keys(row).map((key) => ({
        label: key,
        value: row[key],
      }));
      this.detailVisible = true;
    },
    openSelectedDetail(functionName) {
      this.detailTitle = functionName || "详情";
      this.detailFields = this.buildBusinessDetail(functionName || "详情");
      this.detailVisible = true;
    },
    buildBusinessDetail(functionName) {
      const code = this.buildBusinessCode(functionName);
      const fields = [
        { label: "业务名称", value: functionName },
        { label: "所属页面", value: "IP段扫描联动任务管理" },
        { label: "一级模块", value: "扫描任务联动" },
        { label: "二级模块", value: "工信部资产扫描联动" },
      ];

      if (/下发|发送|派发/.test(functionName)) {
        fields.push(
          { label: "下发编号", value: "XF-" + code },
          { label: "下发时间", value: "2026-05-08 09:30:18" },
          { label: "下发状态", value: "已下发，等待回执" },
          { label: "目标IP范围", value: "10.24.18.0/24、10.24.32.0/24" },
          { label: "接收系统", value: "省侧资产扫描联动网关" },
          { label: "回执状态", value: "已接收2条，待反馈1条" },
        );
      } else if (/接收|解析/.test(functionName)) {
        fields.push(
          { label: "接收编号", value: "JS-" + code },
          { label: "接收时间", value: "2026-05-08 09:18:42" },
          { label: "指令来源", value: "工信部资产安全管理接口" },
          { label: "解析状态", value: "格式校验通过" },
          { label: "入库结果", value: "已入库，生成待处理任务" },
        );
      } else if (/反馈|回执|返回/.test(functionName)) {
        fields.push(
          { label: "反馈编号", value: "FK-" + code },
          { label: "反馈时间", value: "2026-05-08 10:05:33" },
          { label: "反馈结果", value: "处理成功" },
          { label: "关联指令", value: "CMD-" + code.slice(0, 6) },
          { label: "失败原因", value: "无" },
        );
      } else if (/接口|调用/.test(functionName)) {
        fields.push(
          { label: "接口编号", value: "API-" + code },
          { label: "接口地址", value: "/asset-security/api/" + code.toLowerCase() },
          { label: "请求方式", value: "POST" },
          { label: "最近调用", value: "2026-05-08 10:12:09" },
          { label: "调用状态", value: "200 OK" },
          { label: "平均耗时", value: "186ms" },
        );
      } else if (/任务|执行|调度/.test(functionName)) {
        fields.push(
          { label: "任务编号", value: "TASK-" + code },
          { label: "任务状态", value: "执行中" },
          { label: "执行进度", value: "76%" },
          { label: "执行周期", value: "即时任务" },
          { label: "责任角色", value: "资产安全管理员" },
        );
      } else if (/规则|模型|策略/.test(functionName)) {
        fields.push(
          { label: "规则编号", value: "RULE-" + code },
          { label: "启用状态", value: "已启用" },
          { label: "命中次数", value: "128" },
          { label: "最近生效时间", value: "2026-05-08 08:45:00" },
          { label: "适用范围", value: "全省资产安全管理平台" },
        );
      } else if (/日志/.test(functionName)) {
        fields.push(
          { label: "日志批次", value: "LOG-" + code },
          { label: "采集时间", value: "2026-05-08 10:20:00" },
          { label: "日志级别", value: "INFO" },
          { label: "记录数量", value: "356" },
          { label: "异常数量", value: "3" },
        );
      } else if (/参数|字段/.test(functionName)) {
        fields.push(
          { label: "参数编号", value: "PARAM-" + code },
          { label: "参数版本", value: "V1.0.3" },
          { label: "校验结果", value: "通过" },
          { label: "字段数量", value: "24" },
          { label: "缺失字段", value: "无" },
        );
      } else if (/扫描|采集|探测/.test(functionName)) {
        fields.push(
          { label: "批次编号", value: "SCAN-" + code },
          { label: "开始时间", value: "2026-05-08 09:00:00" },
          { label: "完成时间", value: "2026-05-08 09:42:16" },
          { label: "资产数量", value: "482" },
          { label: "异常数量", value: "7" },
        );
      } else if (/资产/.test(functionName)) {
        fields.push(
          { label: "资产批次", value: "ASSET-" + code },
          { label: "资产类型", value: "服务器、网络设备、虚拟资源" },
          { label: "纳管状态", value: "已纳管" },
          { label: "资产数量", value: "136" },
          { label: "最近同步", value: "2026-05-08 10:30:00" },
        );
      } else {
        fields.push(
          { label: "业务编号", value: "BIZ-" + code },
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
      if (/下发|发送|派发/.test(functionName)) {
        this.analysisMetrics = [
          { label: "下发总数", value: 96 },
          { label: "成功下发", value: 91 },
          { label: "成功率", value: "94.8%" },
        ];
        this.analysisBars = [
          { name: "待下发", value: 12 },
          { name: "下发中", value: 38 },
          { name: "已完成", value: 95 },
        ];
      } else if (/接收|解析/.test(functionName)) {
        this.analysisMetrics = [
          { label: "接收批次", value: 64 },
          { label: "解析成功", value: 61 },
          { label: "入库率", value: "95.3%" },
        ];
        this.analysisBars = [
          { name: "已接收", value: 88 },
          { name: "已解析", value: 82 },
          { name: "已入库", value: 76 },
        ];
      } else if (/扫描|采集|探测/.test(functionName)) {
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
      } else {
        this.analysisMetrics = [
          { label: "统计编号", value: "TJ-" + code.slice(0, 6) },
          { label: "处理总量", value: 238 },
          { label: "完成率", value: "91.6%" },
        ];
        this.analysisBars = [
          { name: "待处理", value: 18 },
          { name: "处理中", value: 54 },
          { name: "已完成", value: 92 },
        ];
      }
      this.analysisVisible = true;
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
