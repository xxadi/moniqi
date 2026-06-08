/**
 * 将8个报表页面的可视化弹窗从文字+条形图改为 ECharts 折线图+饼图
 */
const fs = require("fs");
const path = require("path");

const pages = [
  "IP纳管对比报表",
  "主机资产报表",
  "备案验证结果报表",
  "模拟采集资产报表",
  "暴露面资产纳管报表报表",
  "自定义项校验结果报表",
  "虚拟资产纳管报表",
  "资产类别缺失报表",
];

const basePath = path.join(
  __dirname,
  "..",
  "src",
  "views",
  "资产信息上报调整",
  "JL吉林COSMIC"
);

// 新的可视化弹窗模板
const NEW_VIZ_DIALOG = `    <!-- 可视化展示弹窗 -->
    <el-dialog :title="vizTitle" :visible.sync="vizVisible" width="780px" append-to-body @opened="initVizCharts">
      <div ref="vizLineChart" style="width:100%;height:300px;"></div>
      <div ref="vizPieChart" style="width:100%;height:300px;margin-top:10px;"></div>
    </el-dialog>`;

// 旧的可视化弹窗正则
const OLD_VIZ_DIALOG_RE = /    <!-- 可视化展示弹窗 -->\s*<el-dialog :title="vizTitle"[^>]*>[\s\S]*?<\/el-dialog>\s*\n/;

// 新的 openOperationDialog 方法
const NEW_OPEN_OPERATION = `    openOperationDialog(functionName, S, now) {
      this.vizTitle = functionName;
      const pick = (arr, i, seed) => arr[((seed || 0) + i) % arr.length];
      this.vizLineData = {
        labels: ["1月", "2月", "3月", "4月", "5月", "6月"],
        series: [
          { name: "总量", data: [pick([120,150,130,160], 0, S), pick([200,180,210,190], 0, S), pick([170,220,190,240], 0, S), pick([250,230,260,280], 0, S), pick([280,300,270,310], 0, S), pick([320,340,300,350], 0, S)] },
          { name: "已完成", data: [pick([100,130,110,140], 1, S), pick([170,160,180,170], 1, S), pick([150,190,170,210], 1, S), pick([220,200,230,250], 1, S), pick([250,270,240,280], 1, S), pick([290,310,270,320], 1, S)] },
          { name: "异常数", data: [pick([5,8,6,10], 2, S), pick([12,10,15,8], 2, S), pick([8,14,10,12], 2, S), pick([15,12,18,10], 2, S), pick([10,16,12,14], 2, S), pick([12,10,15,8], 2, S)] },
        ],
      };
      this.vizPieData = [
        { name: "已完成", value: pick([45, 50, 42, 48], 0, S) },
        { name: "处理中", value: pick([20, 18, 22, 16], 1, S) },
        { name: "待处理", value: pick([15, 12, 18, 14], 2, S) },
        { name: "异常", value: pick([10, 8, 12, 6], 3, S) },
        { name: "已关闭", value: pick([10, 12, 6, 16], 4, S) },
      ];
      this.vizVisible = true;
    },`;

// 旧的 openOperationDialog 正则
const OLD_OPEN_OPERATION_RE = /    \/\/ ─── 默认操作类弹窗 ───\s*\n\s*openOperationDialog\([\s\S]*?invokeVisible = true;\s*\n\s*\},/;

// 新的 initVizCharts 方法（插入到 openOperationDialog 后面）
const INIT_VIZ_CHARTS = `    initVizCharts() {
      const echarts = require("echarts");
      // 折线图
      if (this.$refs.vizLineChart) {
        const lineChart = echarts.init(this.$refs.vizLineChart);
        lineChart.setOption({
          tooltip: { trigger: "axis" },
          legend: { data: this.vizLineData.series.map(s => s.name) },
          grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
          xAxis: { type: "category", data: this.vizLineData.labels },
          yAxis: { type: "value" },
          series: this.vizLineData.series.map((s, i) => ({
            name: s.name,
            type: "line",
            smooth: true,
            data: s.data,
            itemStyle: { color: ["#409eff","#67c23a","#f56c6c"][i] },
            areaStyle: { color: ["rgba(64,158,255,0.15)","rgba(103,194,58,0.15)","rgba(245,108,108,0.15)"][i] },
          })),
        });
        this._vizLineChart = lineChart;
      }
      // 饼图
      if (this.$refs.vizPieChart) {
        const pieChart = echarts.init(this.$refs.vizPieChart);
        pieChart.setOption({
          tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
          legend: { bottom: "0%", left: "center" },
          series: [{
            type: "pie",
            radius: ["40%", "65%"],
            center: ["50%", "45%"],
            avoidLabelOverlap: true,
            itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
            label: { show: true, formatter: "{b}\\n{d}%" },
            data: this.vizPieData,
          }],
        });
        this._vizPieChart = pieChart;
      }
    },`;

