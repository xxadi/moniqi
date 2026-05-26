<template>
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
          <el-button plain type="primary" icon="el-icon-download" @click='handleFunction("接收互联网暴露面资产上报线程处理请求", "receive_request")'>接收互联网暴露面资产上报线程处理请求</el-button>
          <el-button plain type="primary" icon="el-icon-s-promotion" @click='handleFunction("向互联网暴露面资产上报发送负载均衡调用请求", "send")'>向互联网暴露面资产上报发送负载均衡调用请求</el-button>
          <el-button plain type="primary" icon="el-icon-document-checked" @click='handleFunction("接收互联网暴露面资产上报反馈的线程信息", "receive_feedback")'>接收互联网暴露面资产上报反馈的线程信息</el-button>
          <el-button plain type="primary" icon="el-icon-s-claim" @click='handleFunction("调用互联网暴露面资产上报线程处理对应流程", "invoke")'>调用互联网暴露面资产上报线程处理对应流程</el-button>
          <el-button plain type="primary" icon="el-icon-finished" @click='handleFunction("反馈互联网暴露面资产上报线程处理结果", "feedback_result")'>反馈互联网暴露面资产上报线程处理结果</el-button>
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

    <!-- 接收/处理弹窗 -->
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

    <!-- 发送/调度弹窗 -->
    <el-dialog :title="sendTitle" :visible.sync="sendVisible" width="600px" append-to-body>
      <el-form label-width="120px">
        <el-form-item v-for="item in sendFields" :key="item.label" :label="item.label">
          <span :style="{ color: /超时|断开|失败/.test(item.value) ? '#F56C6C' : /已连接|已连接/.test(item.value) ? '#67C23A' : '' }">{{ item.value }}</span>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="sendVisible = false">关闭</el-button>
        <el-button type="warning" @click="sendVisible = false; $message.warning('已触发重试调度')">重试调度</el-button>
        <el-button type="primary" @click="sendVisible = false; $message.success('调度确认完成')">确认发送</el-button>
      </span>
    </el-dialog>

    <!-- 录入/配置弹窗 - 字段与列表一致 -->
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

    <!-- 反馈/输出弹窗 -->
    <el-dialog :title="feedbackTitle" :visible.sync="feedbackVisible" width="600px" append-to-body>
      <el-form label-width="120px">
        <el-form-item v-for="item in feedbackFields" :key="item.label" :label="item.label">
          <span :style="{ color: /失败|超时|异常|500|504/.test(item.value) ? '#F56C6C' : /成功|200|202/.test(item.value) ? '#67C23A' : '' }">{{ item.value }}</span>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="feedbackVisible = false">关闭</el-button>
        <el-button type="primary" @click="feedbackVisible = false; $message.success('结果已确认')">确认</el-button>
      </span>
    </el-dialog>

    <!-- 查询/展示弹窗 -->
    <el-dialog :title="queryTitle" :visible.sync="queryVisible" width="660px" append-to-body>
      <el-table :data="queryResults" border size="small" style="width: 100%">
        <el-table-column prop="序号" label="序号" width="60" align="center"></el-table-column>
        <el-table-column prop="数据项" label="数据项"></el-table-column>
        <el-table-column prop="结果数量" label="结果数量" width="100" align="center"></el-table-column>
        <el-table-column prop="查询耗时" label="查询耗时" width="100" align="center"></el-table-column>
        <el-table-column prop="状态" label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === '正常' ? 'success' : scope.row.status === '查询超时' ? 'danger' : 'warning'" size="mini">{{ scope.row.状态 }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="queryVisible = false">关闭</el-button>
        <el-button type="primary" @click="queryVisible = false">刷新查询</el-button>
      </span>
    </el-dialog>

    <!-- 接收请求：队列监控面板 -->
    <el-dialog :title="recvReqTitle" :visible.sync="recvReqVisible" width="620px" append-to-body>
      <div style="display:flex;gap:12px;margin-bottom:16px;">
        <div v-for="item in recvReqStats" :key="item.label" style="flex:1;text-align:center;padding:12px;background:#f5f7fa;border-radius:4px;">
          <div style="font-size:12px;color:#909399;">{{ item.label }}</div>
          <div style="font-size:20px;font-weight:bold;color:#303133;margin-top:4px;">{{ item.value }}</div>
        </div>
      </div>
      <el-form label-width="100px">
        <el-form-item label="处理进度">
          <el-progress :percentage="recvReqProgress" :status="recvReqProgress === 100 ? 'success' : undefined" style="width:80%"></el-progress>
        </el-form-item>
      </el-form>
      <div style="background:#f5f7fa;padding:10px;border-radius:4px;max-height:160px;overflow-y:auto;">
        <div v-for="(log, idx) in recvReqLog" :key="idx" style="font-size:12px;margin-bottom:4px;font-family:monospace;">
          <span style="color:#909399;">{{ log.time }}</span>
          <el-tag :type="log.level === 'WARN' ? 'warning' : 'info'" size="mini" style="margin:0 6px;">{{ log.level }}</el-tag>
          <span>{{ log.msg }}</span>
        </div>
      </div>
      <span slot="footer">
        <el-button @click="recvReqVisible = false">关闭</el-button>
        <el-button type="primary" @click="recvReqVisible = false; $message.success('队列已刷新')">刷新队列</el-button>
      </span>
    </el-dialog>

    <!-- 接收反馈：数据流查看面板 -->
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

    <!-- 调度面板 -->
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

    <!-- 流程执行面板 -->
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

    <!-- 反馈结果详情 -->
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

