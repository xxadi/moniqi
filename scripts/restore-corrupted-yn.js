/**
 * 恢复 fix-yn-all.js 损坏的 YN云南COSMIC 文件（丢失 template 和 export default）。
 *
 * 损坏模式：文件以 `data() {` 开头，缺少 <template>、<script>、import、export default。
 *
 * 修复方法：使用 generate-yn-pages.js 的逻辑从 功能点拆分表.json 生成
 * 模板、按钮和脚本头，然后与已损坏文件中的 data()/computed/methods 合并。
 *
 * Run: node scripts/restore-corrupted-yn.js
 */
const fs = require("fs");
const path = require("path");

// ─── 复用 generate-yn-pages.js 的工具函数 ───

function pageHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 100000;
  return h;
}
const pick = (items, index, seed) => items[(seed + index) % items.length];

// ─── 解析 JSON 数据 ───

function parseExcelData() {
  const jsonPath = path.join(__dirname, "..", "功能点拆分表.json");
  const rawData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const pagesMap = new Map();

  for (const row of rawData) {
    const userNeed = row.功能用户需求;
    if (!userNeed) continue;
    if (!pagesMap.has(userNeed)) {
      pagesMap.set(userNeed, { name: userNeed, triggers: new Map(), dataAttrs: new Set() });
    }
    const page = pagesMap.get(userNeed);
    if (row.数据属性) {
      const attrs = row.数据属性.split(/[、，,]/).map(s => s.trim()).filter(Boolean);
      attrs.forEach(a => page.dataAttrs.add(a));
    }
    const triggerName = row.触发事件;
    if (!triggerName) continue;
    if (!page.triggers.has(triggerName)) {
      page.triggers.set(triggerName, { name: triggerName, subProcesses: [] });
    }
    const trigger = page.triggers.get(triggerName);
    if (row.子过程描述) {
      trigger.subProcesses.push(row.子过程描述);
    }
  }

  const pages = [];
  for (const [name, page] of pagesMap) {
    const triggers = [];
    for (const [, trigger] of page.triggers) {
      triggers.push(trigger);
    }
    pages.push({
      name,
      triggers,
      dataAttrs: Array.from(page.dataAttrs),
    });
  }
  return pages;
}

// ─── 按钮类型映射（从 generate-yn-pages.js 复制） ───

function getPreferredDialogType(name) {
  if (/^(新增|创建|录入|保存|建立|批量导入)/.test(name)) return "form";
  if (/^(配置|修改)/.test(name)) return "config";
  if (/^(查询|查看|展示|跟踪|读取)/.test(name)) return "detail";
  if (/^(导出|下载)/.test(name)) return "export";
  if (/^(删除|移除)/.test(name)) return "operation";
  if (/^(发起.*审核流程)/.test(name)) return "initiate_audit";
  if (/^(发起)/.test(name)) return "workflow";
  if (/^(反馈|输出|返回)/.test(name)) return "feedback";
  if (/^(发送|调度|调用|唤醒)/.test(name)) return "dispatch";
  if (/^(接收|输入)/.test(name)) return "receive";
  if (/监控告警|异常告警|失败告警/.test(name)) return "alert";
  if (/结果监控|状态监控|运行监控|采集监控/.test(name)) return "monitor";
  if (/监控/.test(name)) return "log";
  if (/统计/.test(name)) return "statistics";
  if (/分析|评估|运行效果/.test(name)) return "analysis";
  if (/告警|稽核|审批|通知|推送|催办|提醒|驳回|拒绝/.test(name)) return "audit";
  if (/采集|转换|预处理/.test(name)) return "transform";
  if (/提取|识别|分级|聚合|计算|审查|校验|研判/.test(name)) return "validate";
  if (/同步/.test(name)) return "sync";
  if (/预览/.test(name)) return "preview";
  if (/报表/.test(name)) return "report";
  if (/调度|计划/.test(name)) return "schedule";
  if (/接口/.test(name)) return "api";
  return "operation";
}

