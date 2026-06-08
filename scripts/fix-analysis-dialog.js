/**
 * 让每个页面的 openAnalysisDialog 根据 functionName 生成不同的分析内容
 */
const fs = require("fs");
const path = require("path");

const basePath = path.join(
  __dirname,
  "..",
  "src",
  "views",
  "资产信息上报调整",
  "JL吉林COSMIC"
);

const NEW_ANALYSIS = `    openAnalysisDialog(functionName, S, now) {
      this.analysisTitle = functionName;
      var kw = functionName;
      if (/资产|设备|主机|网络|虚拟|存储|终端|软件|品牌|型号|类型|分类|归属|备案/.test(kw)) {
        this.analysisMetrics = [
          { label: "资产总数", value: pick([1280, 2560, 5120, 3840], 0, S) },
          { label: "已纳管", value: pick([980, 2100, 4300, 3200], 1, S) },
          { label: "覆盖率", value: pick(["76.5%", "82.1%", "88.3%", "91.7%"], 2, S) },
          { label: "异常数", value: pick([12, 28, 45, 18], 3, S) },
        ];
        this.analysisBars = [
          { name: "服务器", value: pick([85, 88, 92, 96], 0, S) },
          { name: "网络设备", value: pick([70, 75, 80, 85], 1, S) },
          { name: "安全设备", value: pick([60, 65, 72, 78], 2, S) },
          { name: "终端设备", value: pick([50, 55, 62, 68], 3, S) },
        ];
      } else if (/扫描|探测|发现|识别/.test(kw)) {
        this.analysisMetrics = [
          { label: "扫描总量", value: pick([5600, 8400, 12000, 16800], 0, S) },
          { label: "存活主机", value: pick([1200, 2400, 3600, 4800], 1, S) },
          { label: "存活率", value: pick(["21.4%", "28.6%", "30.0%", "28.6%"], 2, S) },
          { label: "耗时", value: pick(["5.2s", "12.8s", "28.5s", "45.3s"], 3, S) },
        ];
        this.analysisBars = [
          { name: "端口开放", value: pick([35, 42, 55, 68], 0, S) },
          { name: "服务识别", value: pick([28, 38, 48, 58], 1, S) },
          { name: "系统指纹", value: pick([20, 30, 40, 50], 2, S) },
          { name: "漏洞检出", value: pick([5, 12, 18, 25], 3, S) },
        ];
      } else if (/指令|调度|同步|上报|下发|接收|反馈|通知/.test(kw)) {
        this.analysisMetrics = [
          { label: "指令总量", value: pick([3200, 6400, 9600, 12800], 0, S) },
          { label: "执行成功", value: pick([2800, 5600, 8400, 11200], 1, S) },
          { label: "成功率", value: pick(["87.5%", "91.2%", "93.8%", "95.6%"], 2, S) },
          { label: "平均耗时", value: pick(["120ms", "256ms", "512ms", "1024ms"], 3, S) },
        ];
        this.analysisBars = [
          { name: "即时执行", value: pick([75, 80, 85, 90], 0, S) },
          { name: "延迟执行", value: pick([10, 12, 15, 18], 1, S) },
          { name: "超时失败", value: pick([3, 5, 8, 12], 2, S) },
          { name: "重试成功", value: pick([5, 8, 10, 15], 3, S) },
        ];
      } else if (/校验|验证|比对|对比|一致性|合规|审计/.test(kw)) {
        this.analysisMetrics = [
          { label: "校验总量", value: pick([4500, 7800, 12000, 18000], 0, S) },
          { label: "通过数", value: pick([4200, 7200, 11000, 16500], 1, S) },
          { label: "通过率", value: pick(["93.3%", "92.3%", "91.7%", "91.7%"], 2, S) },
          { label: "异常项", value: pick([300, 600, 1000, 1500], 3, S) },
        ];
        this.analysisBars = [
          { name: "格式校验", value: pick([95, 96, 97, 98], 0, S) },
          { name: "完整性校验", value: pick([88, 90, 92, 94], 1, S) },
          { name: "一致性校验", value: pick([82, 85, 88, 91], 2, S) },
          { name: "合规性校验", value: pick([75, 80, 85, 90], 3, S) },
        ];
      } else if (/采集|抓取|获取|读取/.test(kw)) {
        this.analysisMetrics = [
          { label: "采集任务", value: pick([800, 1600, 3200, 4800], 0, S) },
          { label: "成功采集", value: pick([720, 1440, 2880, 4320], 1, S) },
          { label: "成功率", value: pick(["90.0%", "90.0%", "90.0%", "90.0%"], 2, S) },
          { label: "数据量", value: pick(["2.4GB", "5.8GB", "12.6GB", "28.3GB"], 3, S) },
        ];
        this.analysisBars = [
          { name: "主动采集", value: pick([70, 75, 80, 85], 0, S) },
          { name: "被动发现", value: pick([15, 18, 22, 25], 1, S) },
          { name: "接口同步", value: pick([8, 10, 12, 15], 2, S) },
          { name: "人工录入", value: pick([2, 3, 5, 8], 3, S) },
        ];
      } else if /告警|预警|监控|异常|故障/.test(kw) {
        this.analysisMetrics = [
          { label: "告警总数", value: pick([320, 640, 1280, 2560], 0, S) },
          { label: "已处理", value: pick([280, 560, 1100, 2200], 1, S) },
          { label: "处理率", value: pick(["87.5%", "87.5%", "85.9%", "85.9%"], 2, S) },
          { label: "平均响应", value: pick(["5min", "12min", "28min", "45min"], 3, S) },
        ];
        this.analysisBars = [
          { name: "严重", value: pick([8, 12, 15, 20], 0, S) },
          { name: "高", value: pick([15, 20, 25, 30], 1, S) },
          { name: "中", value: pick([30, 35, 40, 45], 2, S) },
          { name: "低", value: pick([40, 45, 50, 55], 3, S) },
        ];
      } else {
        this.analysisMetrics = [
          { label: "分析样本", value: pick([256, 512, 1024, 2048], 0, S) },
          { label: "异常检出", value: pick([3, 8, 15, 28], 1, S) },
          { label: "准确率", value: pick(["96.2%", "97.8%", "98.5%", "99.1%"], 2, S) },
          { label: "处理耗时", value: pick(["1.2s", "3.5s", "8.7s", "15.2s"], 3, S) },
        ];
        this.analysisBars = [
          { name: "正常", value: pick([85, 88, 92, 96], 0, S) },
          { name: "警告", value: pick([5, 8, 12, 15], 1, S) },
          { name: "异常", value: pick([1, 3, 5, 8], 2, S) },
          { name: "未知", value: pick([0, 1, 2, 3], 3, S) },
        ];
      }
      this.analysisVisible = true;
    },`;

function findVueFiles(dir) {
  const results = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results.push(...findVueFiles(full));
    } else if (item === "index.vue") {
      results.push(full);
    }
  }
  return results;
}

const files = findVueFiles(basePath);
let count = 0;

for (const filePath of files) {
  let content = fs.readFileSync(filePath, "utf8");
  if (!content.includes("openAnalysisDialog")) continue;

  // 匹配 openAnalysisDialog 方法（从定义到下一个方法或逗号结束）
  const re = /    openAnalysisDialog\(functionName, S, now\) \{[\s\S]*?this\.analysisVisible = true;\s*\n    \},/;
  if (re.test(content)) {
    content = content.replace(re, NEW_ANALYSIS);
    fs.writeFileSync(filePath, content, "utf8");
    count++;
  }
}

console.log(`Done. Updated ${count} files.`);
