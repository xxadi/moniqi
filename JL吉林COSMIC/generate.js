/**
 * JL吉林COSMIC 代码生成脚本
 * 从 src/views/资产信息上报调整/JL吉林COSMIC 目录读取页面名称，生成 controller、iframe HTML、SQL 权限文件
 *
 * 用法: node JL吉林COSMIC/generate.js
 */
const fs = require("fs");
const path = require("path");

// ── 1. 读取页面目录 ──
const viewsDir = path.join(__dirname, "..", "src", "views", "资产信息上报调整", "JL吉林COSMIC");
const pageNames = fs
  .readdirSync(viewsDir)
  .filter((name) => {
    const fullPath = path.join(viewsDir, name);
    return fs.statSync(fullPath).isDirectory() && name !== "ImportDialog.vue";
  })
  .sort();

console.log(`读取到 ${pageNames.length} 个页面`);

// ── 1.1 从路由配置解析中文名→拼音路径映射 ──
const examplesPath = path.join(__dirname, "..", "src", "router", "modules", "examples.js");
const examplesContent = fs.readFileSync(examplesPath, "utf8");

const nameToRoutePath = {};
const jlIdx = examplesContent.indexOf('path: "JLJiLinCOSMIC"');
if (jlIdx !== -1) {
  // 找到 children: [ 的位置
  const childrenStart = examplesContent.indexOf("children: [", jlIdx);
  if (childrenStart !== -1) {
    // 用括号匹配提取完整的 children 块
    let depth = 0;
    let pos = childrenStart + "children:".length;
    // 找到第一个 [
    while (pos < examplesContent.length && examplesContent[pos] !== "[") pos++;
    const bracketStart = pos;
    for (; pos < examplesContent.length; pos++) {
      if (examplesContent[pos] === "[") depth++;
      if (examplesContent[pos] === "]") {
        depth--;
        if (depth === 0) break;
      }
    }
    const childBlock = examplesContent.substring(bracketStart, pos + 1);
    // 匹配每个子路由的 path 和 meta.title
    const routeRegex = /path:\s*"([^"]+)"[\s\S]*?title:\s*"([^"]+)"/g;
    let m;
    while ((m = routeRegex.exec(childBlock)) !== null) {
      nameToRoutePath[m[2]] = m[1];
    }
  }
}
console.log(`解析到 ${Object.keys(nameToRoutePath).length} 条路由映射`);

// ── 2. 生成 Controller ──
function generateController(pages) {
  const methods = pages
    .map(
      (name, i) => {
        const num = String(i + 1).padStart(3, "0");
        return `
    @GetMapping("${name}")
    @RequiresPermissions("gen:JiLinCOSMICController:${name}:view")
    public String page${num}() {
        return prefix + "/${name}";
    }`;
      }
    )
    .join("\n");

  return `package com.neusoft.mid.controller.gen;

import com.neusoft.mid.common.base.BaseController;
import io.swagger.annotations.Api;
import org.apache.shiro.authz.annotation.RequiresPermissions;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * JL吉林COSMIC功能入口
 */
@Controller
@RequestMapping("/JiLinCOSMICController")
@Api(value = "JiLinCOSMICController", tags = "JL吉林COSMIC功能")
public class JiLinCOSMICController extends BaseController {

    private final String prefix = "gen/jiLinCOSMIC";
${methods}
}
`;
}

// ── 3. 生成 iframe HTML ──
function generateIframeHtml(name) {
  // 从路由映射中获取拼音路径，fallback 到中文名
  const routePath = nameToRoutePath[name] || name;
  // 完整 hash 路径: 资产信息上报调整/JLJiLinCOSMIC/子路由
  const hashPath = `ziChanXinXiShangBaoTiaoZheng/JLJiLinCOSMIC/${routePath}`;
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>${name}</title>
    <style type="text/css">
        html,
        body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: #fffffe;
        }

        #VueIframe {
            width: 100%;
            height: 100vh;
            border: none;
            background-color: #fffffe;
        }
    </style>
</head>
<body>
<iframe src="/SafeAssets/static/admin/vueAdminShenji/index.html#/${hashPath}" id="VueIframe"></iframe>
</body>
</html>
`;
}

// ── 4. 生成 SQL ──
function generateSql(pages) {
  const rootUrl = "/JiLinCOSMICController/" + pages[0];
  const rootPerm = `gen:JiLinCOSMICController:${pages[0]}:view`;

  const entries = pages
    .map(
      (name, i) => {
        const num = i + 1;
        const url = `/JiLinCOSMICController/${name}`;
        const perm = `gen:JiLinCOSMICController:${name}:view`;
        return `('ji_lin_cosmic_${num}', '${name}', '${name}', '${url}', 0, 'ji_lin_cosmic_root', '${perm}', 1, '', ${num}, 0)`;
      }
    )
    .join(",\n");

  return `START TRANSACTION;

SET @ji_lin_cosmic_root_id = 'ji_lin_cosmic_root';

DELETE FROM t_sys_permission
WHERE id = @ji_lin_cosmic_root_id
   OR id LIKE 'ji\\_lin\\_cosmic\\_%' ESCAPE '\\';

INSERT INTO t_sys_permission (id, name, descripion, url, is_blank, pid, perms, type, icon, order_num, visible)
VALUES
('ji_lin_cosmic_root', 'JL吉林COSMIC功能', 'JL吉林COSMIC功能', '${rootUrl}', 0, '1', '${rootPerm}', 0, '', 260, 0),
${entries};

COMMIT;

SELECT COUNT(*) AS ji_lin_cosmic_permission_count
FROM t_sys_permission
WHERE id = @ji_lin_cosmic_root_id
   OR pid = @ji_lin_cosmic_root_id;
`;
}

// ── 5. 执行生成 ──
const outputBase = path.join(__dirname);

// 5.1 Controller
const controllerDir = path.join(outputBase, "controller");
fs.mkdirSync(controllerDir, { recursive: true });
const controllerPath = path.join(controllerDir, "JiLinCOSMICController.java");
fs.writeFileSync(controllerPath, generateController(pageNames), "utf8");
console.log(`Controller 已生成: ${controllerPath}`);

// 5.2 iframe HTML
const iframeDir = path.join(outputBase, "iframe", "jiLinCOSMIC");
fs.mkdirSync(iframeDir, { recursive: true });
pageNames.forEach((name) => {
  const htmlPath = path.join(iframeDir, `${name}.html`);
  fs.writeFileSync(htmlPath, generateIframeHtml(name), "utf8");
});
console.log(`iframe HTML 已生成: ${iframeDir}/ (${pageNames.length} 个文件)`);

// 5.3 SQL
const sqlDir = path.join(outputBase, "sql");
fs.mkdirSync(sqlDir, { recursive: true });
const sqlPath = path.join(sqlDir, "ji_lin_cosmic_permission.sql");
fs.writeFileSync(sqlPath, generateSql(pageNames), "utf8");
console.log(`SQL 已生成: ${sqlPath}`);

console.log("\n生成完成!");
