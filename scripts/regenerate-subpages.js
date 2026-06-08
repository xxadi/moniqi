/**
 * Regenerate all 11 sub-pages under YN云南COSMIC/4A上报数据对比告警规则管理/
 * Each page has unique buttons, dialog types, and fields.
 * No duplicate dialogs, no duplicate data properties.
 */
const fs = require("fs");
const path = require("path");

const BASE_DIR = path.join(
  __dirname,
  "..",
  "src",
  "views",
  "资产信息上报调整",
  "YN云南COSMIC",
  "4A上报数据对比告警规则管理"
);

// ─── Page Definitions ───

const PAGES = [
  // Page 1: 上报数据对比规则库管理 (8 buttons)
  {
    dir: "上报数据对比规则库管理",
    pageName: "上报数据对比规则库管理",
    componentName: "ShangBaoShuJuDuiBiGuiZeKuGuanLi",
    prefix: "规则库",
    idPrefix: "GZK",
    columns: [
      { prop: "规则库编号", label: "规则库编号", search: true },
      { prop: "规则库名称", label: "规则库名称", search: true },
      { prop: "规则库类型", label: "规则库类型", search: true },
      { prop: "规则库状态", label: "规则库状态", search: true },
      { prop: "规则库描述", label: "规则库描述", search: false },
      { prop: "创建时间", label: "创建时间", search: false, width: 170 },
      { prop: "更新时间", label: "更新时间", search: false, width: 170 },
      { prop: "负责人", label: "负责人", search: true },
    ],
    buttons: [
      { text: "定义上报数据对比规则库信息", icon: "el-icon-plus", actionType: "form", btnType: "primary" },
      { text: "修改上报数据对比规则库信息", icon: "el-icon-edit", actionType: "config", btnType: "primary" },
      { text: "删除上报数据对比规则库信息", icon: "el-icon-delete", actionType: "delete", btnType: "danger" },
      { text: "上报数据对比规则库数据查询", icon: "el-icon-s-operation", actionType: "monitor", btnType: "primary" },
      { text: "上报数据对比规则库数据上传", icon: "el-icon-upload2", actionType: "statistics", btnType: "primary" },
      { text: "上报数据对比规则库数据接口监控", icon: "el-icon-view", actionType: "log", btnType: "primary" },
      { text: "查询上报数据对比规则库汇总报告详情", icon: "el-icon-data-analysis", actionType: "analysis", btnType: "primary" },
      { text: "查询上报数据对比规则库明细报告详情", icon: "el-icon-warning", actionType: "alert", btnType: "primary" },
    ],
    actionTypes: ["form", "config", "monitor", "statistics", "log", "analysis", "alert"],
    dialogLabels: {
      config: "修改规则库配置",
      monitor: "规则库数据查询",
      statistics: "规则库数据上传",
      log: "规则库接口监控",
      analysis: "规则库汇总报告",
      alert: "规则库明细报告",
    },
  },

  // Page 2: 4A数据录入规则库管理 (8 buttons)
  {
    dir: "4A数据录入规则库管理",
    pageName: "4A数据录入规则库管理",
    componentName: "SiAShuJuLuRuGuiZeKuGuanLi",
    prefix: "录入规则",
    idPrefix: "LRTL",
    columns: [
      { prop: "录入规则编号", label: "录入规则编号", search: true },
      { prop: "录入规则名称", label: "录入规则名称", search: true },
      { prop: "数据源类型", label: "数据源类型", search: true },
      { prop: "录入状态", label: "录入状态", search: true },
      { prop: "规则描述", label: "规则描述", search: false },
      { prop: "创建时间", label: "创建时间", search: false, width: 170 },
      { prop: "更新时间", label: "更新时间", search: false, width: 170 },
      { prop: "负责人", label: "负责人", search: true },
    ],
    buttons: [
      { text: "定义4A数据录入规则库信息", icon: "el-icon-plus", actionType: "form", btnType: "primary" },
      { text: "修改4A数据录入规则库信息", icon: "el-icon-edit", actionType: "config", btnType: "primary" },
      { text: "删除4A数据录入规则库信息", icon: "el-icon-delete", actionType: "delete", btnType: "danger" },
      { text: "4A数据录入规则库数据查询", icon: "el-icon-s-operation", actionType: "monitor", btnType: "primary" },
      { text: "4A数据录入规则库数据上传", icon: "el-icon-upload2", actionType: "statistics", btnType: "primary" },
      { text: "4A数据录入规则库数据接口监控", icon: "el-icon-view", actionType: "log", btnType: "primary" },
      { text: "查询4A数据录入规则库汇总报告详情", icon: "el-icon-data-analysis", actionType: "analysis", btnType: "primary" },
      { text: "查询4A数据录入规则库明细报告详情", icon: "el-icon-warning", actionType: "alert", btnType: "primary" },
    ],
    actionTypes: ["form", "config", "monitor", "statistics", "log", "analysis", "alert"],
    dialogLabels: {
      config: "修改录入规则配置",
      monitor: "录入规则数据查询",
      statistics: "录入规则数据上传",
      log: "录入规则接口监控",
      analysis: "录入规则汇总报告",
      alert: "录入规则明细报告",
    },
  },

  // Page 3: 4A上报数据对比设置信息管理 (7 buttons - no alert)
  {
    dir: "4A上报数据对比设置信息管理",
    pageName: "4A上报数据对比设置信息管理",
    componentName: "SiAShangBaoShuJuDuiBiSheZhiXinXiGuanLi",
    prefix: "对比设置",
    idPrefix: "DBCZ",
    columns: [
      { prop: "设置编号", label: "设置编号", search: true },
      { prop: "设置名称", label: "设置名称", search: true },
      { prop: "对比类型", label: "对比类型", search: true },
      { prop: "设置状态", label: "设置状态", search: true },
      { prop: "设置说明", label: "设置说明", search: false },
      { prop: "创建时间", label: "创建时间", search: false, width: 170 },
      { prop: "更新时间", label: "更新时间", search: false, width: 170 },
      { prop: "负责人", label: "负责人", search: true },
    ],
    buttons: [
      { text: "定义4A上报数据对比设置信息", icon: "el-icon-plus", actionType: "form", btnType: "primary" },
      { text: "修改4A上报数据对比设置信息", icon: "el-icon-edit", actionType: "config", btnType: "primary" },
      { text: "删除4A上报数据对比设置信息", icon: "el-icon-delete", actionType: "delete", btnType: "danger" },
      { text: "4A上报数据对比设置数据查询", icon: "el-icon-s-operation", actionType: "monitor", btnType: "primary" },
      { text: "4A上报数据对比设置数据上传", icon: "el-icon-upload2", actionType: "statistics", btnType: "primary" },
      { text: "4A上报数据对比设置数据接口监控", icon: "el-icon-view", actionType: "log", btnType: "primary" },
      { text: "查询4A上报数据对比设置汇总报告详情", icon: "el-icon-data-analysis", actionType: "analysis", btnType: "primary" },
    ],
    actionTypes: ["form", "config", "monitor", "statistics", "log", "analysis"],
    dialogLabels: {
      config: "修改对比设置配置",
      monitor: "对比设置数据查询",
      statistics: "对比设置数据上传",
      log: "对比设置接口监控",
      analysis: "对比设置汇总报告",
    },
  },

  // Page 4: 4A上报数据对比防篡改信息管理 (3 buttons)
  {
    dir: "4A上报数据对比防篡改信息管理",
    pageName: "4A上报数据对比防篡改信息管理",
    componentName: "SiAShangBaoShuJuDuiBiFangCuiGaiXinXiGuanLi",
    prefix: "防篡改",
    idPrefix: "FCG",
    columns: [
      { prop: "防篡改编号", label: "防篡改编号", search: true },
      { prop: "资产名称", label: "资产名称", search: true },
      { prop: "防篡改类型", label: "防篡改类型", search: true },
      { prop: "校验状态", label: "校验状态", search: true },
      { prop: "防篡改哈希值", label: "防篡改哈希值", search: false },
      { prop: "创建时间", label: "创建时间", search: false, width: 170 },
      { prop: "备注说明", label: "备注说明", search: false },
    ],
    buttons: [
      { text: "新增4A上报数据对比防篡改信息", icon: "el-icon-plus", actionType: "form", btnType: "primary" },
      { text: "修改4A上报数据对比防篡改信息", icon: "el-icon-edit", actionType: "config", btnType: "primary" },
      { text: "删除4A上报数据对比防篡改信息", icon: "el-icon-delete", actionType: "delete", btnType: "danger" },
    ],
    actionTypes: ["form", "config"],
    dialogLabels: {
      config: "修改防篡改配置",
    },
  },

  // Page 5: 工信部与4A数据对比设置信息管理 (7 buttons - no alert)
  {
    dir: "工信部与4A数据对比设置信息管理",
    pageName: "工信部与4A数据对比设置信息管理",
    componentName: "GongXinBuYuSiAShuJuDuiBiSheZhiXinXiGuanLi",
    prefix: "工信部对比设置",
    idPrefix: "GXBD",
    columns: [
      { prop: "设置编号", label: "设置编号", search: true },
      { prop: "设置名称", label: "设置名称", search: true },
      { prop: "对比范围", label: "对比范围", search: true },
      { prop: "设置状态", label: "设置状态", search: true },
      { prop: "设置说明", label: "设置说明", search: false },
      { prop: "创建时间", label: "创建时间", search: false, width: 170 },
      { prop: "更新时间", label: "更新时间", search: false, width: 170 },
      { prop: "负责人", label: "负责人", search: true },
    ],
    buttons: [
      { text: "定义工信部与4A数据对比设置信息", icon: "el-icon-plus", actionType: "form", btnType: "primary" },
      { text: "修改工信部与4A数据对比设置信息", icon: "el-icon-edit", actionType: "config", btnType: "primary" },
      { text: "删除工信部与4A数据对比设置信息", icon: "el-icon-delete", actionType: "delete", btnType: "danger" },
      { text: "工信部与4A数据对比设置数据查询", icon: "el-icon-s-operation", actionType: "monitor", btnType: "primary" },
      { text: "工信部与4A数据对比设置数据上传", icon: "el-icon-upload2", actionType: "statistics", btnType: "primary" },
      { text: "工信部与4A数据对比设置数据接口监控", icon: "el-icon-view", actionType: "log", btnType: "primary" },
      { text: "查询工信部与4A数据对比设置汇总报告详情", icon: "el-icon-data-analysis", actionType: "analysis", btnType: "primary" },
    ],
    actionTypes: ["form", "config", "monitor", "statistics", "log", "analysis"],
    dialogLabels: {
      config: "修改工信部对比设置",
      monitor: "工信部对比设置查询",
      statistics: "工信部对比设置上传",
      log: "工信部对比设置监控",
      analysis: "工信部对比设置报告",
    },
  },

  // Page 6: 工信部与4A数据对比防篡改信息管理 (3 buttons)
  {
    dir: "工信部与4A数据对比防篡改信息管理",
    pageName: "工信部与4A数据对比防篡改信息管理",
    componentName: "GongXinBuYuSiAShuJuDuiBiFangCuiGaiXinXiGuanLi",
    prefix: "工信部防篡改",
    idPrefix: "GXFC",
    columns: [
      { prop: "防篡改编号", label: "防篡改编号", search: true },
      { prop: "数据项名称", label: "数据项名称", search: true },
      { prop: "防篡改方式", label: "防篡改方式", search: true },
      { prop: "校验状态", label: "校验状态", search: true },
      { prop: "校验哈希", label: "校验哈希", search: false },
      { prop: "创建时间", label: "创建时间", search: false, width: 170 },
      { prop: "备注说明", label: "备注说明", search: false },
    ],
    buttons: [
      { text: "新增工信部与4A数据对比防篡改信息", icon: "el-icon-plus", actionType: "form", btnType: "primary" },
      { text: "修改工信部与4A数据对比防篡改信息", icon: "el-icon-edit", actionType: "config", btnType: "primary" },
      { text: "删除工信部与4A数据对比防篡改信息", icon: "el-icon-delete", actionType: "delete", btnType: "danger" },
    ],
    actionTypes: ["form", "config"],
    dialogLabels: {
      config: "修改工信部防篡改配置",
    },
  },

  // Page 7: 工信部与4A关系对比库管理 (8 buttons)
  {
    dir: "工信部与4A关系对比库管理",
    pageName: "工信部与4A关系对比库管理",
    componentName: "GongXinBuYuSiAGuanXiDuiBiKuGuanLi",
    prefix: "关系对比",
    idPrefix: "GXDB",
    columns: [
      { prop: "对比库编号", label: "对比库编号", search: true },
      { prop: "对比库名称", label: "对比库名称", search: true },
      { prop: "关系类型", label: "关系类型", search: true },
      { prop: "对比库状态", label: "对比库状态", search: true },
      { prop: "对比库描述", label: "对比库描述", search: false },
      { prop: "创建时间", label: "创建时间", search: false, width: 170 },
      { prop: "更新时间", label: "更新时间", search: false, width: 170 },
      { prop: "负责人", label: "负责人", search: true },
    ],
    buttons: [
      { text: "定义工信部与4A关系对比库信息", icon: "el-icon-plus", actionType: "form", btnType: "primary" },
      { text: "修改工信部与4A关系对比库信息", icon: "el-icon-edit", actionType: "config", btnType: "primary" },
      { text: "删除工信部与4A关系对比库信息", icon: "el-icon-delete", actionType: "delete", btnType: "danger" },
      { text: "工信部与4A关系对比库数据查询", icon: "el-icon-s-operation", actionType: "monitor", btnType: "primary" },
      { text: "工信部与4A关系对比库数据上传", icon: "el-icon-upload2", actionType: "statistics", btnType: "primary" },
      { text: "工信部与4A关系对比库数据接口监控", icon: "el-icon-view", actionType: "log", btnType: "primary" },
      { text: "查询工信部与4A关系对比库汇总报告详情", icon: "el-icon-data-analysis", actionType: "analysis", btnType: "primary" },
      { text: "查询工信部与4A关系对比库明细报告详情", icon: "el-icon-warning", actionType: "alert", btnType: "primary" },
    ],
    actionTypes: ["form", "config", "monitor", "statistics", "log", "analysis", "alert"],
    dialogLabels: {
      config: "修改关系对比库配置",
      monitor: "关系对比库数据查询",
      statistics: "关系对比库数据上传",
      log: "关系对比库接口监控",
      analysis: "关系对比库汇总报告",
      alert: "关系对比库明细报告",
    },
  },

  // Page 8: 4A与资产数据差异设置信息管理 (7 buttons - no alert)
  {
    dir: "4A与资产数据差异设置信息管理",
    pageName: "4A与资产数据差异设置信息管理",
    componentName: "SiAYuZiChanShuJuChaYiSheZhiXinXiGuanLi",
    prefix: "差异设置",
    idPrefix: "CYCZ",
    columns: [
      { prop: "设置编号", label: "设置编号", search: true },
      { prop: "设置名称", label: "设置名称", search: true },
      { prop: "差异类型", label: "差异类型", search: true },
      { prop: "设置状态", label: "设置状态", search: true },
      { prop: "设置说明", label: "设置说明", search: false },
      { prop: "创建时间", label: "创建时间", search: false, width: 170 },
      { prop: "更新时间", label: "更新时间", search: false, width: 170 },
      { prop: "负责人", label: "负责人", search: true },
    ],
    buttons: [
      { text: "定义4A与资产数据差异设置信息", icon: "el-icon-plus", actionType: "form", btnType: "primary" },
      { text: "修改4A与资产数据差异设置信息", icon: "el-icon-edit", actionType: "config", btnType: "primary" },
      { text: "删除4A与资产数据差异设置信息", icon: "el-icon-delete", actionType: "delete", btnType: "danger" },
      { text: "4A与资产数据差异设置数据查询", icon: "el-icon-s-operation", actionType: "monitor", btnType: "primary" },
      { text: "4A与资产数据差异设置数据上传", icon: "el-icon-upload2", actionType: "statistics", btnType: "primary" },
      { text: "4A与资产数据差异设置数据接口监控", icon: "el-icon-view", actionType: "log", btnType: "primary" },
      { text: "查询4A与资产数据差异设置汇总报告详情", icon: "el-icon-data-analysis", actionType: "analysis", btnType: "primary" },
    ],
    actionTypes: ["form", "config", "monitor", "statistics", "log", "analysis"],
    dialogLabels: {
      config: "修改差异设置配置",
      monitor: "差异设置数据查询",
      statistics: "差异设置数据上传",
      log: "差异设置接口监控",
      analysis: "差异设置汇总报告",
    },
  },

  // Page 9: 4A资产数据差异防篡改信息管理 (3 buttons)
  {
    dir: "4A资产数据差异防篡改信息管理",
    pageName: "4A资产数据差异防篡改信息管理",
    componentName: "SiAZiChanShuJuChaYiFangCuiGaiXinXiGuanLi",
    prefix: "差异防篡改",
    idPrefix: "CYFC",
    columns: [
      { prop: "防篡改编号", label: "防篡改编号", search: true },
      { prop: "差异项名称", label: "差异项名称", search: true },
      { prop: "防篡改算法", label: "防篡改算法", search: true },
      { prop: "校验状态", label: "校验状态", search: true },
      { prop: "哈希摘要", label: "哈希摘要", search: false },
      { prop: "创建时间", label: "创建时间", search: false, width: 170 },
      { prop: "备注说明", label: "备注说明", search: false },
    ],
    buttons: [
      { text: "新增4A资产数据差异防篡改信息", icon: "el-icon-plus", actionType: "form", btnType: "primary" },
      { text: "修改4A资产数据差异防篡改信息", icon: "el-icon-edit", actionType: "config", btnType: "primary" },
      { text: "删除4A资产数据差异防篡改信息", icon: "el-icon-delete", actionType: "delete", btnType: "danger" },
    ],
    actionTypes: ["form", "config"],
    dialogLabels: {
      config: "修改差异防篡改配置",
    },
  },

  // Page 10: 4A与资产数据差异监控规则管理 (3 buttons)
  {
    dir: "4A与资产数据差异监控规则管理",
    pageName: "4A与资产数据差异监控规则管理",
    componentName: "SiAYuZiChanShuJuChaYiJianKongGuiZeGuanLi",
    prefix: "监控规则",
    idPrefix: "JKGZ",
    columns: [
      { prop: "规则编号", label: "规则编号", search: true },
      { prop: "规则名称", label: "规则名称", search: true },
      { prop: "监控类型", label: "监控类型", search: true },
      { prop: "规则状态", label: "规则状态", search: true },
      { prop: "触发条件", label: "触发条件", search: false },
      { prop: "创建时间", label: "创建时间", search: false, width: 170 },
      { prop: "负责人", label: "负责人", search: true },
    ],
    buttons: [
      { text: "新增4A与资产数据差异监控规则", icon: "el-icon-plus", actionType: "form", btnType: "primary" },
      { text: "修改4A与资产数据差异监控规则", icon: "el-icon-edit", actionType: "config", btnType: "primary" },
      { text: "删除4A与资产数据差异监控规则", icon: "el-icon-delete", actionType: "delete", btnType: "danger" },
    ],
    actionTypes: ["form", "config"],
    dialogLabels: {
      config: "修改监控规则配置",
    },
  },

  // Page 11: 4A上报指标信息管理 (9 buttons - includes audit)
  {
    dir: "4A上报指标信息管理",
    pageName: "4A上报指标信息管理",
    componentName: "SiAShangBaoZhiBiaoXinXiGuanLi",
    prefix: "上报指标",
    idPrefix: "SBZB",
    columns: [
      { prop: "指标编号", label: "指标编号", search: true },
      { prop: "指标名称", label: "指标名称", search: true },
      { prop: "指标类型", label: "指标类型", search: true },
      { prop: "指标状态", label: "指标状态", search: true },
      { prop: "指标说明", label: "指标说明", search: false },
      { prop: "创建时间", label: "创建时间", search: false, width: 170 },
      { prop: "更新时间", label: "更新时间", search: false, width: 170 },
      { prop: "负责人", label: "负责人", search: true },
    ],
    buttons: [
      { text: "定义4A上报指标信息", icon: "el-icon-plus", actionType: "form", btnType: "primary" },
      { text: "修改4A上报指标信息", icon: "el-icon-edit", actionType: "config", btnType: "primary" },
      { text: "删除4A上报指标信息", icon: "el-icon-delete", actionType: "delete", btnType: "danger" },
      { text: "4A上报指标数据查询", icon: "el-icon-s-operation", actionType: "monitor", btnType: "primary" },
      { text: "4A上报指标数据上传", icon: "el-icon-upload2", actionType: "statistics", btnType: "primary" },
      { text: "4A上报指标数据接口监控", icon: "el-icon-view", actionType: "log", btnType: "primary" },
      { text: "查询4A上报指标汇总报告详情", icon: "el-icon-data-analysis", actionType: "analysis", btnType: "primary" },
      { text: "查询4A上报指标稽核报告详情", icon: "el-icon-document-checked", actionType: "audit", btnType: "primary" },
      { text: "查询4A上报指标明细报告详情", icon: "el-icon-warning", actionType: "alert", btnType: "primary" },
    ],
    actionTypes: ["form", "config", "monitor", "statistics", "log", "analysis", "audit", "alert"],
    dialogLabels: {
      config: "修改上报指标配置",
      monitor: "上报指标数据查询",
      statistics: "上报指标数据上传",
      log: "上报指标接口监控",
      analysis: "上报指标汇总报告",
      audit: "上报指标稽核报告",
      alert: "上报指标明细报告",
    },
  },
];