function getButtonIcon(name) {
  if (/^(新增|创建|录入|配置|保存|建立|批量导入)/.test(name)) return "el-icon-edit-outline";
  if (/修改/.test(name)) return "el-icon-edit";
  if (/^(查询|查看|展示|跟踪|读取)/.test(name)) return "el-icon-view";
  if (/^(导出|下载)/.test(name)) return "el-icon-download";
  if (/^(删除|移除)/.test(name)) return "el-icon-delete";
  if (/^(反馈|输出|返回)/.test(name)) return "el-icon-upload2";
  if (/^(发送|调度|调用|唤醒)/.test(name)) return "el-icon-s-promotion";
  if (/^(接收|输入)/.test(name)) return "el-icon-download";
  if (/^发起.*审核流程/.test(name)) return "el-icon-s-check";
  if (/^发起/.test(name)) return "el-icon-s-claim";
  if (/监控告警|异常告警|失败告警/.test(name)) return "el-icon-warning";
  if (/结果监控|状态监控|运行监控|采集监控/.test(name)) return "el-icon-view";
  if (/监控/.test(name)) return "el-icon-view";
  if (/告警|稽核|审批|通知|推送|催办|提醒|驳回|拒绝/.test(name)) return "el-icon-bell";
  if (/统计/.test(name)) return "el-icon-data-analysis";
  if (/分析|评估|运行效果/.test(name)) return "el-icon-data-analysis";
  if (/采集|转换|预处理|提取|识别|分级|聚合|计算|审查|校验|研判/.test(name)) return "el-icon-data-analysis";
  if (/接口/.test(name)) return "el-icon-s-promotion";
  return "el-icon-s-operation";
}

const DIALOG_TYPES = [
  "form", "detail", "monitor", "statistics", "analysis", "alert", "audit",
  "workflow", "dispatch", "receive", "feedback", "export", "api", "dataprocess", "operation",
  "config", "sync", "preview", "log", "report", "validate", "transform", "schedule",
  "initiate_audit"
];

function assignUniqueDialogTypes(triggers) {
  const usedTypes = new Set();
  return triggers.map((tr) => {
    const preferredType = getPreferredDialogType(tr.name);
    let assignedType;
    if (!usedTypes.has(preferredType)) {
      assignedType = preferredType;
    } else {
      assignedType = DIALOG_TYPES.find((t) => !usedTypes.has(t)) || preferredType;
    }
    usedTypes.add(assignedType);
    return { name: tr.name, dialogType: assignedType };
  });
}

// ─── 生成按钮 HTML ───

function createButtonsHTML(triggers) {
  const assignments = assignUniqueDialogTypes(triggers);
  return assignments
    .map(({ name, dialogType }) => {
      const icon = getButtonIcon(name);
      if (/导出|下载/.test(name)) {
        return `          <el-button plain type="primary" icon="${icon}" @click='exportRows("${name}")'>${name}</el-button>`;
      }
      if (/导入/.test(name)) {
        return `          <el-button plain type="primary" icon="${icon}" @click='openImport("${name}")'>${name}</el-button>`;
      }
      if (/^删除/.test(name)) {
        return `          <el-button plain type="danger" icon="${icon}" @click='deleteByName("${name}")'>${name}</el-button>`;
      }
      return `          <el-button plain type="primary" icon="${icon}" @click='handleFunction("${name}", "${dialogType}")'>${name}</el-button>`;
    })
    .join("\n");
}

// ─── 生成表格列 ───

function createColumnsFromAttrs(page) {
  const attrs = page.dataAttrs;
  const columns = [{ prop: "ID", label: "ID", type: "text", width: 80 }];

  const attrList = attrs.slice(0, 12);
  attrList.forEach((attr) => {
    let type = "text";
    let search = false;
    let width = undefined;

    if (/时间|日期/.test(attr)) {
      type = "text";
      search = false;
      width = 170;
    } else if (/状态|结果|级别|类型/.test(attr)) {
      search = true;
    } else if (/编号|ID|流水号/.test(attr)) {
      search = true;
    } else if (/名称|描述/.test(attr)) {
      search = true;
    }

    const prop = attr.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "_");
    columns.push({ prop, label: attr, type, search, showTooltip: true, ...(width ? { width } : {}) });
  });

  columns.push({ slot: "operate", label: "操作" });
  return columns;
}

// ─── 生成 Mock 数据 ───

