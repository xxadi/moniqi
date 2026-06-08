<template>
  <div>
    <cs-searchpanel :searchConfig="searchConfig" :searchData="searchData" @handelSearch="search" @handelReset="reset" labelWidth="100px"></cs-searchpanel>
    <div class="mt10 crud-container">
      <div class="mb10 operate-container">
        <div class="function-actions">
          <el-button plain type="primary" icon="el-icon-view" @click='handleFunction("4A上报数据对比监控", "monitor")'>4A上报数据对比监控</el-button>
          <el-button plain type="primary" icon="el-icon-warning" @click='handleFunction("4A上报数据对比监控告警", "alert")'>4A上报数据对比监控告警</el-button>
          <el-button plain type="primary" icon="el-icon-bell" @click='handleFunction("4A上报数据对比稽核", "audit")'>4A上报数据对比稽核</el-button>
          <el-button plain type="primary" icon="el-icon-data-analysis" @click='handleFunction("4A上报数据对比统计", "stats")'>4A上报数据对比统计</el-button>
          <el-button plain type="primary" icon="el-icon-download" @click='handleFunction("4A上报数据对比数据采集", "collect")'>4A上报数据对比数据采集</el-button>
          <el-button plain type="primary" icon="el-icon-setting" @click='handleFunction("4A上报数据对比数据预处理", "preprocess")'>4A上报数据对比数据预处理</el-button>
        </div>
        <el-button type="text" icon="el-icon-back" @click="$router.back()">返回上级</el-button>
      </div>
      <cs-pagetable pageTableRef="pageTableRef" :showSelection="true" :tableData="tableData" :tableColumns="tableColumns" :pageTotal="pageTotal" :page.sync="pageOptions.pageNum" :limit.sync="pageOptions.pageSize" @handleSelectionChange="handleSelectionChange" @handleSelectAll="handleSelectionChange" @handleCurrentChange="fetchData" @handleSizeChange="fetchData">
        <el-table-column slot="operate" label="操作" width="260" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" icon="el-icon-view" @click="detail(scope.row)">详情</el-button>
            <el-button type="text" icon="el-icon-delete" style="color:#F56C6C" @click="deleteRow(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </cs-pagetable>
    </div>

    <el-dialog title="4A上报数据对比监控" :visible.sync="monitorVisible" width="800px" append-to-body>
      <el-row :gutter="20" style="margin-bottom:20px;">
        <el-col :span="6">
          <el-card shadow="hover">
            <div slot="header"><span>对比总数</span></div>
            <div style="text-align:center;font-size:24px;color:#409EFF;">2,560</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div slot="header"><span>匹配成功</span></div>
            <div style="text-align:center;font-size:24px;color:#67C23A;">2,432</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div slot="header"><span>匹配失败</span></div>
            <div style="text-align:center;font-size:24px;color:#F56C6C;">128</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div slot="header"><span>匹配率</span></div>
            <div style="text-align:center;font-size:24px;color:#E6A23C;">95.0%</div>
          </el-card>
        </el-col>
      </el-row>
      <el-table :data="monitorLogs" border size="mini" style="width:100%">
        <el-table-column prop="time" label="时间" width="160"></el-table-column>
        <el-table-column prop="type" label="类型" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.type === '成功' ? 'success' : scope.row.type === '失败' ? 'danger' : 'info'" size="mini">{{ scope.row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="数据源" width="120"></el-table-column>
        <el-table-column prop="message" label="描述"></el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="monitorVisible = false">关闭</el-button>
        <el-button type="primary" @click="monitorVisible = false; $message.success('监控数据已刷新')">刷新</el-button>
      </span>
    </el-dialog>

    <el-dialog title="4A上报数据对比监控告警" :visible.sync="alertVisible" width="700px" append-to-body>
      <el-table :data="alertList" border size="mini" style="width:100%">
        <el-table-column prop="time" label="告警时间" width="160"></el-table-column>
        <el-table-column prop="level" label="级别" width="80" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.level === '紧急' ? 'danger' : scope.row.level === '重要' ? 'warning' : 'info'" size="mini">{{ scope.row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="告警标题" width="180"></el-table-column>
        <el-table-column prop="content" label="告警内容"></el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
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

    <el-dialog title="4A上报数据对比稽核" :visible.sync="auditVisible" width="700px" append-to-body>
      <el-table :data="auditList" border size="mini" style="width:100%">
        <el-table-column prop="time" label="稽核时间" width="160"></el-table-column>
        <el-table-column prop="rule" label="稽核规则" width="150"></el-table-column>
        <el-table-column prop="result" label="稽核结果" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.result === '通过' ? 'success' : 'danger'" size="mini">{{ scope.row.result }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="detail" label="稽核详情"></el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="auditVisible = false">关闭</el-button>
        <el-button type="primary" @click="auditVisible = false; $message.success('稽核报告已导出')">导出报告</el-button>
      </span>
    </el-dialog>

    <el-dialog title="4A上报数据对比统计" :visible.sync="statsVisible" width="720px" append-to-body>
      <div class="analysis-panel">
        <div v-for="item in statsMetrics" :key="item.label" class="metric-card">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
      <div class="bar-list">
        <div v-for="item in statsData" :key="item.name" class="bar-row">
          <span>{{ item.name }}</span>
          <div class="bar-track">
            <div class="bar-value" :style="{ width: item.value + '%' }"></div>
          </div>
          <em>{{ item.value }}%</em>
        </div>
      </div>
      <span slot="footer">
        <el-button @click="statsVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { filterData } from "@/utils/index";