// ─── Mock Data Generation ───

const STATUS_OPTIONS = ["正常", "已启用", "已停用", "异常", "待审核", "已处理"];
const PEOPLE = ["余慧", "system", "admin", "萧然", "曾明", "蒋文博"];

function generateInitialRows(page) {
  const rows = [];
  for (let i = 0; i < 6; i++) {
    const row = { ID: i + 1 };
    const idNum = 79959 + i * 7919;
    const day = 8 + i;
    const time = `2026-05-${String(day).padStart(2, "0")} 09:12:00`;
    const updateTime = `2026-05-${String(day).padStart(2, "0")} 09:12:00`;
    row[page.columns[0].prop] = `${page.idPrefix}-${idNum}`;
    row[page.columns[1].prop] = `${page.prefix}名称-${i + 1}`;
    if (page.columns[2]) {
      const typeOptions = ["系统配置", "网络配置", "安全配置", "性能配置", "数据配置", "规则配置"];
      row[page.columns[2].prop] = typeOptions[i];
    }
    row[page.columns[3].prop] = STATUS_OPTIONS[i];
    // Fill remaining columns with appropriate defaults
    for (let c = 4; c < page.columns.length; c++) {
      const col = page.columns[c];
      if (/时间/.test(col.label)) {
        row[col.prop] = c === 5 ? updateTime : time;
      } else if (/负责人/.test(col.label)) {
        row[col.prop] = PEOPLE[i];
      } else if (/哈希|摘要/.test(col.label)) {
        row[col.prop] = "6f5e4d3c2b1a";
      } else if (/描述|说明/.test(col.label)) {
        row[col.prop] = `${col.label}的描述信息`;
      } else if (/条件/.test(col.label)) {
        row[col.prop] = "阈值超标时触发";
      }
    }
    rows.push(row);
  }
  return rows;
}