function createMockData(page) {
  const S = pageHash(page.name);
  const count = (S % 5) + 6;
  const times = [
    "2026-05-08 09:12:18", "2026-05-08 09:35:44", "2026-05-08 10:08:06",
    "2026-05-08 10:42:31", "2026-05-08 11:16:09", "2026-05-08 14:03:52",
    "2026-05-08 15:21:37", "2026-05-08 16:08:25", "2026-05-09 08:33:11",
    "2026-05-09 09:47:56",
  ];
  const t = (i) => times[(S + i) % times.length];
  const columns = createColumnsFromAttrs(page);

  const statusValues = [
    "已处理", "处理中", "待处理", "处理失败", "已暂停", "已完成", "排队中", "部分完成",
    "已启用", "已停用", "正常", "异常", "超时", "已取消", "已驳回", "待审核",
  ];

  const rows = Array.from({ length: count }).map((_, i) => {
    const row = { ID: i + 1 };
    columns.forEach((col) => {
      if (!col.prop || col.prop === "ID" || col.slot) return;
      const label = col.label;
      if (/时间|日期/.test(label)) {
        row[col.prop] = t(i);
      } else if (/编号|ID|流水号/.test(label)) {
        row[col.prop] = `${String.fromCharCode(65 + (S % 26))}-${String(S + i * 7919).slice(-6)}`;
      } else if (/状态|结果|级别/.test(label)) {
        row[col.prop] = pick(statusValues, i, S);
      } else if (/数量|次数|耗时/.test(label)) {
        row[col.prop] = pick([12, 28, 56, 128, 256, 512, 1024], i, S);
      } else if (/名称/.test(label)) {
        row[col.prop] = `${page.name}-${i + 1}`;
      } else if (/部门|组织|单位/.test(label)) {
        row[col.prop] = pick(["安全运维部", "网络管理部", "资产管理部", "信息安全部", "系统运维部", "数据管理部"], i, S);
      } else if (/人员|用户|负责人|操作/.test(label)) {
        row[col.prop] = pick(["张三", "李四", "王五", "赵六", "system", "admin"], i, S);
      } else if (/IP|地址/.test(label)) {
        row[col.prop] = pick(["10.10.1.100", "172.16.0.50", "192.168.1.200", "10.20.5.30", "172.20.1.80", "10.0.0.254"], i, S);
      } else {
        row[col.prop] = pick(statusValues, i, S);
      }
    });
    return row;
  });
  return { columns, rows };
}

