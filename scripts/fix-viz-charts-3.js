/**
 * 直接在 openOperationDialog 后面插入 initVizCharts 方法
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

const INIT_METHOD = `
    initVizCharts() {
      var echarts = require("echarts");
      if (this.$refs.vizLineChart) {
        var lineChart = echarts.init(this.$refs.vizLineChart);
        lineChart.setOption({
          tooltip: { trigger: "axis" },
          legend: { data: this.vizLineData.series.map(function(s){ return s.name; }) },
          grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
          xAxis: { type: "category", data: this.vizLineData.labels },
          yAxis: { type: "value" },
          series: this.vizLineData.series.map(function(s, i) {
            return {
              name: s.name, type: "line", smooth: true, data: s.data,
              itemStyle: { color: ["#409eff","#67c23a","#f56c6c"][i] },
              areaStyle: { color: ["rgba(64,158,255,0.15)","rgba(103,194,58,0.15)","rgba(245,108,108,0.15)"][i] }
            };
          })
        });
        this._vizLineChart = lineChart;
      }
      if (this.$refs.vizPieChart) {
        var pieChart = echarts.init(this.$refs.vizPieChart);
        pieChart.setOption({
          tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
          legend: { bottom: "0%", left: "center" },
          series: [{
            type: "pie", radius: ["40%", "65%"], center: ["50%", "45%"],
            avoidLabelOverlap: true,
            itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
            label: { show: true, formatter: "{b}\\n{d}%" },
            data: this.vizPieData
          }]
        });
        this._vizPieChart = pieChart;
      }
    },`;

let count = 0;
for (const name of pages) {
  const filePath = path.join(basePath, name, "index.vue");
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, "utf8");

  // 检查方法定义是否存在（不仅仅是模板引用）
  if (content.includes("    initVizCharts()")) {
    console.log(`SKIP (already has method): ${name}`);
    continue;
  }

  // 在 openOperationDialog 的结束行后面插入
  const marker = "      this.vizVisible = true;\n    },";
  const idx = content.indexOf(marker);
  if (idx === -1) {
    console.log(`SKIP (marker not found): ${name}`);
    continue;
  }

  const insertPos = idx + marker.length;
  content = content.slice(0, insertPos) + INIT_METHOD + content.slice(insertPos);
  fs.writeFileSync(filePath, content, "utf8");
  count++;
  console.log(`UPDATED: ${name}`);
}

console.log(`\nDone. Updated ${count} files.`);
