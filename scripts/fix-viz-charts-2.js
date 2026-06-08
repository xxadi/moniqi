/**
 * 为8个报表页面补充：data属性、initVizCharts方法、beforeDestroy钩子
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

const INIT_VIZ_CHARTS_METHOD = `
    initVizCharts() {
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

const BEFORE_DESTROY = `
    beforeDestroy() {
      if (this._vizLineChart) { this._vizLineChart.dispose(); }
      if (this._vizPieChart) { this._vizPieChart.dispose(); }
    },`;

let count = 0;
for (const name of pages) {
  const filePath = path.join(basePath, name, "index.vue");
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP: ${name}`);
    continue;
  }
  let content = fs.readFileSync(filePath, "utf8");
  let changed = false;

  // 1. 替换 data 中旧的 vizMetrics/vizBars 为 vizLineData/vizPieData
  if (content.includes("vizMetrics:") && content.includes("vizBars:")) {
    content = content.replace(
      /      vizMetrics: \[\],\s*\n      vizBars: \[\],/,
      `      vizLineData: { labels: [], series: [] },\n      vizPieData: [],`
    );
    changed = true;
  }

  // 2. 在 openOperationDialog 方法后面插入 initVizCharts（如果还没有）
  if (!content.includes("initVizCharts")) {
    // 找到 openOperationDialog 的结尾 }, 后面
    const re = /(    openOperationDialog\(functionName, S, now\) \{[\s\S]*?this\.vizVisible = true;\s*\n    \},)/;
    if (re.test(content)) {
      content = content.replace(re, "$1" + INIT_VIZ_CHARTS_METHOD);
      changed = true;
    }
  }

  // 3. 在 methods: { 后面插入 beforeDestroy（如果还没有）
  if (!content.includes("beforeDestroy")) {
    content = content.replace(
      /(  methods: \{)/,
      BEFORE_DESTROY + "\n  $1"
    );
    changed = true;
  }

  // 4. 删除旧的 non-scoped <style> 块（如果有 viz-metrics 相关样式）
  const oldStyleRe = /\n<style>\s*\.viz-metrics[\s\S]*?<\/style>/;
  if (oldStyleRe.test(content)) {
    content = content.replace(oldStyleRe, "");
    changed = true;
  }

  // 5. 添加 echarts 容器样式（不需要，因为 inline style 已经设了 width/height）

  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
    count++;
    console.log(`UPDATED: ${name}`);
  } else {
    console.log(`SKIP (no changes): ${name}`);
  }
}

console.log(`\nDone. Updated ${count} files.`);
