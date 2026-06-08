<template>
  <div>
    <cs-searchpanel :searchConfig="searchConfig" :searchData="searchData" @handelSearch="search" @handelReset="reset" labelWidth="100px"></cs-searchpanel>
    <div class="mt10 crud-container">
      <div class="mb10 operate-container">
        <div class="function-actions">
          <el-button plain type="primary" icon="el-icon-view" @click='handleFunction("工信部与4A数据对比错误信息监控", "monitor_error")'>工信部与4A数据对比错误信息监控</el-button>
          <el-button plain type="primary" icon="el-icon-bell" @click='handleFunction("工信部与4A数据对比错误事件通知", "notify_error")'>工信部与4A数据对比错误事件通知</el-button>
          <el-button plain type="primary" icon="el-icon-download" @click='handleFunction("错误信息导出", "export_error")'>错误信息导出</el-button>
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

    <el-dialog title="工信部与4A数据对比错误信息监控" :visible.sync="monitorVisible" width="800px" append-to-body>
      <el-row :gutter="20" style="margin-bottom:20px;">
        <el-col :span="6">
          <el-card shadow="hover">
            <div slot="header"><span>错误总数</span></div>
            <div style="text-align:center;font-size:24px;color:#F56C6C;">156</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div slot="header"><span>已处理</span></div>
            <div style="text-align:center;font-size:24px;color:#67C23A;">128</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div slot="header"><span>待处理</span></div>
            <div style="text-align:center;font-size:24px;color:#E6A23C;">28</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div slot="header"><span>处理率</span></div>
            <div style="text-align:center;font-size:24px;color:#409EFF;">82.1%</div>
          </el-card>
        </el-col>
      </el-row>
      <el-table :data="monitorLogs" border size="mini" style="width:100%">
        <el-table-column prop="time" label="时间" width="160"></el-table-column>
        <el-table-column prop="type" label="类型" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.type === '严重' ? 'danger' : scope.row.type === '警告' ? 'warning' : 'info'" size="mini">{{ scope.row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="数据源" width="120"></el-table-column>
        <el-table-column prop="message" label="错误描述"></el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="monitorVisible = false">关闭</el-button>
        <el-button type="primary" @click="monitorVisible = false; $message.success('监控数据已刷新')">刷新</el-button>
      </span>
    </el-dialog>

    <el-dialog title="工信部与4A数据对比错误事件通知" :visible.sync="notifyVisible" width="700px" append-to-body>
      <el-table :data="notifyList" border size="mini" style="width:100%">
        <el-table-column prop="time" label="通知时间" width="160"></el-table-column>
        <el-table-column prop="level" label="级别" width="80" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.level === '紧急' ? 'danger' : scope.row.level === '重要' ? 'warning' : 'info'" size="mini">{{ scope.row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="通知标题" width="180"></el-table-column>
        <el-table-column prop="content" label="通知内容"></el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === '已读' ? 'success' : 'info'" size="mini">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="notifyVisible = false">关闭</el-button>
        <el-button type="primary" @click="notifyVisible = false; $message.success('已全部标记为已读')">全部已读</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { filterData } from "@/utils/index";

const rows = [
  { ID: 1, 错误编号: "ERR-GX-001", 错误类型: "数据格式错误", 数据源: "工信部系统", 错误描述: "资产编码格式不符合规范", 发现时间: "2026-06-03 08:30:00", 处理状态: "已处理" },
  { ID: 2, 错误编号: "ERR-GX-002", 错误类型: "字段缺失", 数据源: "4A系统", 错误描述: "必填字段'资产负责人'为空", 发现时间: "2026-06-03 09:15:00", 处理状态: "待处理" },
  { ID: 3, 错误编号: "ERR-GX-003", 错误类型: "数据重复", 数据源: "工信部系统", 错误描述: "资产编号ASSET-001重复上报", 发现时间: "2026-06-03 10:20:00", 处理状态: "处理中" },
  { ID: 4, 错误编号: "ERR-GX-004", 错误类型: "同步超时", 数据源: "4A系统", 错误描述: "数据同步接口响应超时(>5s)", 发现时间: "2026-06-03 11:45:00", 处理状态: "已处理" },
  { ID: 5, 错误编号: "ERR-GX-005", 错误类型: "数据格式错误", 数据源: "工信部系统", 错误描述: "IP地址格式不正确", 发现时间: "2026-06-03 14:30:00", 处理状态: "待处理" },
];

const cols = [
  { prop: "错误编号", label: "错误编号", type: "text", search: true },
  { prop: "错误类型", label: "错误类型", type: "select", options: [{ value: "数据格式错误", label: "数据格式错误" }, { value: "字段缺失", label: "字段缺失" }, { value: "数据重复", label: "数据重复" }, { value: "同步超时", label: "同步超时" }], search: true },
  { prop: "数据源", label: "数据源", type: "select", options: [{ value: "工信部系统", label: "工信部系统" }, { value: "4A系统", label: "4A系统" }], search: true },
  { prop: "错误描述", label: "错误描述", type: "text" },
  { prop: "发现时间", label: "发现时间", type: "text", width: 170 },
  { prop: "处理状态", label: "处理状态", type: "select", options: [{ value: "待处理", label: "待处理" }, { value: "处理中", label: "处理中" }, { value: "已处理", label: "已处理" }], search: true },
  { slot: "operate", label: "操作" },
];

export default {
  name: "4AYN_GongXinBuYu4AShuJuDuiBiCuoWuGuanLi",
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
      notifyVisible: false,
      notifyList: [],
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
      if (type === "monitor_error") {
        this.monitorLogs = [
          { time: this.now(), type: "严重", source: "工信部系统", message: "数据同步接口连续3次失败" },
          { time: this.now(), type: "警告", source: "4A系统", message: "资产数据格式错误率超过5%" },
          { time: this.now(), type: "提示", source: "工信部系统", message: "数据校验完成，发现12条异常" },
        ];
        this.monitorVisible = true;
      } else if (type === "notify_error") {
        this.notifyList = [
          { time: this.now(), level: "紧急", title: "数据同步异常告警", content: "工信部与4A数据同步接口异常，请及时处理", status: "未读" },
          { time: this.now(), level: "重要", title: "数据格式错误提醒", content: "发现15条资产数据格式不符合规范", status: "已读" },
          { time: this.now(), level: "一般", title: "每日错误统计", content: "今日共发现28条错误，已处理20条", status: "未读" },
        ];
        this.notifyVisible = true;
      } else if (type === "export_error") {
        this.$message.success("正在导出错误信息...");
      }
    },
    detail(row) {
      this.$message.info("查看错误详情：" + row.错误编号);
    },
    deleteRow(row) {
      this.$confirm("确定删除该错误记录吗？", "提示", { type: "warning" }).then(() => {
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
</style>
