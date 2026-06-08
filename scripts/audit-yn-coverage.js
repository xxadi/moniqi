const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const ROOT = path.join(__dirname, "..");
const EXCEL = path.join(ROOT, "中国移动云南公司2024年资产安全管理平台研发项目-评估结果(1).xlsx");
const VIEWS_DIR = path.join(ROOT, "src", "views", "资产信息上报调整", "YN云南COSMIC");
const ROUTES = path.join(ROOT, "src", "router", "modules", "examples.js");

const IGNORE_BUTTONS = new Set([
  "详情",
  "修改",
  "取消",
  "确定",
  "选择文件",
  "开始导入",
  "关闭",
  "确认处理",
  "重试调度",
  "确认发送",
  "保存配置",
  "确认",
  "确认接收",
  "重新调度",
  "确认调度",
  "暂停",
  "确认完成",
  "重试",
]);

function cleanName(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .trim();
}

function stripAction(value) {
  return cleanName(value)
    .replace(/^(新增|定义|修改|删除|查询|批量导入|导入|导出|上传|获取|配置|查看|新增)/, "")
    .replace(/(信息|数据|列表|详情|汇总报告详情|明细报告详情|接口监控|数据查询|数据上传|导出|监控|监控告警|告警|错误信息监控|错误事件通知|错误事件通知删除|错误事件通知查询)$/g, "")
    .replace(/管理$/, "");
}

function readExcelGroups() {
  const wb = XLSX.readFile(EXCEL);
  const ws = wb.Sheets["2、功能点拆分表"];
  if (!ws) throw new Error("Excel 中未找到工作表：2、功能点拆分表");

  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }).slice(3);
  const cols = [
    "客户需求",
    "功能用户",
    "功能用户需求",
    "触发事件",
    "功能过程",
    "子过程描述",
    "数据移动类型",
    "数据组",
    "数据属性",
  ];
  const last = {};
  const groups = new Map();

  for (const row of rows) {
    if (row.every((item) => item === "")) continue;
    cols.forEach((key, index) => {
      if (row[index] !== "" && row[index] != null) last[key] = row[index];
    });

    const page = cleanName(last["功能用户需求"]);
    const trigger = cleanName(last["触发事件"] || last["功能过程"]);
    if (!page || !trigger) continue;

    if (!groups.has(page)) {
      groups.set(page, {
        customerNeed: last["客户需求"] || "",
        user: last["功能用户"] || "",
        page,
        triggers: new Set(),
      });
    }
    groups.get(page).triggers.add(trigger);
  }

  return Array.from(groups.values()).map((group) => ({
    ...group,
    triggers: Array.from(group.triggers),
  }));
}

function listDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => item.name);
}

function extractButtonLabels(vuePath) {
  if (!fs.existsSync(vuePath)) return [];
  const content = fs.readFileSync(vuePath, "utf8");
  const labels = [];
  for (const match of content.matchAll(/<el-button[\s\S]*?>([\s\S]*?)<\/el-button>/g)) {
    const text = match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, "").trim();
    if (text && !IGNORE_BUTTONS.has(text)) labels.push(text);
  }
  return Array.from(new Set(labels));
}

function isCoveredByLabel(trigger, labels) {
  const t = cleanName(trigger);
  const core = stripAction(trigger);
  return labels.some((label) => {
    const l = cleanName(label);
    const lc = stripAction(label);
    return (
      l === t ||
      l.includes(t) ||
      t.includes(l) ||
      (core && lc && (core.includes(lc) || lc.includes(core) || l.includes(core) || t.includes(lc)))
    );
  });
}

function isCoveredBySubPage(trigger, subPages) {
  const t = cleanName(trigger);
  const core = stripAction(trigger);
  return subPages.some((subPage) => {
    const s = cleanName(subPage);
    const sc = stripAction(subPage);
    return (
      s === t ||
      s.includes(t) ||
      t.includes(s) ||
      (core && sc && (core.includes(sc) || sc.includes(core) || s.includes(core) || t.includes(sc)))
    );
  });
}

function audit() {
  const groups = readExcelGroups();
  const routesContent = fs.existsSync(ROUTES) ? fs.readFileSync(ROUTES, "utf8") : "";
  const result = {
    pagesExpected: groups.length,
    triggersExpected: groups.reduce((sum, group) => sum + group.triggers.length, 0),
    missingPages: [],
    missingRouteImports: [],
    suspiciousNames: [],
    pages: [],
  };

  for (const group of groups) {
    const pageDir = path.join(VIEWS_DIR, group.page);
    const vuePath = path.join(pageDir, "index.vue");
    const exists = fs.existsSync(vuePath);
    if (!exists) {
      result.missingPages.push(group.page);
      continue;
    }

    const routeImport = `@/views/资产信息上报调整/YN云南COSMIC/${group.page}/index`;
    if (!routesContent.includes(routeImport)) {
      result.missingRouteImports.push(group.page);
    }

    if (group.page !== group.page.trim() || /[\r\n\t]/.test(group.page)) {
      result.suspiciousNames.push(group.page);
    }

    const labels = extractButtonLabels(vuePath);
    const subPages = listDirs(pageDir);
    const missingTriggers = group.triggers.filter((trigger) => {
      return !isCoveredByLabel(trigger, labels) && !isCoveredBySubPage(trigger, subPages);
    });

    result.pages.push({
      page: group.page,
      user: group.user,
      triggerCount: group.triggers.length,
      buttonCount: labels.length,
      subPageCount: subPages.length,
      missingCount: missingTriggers.length,
      missingTriggers,
    });
  }

  result.pages.sort((a, b) => b.missingCount - a.missingCount || b.triggerCount - a.triggerCount);
  return result;
}

const result = audit();
const outDir = path.join(ROOT, "docs");
const jsonPath = path.join(outDir, "云南COSMIC功能点覆盖审计.json");
fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), "utf8");

console.log("云南 COSMIC 功能点覆盖审计");
console.log("期望页面数:", result.pagesExpected);
console.log("期望触发事件数:", result.triggersExpected);
console.log("缺失页面数:", result.missingPages.length);
console.log("缺失路由数:", result.missingRouteImports.length);
console.log("可疑名称数:", result.suspiciousNames.length);
console.log("覆盖缺口页面 TOP 20:");
result.pages.slice(0, 20).forEach((page) => {
  console.log(
    `${page.missingCount}\t${page.triggerCount}\tbuttons=${page.buttonCount}\tsub=${page.subPageCount}\t${page.page}`
  );
});
console.log("报告:", path.relative(ROOT, jsonPath));

if (result.missingPages.length || result.missingRouteImports.length) {
  process.exitCode = 2;
}