const TEMPLATE_BODY = `<template>
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
_BUTTONS_
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
        <el-table-column slot="operate" label="操作" :min-width="220" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" icon="el-icon-view" @click="openDetail(scope.row)">详情</el-button>
            <el-button type="text" icon="el-icon-edit" @click="openEdit(scope.row)">修改</el-button>
            <el-button type="text" icon="el-icon-delete" style="color:#F56C6C" @click="deleteRow(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </cs-pagetable>
    </div>

    <el-dialog :title="formTitle" :visible.sync="formVisible" width="620px" append-to-body>
      <el-form :model="formData" label-width="130px">
        <el-form-item v-for="col in editableColumns" :key="col.prop" :label="col.label">
          <el-select v-if="isStatusField(col.prop)" v-model="formData[col.prop]" style="width: 100%">
            <el-option label="待处理" value="待处理"></el-option>
            <el-option label="处理中" value="处理中"></el-option>
            <el-option label="已完成" value="已完成"></el-option>
            <el-option label="处理失败" value="处理失败"></el-option>
            <el-option label="已暂停" value="已暂停"></el-option>
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

    <el-dialog :title="receiveTitle" :visible.sync="receiveVisible" width="600px" append-to-body>
      <el-form label-width="120px">
        <el-form-item label="处理进度">
          <el-progress :percentage="receiveProgress" :status="receiveProgress === 100 ? 'success' : undefined" style="width: 80%"></el-progress>
        </el-form-item>
        <el-form-item v-for="item in receiveFields" :key="item.label" :label="item.label">
          <span>{{ item.value }}</span>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="receiveVisible = false">关闭</el-button>
        <el-button type="primary" @click="receiveVisible = false; $message.success('处理确认完成')">确认处理</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="sendTitle" :visible.sync="sendVisible" width="600px" append-to-body>
      <el-form label-width="120px">
        <el-form-item v-for="item in sendFields" :key="item.label" :label="item.label">
          <span :style="{ color: /超时|断开|失败/.test(item.value) ? '#F56C6C' : /已连接/.test(item.value) ? '#67C23A' : '' }">{{ item.value }}</span>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="sendVisible = false">关闭</el-button>
        <el-button type="warning" @click="sendVisible = false; $message.warning('已触发重试调度')">重试调度</el-button>
        <el-button type="primary" @click="sendVisible = false; $message.success('调度确认完成')">确认发送</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="configureTitle" :visible.sync="configureVisible" width="620px" append-to-body>
      <el-form :model="configureForm" label-width="130px">
        <el-form-item v-for="col in editableColumns" :key="col.prop" :label="col.label">
          <el-select v-if="isStatusField(col.prop)" v-model="configureForm[col.prop]" style="width: 100%">
            <el-option label="待处理" value="待处理"></el-option>
            <el-option label="处理中" value="处理中"></el-option>
            <el-option label="已完成" value="已完成"></el-option>
            <el-option label="处理失败" value="处理失败"></el-option>
            <el-option label="已暂停" value="已暂停"></el-option>
            <el-option label="异常" value="异常"></el-option>
          </el-select>
          <el-input-number v-else-if="isNumberField(col.prop)" v-model="configureForm[col.prop]" :min="0" controls-position="right" style="width: 100%"></el-input-number>
          <el-input v-else-if="isLongField(col.prop)" v-model="configureForm[col.prop]" type="textarea" :rows="3"></el-input>
          <el-input v-else v-model="configureForm[col.prop]"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="configureVisible = false">取消</el-button>
        <el-button type="primary" @click="submitConfigure">保存配置</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="feedbackTitle" :visible.sync="feedbackVisible" width="600px" append-to-body>
      <el-form label-width="120px">
        <el-form-item v-for="item in feedbackFields" :key="item.label" :label="item.label">
          <span :style="{ color: /失败|超时|异常/.test(item.value) ? '#F56C6C' : /成功|200/.test(item.value) ? '#67C23A' : '' }">{{ item.value }}</span>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="feedbackVisible = false">关闭</el-button>
        <el-button type="primary" @click="feedbackVisible = false; $message.success('反馈已确认')">确认</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="queryTitle" :visible.sync="queryVisible" width="660px" append-to-body>
      <el-table :data="queryResults" border size="mini" style="width:100%">
        <el-table-column prop="序号" label="序号" width="60" align="center"></el-table-column>
        <el-table-column prop="数据项" label="数据项"></el-table-column>
        <el-table-column prop="结果数量" label="结果数量" width="100" align="center"></el-table-column>
        <el-table-column prop="查询耗时" label="查询耗时" width="100" align="center"></el-table-column>
        <el-table-column prop="状态" label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.状态 === '正常' ? 'success' : scope.row.状态 === '查询超时' ? 'danger' : 'warning'" size="mini">{{ scope.row.状态 }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="queryVisible = false">关闭</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="recvReqTitle" :visible.sync="recvReqVisible" width="600px" append-to-body>
      <el-form label-width="100px" style="margin-bottom:12px;">
        <el-form-item label="处理进度">
          <el-progress :percentage="recvReqProgress" :status="recvReqProgress === 100 ? 'success' : undefined" style="width:80%"></el-progress>
        </el-form-item>
        <el-form-item v-for="item in recvReqStats" :key="item.label" :label="item.label">
          <span>{{ item.value }}</span>
        </el-form-item>
      </el-form>
      <div style="font-size:13px;color:#606266;margin-bottom:8px;font-weight:500;">处理日志</div>
      <el-table :data="recvReqLog" border size="mini" style="width:100%">
        <el-table-column prop="time" label="时间" width="160"></el-table-column>
        <el-table-column prop="level" label="级别" width="70" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.level === 'WARN' ? 'warning' : 'info'" size="mini">{{ scope.row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="msg" label="消息"></el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="recvReqVisible = false">关闭</el-button>
        <el-button type="primary" @click="recvReqVisible = false; $message.success('已确认接收')">确认接收</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="recvFbTitle" :visible.sync="recvFbVisible" width="660px" append-to-body>
      <el-form label-width="110px" style="margin-bottom:12px;">
        <el-form-item v-for="item in recvFbFields" :key="item.label" :label="item.label">
          <span :style="{ color: /异常|缺失|失败/.test(item.value) ? '#F56C6C' : /完成|正常/.test(item.value) ? '#67C23A' : '' }">{{ item.value }}</span>
        </el-form-item>
      </el-form>
      <div style="font-size:13px;color:#606266;margin-bottom:8px;font-weight:500;">数据预览</div>
      <el-table :data="recvFbPreview" border size="mini" style="width:100%">
        <el-table-column prop="字段" label="字段名" width="140"></el-table-column>
        <el-table-column prop="值" label="值"></el-table-column>
        <el-table-column prop="状态" label="状态" width="80" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.状态 === '正常' ? 'success' : 'danger'" size="mini">{{ scope.row.状态 }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="recvFbVisible = false">关闭</el-button>
        <el-button type="primary" @click="recvFbVisible = false; $message.success('数据已确认接收')">确认接收</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="dispatchTitle" :visible.sync="dispatchVisible" width="660px" append-to-body>
      <el-form label-width="110px" style="margin-bottom:12px;">
        <el-form-item label="调度策略">
          <el-tag type="info">{{ dispatchStrategy }}</el-tag>
        </el-form-item>
      </el-form>
      <el-table :data="dispatchNodes" border size="small" style="width:100%">
        <el-table-column prop="节点" label="节点"></el-table-column>
        <el-table-column prop="状态" label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.状态 === '空闲' ? 'success' : scope.row.状态 === '离线' || scope.row.状态 === '维护中' ? 'danger' : 'warning'" size="mini">{{ scope.row.状态 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="负载" label="负载" width="80" align="center"></el-table-column>
        <el-table-column prop="延迟" label="延迟" width="80" align="center"></el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="dispatchVisible = false">关闭</el-button>
        <el-button type="warning" @click="dispatchVisible = false; $message.warning('已触发重新调度')">重新调度</el-button>
        <el-button type="primary" @click="dispatchVisible = false; $message.success('调度已下发')">确认调度</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="invokeTitle" :visible.sync="invokeVisible" width="600px" append-to-body>
      <el-form label-width="100px">
        <el-form-item label="执行进度">
          <el-progress :percentage="invokeProgress" :status="invokeProgress === 100 ? 'success' : undefined" style="width:80%"></el-progress>
        </el-form-item>
      </el-form>
      <div style="margin-top:8px;">
        <div v-for="(step, idx) in invokeSteps" :key="idx" style="display:flex;align-items:center;padding:8px 12px;border-bottom:1px solid #f0f0f0;">
          <el-tag :type="step.status === '已完成' ? 'success' : step.status === '进行中' ? '' : 'info'" size="mini" style="width:70px;text-align:center;">{{ step.status }}</el-tag>
          <span style="flex:1;margin-left:12px;font-size:13px;">{{ step.step }}</span>
          <span style="font-size:12px;color:#909399;width:60px;text-align:right;">{{ step.time }}</span>
        </div>
      </div>
      <span slot="footer">
        <el-button @click="invokeVisible = false">关闭</el-button>
        <el-button v-if="invokeProgress < 100" type="warning" @click="invokeVisible = false; $message.warning('已暂停执行')">暂停</el-button>
        <el-button type="primary" @click="invokeVisible = false; $message.success('流程已确认完成')">确认完成</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="fbResultTitle" :visible.sync="fbResultVisible" width="600px" append-to-body>
      <el-alert v-if="fbResultSuccess" title="执行成功" type="success" :closable="false" show-icon style="margin-bottom:16px;"></el-alert>
      <el-alert v-else title="执行异常" type="error" :closable="false" show-icon style="margin-bottom:16px;"></el-alert>
      <el-form label-width="120px">
        <el-form-item v-for="item in fbResultFields" :key="item.label" :label="item.label">
          <span :style="{ color: /失败|超时|异常|500|504/.test(item.value) ? '#F56C6C' : /成功|200|202/.test(item.value) ? '#67C23A' : '' }">{{ item.value }}</span>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="fbResultVisible = false">关闭</el-button>
        <el-button v-if="!fbResultSuccess" type="warning" @click="fbResultVisible = false; $message.warning('已触发重试')">重试</el-button>
        <el-button type="primary" @click="fbResultVisible = false">确认</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { exportXLSX, filterData } from "@/utils/index";

const initialRows = _INITIAL_ROWS_;
const tableColumns = _COLUMNS_;
const defaultRow = _DEFAULT_ROW_;
const importTemplateRow = _IMPORT_ROW_;

function pageHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 100000;
  return h;
}
const pick = (items, index, seed) => items[(seed + index) % items.length];

export default {
  name: "_NAME_",
`;

