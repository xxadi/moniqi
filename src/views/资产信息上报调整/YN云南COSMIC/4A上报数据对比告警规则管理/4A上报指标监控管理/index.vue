<template>
  <div>
    <cs-searchpanel :searchConfig="searchConfig" :searchData="searchData" @handelSearch="search" @handelReset="reset" labelWidth="100px"></cs-searchpanel>
    <div class="mt10 crud-container">
      <div class="mb10 operate-container">
        <div class="function-actions">
          <el-button plain type="primary" icon="el-icon-view" @click='handleFunction("4A上报指标实时监控", "monitor_realtime")'>4A上报指标实时监控</el-button>
          <el-button plain type="primary" icon="el-icon-warning" @click='handleFunction("4A上报指标监控告警", "alert_monitor")'>4A上报指标监控告警</el-button>
          <el-button plain type="primary" icon="el-icon-data-analysis" @click='handleFunction("4A上报指标趋势分析", "trend_analysis")'>4A上报指标趋势分析</el-button>
          <el-button plain type="primary" icon="el-icon-download" @click='handleFunction("4A上报指标监控报告导出", "export_monitor")'>4A上报指标监控报告导出</el-button>
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

    <el-dialog title="4A上报指标实时监控" :visible.sync="realtimeVisible" width="800px" append-to-body>
      <el-row :gutter="20" style="margin-bottom:20px;">
        <el-col :span="6">
          <el-card shadow="hover">
            <div slot="header"><span>上报成功率</span></div>
            <div style="text-align:center;font-size:24px;color:#67C23A;">98.5%</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div slot="header"><span>上报总数</span></div>
            <div style="text-align:center;font-size:24px;color:#409EFF;">12,580</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div slot="header"><span>失败数量</span></div>
            <div style="text-align:center;font-size:24px;color:#F56C6C;">189</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div slot="header"><span>平均耗时</span></div>
            <div style="text-align:center;font-size:24px;color:#E6A23C;">2.3s</div>
          </el-card>
        </el-col>
      </el-row>
      <el-table :data="realtimeLogs" border size="mini" style="width:100%">
        <el-table-column prop="time" label="时间" width="160"></el-table-column>
        <el-table-column prop="indicator" label="指标名称" width="150"></el-table-column>
        <el-table-column prop="value" label="当前值" width="100" align="center"></el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === '正常' ? 'success' : scope.row.status === '异常' ? 'danger' : 'warning'" size="mini">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="说明"></el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="realtimeVisible = false">关闭</el-button>
        <el-button type="primary" @click="realtimeVisible = false; $message.success('监控数据已刷新')">刷新</el-button>
      </span>
    </el-dialog>

    <el-dialog title="4A上报指标监控告警" :visible.sync="alertVisible" width="700px" append-to-body>
      <el-table :data="alertList" border size="mini" style="width:100%">
        <el-table-column prop="time" label="告警时间" width="160"></el-table-column>
        <el-table-column prop="level" label="告警级别" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.level === '紧急' ? 'danger' : scope.row.level === '重要' ? 'warning' : 'info'" size="mini">{{ scope.row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="indicator" label="指标名称" width="150"></el-table-column>
        <el-table-column prop="message" label="告警内容"></el-table-column>
        <el-table-column prop="status" label="处理状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === '已处理' ? 'success' : scope.row.status === '处理中' ? '' : 'info'" size="mini">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="alertVisible = false">关闭</el-button>
        <el-button type="primary" @click="alertVisible = false; $message.success('告警已确认')">确认全部</el-button>
      </span>
    </el-dialog>

    <el-dialog title="4A上报指标趋势分析" :visible.sync="trendVisible" width="720px" append-to-body>
      <div class="analysis-panel">
        <div v-for="item in trendMetrics" :key="item.label" class="metric-card">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
      <div class="bar-list">
        <div v-for="item in trendData" :key="item.name" class="bar-row">
          <span>{{ item.name }}</span>
          <div class="bar-track">
            <div class="bar-value" :style="{ width: item.value + '%' }"></div>
          </div>
          <em>{{ item.value }}%</em>
        </div>
      </div>
      <span slot="footer">
        <el-button @click="trendVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { filterData } from "@/utils/index";

const rows = [
  { ID: 1, 监控编号: "MON-ZB-001", 指标名称: "资产总数上报", 监控周期: "每小时", 上报成功率: "99.2%", 上报数量: 5120, 失败数量: 41, 平均耗时: "1.8s", 最近监控: "2026-06-03 10:00:00", 状态: "正常" },
  { ID: 2, 监控编号: "MON-ZB-002", 指标名称: "资产变更上报", 监控周期: "每小时", 上报成功率: "97.8%", 上报数量: 2340, 失败数量: 52, 平均耗时: "2.1s", 最近监控: "2026-06-03 10:00:00", 状态: "正常" },
  { ID: 3, 监控编号: "MON-ZB-003", 指标名称: "安全事件上报", 监控周期: "每5分钟", 上报成功率: "98.5%", 上报数量: 856, 失败数量: 13, 平均耗时: "3.2s", 最近监控: "2026-06-03 10:05:00", 状态: "正常" },
  { ID: 4, 监控编号: "MON-ZB-004", 指标名称: "漏洞信息上报", 监控周期: "每天", 上报成功率: "95.6%", 上报数量: 320, 失败数量: 14, 平均耗时: "5.6s", 最近监控: "2026-06-03 08:00:00", 状态: "异常" },
  { ID: 5, 监控编号: "MON-ZB-005", 指标名称: "合规检查上报", 监控周期: "每周", 上报成功率: "100%", 上报数量: 128, 失败数量: 0, 平均耗时: "4.2s", 最近监控: "2026-06-02 09:00:00", 状态: "正常" },
];