// ─── Dialog Field Definitions ───

const DIALOG_FIELDS = {
  config: [
    { label: "配置项名称", value: "", type: "input", disabled: true },
    { label: "配置值", value: "", type: "input", disabled: true },
    { label: "配置说明", value: "", type: "input", disabled: true },
    { label: "生效时间", value: "", type: "input", disabled: true },
    { label: "配置状态", value: "", type: "input", disabled: true },
  ],
  monitor: [
    { label: "查询范围", value: "", type: "input", disabled: true },
    { label: "查询条件", value: "", type: "input", disabled: true },
    { label: "数据量统计", value: "", type: "input", disabled: true },
    { label: "查询结果", value: "", type: "input", disabled: true },
    { label: "查询耗时", value: "", type: "input", disabled: true },
    { label: "查询状态", value: "", type: "input", disabled: true },
  ],
  statistics: [
    { label: "上传文件名", value: "", type: "input", disabled: true },
    { label: "文件大小", value: "", type: "input", disabled: true },
    { label: "上传进度", value: "", type: "input", disabled: true },
    { label: "上传状态", value: "", type: "input", disabled: true },
    { label: "上传时间", value: "", type: "input", disabled: true },
    { label: "操作人", value: "", type: "input", disabled: true },
  ],
  log: [
    { label: "接口地址", value: "", type: "input", disabled: true },
    { label: "请求方式", value: "", type: "input", disabled: true },
    { label: "响应时间", value: "", type: "input", disabled: true },
    { label: "调用状态", value: "", type: "input", disabled: true },
    { label: "错误信息", value: "", type: "input", disabled: true },
    { label: "调用时间", value: "", type: "input", disabled: true },
  ],
  analysis: [
    { label: "报告编号", value: "", type: "input", disabled: true },
    { label: "报告周期", value: "", type: "input", disabled: true },
    { label: "规则/数据总数", value: "", type: "input", disabled: true },
    { label: "匹配数", value: "", type: "input", disabled: true },
    { label: "不匹配数", value: "", type: "input", disabled: true },
    { label: "准确率", value: "", type: "input", disabled: true },
    { label: "生成时间", value: "", type: "input", disabled: true },
  ],
  alert: [
    { label: "明细编号", value: "", type: "input", disabled: true },
    { label: "规则/数据名称", value: "", type: "input", disabled: true },
    { label: "对比结果", value: "", type: "input", disabled: true },
    { label: "差异说明", value: "", type: "input", disabled: true },
    { label: "严重程度", value: "", type: "input", disabled: true },
    { label: "处理状态", value: "", type: "input", disabled: true },
    { label: "发现时间", value: "", type: "input", disabled: true },
  ],
  audit: [
    { label: "稽核编号", value: "", type: "input", disabled: true },
    { label: "稽核周期", value: "", type: "input", disabled: true },
    { label: "稽核类型", value: "", type: "input", disabled: true },
    { label: "稽核结果", value: "", type: "input", disabled: true },
    { label: "问题数量", value: "", type: "input", disabled: true },
    { label: "整改状态", value: "", type: "input", disabled: true },
    { label: "稽核人", value: "", type: "input", disabled: true },
  ],
};

