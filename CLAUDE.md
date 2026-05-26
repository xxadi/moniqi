# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Asset Security Management Platform (资产安全管理平台) frontend for China Mobile Shandong. Vue 2 + Element UI single-page application with mock data (no real backend).

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

- `src/views/` — All page views (364 directories, ~1272 .vue files)
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
- 资产信息上报调整 (Asset Info Reporting)
- 采集任务联动 (Collection Task Coordination)
- auth-setting (System Admin: users, roles, menus)
