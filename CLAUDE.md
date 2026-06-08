# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Asset Security Management Platform (资产安全管理平台) frontend for China Mobile. Vue 2 + Element UI single-page application with mock data (no real backend).

**项目定位**: 本项目为资产安全管理平台功能点验收演示系统。采用 Vue 2 + Element UI 实现纯前端 Mock 页面，用于根据各省份功能点评估表快速生成可点击、可演示、可验收的功能界面。本项目不作为生产系统，不连接真实后端，不承诺真实数据持久化。验收关注点是功能点覆盖、页面可访问、按钮可点击、弹窗可展示、流程可闭环。

## Development Commands

| Command | Purpose |
|---|---|
| `npm run serve` | Dev server on port 8888 |
| `npm run build` | Production build to `dist/` |
| `npm run build:report` | Build with bundle analyzer |
| `npm run lint` | ESLint check |
| `npm run svgo` | Optimize SVG icons |

## Technology Stack

- Vue 2.6.14, Vue Router 3.5.1 (hash mode), Vuex 3.6.2
- Element UI 2.15.6
- Axios 0.26.1 for HTTP
- Sass (sass + sass-loader)
- SVG sprite icons via svg-sprite-loader
- xlsx 0.18.5 for Excel export/import
- moment.js for date formatting
- Prettier + ESLint (plugin:prettier/recommended)
- Path alias: `@` → `src/`

## Architecture

### Config-Driven CRUD Pattern

All business pages follow a 3-file template pattern in `src/views/template/`:
- **`index.vue`** — Main page. A `tableColumns` config array drives both the search panel (`cs-searchpanel`) and data table (`cs-pagetable`).
- **`FormEdit.vue`** — Dialog form for add/edit/detail using global `cs-editform` component.
- **`ImportDialog.vue`** — Excel import dialog with template download.

The `tableColumns` array is the central config:
```js
{ prop: "fieldName", label: "显示名", type: "text|select|datePicker", search: true, options: [...] }
```

When creating a new business page, copy these 3 files from `src/views/template/`, change the `name` property in the component, update `allTableData` to reference the correct `window.*` variable, and adjust `tableColumns` fields.

### Import Dialog Pattern

All business pages use the `ImportDialog.vue` component for batch import. The component is located in each page's directory (copied from `src/views/template/ImportDialog.vue`).

**Usage in index.vue:**
```html
<ImportDialog ref="importDialog" :tableColumns="tableColumns" :templateName="importTitle" @import="onImport" />
```

```js
import ImportDialog from "./ImportDialog.vue";

export default {
  components: { ImportDialog },
  methods: {
    openImport(functionName) {
      this.importTitle = functionName || "导入";
      this.$refs.importDialog.open();
    },
    onImport(importData) {
      importData.forEach((item) => {
        const newRow = { ...item };
        if (!newRow.ID) {
          newRow.ID = this.allTableData.length + 1;
        }
        this.allTableData.push(newRow);
      });
      this.fetchData();
    },
  },
};
```