// ─── Vue File Generation ───

function generateVueContent(page) {
  const rows = generateInitialRows(page);
  const initialRowsJSON = JSON.stringify(rows, null, 2);

  const tableColumns = [
    { prop: "ID", label: "ID", type: "text", width: 80 },
    ...page.columns.map((col) => ({
      prop: col.prop,
      label: col.label,
      type: "text",
      search: col.search,
      showTooltip: true,
      ...(col.width ? { width: col.width } : {}),
    })),
    { slot: "operate", label: "操作" },
  ];
  const tableColumnsJSON = JSON.stringify(tableColumns, null, 2);

  const defaultRow = {};
  page.columns.forEach((col) => {
    defaultRow[col.prop] = "";
  });
  const defaultRowJSON = JSON.stringify(defaultRow, null, 2);

  // Buttons HTML
  const buttonsHTML = page.buttons
    .map((btn) => {
      if (btn.actionType === "delete") {
        return `          <el-button plain type="${btn.btnType}" icon="${btn.icon}" @click="deleteSelected">${btn.text}</el-button>`;
      }
      return `          <el-button plain type="${btn.btnType}" icon="${btn.icon}" @click="handleFunction('${btn.text}', '${btn.actionType}')">${btn.text}</el-button>`;
    })
    .join("\n");

  // Dialog HTML - only for actionTypes that have dialogs
  const dialogHTML = page.actionTypes
    .filter((t) => t !== "form")
    .map((type) => {
      const label = page.dialogLabels[type] || type;
      return `
    <!-- ${label}弹窗 -->
    <el-dialog :title="${type}Title" :visible.sync="${type}Visible" width="680px" append-to-body>
      <el-form label-width="120px">
        <el-form-item v-for="item in ${type}Fields" :key="item.label" :label="item.label">
          <el-input v-model="item.value" :disabled="item.disabled"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="${type}Visible = false">关闭</el-button>
        <el-button type="primary" @click="${type}Visible = false; $message.success('操作完成')">确认</el-button>
      </span>
    </el-dialog>`;
    })
    .join("\n");

  // Data properties for each dialog type
  const dataProps = page.actionTypes
    .filter((t) => t !== "form")
    .map((type) => {
      const label = page.dialogLabels[type] || type;
      return `      ${type}Visible: false,
      ${type}Title: "${label}",
      ${type}Fields: [],`;
    })
    .join("\n");

  // Methods for each dialog type
  const openMethods = page.actionTypes
    .filter((t) => t !== "form")
    .map((type) => {
      const label = page.dialogLabels[type] || type;
      const fieldsJSON = JSON.stringify(DIALOG_FIELDS[type], null, 8);
      return `    open${type.charAt(0).toUpperCase() + type.slice(1)}(functionName) {
      this.${type}Title = functionName || '${label}';
      this.${type}Fields = ${fieldsJSON};
      this.${type}Visible = true;
    },`;
    })
    .join("\n");

  // handleFunction routing
  const handleFunctionCases = page.actionTypes
    .filter((t) => t !== "form")
    .map((type) => {
      const methodName = `open${type.charAt(0).toUpperCase() + type.slice(1)}`;
      return `      if (actionType === '${type}') { this.${methodName}(functionName); return; }`;
    })
    .join("\n");

  const content = `<template>
  <div>
    <div style="margin-bottom:12px;">
      <el-page-header @back="goBack" content="${page.pageName}" style="margin-bottom:16px;"></el-page-header>
    </div>
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
${buttonsHTML}
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
        <el-table-column slot="operate" label="操作" :min-width="150" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" icon="el-icon-view" @click="openDetail(scope.row)">详情</el-button>
            <el-button type="text" icon="el-icon-edit" @click="openEdit(scope.row)">修改</el-button>
          </template>
        </el-table-column>
      </cs-pagetable>
    </div>

    <!-- 新增/修改弹窗 -->
    <el-dialog :title="formTitle" :visible.sync="formVisible" width="620px" append-to-body>
      <el-form :model="formData" label-width="130px">
        <el-form-item v-for="col in editableColumns" :key="col.prop" :label="col.label">
          <el-input v-model="formData[col.prop]"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </span>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog title="详情" :visible.sync="detailVisible" width="620px" append-to-body>
      <el-form label-width="130px" class="detail-form">
        <el-form-item v-for="item in detailFields" :key="item.label" :label="item.label">
          <span>{{ item.value }}</span>
        </el-form-item>
      </el-form>
    </el-dialog>
${dialogHTML}
  </div>
</template>

<script>
import { filterData } from "@/utils/index";

const initialRows = ${initialRowsJSON};

const tableColumns = ${tableColumnsJSON};

const defaultRow = ${defaultRowJSON};

export default {
  name: "${page.componentName}",
  data() {
    return {
      searchData: {},
      searchConfig: [],
      allTableData: initialRows.map((item) => ({ ...item })),
      tableData: [],
      selectedRows: [],
      tableColumns,
      pageTotal: 0,
      pageOptions: { pageNum: 1, pageSize: 10 },
      formVisible: false,
      formMode: "add",
      formTitle: "新增",
      formData: { ...defaultRow },
      detailVisible: false,
      detailFields: [],
${dataProps}
    };
  },
  computed: {
    editableColumns() {
      return this.tableColumns.filter((item) => item.prop && item.prop !== "ID");
    },
  },
  created() {
    this.initConfig();
    this.fetchData();
  },
  methods: {
    goBack() { this.$router.go(-1); },
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
    search() { this.pageOptions.pageNum = 1; this.fetchData(); },
    reset() { this.searchData = {}; this.search(); },
    now() {
      const pad = (v) => String(v).padStart(2, "0");
      const d = new Date();
      return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
    },
    nextId() { return this.allTableData.reduce((max, item) => Math.max(max, Number(item.ID) || 0), 0) + 1; },
    handleSelectionChange(selection) { this.selectedRows = selection || []; },

    handleFunction(functionName, actionType) {
      if (actionType === 'form') { this.openAdd(); return; }
${handleFunctionCases}
    },
    openAdd() {
      this.formMode = "add";
      this.formTitle = "新增${page.pageName}";
      this.formData = { ...defaultRow };
      this.formVisible = true;
    },
    openEdit(row) {
      this.formMode = "edit";
      this.formTitle = "修改${page.pageName}";
      this.formData = { ...row };
      this.formVisible = true;
    },
    openDetail(row) {
      this.detailFields = this.editableColumns.map((col) => ({ label: col.label, value: row[col.prop] || "-" }));
      this.detailVisible = true;
    },
    submitForm() {
      if (this.formMode === "add") {
        this.allTableData.unshift({ ...this.formData, ID: this.nextId() });
      } else {
        const idx = this.allTableData.findIndex((item) => item.ID === this.formData.ID);
        if (idx !== -1) this.$set(this.allTableData, idx, { ...this.formData });
      }
      this.formVisible = false;
      this.fetchData();
      this.$message.success("操作成功");
    },
${openMethods}
    deleteSelected() {
      if (!this.selectedRows.length) { this.$message.warning("请先选择要删除的记录"); return; }
      this.$confirm("确定删除选中的 " + this.selectedRows.length + " 条记录？", "确认删除", {
        confirmButtonText: "确定", cancelButtonText: "取消", type: "warning",
      }).then(() => {
        const ids = new Set(this.selectedRows.map((r) => r.ID));
        this.allTableData = this.allTableData.filter((item) => !ids.has(item.ID));
        this.fetchData();
        this.$message.success("删除成功");
      }).catch(() => {});
    },
  },
};
</script>

<style scoped>
.mt10 { margin-top: 10px; }
.mb10 { margin-bottom: 10px; }
.crud-container { background: #fff; padding: 16px; border-radius: 4px; }
.operate-container { display: flex; justify-content: space-between; align-items: center; }
.function-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.detail-form .el-form-item { margin-bottom: 8px; }
</style>
`;

  return content;
}

