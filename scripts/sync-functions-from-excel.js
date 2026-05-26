const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const { pinyin } = require("pinyin-pro");

const rootDir = path.resolve(__dirname, "..");
const excelFile = path.join(
  rootDir,
  "3.9.山东移动2025年资产安全管理平台改造研发项目-功能点拆分表NESMA(后评估）.xlsx",
);
const functionsFile = path.join(rootDir, "module_functions.json");
const routesFile = path.join(rootDir, "src/router/modules/examples.js");
const viewsDir = path.join(rootDir, "src/views");

const clean = (value) => String(value || "").trim();
const js = (value) => JSON.stringify(value);
const safeSegment = (value) =>
  clean(value)
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "、")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "") || "未命名";

function pageHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 100000;
  return h;
}

const pick = (items, index, seed) => items[(seed + index) % items.length];

function readGroups() {
  const workbook = xlsx.readFile(excelFile);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const header = rows[1] || [];
  const columns = {
    subsystem: header.indexOf("子系统"),
    level1: header.indexOf("一级模块"),
    level2: header.indexOf("二级模块"),
    level3: header.indexOf("三级模块"),
    functionName: header.indexOf("功能点计数项名称"),
  };

  for (const [name, index] of Object.entries(columns)) {
    if (index === -1) {
      throw new Error(`Excel 缺少必要列: ${name}`);
    }
  }

  const current = { subsystem: "", level1: "", level2: "", level3: "" };
  const groups = new Map();

  for (const row of rows.slice(2)) {
    if (clean(row[columns.subsystem])) current.subsystem = clean(row[columns.subsystem]);
    if (clean(row[columns.level1])) current.level1 = clean(row[columns.level1]);
    if (clean(row[columns.level2])) current.level2 = clean(row[columns.level2]);
    if (clean(row[columns.level3])) current.level3 = clean(row[columns.level3]);

    const functionName = clean(row[columns.functionName]);
    if (!current.level3 || !functionName) continue;

    if (!groups.has(current.level3)) {
      groups.set(current.level3, {
        subsystem: current.subsystem,
        level1: current.level1,
        level2: current.level2,
        level3: current.level3,
        functions: [],
      });
    }

    const group = groups.get(current.level3);
    if (!group.functions.includes(functionName)) {
      group.functions.push(functionName);
    }
  }

  return Array.from(groups.values());
}