// 新的 non-scoped 样式
const NEW_NON_SCOPED_STYLE = `<style>
.viz-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px}
.viz-card{display:flex;flex-direction:column;align-items:center;padding:16px 12px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:10px;box-shadow:0 3px 12px rgba(102,126,234,0.25)}
.viz-card-label{font-size:12px;color:rgba(255,255,255,0.8);margin-bottom:6px}
.viz-card-value{font-size:26px;color:#fff;font-weight:700}
.viz-bars{display:flex;flex-direction:column;gap:12px}
.viz-bar-row{display:flex;align-items:center;gap:12px}
.viz-bar-label{width:60px;font-size:13px;color:#606266;text-align:right;flex-shrink:0}
.viz-bar-track{flex:1;height:20px;background:#f0f2f5;border-radius:10px;overflow:hidden}
.viz-bar-fill{height:100%;border-radius:10px;transition:width 0.6s ease}
.viz-bar-pct{width:40px;font-size:13px;color:#606266;text-align:left}
</style>`;

let count = 0;
for (const name of pages) {
  const filePath = path.join(basePath, name, "index.vue");
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP (not found): ${name}`);
    continue;
  }
  let content = fs.readFileSync(filePath, "utf8");
  let changed = false;

  // 1. 替换可视化弹窗模板
  if (OLD_VIZ_DIALOG_RE.test(content)) {
    content = content.replace(OLD_VIZ_DIALOG_RE, NEW_VIZ_DIALOG + "\n\n");
    changed = true;
  }

  // 2. 替换 openOperationDialog 方法
  if (OLD_OPEN_OPERATION_RE.test(content)) {
    content = content.replace(OLD_OPEN_OPERATION_RE, NEW_OPEN_OPERATION);
    changed = true;
  } else {
    // 备选：匹配更宽松的模式
    const looseRe = /    openOperationDialog\(functionName, S, now\) \{[\s\S]*?this\.vizVisible = true;\s*\n    \},/;
    if (looseRe.test(content)) {
      content = content.replace(looseRe, NEW_OPEN_OPERATION);
      changed = true;
    }
  }

  // 3. 在 openOperationDialog 后插入 initVizCharts 方法（如果还没有）
  if (!content.includes("initVizCharts")) {
    // 在 openOperationDialog 的 }, 后面插入
    const insertRe = /(openOperationDialog\(functionName, S, now\) \{[\s\S]*?this\.vizVisible = true;\s*\n    \},)/;
    if (insertRe.test(content)) {
      content = content.replace(insertRe, "$1\n" + INIT_VIZ_CHARTS);
      changed = true;
    }
  }

  // 4. 添加 echarts dispose 到 beforeDestroy（如果还没有）
  if (!content.includes("_vizLineChart") || !content.includes("beforeDestroy")) {
    // 在 methods: { 前面添加 beforeDestroy
    if (!content.includes("beforeDestroy")) {
      const methodsRe = /(export default \{[\s\S]*?data\(\) \{[\s\S]*?return \{)/;
      // 备选：在 methods 前插入
      const beforeMethodsRe = /(\n    methods: \{)/;
      if (beforeMethodsRe.test(content)) {
        content = content.replace(beforeMethodsRe, `
    beforeDestroy() {
      if (this._vizLineChart) { this._vizLineChart.dispose(); }
      if (this._vizPieChart) { this._vizPieChart.dispose(); }
    },
    $1`);
        changed = true;
      }
    }
  }

  // 5. 替换 non-scoped 样式块（删掉旧的 viz 相关样式）
  // 找到旧的 <style> 非 scoped 块并替换
  const oldStyleRe = /<style>\s*\.viz-metrics[\s\S]*?<\/style>/;
  if (oldStyleRe.test(content)) {
    content = content.replace(oldStyleRe, "");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
    count++;
    console.log(`UPDATED: ${name}`);
  } else {
    console.log(`SKIP (no changes): ${name}`);
  }
}

console.log(`\nDone. Updated ${count} files.`);