// ─── Main Execution ───

let createdCount = 0;
let updatedCount = 0;

for (const page of PAGES) {
  const pageDir = path.join(BASE_DIR, page.dir);

  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }

  const vueContent = generateVueContent(page);
  const vuePath = path.join(pageDir, "index.vue");

  // Always overwrite to ensure clean state
  fs.writeFileSync(vuePath, vueContent, "utf8");

  if (fs.existsSync(vuePath)) {
    updatedCount++;
  } else {
    createdCount++;
  }

  // Copy ImportDialog.vue if not present
  const importDialogSrc = path.join(
    __dirname,
    "..",
    "src",
    "views",
    "资产信息上报调整",
    "YN云南COSMIC",
    "4A上报数据对比告警规则管理",
    "ImportDialog.vue"
  );
  const importDialogDst = path.join(pageDir, "ImportDialog.vue");

  if (!fs.existsSync(importDialogDst) && fs.existsSync(importDialogSrc)) {
    fs.copyFileSync(importDialogSrc, importDialogDst);
  }
}

console.log(`\n=== Regeneration Complete ===`);
console.log(`Total pages: ${PAGES.length}`);
console.log(`Written: ${updatedCount}`);
console.log(`\nPages generated:`);
for (const page of PAGES) {
  const actionTypes = page.actionTypes.filter((t) => t !== "form");
  console.log(`  ${page.dir} (${page.buttons.length} buttons, ${actionTypes.length} dialog types: ${actionTypes.join(", ")})`);
}