// ─── 解析被损坏文件 ───

/**
 * 被损坏的文件结构：
 * ```
 * data() {            ← 这是文件的第一行
 *   return { ... };
 * },
 * computed: { ... },
 * created() { ... },
 * methods: { ... },
 * };
 * </script>
 *
 * <style scoped>...</style>
 * ```
 *
 * 缺少：<template>, <script>, import, const 定义, export default {, name
 */

function restoreFile(filePath, page, componentIndex) {
  const { columns, rows } = createMockData(page);
  const buttonsHTML = createButtonsHTML(page.triggers);

  const defaultRowObj = {};
  columns.forEach((c) => {
    if (c.prop) defaultRowObj[c.prop] = c.prop === "处理状态" ? "待处理" : "";
  });

  const importRowObj = {};
  columns.forEach((c) => {
    if (c.prop && c.prop !== "ID") importRowObj[c.prop] = "";
  });
  importRowObj["导入来源"] = page.name + "导入模板.xlsx";

  // 生成模板（插入按钮）
  let template = TEMPLATE_BODY;
  template = template.replace("_BUTTONS_", buttonsHTML);
  template = template.replace("_INITIAL_ROWS_", JSON.stringify(rows, null, 2));
  template = template.replace("_COLUMNS_", JSON.stringify(columns, null, 2));
  template = template.replace("_DEFAULT_ROW_", JSON.stringify(defaultRowObj, null, 2));
  template = template.replace("_IMPORT_ROW_", JSON.stringify(importRowObj, null, 2));
  template = template.replace("_NAME_", `YNPage${componentIndex}`);

  // 读取当前损坏文件
  let content = fs.readFileSync(filePath, "utf-8");

  // 损坏文件应从 data() 开始
  if (!content.startsWith("data()")) {
    console.log(`  [SKIP] ${page.name} does not start with data() - might be ok`);
    return false;
  }

  // 找到 }); 结束和 </script>（已损坏文件以 data() 开头，以 </style> 结尾）
  // 提取从 data() 到 }; (export default 关闭) + </script>
  const scriptEndMatch = content.match(/^data\([\s\S]*?\};?\s*(\r?\n<\/script>)/);
  if (!scriptEndMatch) {
    console.log(`  [SKIP] Cannot find script end in ${page.name}`);
    return false;
  }

  const existingScript = content.slice(0, scriptEndMatch.index + scriptEndMatch[0].length);
  const afterScript = content.slice(scriptEndMatch.index + scriptEndMatch[0].length);

  // 重建完整文件
  const restored = template + existingScript + afterScript;

  fs.writeFileSync(filePath, restored, "utf-8");
  return true;
}