function writeFunctions(groups) {
  const data = {};
  groups.forEach((group) => {
    data[group.level3] = group;
  });
  fs.writeFileSync(functionsFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function groupBy(items, key) {
  const map = new Map();
  items.forEach((item) => {
    const value = item[key] || "未分类";
    if (!map.has(value)) map.set(value, []);
    map.get(value).push(item);
  });
  return map;
}

function toPinyin(str) {
  return pinyin(str, { toneType: "none", type: "array" })
    .map((s, i) => (i === 0 ? s.charAt(0).toLowerCase() + s.slice(1) : s.charAt(0).toUpperCase() + s.slice(1)))
    .join("");
}

function routePath(name) {
  return toPinyin(name);
}

function writeRoutes(groups) {
  const lines = [
    "/* Layout */",
    'import Layout from "@/layout";',
    'import Parent from "@/layout/components/ParentView";',
    "",
    "const examplesRoutes = [",
  ];

  Array.from(groupBy(groups, "level1").entries()).forEach(([level1, level1Groups], level1Index) => {
    lines.push("  {");
    lines.push(`    path: ${js(`/${routePath(level1)}`)},`);
    lines.push(`    name: ${js(level1)},`);
    lines.push(`    meta: { title: ${js(level1)}, icon: "setting" },`);
    lines.push("    component: Layout,");
    lines.push("    children: [");

    Array.from(groupBy(level1Groups, "level2").entries()).forEach(([level2, level2Groups], level2Index) => {
      lines.push("      {");
      lines.push(`        path: ${js(routePath(level2))},`);
      lines.push(`        name: ${js(level2)},`);
      lines.push(`        meta: { title: ${js(level2)} },`);
      lines.push("        component: Parent,");
      lines.push("        children: [");

      level2Groups.forEach((group, level3Index) => {
        const viewPath = `@/views/${safeSegment(group.level1)}/${safeSegment(group.level2)}/${safeSegment(group.level3)}/index`;
        lines.push("          {");
        lines.push(`            path: ${js(routePath(group.level3))},`);
        lines.push(`            name: ${js(`${group.level3}-${level1Index + 1}-${level2Index + 1}-${level3Index + 1}`)},`);
        lines.push(`            meta: { title: ${js(group.level3)} },`);
        lines.push(`            component: () => import(${js(viewPath)}),`);
        lines.push("          },");
      });

      lines.push("        ],");
      lines.push("      },");
    });

    lines.push("    ],");
    lines.push("  },");
  });

  lines.push("];");
  lines.push("");
  lines.push("export default examplesRoutes;");
  fs.writeFileSync(routesFile, `${lines.join("\n")}\n`, "utf8");
}

function getActionType(functionName) {
  if (/导入|上传/.test(functionName)) return "import";
  if (/导出|下载/.test(functionName)) return "export";
  if (/删除|移除|作废|清理/.test(functionName)) return "delete";
  if (/修改|编辑|更新|配置|维护|设置|调整/.test(functionName)) return "edit";
  if (/新增|添加|创建|生成|发起|启动|新建|登记/.test(functionName)) return "add";
  if (/查看|查询|详情|监控|检索|展示/.test(functionName)) return "detail";
  if (/分析|统计|评估|报告|报表|可视化|汇总/.test(functionName)) return "analysis";
  return "operation";
}

function getIcon(functionName) {
  const iconMap = {
    import: "el-icon-upload2",
    export: "el-icon-download",
    delete: "el-icon-delete",
    edit: "el-icon-edit",
    add: "el-icon-plus",
    detail: "el-icon-view",
    analysis: "el-icon-data-analysis",
    operation: "el-icon-s-operation",
  };
  return iconMap[getActionType(functionName)];
}

function createButtons(functions) {
  return functions
    .map((functionName) => {
      const actionType = getActionType(functionName);
      return `          <el-button plain type="primary" icon="${getIcon(functionName)}" @click='handleFunction(${js(functionName)}, ${js(actionType)})'>${functionName}</el-button>`;
    })
    .join("\n");
}

function createColumns(names) {
  return names.map((name, index) => ({
    prop: name,
    label: name,
    type: "text",
    search: index < 3,
    showTooltip: true,
    width: /时间|日志|范围|地址/.test(name) ? 170 : undefined,
  }));
}

function makeProfile(kind, columns, rowBuilder) {
  return { kind, columns: createColumns(columns), rowBuilder };
}

function createTableProfile(group) {
  const name = `${group.level1} ${group.level2} ${group.level3}`;
  const page = group.level3;
  const L2 = group.level2;
  const S = pageHash(page);
  const uid = (prefix, i) => String(S + pageHash(prefix) + i * 7919).slice(-8);
  const times = [
    "2026-05-08 09:12:18",
    "2026-05-08 09:35:44",
    "2026-05-08 10:08:06",
    "2026-05-08 10:42:31",
    "2026-05-08 11:16:09",
    "2026-05-08 14:03:52",
    "2026-05-08 15:21:37",
    "2026-05-08 16:08:25",
    "2026-05-09 08:33:11",
    "2026-05-09 09:47:56",
  ];
  const t = (i) => times[(S + i) % times.length];

  // ─── 指令下发 ───
  if (/下发|指令.*发送|派发/.test(page)) {
    return makeProfile("下发", ["下发编号", "指令类型", "目标范围", "接收系统", "下发状态", "下发时间"], (i) => ({
      下发编号: `XF-${uid("XF", i)}`,
      指令类型: pick(["IP扫描", "端口探测", "资产核查", "漏洞验证", "配置核验", "指纹采集", "合规巡检", "拓扑发现"], i, S),
      目标范围: pick(["10.24.18.0/24", "10.25.6.0/24", "172.20.14.0/24", "10.30.9.0/24", "192.168.1.0/24", "10.50.12.0/24", "172.16.0.0/16", "10.100.8.0/24"], i, S),
      接收系统: pick(["省侧扫描网关", "资产安全联动平台", "4A运维审计系统", "CMDB同步服务", "漏洞管理平台", "态势感知系统", "安全运营中心", "日志审计平台"], i, S),
      下发状态: pick(["已下发", "待回执", "执行中", "已完成", "下发失败", "部分回执", "已撤回", "超时未回"], i, S),
      下发时间: t(i),
    }));
  }

  // ─── 指令接收解析（工信部资产扫描联动）───
  if (/接收|解析/.test(page) && /工信部|扫描/.test(L2)) {
    return makeProfile("扫描指令接收", ["接收编号", "指令流水号", "来源系统", "扫描类型", "IP段数量", "解析状态", "入库状态"], (i) => ({
      接收编号: `SJ-${uid("SJ", i)}`,
      指令流水号: `CMD-${uid("CMD", i)}`,
      来源系统: pick(["工信部扫描接口", "集团安全平台", "部侧联动网关", "省际互联通道"], i, S),
      扫描类型: pick(["IPv4快速扫描", "IPv6深度扫描", "端口全量探测", "漏洞专项扫描", "指纹精准识别", "合规基线扫描"], i, S),
      IP段数量: pick([12, 28, 45, 67, 89, 134, 256, 512], i, S),
      解析状态: pick(["校验通过", "待补充字段", "已解析", "格式异常", "字段映射完成", "版本不兼容"], i, S),
      入库状态: pick(["已入库", "待入库", "重复忽略", "入库失败", "部分入库", "已归档"], i, S),
    }));
  }

  // ─── 入库管理 ───
  if (/入库|归档|存储/.test(page)) {
    return makeProfile("入库", ["入库编号", "数据来源", "数据格式", "记录总数", "入库耗时", "入库状态", "完成时间"], (i) => ({
      入库编号: `RK-${uid("RK", i)}`,
      数据来源: pick(["指令解析引擎", "资产采集器", "漏洞扫描器", "CMDB同步", "手工导入", "接口推送", "批量采集", "日志转发"], i, S),
      数据格式: pick(["JSON", "XML", "CSV", "Protobuf", "Avro", "SQL", "TSV", "YAML"], i, S),
      记录总数: pick([128, 256, 512, 1024, 2048, 4096, 8192, 16384], i, S),
      入库耗时: pick(["1.2s", "3.5s", "8.7s", "15.3s", "22.1s", "45.6s", "68.2s", "120.4s"], i, S),
      入库状态: pick(["入库完成", "入库中", "待入库", "入库失败", "部分入库", "已回滚", "重复跳过", "格式修正后入库"], i, S),
      完成时间: t(i),
    }));
  }

  // ─── 指令接收解析（其他模块，仅匹配 level3 页面名）───
  if (/接收|解析/.test(page)) {
    return makeProfile("接收", ["接收编号", "来源系统", "指令类型", "解析状态", "接收时间", "入库状态"], (i) => ({
      接收编号: `JS-${uid("JS", i)}`,
      来源系统: pick(["工信部资产安全接口", "集团资产安全平台", "省内综合网关", "CMDB推送通道", "漏洞情报中心", "资产管理台账", "安全基线平台", "态势感知平台"], i, S),
      指令类型: pick(["IP扫描指令", "资产核验指令", "日志采集指令", "异常复核指令", "漏洞扫描指令", "配置备份指令", "拓扑采集指令", "指纹更新指令"], i, S),
      解析状态: pick(["校验通过", "待补充字段", "已解析", "格式异常", "字段映射完成", "待人工确认", "部分解析", "版本不兼容"], i, S),
      接收时间: t(i),
      入库状态: pick(["已入库", "待入库", "重复忽略", "入库失败", "部分入库", "待审批入库", "已归档", "已回退"], i, S),
    }));
  }

  // ─── 反馈回执 ───
  if (/反馈|回执|返回/.test(page)) {
    return makeProfile("反馈", ["反馈编号", "关联指令", "反馈结果", "回执状态", "反馈时间", "失败原因"], (i) => ({
      反馈编号: `FK-${uid("FK", i)}`,
      关联指令: `CMD-${uid("CMD", i + 20)}`,
      反馈结果: pick(["处理成功", "部分成功", "等待执行", "执行失败", "超时未响应", "权限不足", "资源不可达", "格式校验失败"], i, S),
      回执状态: pick(["已回执", "待回执", "回执重试", "无需回执", "回执已确认", "回执异常", "回执已过期", "回执已归档"], i, S),
      反馈时间: t(i),
      失败原因: pick(["无", "目标主机无响应", "接口超时", "字段校验未通过", "网络不可达", "认证失败", "服务繁忙", "数据格式错误"], i, S),
    }));
  }

  // ─── 扫描任务（工信部资产扫描联动）───
  if (/任务|调度|流程|执行/.test(name) && /扫描|探测/.test(L2)) {
    return makeProfile("扫描任务", ["任务编号", "扫描目标", "扫描器节点", "端口覆盖率", "存活主机数", "任务状态", "计划时间"], (i) => ({
      任务编号: `ST-${uid("ST", i)}`,
      扫描目标: pick(["10.24.18.0/24", "10.25.6.0/24", "172.20.14.0/24", "10.30.9.0/24", "192.168.10.0/24", "10.50.20.0/24"], i, S),
      扫描器节点: pick(["分布式扫描-节点A", "分布式扫描-节点B", "中心扫描引擎", "边缘探测器", "被动嗅探器", "主动扫描器"], i, S),
      端口覆盖率: pick(["67%", "78%", "85%", "92%", "96%", "100%"], i, S),
      存活主机数: pick([12, 28, 45, 89, 134, 256], i, S),
      任务状态: pick(["执行中", "已完成", "待执行", "执行失败", "已暂停", "排队中", "部分完成"], i, S),
      计划时间: t(i),
    }));
  }

  // ─── 采集任务（资产采集）───
  if (/任务|调度|流程|执行/.test(name) && /采集|同步/.test(L2)) {
    return makeProfile("采集任务", ["任务编号", "采集目标", "采集协议", "采集器类型", "数据量(MB)", "任务状态", "计划时间"], (i) => ({
      任务编号: `CT-${uid("CT", i)}`,
      采集目标: pick(["核心网设备", "汇聚层交换机", "接入层路由器", "安全设备集群", "业务服务器", "数据库集群"], i, S),
      采集协议: pick(["SNMP v3", "SSH", "NETCONF", "RESTCONF", "gNMI", "WMI"], i, S),
      采集器类型: pick(["主动采集器", "被动嗅探器", "Agent代理", "API拉取", "日志转发", "流式采集"], i, S),
      数据量: pick([12, 48, 96, 256, 512, 1024], i, S),
      任务状态: pick(["采集中", "已完成", "待执行", "采集失败", "已暂停", "部分完成"], i, S),
      计划时间: t(i),
    }));
  }

  // ─── 结果上报 ───
  if (/上报|报送|推送/.test(name) || /结果上报/.test(L2)) {
    return makeProfile("上报", ["上报编号", "数据批次", "上报通道", "记录条数", "上报状态", "上报时间"], (i) => ({
      上报编号: `SB-${uid("SB", i)}`,
      数据批次: pick(["BATCH-A", "BATCH-B", "BATCH-C", "BATCH-D", "BATCH-E", "BATCH-F"], i, S),
      上报通道: pick(["工信部安全接口", "集团数据中台", "省级态势平台", "安全运营中心", "日志采集通道", "批量推送通道"], i, S),
      记录条数: pick([128, 256, 512, 1024, 2048, 4096], i, S),
      上报状态: pick(["已上报", "待上报", "上报失败", "部分成功", "已确认", "已退回"], i, S),
      上报时间: t(i),
    }));
  }

  // ─── 通用任务（其余任务类页面）───
  if (/任务|调度|流程|执行/.test(page)) {
    return makeProfile("任务", ["任务编号", "任务名称", "执行节点", "执行状态", "进度", "计划时间"], (i) => ({
      任务编号: `TASK-${uid("TASK", i)}`,
      任务名称: `${page}-${pick(["批量核查", "增量同步", "全量扫描", "异常处理", "定时巡检", "应急响应", "合规检查", "基线核查"], i, S)}`,
      执行节点: pick(["调度中心-主节点", "边缘计算-01", "安全分析-02", "数据汇聚-03", "采集代理-04", "监控探针-05", "审计节点-06", "扫描引擎-07"], i, S),
      执行状态: pick(["执行中", "已完成", "待执行", "执行失败", "已暂停", "排队中", "已取消", "部分完成"], i, S),
      进度: pick(["0%", "12%", "28%", "45%", "63%", "78%", "91%", "100%"], i, S),
      计划时间: t(i),
    }));
  }

  // ─── 规则策略 ───
  if (/规则|策略|模型|白名单|黑名单/.test(page)) {
    return makeProfile("规则", ["规则编号", "规则名称", "规则类型", "启用状态", "命中次数", "更新时间"], (i) => ({
      规则编号: `RULE-${uid("RULE", i)}`,
      规则名称: `${page}-${pick(["校验规则", "识别策略", "过滤规则", "告警模型", "评分模型", "分类规则", "匹配策略", "阈值规则"], i, S)}`,
      规则类型: pick(["资产识别", "字段校验", "异常拦截", "风险评分", "行为分析", "基线比对", "关联分析", "合规检测"], i, S),
      启用状态: pick(["已启用", "已停用", "灰度中", "待发布", "待审核", "已归档", "测试中", "已过期"], i, S),
      命中次数: pick([32, 76, 128, 189, 245, 312, 419, 567], i, S),
      更新时间: t(i),
    }));
  }

  // ─── 接口服务 ───
  if (/接口|调用|API|服务/.test(page)) {
    return makeProfile("接口", ["接口编号", "接口名称", "请求方式", "调用状态", "平均耗时", "最近调用"], (i) => ({
      接口编号: `API-${uid("API", i)}`,
      接口名称: `${page}-${pick(["查询接口", "下发接口", "回执接口", "同步接口", "推送接口", "回调接口", "批量接口", "鉴权接口"], i, S)}`,
      请求方式: pick(["POST", "GET", "PUT", "DELETE", "PATCH", "POST", "GET", "POST"], i, S),
      调用状态: pick(["200 OK", "202 ACCEPTED", "超时重试", "参数异常", "401 未授权", "403 禁止访问", "500 服务异常", "408 请求超时"], i, S),
      平均耗时: pick(["23ms", "56ms", "86ms", "143ms", "189ms", "215ms", "342ms", "392ms"], i, S),
      最近调用: t(i),
    }));
  }

  // ─── 日志审计 ───
  if (/日志|审计|留痕/.test(page)) {
    return makeProfile("日志", ["日志编号", "业务类型", "日志级别", "日志摘要", "记录时间", "处理状态"], (i) => ({
      日志编号: `LOG-${uid("LOG", i)}`,
      业务类型: pick(["指令下发", "接口调用", "资产同步", "任务调度", "用户操作", "配置变更", "权限变更", "数据导出"], i, S),
      日志级别: pick(["INFO", "WARN", "ERROR", "DEBUG", "INFO", "WARN", "INFO", "ERROR"], i, S),
      日志摘要: pick(["任务进入执行队列", "回执接口调用成功", "资产字段完成比对", "节点响应超时", "配置热更新完成", "权限变更已生效", "数据同步完成", "告警规则触发"], i, S),
      记录时间: t(i),
      处理状态: pick(["已归档", "待复核", "已处理", "自动忽略", "人工复核中", "已升级", "已通知", "已恢复"], i, S),
    }));
  }

  // ─── 参数配置 ───
  if (/参数|字段|字典|配置项/.test(page)) {
    return makeProfile("参数", ["参数编号", "参数名称", "参数值", "校验状态", "字段来源", "更新时间"], (i) => ({
      参数编号: `PARAM-${uid("PARAM", i)}`,
      参数名称: pick(["taskId", "ipRange", "callbackUrl", "assetType", "syncMode", "retryCount", "timeout", "batchSize"], i, S),
      参数值: pick(["TASK-260508001", "10.24.18.0/24", "/asset-security/callback", "server", "incremental", "3", "30000ms", "500"], i, S),
      校验状态: pick(["校验通过", "待确认", "缺少映射", "格式异常", "值域超限", "类型不匹配", "已过期", "依赖缺失"], i, S),
      字段来源: pick(["接口报文", "页面维护", "CMDB同步", "规则匹配", "配置中心", "环境变量", "数据库", "远程拉取"], i, S),
      更新时间: t(i),
    }));
  }

  // ─── 扫描探测 ───
  if (/扫描|探测/.test(page)) {
    return makeProfile("扫描", ["扫描批次", "IP范围", "扫描器", "资产数量", "异常数量", "扫描状态"], (i) => ({
      扫描批次: `SCAN-${uid("SCAN", i)}`,
      IP范围: pick(["10.24.18.0/24", "10.25.6.0/24", "172.20.14.0/24", "10.30.9.0/24", "192.168.10.0/24", "10.50.20.0/24", "172.16.8.0/24", "10.100.3.0/24"], i, S),
      扫描器: pick(["分布式扫描-节点A", "分布式扫描-节点B", "中心扫描引擎", "边缘探测器", "被动嗅探器", "主动扫描器", "合规检查器", "漏洞探测器"], i, S),
      资产数量: pick([45, 96, 128, 214, 316, 482, 637, 764], i, S),
      异常数量: pick([0, 1, 2, 3, 5, 7, 12, 18], i, S),
      扫描状态: pick(["扫描中", "已完成", "待调度", "异常结束", "已暂停", "排队中", "部分完成", "已取消"], i, S),
    }));
  }

  // ─── 采集同步 ───
  if (/采集|同步|汇聚/.test(page)) {
    return makeProfile("采集", ["采集批次", "采集来源", "资产类型", "采集数量", "入库数量", "采集状态"], (i) => ({
      采集批次: `CJ-${uid("CJ", i)}`,
      采集来源: pick(["CMDB", "综合网管", "云资源平台", "安全扫描平台", "运维监控", "资产管理台账", "态势感知", "日志平台"], i, S),
      资产类型: pick(["服务器", "网络设备", "虚拟资源", "业务系统", "数据库", "中间件", "容器集群", "存储设备"], i, S),
      采集数量: pick([23, 96, 128, 214, 356, 521, 742, 893], i, S),
      入库数量: pick([23, 92, 128, 210, 349, 512, 731, 879], i, S),
      采集状态: pick(["采集完成", "解析中", "待入库", "部分失败", "采集中", "已归档", "待审批", "已取消"], i, S),
    }));
  }

  // ─── 虚拟资源填报 ───
  if (/虚拟|云/.test(page) || /虚拟资源/.test(L2)) {
    return makeProfile("虚拟资源", ["资源编号", "资源名称", "资源类型", "所在主机", "CPU/内存", "纳管状态", "创建时间"], (i) => ({
      资源编号: `VR-${uid("VR", i)}`,
      资源名称: pick(["VM-Web-A01", "VM-DB-B02", "VM-App-C03", "VM-MQ-D04", "VM-Cache-E05", "VM-Log-F06"], i, S),
      资源类型: pick(["KVM虚拟机", "Docker容器", "VMware虚机", "OpenStack实例", "轻量容器", "Serverless函数"], i, S),
      所在主机: pick(["物理主机-01", "物理主机-02", "集群节点-A", "集群节点-B", "边缘节点-01", "灾备节点-01"], i, S),
      "CPU/内存": pick(["2C/4G", "4C/8G", "8C/16G", "16C/32G", "32C/64G", "4C/16G"], i, S),
      纳管状态: pick(["运行中", "已关机", "待创建", "迁移中", "已释放", "异常"], i, S),
      创建时间: t(i),
    }));
  }

  // ─── IP资产纳管验证 ───
  if (/IP|地址|网段/.test(page) || /资产IP/.test(L2)) {
    return makeProfile("IP资产", ["资产编号", "IP地址", "资产归属", "端口开放数", "风险等级", "纳管状态", "检测时间"], (i) => ({
      资产编号: `IPA-${uid("IPA", i)}`,
      IP地址: pick(["10.24.18.101", "10.25.6.203", "172.20.14.55", "10.30.9.178", "192.168.10.42", "10.50.12.99"], i, S),
      资产归属: pick(["核心业务区", "办公网络区", "DMZ隔离区", "开发测试区", "运维管理区", "灾备恢复区"], i, S),
      端口开放数: pick([0, 2, 5, 8, 12, 23, 45, 67], i, S),
      风险等级: pick(["低风险", "中风险", "高风险", "严重", "低风险", "中风险"], i, S),
      纳管状态: pick(["已纳管", "未纳管", "部分纳管", "待核验", "已下线", "核验失败"], i, S),
      检测时间: t(i),
    }));
  }

  // ─── 资产条目纳管 ───
  if (/条目|分类|类别|名称/.test(page) || /资产条目/.test(L2)) {
    return makeProfile("资产条目", ["条目编号", "资产名称", "资产分类", "分类置信度", "来源系统", "核验状态", "更新时间"], (i) => ({
      条目编号: `AE-${uid("AE", i)}`,
      资产名称: pick(["核心交换机-CorSwitch-01", "Web服务器-WebSvr-A02", "数据库-Oracle-03", "防火墙-FW-DMZ-04", "负载均衡-LB-05", "存储-NAS-06"], i, S),
      资产分类: pick(["网络设备", "服务器", "数据库", "安全设备", "存储设备", "中间件"], i, S),
      分类置信度: pick(["98%", "95%", "87%", "76%", "63%", "45%"], i, S),
      来源系统: pick(["CMDB自动导入", "人工填报", "扫描发现", "接口同步", "Excel导入", "规则匹配"], i, S),
      核验状态: pick(["已核验", "待核验", "分类存疑", "待人工确认", "已更正", "已忽略"], i, S),
      更新时间: t(i),
    }));
  }

  // ─── 资产（通用）───
  if (/资产|纳管|虚拟|主机|设备|系统/.test(page)) {
    return makeProfile("资产", ["资产编号", "资产名称", "资产类型", "所属区域", "纳管状态", "最近同步"], (i) => ({
      资产编号: `ASSET-${uid("ASSET", i)}`,
      资产名称: pick(["核心交换机-01", "Web服务器-A02", "数据库主节点-03", "虚拟化平台-04", "防火墙-DMZ-05", "负载均衡-06", "存储阵列-07", "应用网关-08"], i, S),
      资产类型: pick(["服务器", "网络设备", "虚拟机", "数据库", "业务系统", "中间件", "安全设备", "存储设备"], i, S),
      所属区域: pick(["核心机房", "DMZ区域", "办公区域", "云计算区", "灾备中心", "边缘节点", "开发区", "测试环境"], i, S),
      纳管状态: pick(["已纳管", "待核验", "已下线", "同步中", "待纳管", "已退役", "部分纳管", "核验失败"], i, S),
      最近同步: t(i),
    }));
  }

  // ─── 报表报告 ───
  if (/报表|报告|统计|分析|看板|总览/.test(page)) {
    return makeProfile("报表", ["报表编号", "报表名称", "统计周期", "生成状态", "生成时间", "导出次数"], (i) => ({
      报表编号: `RPT-${uid("RPT", i)}`,
      报表名称: `${page}-${pick(["日报", "周报", "月报", "分析报告", "趋势报表", "对比报表", "汇总报表", "明细报表"], i, S)}`,
      统计周期: pick(["今日", "本周", "本月", "近7日", "近30日", "本季度", "上半年", "全年"], i, S),
      生成状态: pick(["已生成", "生成中", "待生成", "生成失败", "已更新", "待审批", "已归档", "已过期"], i, S),
      生成时间: t(i),
      导出次数: pick([0, 1, 3, 6, 11, 18, 25, 42], i, S),
    }));
  }

  // ─── 告警预警 ───
  if (/告警|预警|异常|风险/.test(page)) {
    return makeProfile("告警", ["告警编号", "告警类型", "告警级别", "关联对象", "告警时间", "处置状态"], (i) => ({
      告警编号: `ALM-${uid("ALM", i)}`,
      告警类型: pick(["扫描失败", "接口超时", "资产异常", "字段缺失", "回执失败", "配置漂移", "容量告警", "性能劣化"], i, S),
      告警级别: pick(["紧急", "高", "中", "低", "信息", "高", "中", "低"], i, S),
      关联对象: pick(["扫描节点集群", "API网关", "核心交换机", "数据库集群", "虚拟化平台", "负载均衡器", "存储阵列", "安全设备"], i, S),
      告警时间: t(i),
      处置状态: pick(["待处置", "处理中", "已关闭", "已升级", "已忽略", "已恢复", "待确认", "已转派"], i, S),
    }));
  }

  // ─── 通用兜底 ───
  return makeProfile("通用", ["业务编号", "业务名称", "业务类型", "处理状态", "负责人", "更新时间"], (i) => ({
    业务编号: `BIZ-${uid("BIZ", i)}`,
    业务名称: `${page}-${pick(["业务记录", "复核记录", "处理记录", "联动记录", "审批记录", "变更记录", "巡检记录", "演练记录"], i, S)}`,
    业务类型: pick([group.level2, "平台维护", "业务联动", "安全运营", "资产管理", "合规检查", "应急响应", "日常运维"], i, S),
    处理状态: pick(["正常", "处理中", "待复核", "已完成", "异常", "已挂起", "已转派", "已升级"], i, S),
    负责人: pick(["资产安全管理员", "接口运维员", "任务调度员", "数据复核员", "安全分析师", "系统管理员", "审计专员", "应急响应员"], i, S),
    更新时间: t(i),
  }));
}

function createInitialRows(group, profile) {
  const count = (pageHash(group.level3) % 5) + 6;
  return Array.from({ length: count }).map((_, index) => ({
    ID: index + 1,
    ...profile.rowBuilder(index),
  }));
}

function createDefaultRow(profile) {
  const row = { ID: "" };
  profile.columns.forEach((column) => {
    if (/状态/.test(column.prop)) row[column.prop] = "待处理";
    else if (/时间/.test(column.prop)) row[column.prop] = "";
    else if (/数量|次数/.test(column.prop)) row[column.prop] = 0;
    else row[column.prop] = "";
  });
  return row;
}

function createImportRow(group, profile) {
  return {
    ...profile.rowBuilder(8),
    ID: "",
    导入来源: `${group.level3}导入模板.xlsx`,
  };
}

function writeView(group, index) {
  const dir = path.join(
    viewsDir,
    safeSegment(group.level1),
    safeSegment(group.level2),
    safeSegment(group.level3),
  );
  fs.mkdirSync(dir, { recursive: true });

  const profile = createTableProfile(group);
  const tableColumns = [
    { prop: "ID", label: "ID", type: "text", width: 80 },
    ...profile.columns,
    { slot: "operate", label: "操作" },
  ];
  const initialRows = createInitialRows(group, profile);
  const defaultRow = createDefaultRow(profile);
  const importRow = createImportRow(group, profile);
  const buttons = createButtons(group.functions);

  const content = `<template>
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
${buttons}
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

const initialRows = ${JSON.stringify(initialRows, null, 2)};
const tableColumns = ${JSON.stringify(tableColumns, null, 2)};
const defaultRow = ${JSON.stringify(defaultRow, null, 2)};
const importTemplateRow = ${JSON.stringify(importRow, null, 2)};

export default {
  name: "GeneratedFeaturePage${index + 1}",
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
      exportXLSX(rows, functionName || "${group.level3}导出");
      this.$message.success("导出成功");
    },
    buildExportRows(functionName) {
      if (/数据导出|信息导出|列表导出|全量/.test(functionName)) {
        return this.allTableData;
      }
      if (/执行状态|日志/.test(functionName)) {
        return [
          { 名称: functionName.replace(/导出/g, ""), 状态: "执行成功", 日志: "任务已完成，回执校验通过" },
          { 名称: "${group.level3}任务调度", 状态: "执行中", 日志: "正在等待节点返回执行结果" },
          { 名称: "${group.level3}异常检查", 状态: "已告警", 日志: "发现1条超时记录，已进入重试队列" },
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
          { 接口名称: "${group.level3}状态同步接口", 请求方式: "GET", 调用状态: "200 OK", 平均耗时: "93ms" },
          { 接口名称: "${group.level3}回执接口", 请求方式: "POST", 调用状态: "202 ACCEPTED", 平均耗时: "141ms" },
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
        { 业务名称: "${group.level3}业务记录", 业务状态: "已处理", 处理时间: "2026-05-08 10:05:00", 说明: "模拟业务记录" },
        { 业务名称: "${group.level3}复核记录", 业务状态: "待复核", 处理时间: "2026-05-08 10:10:00", 说明: "等待人工确认" },
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
        { label: "所属页面", value: "${group.level3}" },
        { label: "一级模块", value: "${group.level1}" },
        { label: "二级模块", value: "${group.level2}" },
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
`;

  fs.writeFileSync(path.join(dir, "index.vue"), content, "utf8");
}

const groups = readGroups();
writeFunctions(groups);
writeRoutes(groups);
groups.forEach(writeView);

console.log(`同步完成：${groups.length} 个模块，${groups.reduce((sum, group) => sum + group.functions.length, 0)} 个功能点。`);