// Validate generated files
console.log(`\n=== Validation ===`);
let errors = 0;
for (const page of PAGES) {
  const vuePath = path.join(BASE_DIR, page.dir, "index.vue");
  const content = fs.readFileSync(vuePath, "utf8");

  // Check matching el-dialog tags
  const dialogOpen = (content.match(/<el-dialog /g) || []).length;
  const dialogClose = (content.match(/<\/el-dialog>/g) || []).length;
  if (dialogOpen !== dialogClose) {
    console.error(`  ERROR: ${page.dir} - el-dialog mismatch: ${dialogOpen} opens, ${dialogClose} closes`);
    errors++;
  }

  // Check data() has no duplicate keys
  const dataMatch = content.match(/data\(\)\s*\{[\s\S]*?return\s*\{([\s\S]*?)\};[\s\S]*?\}/);
  if (dataMatch) {
    const dataBlock = dataMatch[1];
    const keys = dataBlock.match(/^\s*(\w+):/gm);
    if (keys) {
      const keyNames = keys.map((k) => k.trim().replace(":", ""));
      const uniqueKeys = new Set(keyNames);
      if (uniqueKeys.size !== keyNames.length) {
        console.error(`  ERROR: ${page.dir} - duplicate keys in data()`);
        errors++;
      }
    }
  }

  // Check component name
  const nameMatch = content.match(/name:\s*"(\w+)"/);
  if (!nameMatch || nameMatch[1] !== page.componentName) {
    console.error(`  ERROR: ${page.dir} - component name mismatch: expected ${page.componentName}, got ${nameMatch ? nameMatch[1] : "none"}`);
    errors++;
  }

  // Check handleFunction routes all actionTypes
  for (const at of page.actionTypes) {
    if (at === "form") continue;
    if (!content.includes(`actionType === '${at}'`)) {
      console.error(`  ERROR: ${page.dir} - handleFunction missing case for '${at}'`);
      errors++;
    }
  }

  console.log(`  ${page.dir}: ${dialogOpen} dialogs, OK`);
}

if (errors === 0) {
  console.log(`\nAll validations passed.`);
} else {
  console.error(`\n${errors} validation errors found.`);
}