const initialRows = [
  {
    "ID": 1,
    "任务编号": "DB-22157",
    "模块名称": "Agent代理模块",
    "线程数": 64,
    "处理状态": "待处理",
    "负载均衡策略": "一致性哈希",
    "耗时(ms)": 128,
    "更新时间": "2026-05-08 16:08:25"
  },
  {
    "ID": 2,
    "任务编号": "DB-30076",
    "模块名称": "流量分析模块",
    "线程数": 2,
    "处理状态": "处理失败",
    "负载均衡策略": "轮询分配",
    "耗时(ms)": 256,
    "更新时间": "2026-05-09 08:33:11"
  },
  {
    "ID": 3,
    "任务编号": "DB-37995",
    "模块名称": "拨测模块",
    "线程数": 4,
    "处理状态": "已暂停",
    "负载均衡策略": "最少连接",
    "耗时(ms)": 512,
    "更新时间": "2026-05-09 09:47:56"
  },
  {
    "ID": 4,
    "任务编号": "DB-45914",
    "模块名称": "资产总览模块",
    "线程数": 8,
    "处理状态": "排队中",
    "负载均衡策略": "加权轮询",
    "耗时(ms)": 1024,
    "更新时间": "2026-05-08 09:12:18"
  },
  {
    "ID": 5,
    "任务编号": "DB-53833",
    "模块名称": "资产画像模块",
    "线程数": 16,
    "处理状态": "部分完成",
    "负载均衡策略": "源地址哈希",
    "耗时(ms)": 2048,
    "更新时间": "2026-05-08 09:35:44"
  },
  {
    "ID": 6,
    "任务编号": "DB-61752",
    "模块名称": "工信部上报模块",
    "线程数": 32,
    "处理状态": "处理中",
    "负载均衡策略": "随机分配",
    "耗时(ms)": 23,
    "更新时间": "2026-05-08 10:08:06"
  },
  {
    "ID": 7,
    "任务编号": "DB-69671",
    "模块名称": "脆弱性管理模块",
    "线程数": 64,
    "处理状态": "已完成",
    "负载均衡策略": "一致性哈希",
    "耗时(ms)": 56,
    "更新时间": "2026-05-08 10:42:31"
  },
  {
    "ID": 8,
    "任务编号": "DB-77590",
    "模块名称": "资产管理模块",
    "线程数": 2,
    "处理状态": "待处理",
    "负载均衡策略": "轮询分配",
    "耗时(ms)": 128,
    "更新时间": "2026-05-08 11:16:09"
  }
];
const tableColumns = [
  {
    "prop": "ID",
    "label": "ID",
    "type": "text",
    "width": 80
  },
  {
    "prop": "任务编号",
    "label": "任务编号",
    "type": "text",
    "search": true,
    "showTooltip": true
  },
  {
    "prop": "模块名称",
    "label": "模块名称",
    "type": "text",
    "search": true,
    "showTooltip": true
  },
  {
    "prop": "线程数",
    "label": "线程数",
    "type": "text",
    "search": false,
    "showTooltip": true
  },
  {
    "prop": "处理状态",
    "label": "处理状态",
    "type": "text",
    "search": true,
    "showTooltip": true
  },
  {
    "prop": "负载均衡策略",
    "label": "负载均衡策略",
    "type": "text",
    "search": false,
    "showTooltip": true
  },
  {
    "prop": "耗时(ms)",
    "label": "耗时(ms)",
    "type": "text",
    "search": false,
    "showTooltip": true
  },
  {
    "prop": "更新时间",
    "label": "更新时间",
    "type": "text",
    "search": false,
    "showTooltip": true,
    "width": 170
  },
  {
    "slot": "operate",
    "label": "操作"
  }
];
const defaultRow = {
  "ID": "",
  "任务编号": "",
  "模块名称": "",
  "线程数": "",
  "处理状态": "待处理",
  "负载均衡策略": "",
  "耗时(ms)": "",
  "更新时间": ""
};
const importTemplateRow = {
  "任务编号": "",
  "模块名称": "",
  "线程数": "",
  "处理状态": "",
  "负载均衡策略": "",
  "耗时(ms)": "",
  "更新时间": "",
  "导入来源": "互联网暴露面资产上报多线程负载均衡处理导入模板.xlsx"
};

function pageHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 100000;
  return h;
}
const pick = (items, index, seed) => items[(seed + index) % items.length];

export default {
  name: "GeneratedFeaturePage4036",
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
      receiveVisible: false,
      receiveTitle: "接收处理",
      receiveFields: [],
      receiveProgress: 0,
      sendVisible: false,
      sendTitle: "调度发送",
      sendFields: [],
      configureVisible: false,
      configureTitle: "配置录入",
      configureForm: {},
      feedbackVisible: false,
      feedbackTitle: "结果反馈",
      feedbackFields: [],
      queryVisible: false,
      queryTitle: "查询结果",
      queryResults: [],
      recvReqVisible: false,
      recvReqTitle: "接收请求监控",
      recvReqStats: [],
      recvReqProgress: 0,
      recvReqLog: [],
      recvFbVisible: false,
      recvFbTitle: "接收反馈数据",
      recvFbFields: [],
      recvFbPreview: [],
      dispatchVisible: false,
      dispatchTitle: "调度面板",
      dispatchNodes: [],
      dispatchStrategy: "",
      invokeVisible: false,
      invokeTitle: "流程执行",
      invokeSteps: [],
      invokeCurrentStep: 0,
      invokeProgress: 0,
      fbResultVisible: false,
      fbResultTitle: "结果反馈",
      fbResultFields: [],
      fbResultSuccess: false,
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
      return /数量|次数|线程|耗时/.test(prop);
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

      if (actionType === "receive_request") { this.openConfigure(functionName); return; }
      if (actionType === "receive_feedback") { this.openReceiveFeedback(functionName); return; }
      if (actionType === "receive") { this.openReceive(functionName); return; }
      if (actionType === "send") { this.openSend(functionName); return; }
      if (actionType === "dispatch") { this.openDispatch(functionName); return; }
      if (actionType === "invoke") { this.openInvoke(functionName); return; }
      if (actionType === "feedback_result") { this.openFeedbackResult(functionName); return; }
      if (actionType === "feedback") { this.openFeedback(functionName); return; }
      if (actionType === "configure") { this.openConfigure(functionName); return; }
      if (actionType === "query") { this.openQuery(functionName); return; }
      if (actionType === "add") { this.openAdd(functionName); return; }
      if (actionType === "edit") { this.openSelectedEdit(functionName); return; }
      if (actionType === "delete") { this.deleteSelected(); return; }
      if (actionType === "import") { this.openImport(functionName); return; }
      if (actionType === "export") { this.exportRows(functionName); return; }
      if (actionType === "detail") { this.openSelectedDetail(functionName); return; }
      if (actionType === "analysis") { this.openBusinessAnalysis(functionName); return; }
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
      if (status) row[status.prop] = /下发|发送|派发|录入/.test(functionName) ? "已下发" : "已完成";
      this.formData = row;
      this.formVisible = true;
    },
    // ─── 接收/处理：显示线程处理详情 ───
    openReceive(functionName) {
      const S = pageHash(functionName);
      this.receiveTitle = functionName;
      this.receiveFields = [
        { label: "操作名称", value: functionName },
        { label: "线程ID", value: "thread-" + String(S).slice(-6) },
        { label: "处理状态", value: pick(["处理中", "等待队列", "已完成", "处理异常"], 0, S) },
        { label: "队列深度", value: pick([0, 3, 7, 12, 28], 1, S) },
        { label: "已处理数量", value: pick([128, 256, 512, 1024], 2, S) },
        { label: "失败数量", value: pick([0, 1, 3, 7], 3, S) },
        { label: "平均耗时", value: pick(["23ms", "56ms", "128ms", "256ms"], 4, S) + "" },
        { label: "开始时间", value: this.now() },
        { label: "最后活动", value: this.now() },
        { label: "负载策略", value: pick(["轮询分配", "最少连接", "加权轮询"], 5, S) },
      ];
      this.receiveProgress = pick([35, 62, 78, 95, 100], 0, S);
      this.receiveVisible = true;
    },
    // ─── 发送/调度/调用：显示调度详情 ───
    openSend(functionName) {
      const S = pageHash(functionName);
      this.sendTitle = functionName;
      this.sendFields = [
        { label: "操作名称", value: functionName },
        { label: "调度编号", value: "DISP-" + String(S).slice(-6) },
        { label: "目标节点", value: pick(["node-01 (主节点)", "node-02 (备节点)", "node-03 (边缘)", "node-04 (灾备)"], 0, S) },
        { label: "连接状态", value: pick(["已连接", "连接中...", "连接超时", "已断开"], 1, S) },
        { label: "负载均衡", value: pick(["轮询分配", "最少连接", "加权轮询", "源地址哈希"], 2, S) },
        { label: "心跳延迟", value: pick(["12ms", "28ms", "56ms", "120ms"], 3, S) + "" },
        { label: "调度时间", value: this.now() },
        { label: "重试次数", value: pick([0, 1, 2, 3], 4, S) + "" },
        { label: "超时设置", value: pick(["30s", "60s", "120s", "300s"], 5, S) },
      ];
      this.sendVisible = true;
    },
    // ─── 录入/配置：显示配置录入表单 ───
    openConfigure(functionName) {
      this.configureTitle = functionName;
      const S = pageHash(functionName);
      const row = this.createEmptyRow();
      const now = this.now();
      const primary = this.getPrimaryNameField();
      const status = this.getStatusField();
      if (primary) row[primary.prop] = functionName;
      if (status) row[status.prop] = "待处理";
      // 填充其他可编辑字段
      this.editableColumns.forEach((col, i) => {
        if (primary && col.prop === primary.prop) return;
        if (status && col.prop === status.prop) return;
        if (/线程/.test(col.prop)) row[col.prop] = pick([4, 8, 16, 32, 64], i, S);
        else if (/负载/.test(col.prop)) row[col.prop] = pick(["轮询", "权重", "随机", "最少连接"], i, S);
        else if (/耗时/.test(col.prop)) row[col.prop] = 0;
        else if (/时间/.test(col.prop)) row[col.prop] = now;
        else if (/编号|ID/i.test(col.prop)) row[col.prop] = "";
        else row[col.prop] = pick(["正常", "运行中", "已完成", "待处理"], i, S);
      });
      this.configureForm = row;
      this.configureVisible = true;
    },
    submitConfigure() {
      const now = this.now();
      const id = "CFG-" + Date.now();
      const primary = this.getPrimaryNameField();
      const newRow = {
        ...this.configureForm,
        "ID": id,
      };
      // 如果有编号字段，自动填充
      if (/编号|ID/i.test(primary ? primary.prop : "")) {
        newRow[primary.prop] = id;
      }
      // 更新时间设为当前时间
      const timeCol = this.editableColumns.find(c => /时间/.test(c.prop));
      if (timeCol) newRow[timeCol.prop] = now;
      this.allTableData.unshift(newRow);
      this.pageTotal = this.allTableData.length;
      this.fetchData();
      const name = primary ? newRow[primary.prop] : id;
      this.$message.success("配置已保存并添加到列表：" + name);
      this.configureVisible = false;
    },
    // ─── 反馈/返回/输出：显示结果反馈 ───
    openFeedback(functionName) {
      const S = pageHash(functionName);
      this.feedbackTitle = functionName;
      this.feedbackFields = [
        { label: "操作名称", value: functionName },
        { label: "反馈编号", value: "FB-" + String(S).slice(-6) },
        { label: "返回码", value: pick(["200 OK", "202 ACCEPTED", "500 INTERNAL_ERROR", "504 TIMEOUT"], 0, S) },
        { label: "处理结果", value: pick(["成功", "部分成功", "失败", "超时"], 1, S) },
        { label: "处理耗时", value: pick(["23ms", "86ms", "256ms", "1024ms"], 2, S) + "" },
        { label: "返回数据量", value: pick(["0 KB", "12 KB", "48 KB", "256 KB"], 3, S) },
        { label: "错误信息", value: pick(["无", "字段缺失", "格式异常", "权限不足"], 4, S) },
        { label: "完成时间", value: this.now() },
      ];
      this.feedbackVisible = true;
    },
    // ─── 查询/读取/展示：显示查询结果 ───
    openQuery(functionName) {
      const S = pageHash(functionName);
      this.queryTitle = functionName;
      const count = (S % 3) + 3;
      this.queryResults = Array.from({ length: count }).map((_, i) => ({
        序号: i + 1,
        数据项: pick(["配置数据", "状态信息", "日志记录", "统计报表", "资产清单", "任务记录"], i, S),
        结果数量: pick([12, 28, 56, 128, 256], i, S),
        查询耗时: pick(["12ms", "28ms", "56ms", "128ms"], i, S) + "",
        状态: pick(["正常", "部分缺失", "查询超时"], i, S),
      }));
      this.queryVisible = true;
    },
    // ─── 接收请求：队列监控面板 ───
    openReceiveRequest(functionName) {
      const S = pageHash(functionName);
      this.recvReqTitle = functionName;
      this.recvReqStats = [
        { label: "队列深度", value: pick([0, 3, 7, 15, 28], 0, S) + "" },
        { label: "待处理", value: pick([5, 12, 24, 48], 1, S) + "" },
        { label: "处理中", value: pick([1, 2, 4, 8], 2, S) + "" },
        { label: "已完成", value: pick([128, 256, 512], 3, S) + "" },
      ];
      this.recvReqProgress = pick([45, 67, 82, 95], 0, S);
      this.recvReqLog = [
        { time: this.now(), level: "INFO", msg: "接收线程已启动，监听端口 9527" },
        { time: this.now(), level: "INFO", msg: "收到新请求，已加入处理队列" },
        { time: this.now(), level: pick(["INFO", "WARN"], 4, S), msg: pick(["请求处理完成", "队列积压告警", "线程池扩容", "请求参数校验通过"], 5, S) },
      ];
      this.recvReqVisible = true;
    },
    // ─── 接收反馈：数据流查看面板 ───
    openReceiveFeedback(functionName) {
      const S = pageHash(functionName);
      this.recvFbTitle = functionName;
      this.recvFbFields = [
        { label: "数据来源", value: pick(["资产管理模块-主节点", "资产管理模块-备节点", "资产管理模块-边缘节点"], 0, S) },
        { label: "数据格式", value: pick(["JSON", "Protobuf", "XML", "Avro"], 1, S) },
        { label: "数据量", value: pick(["12 KB", "48 KB", "256 KB", "1.2 MB"], 2, S) },
        { label: "解析状态", value: pick(["解析完成", "解析中", "格式异常", "字段缺失"], 3, S) },
        { label: "有效记录", value: pick([86, 128, 256, 512], 4, S) + "条" },
        { label: "丢弃记录", value: pick([0, 2, 5, 12], 5, S) + "条" },
        { label: "接收时间", value: this.now() },
      ];
      this.recvFbPreview = [
        { 字段: "thread_id", 值: "T-" + String(S).slice(-6), 状态: "正常" },
        { 字段: "status", 值: pick(["COMPLETED", "PROCESSING", "PENDING"], 6, S), 状态: "正常" },
        { 字段: "result_data", 值: "{...} (嵌套对象)", 状态: "正常" },
        { 字段: "error_msg", 值: pick(["null", "null", "timeout"], 7, S), 状态: pick(["正常", "正常", "异常"], 8, S) },
      ];
      this.recvFbVisible = true;
    },
    // ─── 调度：调度面板 ───
    openDispatch(functionName) {
      const S = pageHash(functionName);
      this.dispatchTitle = functionName;
      this.dispatchNodes = [
        { 节点: "node-01 (主节点)", 状态: pick(["空闲", "繁忙", "离线"], 0, S), 负载: pick([12, 45, 78, 95], 1, S) + "%", 延迟: pick([8, 16, 32, 120], 2, S) + "ms" },
        { 节点: "node-02 (备节点)", 状态: pick(["空闲", "繁忙"], 3, S), 负载: pick([8, 23, 56], 4, S) + "%", 延迟: pick([12, 24, 48], 5, S) + "ms" },
        { 节点: "node-03 (边缘节点)", 状态: pick(["空闲", "繁忙", "维护中"], 6, S), 负载: pick([5, 34, 67], 7, S) + "%", 延迟: pick([20, 45, 89], 8, S) + "ms" },
      ];
      this.dispatchStrategy = pick(["轮询分配", "最少连接", "加权轮询", "源地址哈希"], 9, S);
      this.dispatchVisible = true;
    },
    // ─── 调用流程：流程执行面板 ───
    openInvoke(functionName) {
      const S = pageHash(functionName);
      this.invokeTitle = functionName;
      this.invokeSteps = [
        { step: "参数校验", status: pick(["已完成", "进行中", "等待中"], 0, S), time: pick(["12ms", "28ms", "-"], 1, S) + "" },
        { step: "权限检查", status: pick(["已完成", "进行中", "等待中", "已跳过"], 2, S), time: pick(["8ms", "15ms", "-"], 3, S) + "" },
        { step: "数据准备", status: pick(["已完成", "进行中", "等待中"], 4, S), time: pick(["23ms", "56ms", "-"], 5, S) + "" },
        { step: "执行核心逻辑", status: pick(["已完成", "进行中", "等待中"], 6, S), time: pick(["128ms", "256ms", "-"], 7, S) + "" },
        { step: "结果持久化", status: pick(["已完成", "进行中", "等待中"], 8, S), time: pick(["18ms", "35ms", "-"], 9, S) + "" },
      ];
      this.invokeCurrentStep = this.invokeSteps.findIndex(s => s.status === "进行中") + 1;
      this.invokeProgress = Math.round((this.invokeSteps.filter(s => s.status === "已完成").length / this.invokeSteps.length) * 100);
      this.invokeVisible = true;
    },
    // ─── 反馈结果：结果反馈详情 ───
    openFeedbackResult(functionName) {
      const S = pageHash(functionName);
      this.fbResultTitle = functionName;
      this.fbResultFields = [
        { label: "操作名称", value: functionName },
        { label: "反馈编号", value: "FB-" + String(S).slice(-6) },
        { label: "返回码", value: pick(["200 OK", "202 ACCEPTED", "500 INTERNAL_ERROR", "504 TIMEOUT"], 0, S) },
        { label: "执行结果", value: pick(["全部成功", "部分成功", "执行失败", "超时终止"], 1, S) },
        { label: "影响记录数", value: pick([0, 12, 48, 128], 2, S) + "条" },
        { label: "处理耗时", value: pick(["23ms", "86ms", "256ms", "1024ms"], 3, S) },
        { label: "错误信息", value: pick(["无", "无", "字段校验失败", "连接超时"], 4, S) },
        { label: "完成时间", value: this.now() },
      ];
      this.fbResultSuccess = /成功|200|202/.test(this.fbResultFields[3].value);
      this.fbResultVisible = true;
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
      exportXLSX(rows, functionName || "互联网暴露面资产上报多线程负载均衡处理导出");
      this.$message.success("导出成功");
    },
    buildExportRows(functionName) {
      if (/数据导出|信息导出|列表导出|全量/.test(functionName)) {
        return this.allTableData;
      }
      if (/执行状态|日志/.test(functionName)) {
        return [
          { 名称: functionName.replace(/导出/g, ""), 状态: "执行成功", 日志: "任务已完成，回执校验通过" },
          { 名称: "互联网暴露面资产上报多线程负载均衡处理任务调度", 状态: "执行中", 日志: "正在等待节点返回执行结果" },
          { 名称: "互联网暴露面资产上报多线程负载均衡处理异常检查", 状态: "已告警", 日志: "发现1条超时记录，已进入重试队列" },
        ];
      }
      if (/统计|分析|报表|报告/.test(functionName)) {
        return [
          { 指标名称: "处理总量", 指标值: 238, 统计周期: "今日", 说明: functionName },
          { 指标名称: "成功数量", 指标值: 221, 统计周期: "今日", 说明: "成功完成业务处理" },
          { 指标名称: "异常数量", 指标值: 17, 统计周期: "今日", 说明: "需要人工复核" },
        ];
      }
      return [
        { 业务名称: functionName, 业务状态: "正常", 处理时间: this.now(), 说明: "按按钮含义生成的业务导出数据" },
        { 业务名称: "互联网暴露面资产上报多线程负载均衡处理业务记录", 业务状态: "已处理", 处理时间: this.now(), 说明: "模拟业务记录" },
        { 业务名称: "互联网暴露面资产上报多线程负载均衡处理复核记录", 业务状态: "待复核", 处理时间: this.now(), 说明: "等待人工确认" },
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
      const code = String(pageHash(functionName)).slice(-6);
      const fields = [
        { label: "业务名称", value: functionName },
        { label: "所属页面", value: "互联网暴露面资产上报多线程负载均衡处理" },
        { label: "一级模块", value: "资产信息上报调整" },
        { label: "二级模块", value: "数据库国产化改造" },
      ];

      if (/接收|处理/.test(functionName)) {
        fields.push(
          { label: "处理编号", value: "PROC-" + code },
          { label: "处理时间", value: this.now() },
          { label: "处理状态", value: "处理中" },
          { label: "线程ID", value: "thread-" + code.slice(0, 4) },
        );
      } else if (/发送|调度|唤醒/.test(functionName)) {
        fields.push(
          { label: "调度编号", value: "DISP-" + code },
          { label: "调度时间", value: this.now() },
          { label: "目标节点", value: "node-" + code.slice(0, 4) },
          { label: "负载策略", value: "轮询分配" },
        );
      } else if (/录入|配置|新增|创建/.test(functionName)) {
        fields.push(
          { label: "配置编号", value: "CFG-" + code },
          { label: "创建时间", value: this.now() },
          { label: "配置状态", value: "已生效" },
          { label: "操作人", value: "系统管理员" },
        );
      } else if (/反馈|返回|输出/.test(functionName)) {
        fields.push(
          { label: "反馈编号", value: "FB-" + code },
          { label: "反馈时间", value: this.now() },
          { label: "反馈结果", value: "处理成功" },
          { label: "耗时", value: "128ms" },
        );
      } else if (/查询|读取|展示/.test(functionName)) {
        fields.push(
          { label: "查询编号", value: "QRY-" + code },
          { label: "查询时间", value: this.now() },
          { label: "结果数量", value: "42" },
          { label: "响应耗时", value: "56ms" },
        );
      } else {
        fields.push(
          { label: "操作编号", value: "OP-" + code },
          { label: "操作时间", value: this.now() },
          { label: "操作状态", value: "已完成" },
        );
      }
      return fields;
    },
    openBusinessAnalysis(functionName) {
      this.analysisTitle = functionName + " - 分析";
      const S = pageHash(functionName);
      this.analysisMetrics = [
        { label: "处理总量", value: pick([128, 256, 512, 1024], 0, S) },
        { label: "成功数量", value: pick([120, 245, 498, 1010], 0, S) },
        { label: "成功率", value: pick(["93.7%", "95.7%", "97.3%", "98.6%"], 0, S) },
      ];
      this.analysisBars = [
        { name: "受理", value: pick([72, 81, 88, 95], 0, S) },
        { name: "执行", value: pick([65, 74, 83, 91], 1, S) },
        { name: "完成", value: pick([88, 93, 97, 100], 2, S) },
      ];
      this.analysisVisible = true;
    },
  },
};
</script>

<style lang="scss" scoped>
.detail-form {
  ::v-deep .el-form-item__label {
    font-weight: 500;
    color: #606266;
  }
  ::v-deep .el-form-item__content span {
    color: #303133;
  }
}
.analysis-panel {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  .metric-card {
    flex: 1;
    text-align: center;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 4px;
    span {
      display: block;
      font-size: 13px;
      color: #909399;
      margin-bottom: 8px;
    }
    strong {
      font-size: 22px;
      color: #303133;
    }
  }
}
.bar-list {
  .bar-row {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    span {
      width: 60px;
      font-size: 13px;
      color: #606266;
    }
    .bar-track {
      flex: 1;
      height: 14px;
      background: #ebeef5;
      border-radius: 7px;
      overflow: hidden;
      margin: 0 12px;
      .bar-value {
        height: 100%;
        background: #409eff;
        border-radius: 7px;
        transition: width 0.3s;
      }
    }
    em {
      width: 40px;
      text-align: right;
      font-style: normal;
      font-size: 13px;
      color: #909399;
    }
  }
}
</style>