const cols = [
  { prop: "监控编号", label: "监控编号", type: "text", search: true },
  { prop: "指标名称", label: "指标名称", type: "text", search: true },
  { prop: "监控周期", label: "监控周期", type: "select", options: [{ value: "每5分钟", label: "每5分钟" }, { value: "每小时", label: "每小时" }, { value: "每天", label: "每天" }, { value: "每周", label: "每周" }], search: true },
  { prop: "上报成功率", label: "上报成功率", type: "text" },
  { prop: "上报数量", label: "上报数量", type: "text" },
  { prop: "失败数量", label: "失败数量", type: "text" },
  { prop: "平均耗时", label: "平均耗时", type: "text" },
  { prop: "最近监控", label: "最近监控", type: "text", width: 170 },
  { prop: "状态", label: "状态", type: "select", options: [{ value: "正常", label: "正常" }, { value: "异常", label: "异常" }], search: true },
  { slot: "operate", label: "操作" },
];

const defaultRow = { 监控编号: "", 指标名称: "", 监控周期: "每小时", 上报成功率: "100%", 上报数量: 0, 失败数量: 0, 平均耗时: "0s", 最近监控: "", 状态: "正常" };

export default {
  name: "4AYN_4AShangBaoZhiBiaoJianKongGuanLi",
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
      realtimeVisible: false,
      realtimeLogs: [],
      alertVisible: false,
      alertList: [],
      trendVisible: false,
      trendMetrics: [],
      trendData: [],
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
      if (type === "monitor_realtime") {
        this.realtimeLogs = [
          { time: this.now(), indicator: "资产总数上报", value: "5120", status: "正常", message: "上报成功率99.2%，运行正常" },
          { time: this.now(), indicator: "资产变更上报", value: "2340", status: "正常", message: "上报成功率97.8%，运行正常" },
          { time: this.now(), indicator: "安全事件上报", value: "856", status: "正常", message: "上报成功率98.5%，运行正常" },
          { time: this.now(), indicator: "漏洞信息上报", value: "320", status: "异常", message: "上报失败率4.4%，需检查网络连接" },
          { time: this.now(), indicator: "合规检查上报", value: "128", status: "正常", message: "上报成功率100%，运行正常" },
        ];
        this.realtimeVisible = true;
      } else if (type === "alert_monitor") {
        this.alertList = [
          { time: this.now(), level: "紧急", indicator: "漏洞信息上报", message: "上报失败率超过阈值4%，当前4.4%", status: "处理中" },
          { time: this.now(), level: "重要", indicator: "资产变更上报", message: "上报耗时超过3秒阈值", status: "待处理" },
          { time: this.now(), level: "一般", indicator: "安全事件上报", message: "上报数量较昨日下降15%", status: "已处理" },
        ];
        this.alertVisible = true;
      } else if (type === "trend_analysis") {
        this.trendMetrics = [
          { label: "平均成功率", value: "98.2%" },
          { label: "总上报量", value: "8,764" },
          { label: "异常指标", value: "1个" },
          { label: "告警次数", value: "3次" },
        ];
        this.trendData = [
          { name: "资产总数", value: 99 },
          { name: "资产变更", value: 98 },
          { name: "安全事件", value: 97 },
          { name: "漏洞信息", value: 96 },
          { name: "合规检查", value: 100 },
        ];
        this.trendVisible = true;
      } else if (type === "export_monitor") {
        this.$message.success("正在导出监控报告...");
      }
    },
    edit(row) {
      this.$message.info("修改监控配置：" + row.指标名称);
    },
    detail(row) {
      this.$message.info("查看监控详情：" + row.指标名称);
    },
    deleteRow(row) {
      this.$confirm("确定删除该监控配置吗？", "提示", { type: "warning" }).then(() => {
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
.mt10 { margin-top: 10px; }
.mb10 { margin-bottom: 10px; }
.crud-container { background: #fff; padding: 16px; border-radius: 4px; }
.operate-container { display: flex; justify-content: space-between; align-items: center; }
.analysis-panel { display: flex; gap: 16px; margin-bottom: 16px; }
.metric-card { flex: 1; padding: 12px; background: #f5f7fa; border-radius: 4px; text-align: center; }
.metric-card span { display: block; font-size: 12px; color: #909399; margin-bottom: 4px; }
.metric-card strong { font-size: 20px; color: #303133; }
.bar-list { margin-top: 12px; }
.bar-row { display: flex; align-items: center; margin-bottom: 8px; }
.bar-row span { width: 80px; font-size: 13px; color: #606266; }
.bar-track { flex: 1; height: 16px; background: #f0f0f0; border-radius: 8px; overflow: hidden; }
.bar-value { height: 100%; background: #409eff; border-radius: 8px; transition: width 0.3s; }
.bar-row em { width: 40px; text-align: right; font-size: 12px; color: #909399; font-style: normal; margin-left: 8px; }
</style>