// ─── 主流程 ───

function main() {
  const viewsDir = path.join(__dirname, "..", "src", "views", "资产信息上报调整", "YN云南COSMIC");
  const allPages = parseExcelData();

  // 创建 page name → page 映射
  const pageMap = new Map();
  allPages.forEach((p, i) => {
    pageMap.set(p.name, { page: p, index: 6000 + i });
  });

  // 查找所有被损坏的文件 (以 data() 开头)
  const files = [];
  for (const entry of fs.readdirSync(viewsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const indexPath = path.join(viewsDir, entry.name, "index.vue");
    if (!fs.existsSync(indexPath)) continue;
    const firstLine = fs.readFileSync(indexPath, "utf-8").split("\n")[0].trim();
    if (firstLine === "data() {") {
      files.push({ dir: entry.name, filePath: indexPath });
    }
  }

  console.log(`找到 ${files.length} 个损坏文件\n`);

  let fixed = 0, skipped = 0, notFound = 0;
  for (const { dir, filePath } of files) {
    const pageInfo = pageMap.get(dir);
    if (!pageInfo) {
      // 尝试找部分匹配
      let found = null;
      for (const [name, info] of pageMap) {
        if (name.includes(dir) || dir.includes(name)) {
          found = info;
          break;
        }
      }
      if (!found) {
        console.log(`  [SKIP] 在功能点拆分表中未找到: ${dir}`);
        notFound++;
        continue;
      }
      pageInfo = found;
    }

    try {
      if (restoreFile(filePath, pageInfo.page, pageInfo.index)) {
        console.log(`✓ 已恢复: ${dir}`);
        fixed++;
      } else {
        skipped++;
      }
    } catch (e) {
      console.error(`✗ 错误 ${dir}: ${e.message}`);
    }
  }

  console.log(`\n完成: ${fixed} 恢复, ${skipped} 跳过, ${notFound} 未找到`);
}

main();