const rows = [
  { ID: 1, 对比编号: "CMP-001", 对比名称: "资产编码对比", 对比类型: "资产信息", 数据源: "4A系统", 对比结果: "匹配成功", 对比时间: "2026-06-03 08:30:00", 处理状态: "正常" },
  { ID: 2, 对比编号: "CMP-002", 对比名称: "资产状态对比", 对比类型: "运行数据", 数据源: "监控系统", 对比结果: "匹配失败", 对比时间: "2026-06-03 09:15:00", 处理状态: "异常" },
  { ID: 3, 对比编号: "CMP-003", 对比名称: "配置信息对比", 对比类型: "配置信息", 数据源: "4A系统", 对比结果: "匹配成功", 对比时间: "2026-06-03 10:20:00", 处理状态: "正常" },
  { ID: 4, 对比编号: "CMP-004", 对比名称: "网络配置对比", 对比类型: "配置信息", 数据源: "资产库", 对比结果: "匹配失败", 对比时间: "2026-06-03 11:45:00", 处理状态: "异常" },
  { ID: 5, 对比编号: "CMP-005", 对比名称: "安全策略对比", 对比类型: "安全数据", 数据源: "4A系统", 对比结果: "匹配成功", 对比时间: "2026-06-03 14:30:00", 处理状态: "正常" },
];

const cols = [
  { prop: "对比编号", label: "对比编号", type: "text", search: true },
  { prop: "对比名称", label: "对比名称", type: "text", search: true },
  { prop: "对比类型", label: "对比类型", type: "select", options: [{ value: "资产信息", label: "资产信息" }, { value: "配置信息", label: "配置信息" }, { value: "运行数据", label: "运行数据" }, { value: "安全数据", label: "安全数据" }], search: true },
  { prop: "数据源", label: "数据源", type: "select", options: [{ value: "4A系统", label: "4A系统" }, { value: "资产库", label: "资产库" }, { value: "监控系统", label: "监控系统" }], search: true },
  { prop: "对比结果", label: "对比结果", type: "select", options: [{ value: "匹配成功", label: "匹配成功" }, { value: "匹配失败", label: "匹配失败" }], search: true },
  { prop: "对比时间", label: "对比时间", type: "text", width: 170 },
  { prop: "处理状态", label: "处理状态", type: "select", options: [{ value: "正常", label: "正常" }, { value: "异常", label: "异常" }], search: true },
  { slot: "operate", label: "操作" },
];

export default {
  name: "4AYN_4AShangBaoShuJuDuiBiZongHeGuanLi",
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
      monitorVisible: false,
      monitorLogs: [],
      alertVisible: false,
      alertList: [],
      auditVisible: false,
      auditList: [],
      statsVisible: false,
      statsMetrics: [],
      statsData: [],
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
      if (type === "monitor") {
        this.monitorLogs = [
          { time: this.now(), type: "成功", source: "4A系统", message: "资产编码对比完成，匹配率95%" },
          { time: this.now(), type: "失败", source: "监控系统", message: "资产状态对比异常，发现128条不匹配" },
          { time: this.now(), type: "成功", source: "资产库", message: "配置信息对比完成，全部匹配" },
        ];
        this.monitorVisible = true;
      } else if (type === "alert") {
        this.alertList = [
          { time: this.now(), level: "紧急", title: "对比失败率超标", content: "资产状态对比失败率超过10%阈值", status: "处理中" },
          { time: this.now(), level: "重要", title: "批量对比异常", content: "发现50条以上相同类型对比失败", status: "待处理" },
          { time: this.now(), level: "一般", title: "每日对比统计", content: "今日对比2560条，失败128条", status: "已处理" },
        ];
        this.alertVisible = true;
      } else if (type === "audit") {
        this.auditList = [
          { time: this.now(), rule: "资产编码一致性", result: "通过", detail: "2560条资产编码全部匹配" },
          { time: this.now(), rule: "资产状态有效性", result: "不通过", detail: "发现128条资产状态不一致" },
          { time: this.now(), rule: "配置信息规范性", result: "通过", detail: "512条配置信息符合规范" },
          { time: this.now(), rule: "网络配置准确性", result: "不通过", detail: "发现15条网络配置差异" },
        ];
        this.auditVisible = true;
      } else if (type === "stats") {
        this.statsMetrics = [
          { label: "总对比数", value: "2,560" },
          { label: "匹配成功", value: "2,432" },
          { label: "匹配率", value: "95.0%" },
          { label: "平均耗时", value: "1.8s" },
        ];
        this.statsData = [
          { name: "资产信息", value: 96 },
          { name: "配置信息", value: 94 },
          { name: "运行数据", value: 92 },
          { name: "安全数据", value: 98 },
        ];
        this.statsVisible = true;
      } else if (type === "collect") {
        this.$message.success("正在采集4A上报数据对比...");
      } else if (type === "preprocess") {
        this.$message.success("正在预处理对比数据...");
      }
    },
    detail(row) {
      this.$message.info("查看对比详情：" + row.对比编号);
    },
    deleteRow(row) {
      this.$confirm("确定删除该对比记录吗？", "提示", { type: "warning" }).then(() => {
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