**Import flow:**
1. Click "导入" button → opens `ImportDialog`
2. Click "下载模板" → downloads Excel with headers + 3 sample rows (generated from `tableColumns` via `downloadImportTemplate`)
3. Select any `.xlsx/.xls` file (content doesn't matter)
4. Click "确定" → `generateDefaultData(tableColumns)` creates 3 rows with all fields populated based on column config (select options cycle, text fields get themed defaults)
5. Emits `import` event with the data array → parent's `onImport` adds rows to table

**Key functions in `src/utils/index.js`:**
- `generateDefaultData(columns, rowCount)` — Generates default data rows from `tableColumns` config. Handles select options, ID/编号, 名称, 时间, 负责人, 部门, 状态, 结果, etc.
- `downloadImportTemplate(columns, templateName)` — Generates and downloads Excel template with headers + 3 mock rows. Has Blob fallback for browsers that block `XLSX.writeFile`.
- `parseExcelFile(file)` — Parses uploaded Excel file to JSON (available but not used by default import flow).

### Globally Registered Components

Registered in `src/components/componentsRegister.js`:
- `cs-searchpanel` — Config-driven search form
- `cs-pagetable` — Data table with pagination
- `cs-editform` — Config-driven edit/create form
- `cs-detailForm` — Read-only detail view form

### Mock Data

No backend. Data lives in `public/mockData.js` as `window.*` global variables (e.g., `window.指令清单`). Views access it directly: `this.allTableData = window.指令清单`.

### Code Generation

`scripts/sync-functions-from-excel.js` reads a NESMA function point Excel spreadsheet and auto-generates:
- `module_functions.json` — Function definitions by module
- `src/router/modules/examples.js` — All business route definitions (large, ~181KB)
- View directories and template files under `src/views/`

`scripts/generate-jl-pages.js` generates the **JL吉林COSMIC** sub-module pages under `资产信息上报调整`:
- Reads `COSMIC拆分表-需求提取.md` for trigger events and functions
- Generates Vue pages to `src/views/资产信息上报调整/JL吉林COSMIC/{触发事件}/index.vue`
- Appends routes to `examples.js` under the 资产信息上报调整 > JL吉林COSMIC path
- Each page is self-contained: mock data is embedded inline (not using `window.*` globals)
- Buttons: each function gets a unique dialog type (form/detail/monitor/statistics etc.)
- Run: `node scripts/generate-jl-pages.js`

**Do not manually edit** `examples.js` or auto-generated view files — regenerate them from the Excel source.

### Route Structure

Routes are in `src/router/modules/examples.js` (auto-generated) and `src/router/modules/auth-setting.js` (system admin). Route paths use pinyin transliteration of Chinese names (e.g., `/saoMiaoRenWuLianDong` for 扫描任务联动). Paths are URI-encoded via `encodeRoutePaths()` in `src/router/index.js`.

Navigation guards in `src/router/routers-guards.js`. Auth is currently disabled (token check commented out).

**Keep-alive**: Page component `name` must match the route `name` for keep-alive caching to work. If a page is not being cached, verify the names match.

### Vuex Store

Modules auto-imported via `require.context` in `src/store/index.js`: `app`, `user`, `permission`, `settings`, `tagsView`.

### UI Layout Settings

`src/settings.js` controls layout features: tagsView (multi-tab), sidebar menu, header bar, breadcrumb, screen-full button. Toggle booleans here.

### Environment

- `.env.development`: `VUE_APP_BASE_API = '/dev-api'`
- `.env.production`: `VUE_APP_BASE_API = '/prod-api'`
- Token stored in `sessionStorage` under key `TokenKey`
- `publicPath` in `vue.config.js` can be changed for sub-directory deployment

## Key Directories

- `src/views/` — All page views (~730 directories, ~1460 .vue files including ImportDialog.vue copies)
- `src/components/` — Reusable UI components
- `src/layout/` — App shell (sidebar, navbar, tags view)
- `src/utils/` — Utilities: `request.js` (Axios), `auth.js` (token), `index.js` (Excel ops, download)
- `src/styles/` — SCSS variables, mixins, Element UI overrides
- `public/mockData.js` — All mock data (~430KB)
- `scripts/` — Code generation tooling

## Business Modules

- 扫描任务联动 (Scan Task Coordination) — largest module
- 指令清单 (Command List)
- 模拟验证优化 (Simulation Verification)
- 资产信息上报调整 (Asset Info Reporting) — 含省份COSMIC子模块
- 采集任务联动 (Collection Task Coordination)
- auth-setting (System Admin: users, roles, menus)

## 省份接入标准

详见 `docs/省份接入流程.md`、`docs/项目标准.md`。

### 省份模块命名

格式: `{省份简称}{省份名称}COSMIC`，如 `JL吉林COSMIC`、`YN云南COSMIC`。

### 菜单层级

```text
资产信息上报调整
└── {省份模块}
    └── {功能用户}
        └── {功能用户需求页面}
```

### Excel 映射关系

| Excel 层级 | 系统表现 |
| --- | --- |
| 客户需求 | 一级业务分类或页面分组 |
| 功能用户 | 省份模块下的二级菜单 |
| 功能用户需求 | 具体演示页面 |
| 触发事件/功能过程 | 页面按钮、表格操作或流程节点 |
| 子过程描述 | 弹窗步骤、接口日志、详情说明或流程记录 |
| 数据组/数据属性 | 表格字段、表单字段、详情字段 |

### 省份页面目录

```text
src/views/资产信息上报调整/{省份模块}/{功能用户需求}/index.vue
```

## 按钮与流程映射规范

详见 `docs/按钮与流程映射规范.md`。

| 关键词 | 类型 | 页面表现 |
| --- | --- | --- |
| 新增、添加、录入、配置、创建、保存、建立 | 表单录入 | 打开表单弹窗，确认后新增模拟数据 |
| 修改、编辑、变更、更新、维护 | 表单编辑 | 打开编辑弹窗，确认后更新当前行 |
| 删除、移除、清除 | 删除确认 | 打开确认框，确认后删除或提示删除成功 |
| 查询、查看、读取、展示、分页、列表 | 查询展示 | 刷新表格或打开详情弹窗 |
| 导入、上传 | 导入弹窗 | 打开导入弹窗，生成模拟导入结果 |
| 导出、下载、报表导出 | 导出反馈 | 下载模拟文件或提示导出成功 |
| 审批、审核、复核、确认、驳回 | 审批流程 | 打开审批流弹窗，展示节点和处理意见 |
| 下发、发送、推送、上报、同步 | 接口调用 | 打开接口调用弹窗，展示请求、响应和日志 |
| 接收、反馈、返回、回执 | 反馈结果 | 打开反馈弹窗，展示回执、状态和结果 |
| 分析、统计、报表、监控、趋势 | 统计分析 | 打开图表弹窗或统计面板 |
| 稽核、校验、核验、匹配、比对、对比 | 校验结果 | 打开校验结果弹窗，展示通过项和异常项 |
| 调度、执行、启动、停止、重试 | 任务调度 | 打开任务调度弹窗，展示执行进度和日志 |
| 日志、记录、轨迹、历史 | 日志详情 | 打开日志弹窗，展示操作时间线 |
| 指派 | 指派弹窗 | 打开指派弹窗，可选择指派人/负责人/部门，确认后通知负责人 |
| 流程图查看 | 流程图弹窗 | 打开流程图弹窗，用 el-steps 展示审批/流程节点和时间线 |
| 通知 | 通知/告警弹窗 | 打开通知弹窗，展示告警信息和通知列表 |
| 发起审批、发起流程 | 发起审核流程弹窗 | 打开发起审核流程弹窗，展示审核表单和审批节点时间线 |
| 逐级审批 | 逐级审批弹窗 | 打开逐级审批弹窗，展示审批层级、状态、通过/驳回操作 |
| 拒绝、驳回 | 驳回弹窗 | 打开驳回弹窗，可选择驳回类型/级别/原因/说明，确认后退回 |

**优先级**（命中多个关键词时）: 发起审批 > 指派 > 流程图 > 逐级审批 > 驳回 > 通知 > 审批 > 导入 > 导出 > 新增 > 修改 > 删除 > 下发 > 接收 > 稽核 > 统计 > 调度 > 查询 > 日志 > 通用

**Mock 反馈标准**: 所有按钮点击后必须有可见反馈（弹窗打开、消息提示、表格数据变化、状态变化、日志追加），不允许按钮点击后没有任何响应。

## 复杂页面聚合标准

详见 `docs/样板页面-4A上报数据对比告警规则管理.md`。

- 主页面保留核心流程入口（监控、告警、稽核、统计、采集、预处理、导出、推送）
- 新增、修改、删除、查询、上传等围绕同一业务对象的功能，生成独立管理子页面
- 主页面按钮数量建议控制在 **20 到 40 个**之间，超过后继续拆分子页面
- 验收时按"功能簇"说明覆盖关系，不要求按钮名与 Excel 功能点逐字一一对应

## Mock 数据标准

详见 `docs/项目标准.md`。

- 每页至少生成 5 到 10 条演示数据
- 状态字段覆盖: 待处理、处理中、已完成、异常、已驳回
- 时间字段使用最近 30 天内的模拟时间
- 编号字段使用稳定前缀（如 `YN-2024-0001`）
- 数据内容贴合功能名称，不使用明显无关的占位文本
- 录入后数据使用 `unshift` 添加到列表顶部
- 时间格式统一使用 `YYYY-MM-DD HH:mm:ss`，不用 `toLocaleString()`

## 可手改与不可手改

**优先手工维护**: README、docs 规范文档、生成脚本、通用模板

**谨慎手工修改**: 自动生成页面、自动生成路由、批量生成的数据文件

如果自动生成页面存在共性问题，应优先修改生成脚本或页面模板，再重新生成。

## 交付检查清单

详见 `docs/交付检查清单.md`。交付前需确认:

- 菜单层级完整，页面可打开，无空白页
- 查询、重置、刷新有反馈
- 新增、编辑、详情、删除等基础按钮可点击
- 导入、导出有演示反馈
- 审批、下发、反馈、稽核、统计类按钮能打开对应弹窗
- 构建命令 `npm run build` 通过
- 已提供省份演示说明或验收清单

## 按钮操作类型与正则匹配顺序

详见 `docs/数据库国产化改造页面修改记录.md`。

`getActionType` 函数中正则匹配顺序至关重要:

1. `接收.*请求|接收.*处理` → receive_request
2. `接收.*反馈|接收.*信息|接收.*结果` → receive_feedback
3. `接收` → receive
4. `发送` → send
5. `发起.*审批|发起.*流程` → initiate_audit
6. `指派` → assign（必须在新增/配置之前，避免"新增指派信息"误匹配为 configure）
7. `录入|配置|新增|创建|保存|建立|修改` → **必须在调度之前**
8. `调用.*流程|调用.*处理` → **必须在调度之前**
9. `反馈.*结果|返回.*结果` → **必须在调度之前**
10. `反馈|返回|输出` → feedback
11. `^调度|唤醒` 或 `调度(?!模块)` → **放在最后，避免误匹配模块名中的"任务调度"**
12. `查询|读取|展示|监控|跟踪` → query
13. `导出|下载` → export
14. `删除|移除` → delete
15. `分析|统计|报表` → analysis
16. `导入|上传` → import
17. `流程图` → flowchart
18. `逐级审批` → approval
19. `驳回|拒绝` → reject
20. `通知` → alert
21. 其他 → operation

**关键**: `getButtonIcon` 函数的正则顺序必须与 `getActionType` 一致。
