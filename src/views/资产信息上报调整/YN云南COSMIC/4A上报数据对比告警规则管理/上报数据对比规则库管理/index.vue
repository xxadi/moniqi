<template>
  <div>
    <cs-searchpanel :searchConfig="searchConfig" :searchData="searchData" @handelSearch="search" @handelReset="reset" labelWidth="100px"></cs-searchpanel>
    <div class="mt10 crud-container">
      <div class="mb10 operate-container">
        <div class="function-actions">
          <el-button plain type="primary" icon="el-icon-edit-outline" @click='handleFunction("新增上报数据对比规则", "add_new")'>新增上报数据对比规则</el-button>
          <el-button plain type="primary" icon="el-icon-edit-outline" @click='handleFunction("定义上报数据对比规则库信息", "define_rule")'>定义上报数据对比规则库信息</el-button>
          <el-button plain type="primary" icon="el-icon-edit" @click='handleFunction("修改上报数据对比规则库信息", "modify_rule")'>修改上报数据对比规则库信息</el-button>
          <el-button plain type="danger" icon="el-icon-delete" @click='handleFunction("删除上报数据对比规则库信息", "delete_rule")'>删除上报数据对比规则库信息</el-button>
          <el-button plain type="primary" icon="el-icon-view" @click='handleFunction("上报数据对比规则库数据查询", "query_rule")'>上报数据对比规则库数据查询</el-button>
          <el-button plain type="primary" icon="el-icon-upload2" @click='handleFunction("上报数据对比规则库数据上传", "import_rule")'>上报数据对比规则库数据上传</el-button>
          <el-button plain type="primary" icon="el-icon-monitor" @click='handleFunction("上报数据对比规则库数据接口监控", "monitor_rule")'>上报数据对比规则库数据接口监控</el-button>
          <el-button plain type="primary" icon="el-icon-view" @click='handleFunction("查询上报数据对比规则库汇总报告详情", "query_summary")'>查询上报数据对比规则库汇总报告详情</el-button>
          <el-button plain type="primary" icon="el-icon-view" @click='handleFunction("查询上报数据对比规则库明细报告详情", "query_detail")'>查询上报数据对比规则库明细报告详情</el-button>
          <el-button plain type="primary" icon="el-icon-view" @click='handleFunction("查询上报数据对比规则列表", "query_list")'>查询上报数据对比规则列表</el-button>
          <el-button plain type="primary" icon="el-icon-view" @click='handleFunction("查询上报数据对比规则详情", "query_info")'>查询上报数据对比规则详情</el-button>
        </div>
        <el-button type="text" icon="el-icon-back" @click="$router.back()">返回上级</el-button>
      </div>
      <cs-pagetable pageTableRef="pageTableRef" :showSelection="true" :tableData="tableData" :tableColumns="tableColumns" :pageTotal="pageTotal" :page.sync="pageOptions.pageNum" :limit.sync="pageOptions.pageSize" @handleSelectionChange="handleSelectionChange" @handleSelectAll="handleSelectionChange" @handleCurrentChange="fetchData" @handleSizeChange="fetchData">
        <el-table-column slot="operate" label="操作" width="260" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" icon="el-icon-view" @click="detail(scope.row)">详情</el-button>
            <el-button type="text" icon="el-icon-edit" @click="edit(scope.row)">修改</el-button>
            <el-button type="text" icon="el-icon-delete" style="color:#F56C6C" @click="deleteRow(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </cs-pagetable>
    </div>

    <el-dialog :title="formTitle" :visible.sync="formVisible" width="620px" append-to-body>
      <el-form :model="formData" label-width="120px">
        <el-form-item v-for="col in editableColumns" :key="col.prop" :label="col.label">
          <el-select v-if="/状态/.test(col.prop)" v-model="formData[col.prop]" style="width:100%">
            <el-option label="启用" value="启用"></el-option><el-option label="停用" value="停用"></el-option>
          </el-select>
          <el-input v-else v-model="formData[col.prop]" :disabled="formMode==='detail'"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="formVisible = false">取消</el-button>
        <el-button v-if="formMode!=='detail'" type="primary" @click="submitForm">确定</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="configureTitle" :visible.sync="configureVisible" width="620px" append-to-body>
      <el-form :model="configureForm" label-width="120px">
        <el-form-item v-for="col in editableColumns" :key="col.prop" :label="col.label">
          <el-select v-if="/状态/.test(col.prop)" v-model="configureForm[col.prop]" style="width:100%">
            <el-option label="启用" value="启用"></el-option><el-option label="停用" value="停用"></el-option>
          </el-select>
          <el-input-number v-else-if="isNumberField(col.prop)" v-model="configureForm[col.prop]" :min="0" controls-position="right" style="width:100%"></el-input-number>
          <el-input v-else-if="isLongField(col.prop)" v-model="configureForm[col.prop]" type="textarea" :rows="3"></el-input>
          <el-input v-else v-model="configureForm[col.prop]"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="configureVisible = false">取消</el-button>
        <el-button type="primary" @click="submitConfigure">保存配置</el-button>
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
          <div class="bar-track"><div class="bar-value" :style="{ width: item.value + '%' }"></div></div>
          <em>{{ item.value }}%</em>
        </div>
      </div>
    </el-dialog>

    <el-dialog :title="importTitle" :visible.sync="importVisible" width="560px" append-to-body>
      <el-form label-width="110px">
        <el-form-item label="导入文件">
          <el-upload action="#" :auto-upload="false" :limit="1" :file-list="importFileList" :on-change="handleImportFileChange" :on-remove="handleImportFileRemove">
            <el-button type="primary" icon="el-icon-upload2">选择文件</el-button>
            <span slot="tip" class="el-upload__tip">支持 xlsx/xls 文件</span>
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
          <el-progress :percentage="receiveProgress" :status="receiveProgress === 100 ? 'success' : undefined" style="width:80%"></el-progress>
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

    <el-dialog :title="initiateAuditTitle" :visible.sync="initiateAuditVisible" width="720px" append-to-body>
      <el-form :model="initiateAuditForm" label-width="110px" style="margin-bottom:16px;">
        <el-row :gutter="20">
          <el-col :span="12"><el-form-item label="审核编号"><el-input v-model="initiateAuditForm.billNo" disabled></el-input></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="审核类型"><el-input v-model="initiateAuditForm.auditType" disabled></el-input></el-form-item></el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12"><el-form-item label="申请人"><el-input v-model="initiateAuditForm.applicant" disabled></el-input></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="申请部门"><el-input v-model="initiateAuditForm.dept" disabled></el-input></el-form-item></el-col>
        </el-row>
        <el-form-item label="审核范围"><el-input v-model="initiateAuditForm.scope" disabled></el-input></el-form-item>
        <el-form-item label="审核说明"><el-input v-model="initiateAuditForm.description" type="textarea" :rows="2" disabled></el-input></el-form-item>
      </el-form>
      <el-steps :active="initiateAuditStep" align-center style="margin-bottom:20px;">
        <el-step v-for="node in initiateAuditNodes" :key="node.step" :title="node.step" :description="node.status"></el-step>
      </el-steps>
      <el-table :data="initiateAuditNodes" border size="small" style="width:100%">
        <el-table-column prop="step" label="审核节点" width="110"></el-table-column>
        <el-table-column prop="handler" label="处理人" width="100"></el-table-column>
        <el-table-column prop="time" label="处理时间" width="160"></el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === '已完成' ? 'success' : scope.row.status === '进行中' ? 'warning' : 'info'" size="mini">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注"></el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="initiateAuditVisible = false">取消</el-button>
        <el-button type="primary" icon="el-icon-s-check" @click="confirmInitiateAudit">提交审核</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="approvalTitle" :visible.sync="approvalVisible" width="680px" append-to-body>
      <el-table :data="approvalSteps" border size="mini" style="width:100%">
        <el-table-column prop="level" label="审批层级" width="100" align="center"></el-table-column>
        <el-table-column prop="approver" label="审批人" width="120" align="center"></el-table-column>
        <el-table-column prop="status" label="审批状态" width="120" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status==='已通过'?'success':scope.row.status==='已驳回'?'danger':scope.row.status==='审批中'?'':'info'" size="mini">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="time" label="审批时间" width="160" align="center"></el-table-column>
        <el-table-column prop="remark" label="审批意见"></el-table-column>
      </el-table>
      <el-divider></el-divider>
      <el-form label-width="100px">
        <el-form-item label="审批进度"><el-progress :percentage="approvalProgress" :status="approvalProgress===100?'success':''" style="width:80%"></el-progress></el-form-item>
        <el-form-item label="最终状态"><el-tag :type="approvalFinalStatus==='已通过'?'success':approvalFinalStatus==='已驳回'?'danger':'warning'" size="medium">{{ approvalFinalStatus }}</el-tag></el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="approvalVisible = false">关闭</el-button>
        <el-button type="danger" icon="el-icon-close" @click="approvalAction('驳回')">驳回</el-button>
        <el-button type="primary" icon="el-icon-check" @click="approvalAction('通过')">通过</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="dispatchTitle" :visible.sync="dispatchVisible" width="660px" append-to-body>
      <el-form label-width="110px" style="margin-bottom:12px;">
        <el-form-item label="调度策略"><el-tag type="info">{{ dispatchStrategy }}</el-tag></el-form-item>
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
        <el-form-item label="执行进度"><el-progress :percentage="invokeProgress" :status="invokeProgress === 100 ? 'success' : undefined" style="width:80%"></el-progress></el-form-item>
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

    <!-- 动态查询对话框（5种模式：table/summary/detailReport/list/detail） -->
    <el-dialog :title="queryDynTitle" :visible.sync="queryDynVisible" width="740px" append-to-body>
      <template v-if="queryDynMode === 'table'">
        <el-alert title="规则库数据查询结果" type="info" :closable="false" show-icon style="margin-bottom:16px;"></el-alert>
        <el-table :data="queryDynData" border size="mini" style="width:100%" max-height="400">
          <el-table-column prop="规则编号" label="规则编号" width="110"></el-table-column>
          <el-table-column prop="规则名称" label="规则名称"></el-table-column>
          <el-table-column prop="规则类型" label="规则类型" width="110"></el-table-column>
          <el-table-column prop="匹配条件" label="匹配条件"></el-table-column>
          <el-table-column prop="规则状态" label="状态" width="80" align="center">
            <template slot-scope="s"><el-tag :type="s.row.规则状态==='启用'?'success':'info'" size="mini">{{ s.row.规则状态 }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="负责人" label="负责人" width="80"></el-table-column>
        </el-table>
      </template>
      <template v-else-if="queryDynMode === 'summary'">
        <el-alert title="汇总报告统计" type="success" :closable="false" show-icon style="margin-bottom:16px;"></el-alert>
        <div class="analysis-panel" style="display:flex;flex-wrap:wrap;gap:16px;margin-bottom:16px;">
          <div v-for="m in queryDynMetrics" :key="m.label" class="metric-card" style="flex:1;min-width:140px;padding:16px;background:#f5f7fa;border-radius:8px;text-align:center;">
            <span style="display:block;font-size:13px;color:#909399;">{{ m.label }}</span>
            <strong style="display:block;font-size:24px;color:#303133;margin-top:8px;">{{ m.value }}</strong>
          </div>
        </div>
      </template>
      <template v-else-if="queryDynMode === 'detailReport'">
        <el-alert title="明细报告数据" type="warning" :closable="false" show-icon style="margin-bottom:16px;"></el-alert>
        <el-table :data="queryDynData" border size="mini" style="width:100%" max-height="400">
          <el-table-column prop="规则名称" label="规则名称"></el-table-column>
          <el-table-column prop="执行次数" label="执行次数" width="90" align="center"></el-table-column>
          <el-table-column prop="通过率" label="通过率" width="80" align="center"></el-table-column>
          <el-table-column prop="平均耗时" label="平均耗时" width="90" align="center"></el-table-column>
          <el-table-column prop="最近执行" label="最近执行" width="160"></el-table-column>
          <el-table-column prop="状态" label="状态" width="80" align="center">
            <template slot-scope="s"><el-tag :type="s.row.状态==='正常'?'success':'danger'" size="mini">{{ s.row.状态 }}</el-tag></template>
          </el-table-column>
        </el-table>
      </template>
      <template v-else-if="queryDynMode === 'list'">
        <el-alert title="规则列表概览" type="info" :closable="false" show-icon style="margin-bottom:16px;"></el-alert>
        <el-timeline>
          <el-timeline-item v-for="item in queryDynData" :key="item.name" :type="item.status === '启用' ? 'success' : 'info'" :timestamp="item.type">
            <span style="font-weight:500;">{{ item.name }}</span>
            <el-tag :type="item.status === '启用' ? 'success' : 'info'" size="mini" style="margin-left:8px;">{{ item.status }}</el-tag>
          </el-timeline-item>
        </el-timeline>
      </template>
      <template v-else-if="queryDynMode === 'detail'">
        <el-alert title="规则详情" type="info" :closable="false" show-icon style="margin-bottom:16px;"></el-alert>
        <el-form label-width="120px">
          <el-form-item v-for="f in queryDynFields" :key="f.label" :label="f.label">
            <el-input :value="f.value" disabled style="width:80%;"></el-input>
          </el-form-item>
        </el-form>
      </template>
      <span slot="footer"><el-button type="primary" @click="queryDynVisible = false">关闭</el-button></span>
    </el-dialog>
  </div>
</template>

<script>
import { filterData, exportXLSX, getActionType, getButtonIcon } from "@/utils/index";

const rows = [
  { ID: 1, 规则编号: "GZ-001", 规则名称: "4A上报数据完整性规则", 规则类型: "完整性校验", 匹配条件: "字段非空", 规则状态: "启用", 创建时间: "2026-05-20 09:00:00", 更新时间: "2026-06-01 14:30:00", 负责人: "张伟" },
  { ID: 2, 规则编号: "GZ-002", 规则名称: "4A上报数据一致性规则", 规则类型: "一致性校验", 匹配条件: "关联字段匹配", 规则状态: "启用", 创建时间: "2026-05-20 10:00:00", 更新时间: "2026-06-02 09:15:00", 负责人: "李娜" },
  { ID: 3, 规则编号: "GZ-003", 规则名称: "4A上报数据时效性规则", 规则类型: "时效性校验", 匹配条件: "时间戳在24h内", 规则状态: "启用", 创建时间: "2026-05-21 08:30:00", 更新时间: "2026-06-03 11:20:00", 负责人: "王强" },
  { ID: 4, 规则编号: "GZ-004", 规则名称: "4A上报数据格式校验规则", 规则类型: "格式校验", 匹配条件: "正则表达式匹配", 规则状态: "停用", 创建时间: "2026-05-22 14:00:00", 更新时间: "2026-06-04 16:45:00", 负责人: "赵敏" },
  { ID: 5, 规则编号: "GZ-005", 规则名称: "4A上报数据范围校验规则", 规则类型: "范围校验", 匹配条件: "值在允许范围内", 规则状态: "启用", 创建时间: "2026-05-23 11:00:00", 更新时间: "2026-06-05 08:10:00", 负责人: "刘洋" },
];
const cols = [
  { prop: "规则编号", label: "规则编号", type: "text", search: true },
  { prop: "规则名称", label: "规则名称", type: "text", search: true },
  { prop: "规则类型", label: "规则类型", type: "select", options: [{ value: "完整性校验", label: "完整性校验" }, { value: "一致性校验", label: "一致性校验" }, { value: "时效性校验", label: "时效性校验" }, { value: "格式校验", label: "格式校验" }, { value: "范围校验", label: "范围校验" }], search: true },
  { prop: "匹配条件", label: "匹配条件", type: "text" },
  { prop: "规则状态", label: "规则状态", type: "select", options: [{ value: "启用", label: "启用" }, { value: "停用", label: "停用" }], search: true },
  { prop: "负责人", label: "负责人", type: "text", search: true },
  { prop: "创建时间", label: "创建时间", type: "text", width: 170 },
  { prop: "更新时间", label: "更新时间", type: "text", width: 170 },
  { slot: "operate", label: "操作" },
];
const defaultRow = { 规则编号: "", 规则名称: "", 规则类型: "", 匹配条件: "", 规则状态: "启用", 负责人: "", 创建时间: "", 更新时间: "" };

function pageHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 100000;
  return h;
}
const pick = (items, index, seed) => items[(seed + index) % items.length];

export default {
  name: "4AYN_ShangBaoShuJuDuiBiGuiZeKuGuanLi",
  data() {
    return {
      searchData: {},
      searchConfig: [],
      allTableData: rows.map((r) => ({ ...r })),
      tableData: [],
      selectedRows: [],
      tableColumns: cols,
      pageTotal: 0,
      pageOptions: { pageNum: 1, pageSize: 10 },
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
      queryDynVisible: false,
      queryDynTitle: "",
      queryDynMode: "table",
      queryDynData: [],
      queryDynMetrics: [],
      queryDynFields: [],
      initiateAuditVisible: false,
      initiateAuditTitle: "",
      initiateAuditForm: {
        billNo: "",
        auditType: "",
        applicant: "",
        dept: "",
        scope: "",
        description: "",
      },
      initiateAuditStep: 0,
      initiateAuditNodes: [],
      approvalVisible: false,
      approvalTitle: "逐级审批",
      approvalSteps: [],
      approvalProgress: 0,
      approvalFinalStatus: "",
      approvalForm: { billNo: "", applicant: "", status: "", currentStatus: "", remark: "" },
      approvalStateMap: {},
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
    handleFunction(functionName, extraType) {
      this.activeFunction = functionName;
      this.activeActionType = extraType;
      if (extraType) {
        if (/^delete/.test(extraType)) {
          if (!this.selectedRows.length) { this.$message.warning("请先选择要删除的记录"); return; }
          this.$confirm("确定要执行【" + functionName + "】删除选中的 " + this.selectedRows.length + " 条记录吗？", "提示", { type: "warning" }).then(() => {
            const ids = new Set(this.selectedRows.map((r) => r.ID));
            this.allTableData = this.allTableData.filter((item) => !ids.has(item.ID));
            this.fetchData();
            this.$message.success("删除成功，共删除 " + ids.size + " 条记录");
          }).catch(() => {});
          return;
        }
        if (/^export/.test(extraType)) {
          const data = this.selectedRows.length ? this.selectedRows : this.tableData;
          exportXLSX(data, functionName);
          this.$message.success("导出成功");
          return;
        }
        if (/^import/.test(extraType)) {
          this.importTitle = functionName || "导入";
          this.importFunctionName = functionName;
          this.importFileList = [];
          this.importProgress = 0;
          this.importVisible = true;
          return;
        }
        // 查询类按钮 → 各自独立对话框内容
        if (extraType === 'query_rule') {
          this.queryDynTitle = functionName;
          this.queryDynMode = 'table';
          this.queryDynData = this.allTableData.map(r => ({...r}));
          this.queryDynVisible = true;
          return;
        }
        if (extraType === 'query_summary') {
          this.queryDynTitle = functionName;
          this.queryDynMode = 'summary';
          const enabled = this.allTableData.filter(r => r.规则状态 === '启用').length;
          const disabled = this.allTableData.filter(r => r.规则状态 === '停用').length;
          this.queryDynMetrics = [
            { label: '规则总数', value: this.allTableData.length },
            { label: '启用规则', value: enabled },
            { label: '停用规则', value: disabled },
            { label: '覆盖率', value: '100%' },
            { label: '通过率', value: '98.5%' },
          ];
          this.queryDynVisible = true;
          return;
        }
        if (extraType === 'query_detail') {
          this.queryDynTitle = functionName;
          this.queryDynMode = 'detailReport';
          this.queryDynData = this.allTableData.map((r, i) => ({
            '规则名称': r.规则名称,
            '执行次数': [120, 85, 230, 56, 168][i % 5],
            '通过率': ['98%', '95%', '99%', '87%', '96%'][i % 5],
            '平均耗时': ['45ms', '120ms', '30ms', '200ms', '65ms'][i % 5],
            '最近执行': '2026-06-0' + (7 - i) + ' 10:30:00',
            '状态': ['正常', '正常', '正常', '异常', '正常'][i % 5],
          }));
          this.queryDynVisible = true;
          return;
        }
        if (extraType === 'query_list') {
          this.queryDynTitle = functionName;
          this.queryDynMode = 'list';
          this.queryDynData = this.allTableData.map(r => ({
            name: r.规则名称,
            type: r.规则类型,
            status: r.规则状态,
          }));
          this.queryDynVisible = true;
          return;
        }
        if (extraType === 'query_info') {
          this.queryDynTitle = functionName;
          this.queryDynMode = 'detail';
          const firstRow = this.allTableData[0] || {};
          this.queryDynFields = this.tableColumns.filter(c => c.prop).map(c => ({
            label: c.label,
            value: firstRow[c.prop] || '-',
          }));
          this.queryDynVisible = true;
          return;
        }
        this.openFunctionDialog(functionName, extraType);
        return;
      }
      const actionType = getActionType(functionName);
      this.activeActionType = actionType;
      if (actionType === "delete") {
        if (!this.selectedRows.length) { this.$message.warning("请先选择要删除的记录"); return; }
        this.$confirm("确定要执行【" + functionName + "】删除选中的 " + this.selectedRows.length + " 条记录吗？", "提示", { type: "warning" }).then(() => {
          const ids = new Set(this.selectedRows.map((r) => r.ID));
          this.allTableData = this.allTableData.filter((item) => !ids.has(item.ID));
          this.fetchData();
          this.$message.success("删除成功，共删除 " + ids.size + " 条记录");
        }).catch(() => {});
        return;
      }
      if (actionType === "export") {
        const data = this.selectedRows.length ? this.selectedRows : this.tableData;
        exportXLSX(data, functionName);
        this.$message.success("导出成功");
        return;
      }
      if (actionType === "import") {
        this.importTitle = functionName || "导入";
        this.importFunctionName = functionName;
        this.importFileList = [];
        this.importProgress = 0;
        this.importVisible = true;
        return;
      }
      const dialogTypeMap = {
        "configure": "form", "receive_request": "receive", "receive_feedback": "receive",
        "receive": "receive", "send": "dispatch", "invoke": "workflow",
        "feedback_result": "feedback", "feedback": "feedback", "dispatch": "dispatch",
        "query": "detail", "analysis": "analysis", "operation": "operation",
      };
      this.openFunctionDialog(functionName, dialogTypeMap[actionType] || "operation");
    },
    openFunctionDialog(functionName, type) {
      const S = pageHash(functionName);
      const now = this.now();
      const prefixMap = {
        'monitor': 'monitor', 'alert': 'alert', 'err_monitor': 'monitor', 'err_notify': 'alert',
        'audit': 'audit', 'stats': 'statistics', 'collect': 'dataprocess', 'preprocess': 'dataprocess',
        'add': 'form', 'define': 'form', 'modify': 'form', 'query': 'detail', 'get': 'detail',
        'push': 'dispatch', 'config': 'config',
      };
      const match = type.match(/^(.+)_([a-z0-9]+)$/);
      const resolvedType = (match && prefixMap[match[1]]) || type;
      switch (resolvedType) {
        case "form": this.openFormDialog(functionName, S, now); break;
        case "detail": this.openDetailDialog(functionName, S, now); break;
        case "monitor": this.openMonitorDialog(functionName, S, now); break;
        case "statistics": this.openStatisticsDialog(functionName, S, now); break;
        case "analysis": this.openAnalysisDialog(functionName, S, now); break;
        case "alert": this.openAlertDialog(functionName, S, now); break;
        case "audit": this.openAuditDialog(functionName, S, now); break;
        case "workflow": this.openWorkflowDialog(functionName, S, now); break;
        case "dispatch": this.openDispatchDialog(functionName, S, now); break;
        case "receive": this.openReceiveDialog(functionName, S, now); break;
        case "feedback": this.openFeedbackDialog(functionName, S, now); break;
        case "export": this.openExportDialog(functionName, S, now); break;
        case "api": this.openApiDialog(functionName, S, now); break;
        case "dataprocess": this.openDataProcessDialog(functionName, S, now); break;
        case "config": this.openConfigDialog(functionName, S, now); break;
        case "sync": this.openSyncDialog(functionName, S, now); break;
        case "preview": this.openPreviewDialog(functionName, S, now); break;
        case "log": this.openLogDialog(functionName, S, now); break;
        case "report": this.openReportDialog(functionName, S, now); break;
        case "validate": this.openValidateDialog(functionName, S, now); break;
        case "transform": this.openTransformDialog(functionName, S, now); break;
        case "schedule": this.openScheduleDialog(functionName, S, now); break;
        case "initiate_audit": this.openInitiateAuditDialog(functionName, S, now); break;
        case "approval": this.openApprovalDialog(functionName, S, now); break;
        default: this.openOperationDialog(functionName, S, now);
      }
    },
    openFormDialog(functionName, S, now) {
      this.configureTitle = functionName;
      const row = this.createEmptyRow();
      const primary = this.getPrimaryNameField();
      const status = this.getStatusField();
      if (primary) row[primary.prop] = functionName;
      if (status) row[status.prop] = "待处理";
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
    openDetailDialog(functionName, S, now) {
      this.detailTitle = functionName;
      const prefix = functionName.replace(/^(查询|查看|展示|跟踪|读取)/, "").trim() || functionName;
      this.detailFields = [
        { label: "名称", value: prefix },
        { label: "编号", value: "DTL-" + String(S).slice(-6) },
        { label: "状态", value: pick(["正常", "已完成", "运行中", "部分异常"], 0, S) },
        { label: "类型", value: pick(["系统数据", "配置数据", "运行数据", "统计数据"], 1, S) },
        { label: "来源模块", value: pick(["扫描任务模块", "采集任务模块", "资产上报模块", "指令处理模块"], 2, S) },
        { label: "数据量", value: pick(["128条", "256条", "512条", "1024条"], 3, S) },
        { label: "更新时间", value: now },
        { label: "操作人", value: pick(["系统管理员", "审计员", "操作员", "自动同步"], 4, S) },
        { label: "备注", value: functionName + "的查看详情" },
      ];
      this.detailVisible = true;
    },
    openMonitorDialog(functionName, S, now) {
      this.recvReqTitle = functionName;
      var prefix = functionName.replace(/(结果监控|状态监控|运行监控|采集监控|监控告警|监控)/g, "").trim() || functionName;
      this.recvReqStats = [
        { label: "监控目标", value: prefix },
        { label: "在线状态", value: pick(["在线", "离线", "部分异常"], 0, S) },
        { label: "运行时长", value: pick(["2h 15m", "5h 32m", "12h 8m", "24h 45m"], 1, S) },
        { label: "当前负载", value: pick(["23%", "45%", "67%", "89%"], 2, S) + "" },
        { label: "响应延迟", value: pick(["12ms", "28ms", "56ms", "120ms"], 3, S) + "" },
        { label: "错误率", value: pick(["0.1%", "0.5%", "1.2%", "3.8%"], 4, S) },
      ];
      this.recvReqProgress = pick([75, 82, 91, 98], 0, S);
      this.recvReqLog = [
        { time: now, level: "INFO", msg: functionName + " 监控已启动" },
        { time: now, level: "INFO", msg: "数据采集正常，当前延迟 " + pick(["12ms", "28ms"], 1, S) },
        { time: now, level: pick(["INFO", "WARN"], 4, S), msg: pick(["监控数据已更新", "发现异常波动", "负载超过阈值", "指标恢复正常"], 5, S) },
      ];
      this.recvReqVisible = true;
    },
    openStatisticsDialog(functionName, S, now) {
      this.analysisTitle = functionName;
      this.analysisMetrics = [
        { label: "统计总量", value: pick([1280, 2560, 5120, 10240], 0, S) },
        { label: "有效数据", value: pick([1200, 2450, 4980, 10100], 1, S) },
        { label: "覆盖率", value: pick(["93.7%", "95.7%", "97.3%", "98.6%"], 2, S) },
        { label: "日均增长", value: pick(["12%", "18%", "25%", "32%"], 3, S) },
      ];
      this.analysisBars = [
        { name: "本周", value: pick([72, 81, 88, 95], 0, S) },
        { name: "上周", value: pick([65, 74, 83, 91], 1, S) },
        { name: "上月", value: pick([58, 67, 76, 85], 2, S) },
        { name: "去年同期", value: pick([45, 54, 63, 72], 3, S) },
      ];
      this.analysisVisible = true;
    },
    openAnalysisDialog(functionName, S, now) {
      this.analysisTitle = functionName;
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
      this.analysisVisible = true;
    },
    openAlertDialog(functionName, S, now) {
      this.recvFbTitle = functionName;
      this.recvFbFields = [
        { label: "告警名称", value: functionName },
        { label: "告警编号", value: "ALT-" + String(S).slice(-6) },
        { label: "告警级别", value: pick(["紧急", "重要", "一般", "提示"], 0, S) },
        { label: "告警状态", value: pick(["未处理", "处理中", "已处理", "已忽略"], 1, S) },
        { label: "触发时间", value: now },
        { label: "告警来源", value: pick(["系统自动检测", "人工巡检", "第三方告警", "日志分析"], 2, S) },
        { label: "影响范围", value: pick(["单节点", "集群", "全局", "特定模块"], 3, S) },
        { label: "处理建议", value: pick(["检查配置", "重启服务", "扩容资源", "联系管理员"], 4, S) },
      ];
      this.recvFbPreview = [
        { 字段: "alert_id", 值: "A-" + String(S).slice(-6), 状态: "正常" },
        { 字段: "severity", 值: pick(["CRITICAL", "WARNING", "INFO"], 5, S), 状态: pick(["正常", "异常"], 6, S) },
        { 字段: "source", 值: pick(["monitor", "scanner", "agent"], 7, S), 状态: "正常" },
        { 字段: "message", 值: pick(["阈值超标", "连接超时", "资源不足"], 8, S), 状态: "异常" },
      ];
      this.recvFbVisible = true;
    },
    openAuditDialog(functionName, S, now) {
      this.queryTitle = functionName;
      const count = (S % 3) + 3;
      this.queryResults = Array.from({ length: count }).map((_, i) => ({
        序号: i + 1,
        数据项: pick(["配置变更", "权限修改", "数据访问", "操作日志", "异常事件"], i, S),
        结果数量: pick([12, 28, 56, 128], i, S),
        查询耗时: pick(["12ms", "28ms", "56ms", "128ms"], i, S) + "",
        状态: pick(["已通过", "待审核", "已驳回", "需复核"], i, S),
      }));
      this.queryVisible = true;
    },
    openWorkflowDialog(functionName, S, now) {
      this.invokeTitle = functionName;
      this.invokeSteps = [
        { step: "发起申请", status: pick(["已完成", "进行中"], 0, S), time: pick(["12ms", "28ms"], 1, S) + "" },
        { step: "初审", status: pick(["已完成", "进行中", "等待中"], 2, S), time: pick(["15ms", "35ms", "-"], 3, S) + "" },
        { step: "复审", status: pick(["已完成", "进行中", "等待中"], 4, S), time: pick(["18ms", "42ms", "-"], 5, S) + "" },
        { step: "终审", status: pick(["已完成", "进行中", "等待中", "已跳过"], 6, S), time: pick(["25ms", "58ms", "-"], 7, S) + "" },
        { step: "执行", status: pick(["已完成", "进行中", "等待中"], 8, S), time: pick(["128ms", "256ms", "-"], 9, S) + "" },
      ];
      this.invokeCurrentStep = this.invokeSteps.findIndex(s => s.status === "进行中") + 1;
      this.invokeProgress = Math.round((this.invokeSteps.filter(s => s.status === "已完成").length / this.invokeSteps.length) * 100);
      this.invokeVisible = true;
    },
    openDispatchDialog(functionName, S, now) {
      this.sendTitle = functionName;
      this.sendFields = [
        { label: "操作名称", value: functionName },
        { label: "调度编号", value: "DSP-" + String(S).slice(-6) },
        { label: "目标节点", value: pick(["node-01 (主节点)", "node-02 (备节点)", "node-03 (边缘)", "node-04 (灾备)"], 0, S) },
        { label: "连接状态", value: pick(["已连接", "连接中...", "连接超时", "已断开"], 1, S) },
        { label: "负载均衡", value: pick(["轮询分配", "最少连接", "加权轮询", "源地址哈希"], 2, S) },
        { label: "心跳延迟", value: pick(["12ms", "28ms", "56ms", "120ms"], 3, S) + "" },
        { label: "调度时间", value: now },
        { label: "重试次数", value: pick([0, 1, 2, 3], 4, S) + "" },
        { label: "超时设置", value: pick(["30s", "60s", "120s", "300s"], 5, S) },
      ];
      this.sendVisible = true;
    },
    openReceiveDialog(functionName, S, now) {
      this.recvFbTitle = functionName;
      this.recvFbFields = [
        { label: "数据来源", value: pick(["主节点", "备节点", "边缘节点", "灾备节点"], 0, S) },
        { label: "数据格式", value: pick(["JSON", "Protobuf", "XML", "Avro"], 1, S) },
        { label: "数据量", value: pick(["12 KB", "48 KB", "256 KB", "1.2 MB"], 2, S) },
        { label: "解析状态", value: pick(["解析完成", "解析中", "格式异常", "字段缺失"], 3, S) },
        { label: "有效记录", value: pick([86, 128, 256, 512], 4, S) + "条" },
        { label: "丢弃记录", value: pick([0, 2, 5, 12], 5, S) + "条" },
        { label: "接收时间", value: now },
      ];
      this.recvFbPreview = [
        { 字段: "request_id", 值: "R-" + String(S).slice(-6), 状态: "正常" },
        { 字段: "status", 值: pick(["COMPLETED", "PROCESSING", "PENDING"], 6, S), 状态: "正常" },
        { 字段: "result_data", 值: "{...} (嵌套对象)", 状态: "正常" },
        { 字段: "error_msg", 值: pick(["null", "null", "timeout"], 7, S), 状态: pick(["正常", "正常", "异常"], 8, S) },
      ];
      this.recvFbVisible = true;
    },
    openFeedbackDialog(functionName, S, now) {
      this.fbResultTitle = functionName;
      this.fbResultFields = [
        { label: "操作名称", value: functionName },
        { label: "反馈编号", value: "FB-" + String(S).slice(-6) },
        { label: "返回码", value: pick(["200 OK", "202 ACCEPTED", "500 INTERNAL_ERROR", "504 TIMEOUT"], 0, S) },
        { label: "执行结果", value: pick(["全部成功", "部分成功", "执行失败", "超时终止"], 1, S) },
        { label: "影响记录数", value: pick([0, 12, 48, 128], 2, S) + "条" },
        { label: "处理耗时", value: pick(["23ms", "86ms", "256ms", "1024ms"], 3, S) + "" },
        { label: "错误信息", value: pick(["无", "无", "字段校验失败", "连接超时"], 4, S) },
        { label: "完成时间", value: now },
      ];
      this.fbResultSuccess = /成功|200|202/.test(this.fbResultFields[3].value);
      this.fbResultVisible = true;
    },
    openExportDialog(functionName, S, now) {
      this.detailTitle = functionName;
      this.detailFields = [
        { label: "导出任务", value: functionName },
        { label: "导出编号", value: "EXP-" + String(S).slice(-6) },
        { label: "导出格式", value: pick(["Excel (.xlsx)", "CSV (.csv)", "JSON (.json)", "PDF (.pdf)"], 0, S) },
        { label: "数据范围", value: pick(["全量数据", "当前筛选", "最近7天", "最近30天"], 1, S) },
        { label: "预计耗时", value: pick(["约2秒", "约5秒", "约15秒", "约30秒"], 2, S) },
        { label: "文件大小", value: pick(["12KB", "48KB", "256KB", "1.2MB"], 3, S) },
        { label: "导出状态", value: "等待确认" },
        { label: "操作时间", value: now },
      ];
      this.detailVisible = true;
    },
    openApiDialog(functionName, S, now) {
      this.recvReqTitle = functionName;
      this.recvReqStats = [
        { label: "接口地址", value: "/api/" + String(S).slice(-6) + "/" + pick(["query", "submit", "sync", "check"], 0, S) },
        { label: "请求方式", value: pick(["GET", "POST", "PUT", "DELETE"], 1, S) },
        { label: "响应时间", value: pick(["12ms", "28ms", "56ms", "120ms"], 2, S) + "" },
        { label: "成功率", value: pick(["99.8%", "99.5%", "98.9%", "97.2%"], 3, S) },
        { label: "今日调用", value: pick([128, 256, 512, 1024], 4, S) + "" },
        { label: "限流状态", value: pick(["正常", "接近阈值", "已触发限流"], 5, S) },
      ];
      this.recvReqProgress = pick([85, 92, 97, 100], 0, S);
      this.recvReqLog = [
        { time: now, level: "INFO", msg: functionName + " 接口就绪" },
        { time: now, level: "INFO", msg: "收到请求，处理中..." },
        { time: now, level: pick(["INFO", "WARN"], 4, S), msg: pick(["请求处理完成", "响应超时", "参数校验失败", "接口限流触发"], 5, S) },
      ];
      this.recvReqVisible = true;
    },
    openDataProcessDialog(functionName, S, now) {
      this.invokeTitle = functionName;
      this.invokeSteps = [
        { step: "数据采集", status: pick(["已完成", "进行中", "等待中"], 0, S), time: pick(["128ms", "256ms", "-"], 1, S) + "" },
        { step: "格式转换", status: pick(["已完成", "进行中", "等待中"], 2, S), time: pick(["56ms", "128ms", "-"], 3, S) + "" },
        { step: "数据校验", status: pick(["已完成", "进行中", "等待中"], 4, S), time: pick(["23ms", "56ms", "-"], 5, S) + "" },
        { step: "数据清洗", status: pick(["已完成", "进行中", "等待中"], 6, S), time: pick(["86ms", "186ms", "-"], 7, S) + "" },
        { step: "结果写入", status: pick(["已完成", "进行中", "等待中"], 8, S), time: pick(["18ms", "35ms", "-"], 9, S) + "" },
      ];
      this.invokeCurrentStep = this.invokeSteps.findIndex(s => s.status === "进行中") + 1;
      this.invokeProgress = Math.round((this.invokeSteps.filter(s => s.status === "已完成").length / this.invokeSteps.length) * 100);
      this.invokeVisible = true;
    },
    openOperationDialog(functionName, S, now) {
      this.detailTitle = functionName;
      this.detailFields = [
        { label: "操作名称", value: functionName },
        { label: "操作编号", value: "OP-" + String(S).slice(-6) },
        { label: "操作状态", value: pick(["已完成", "处理中", "待处理", "异常"], 0, S) },
        { label: "操作类型", value: pick(["系统操作", "数据操作", "配置操作", "维护操作"], 1, S) },
        { label: "执行耗时", value: pick(["23ms", "86ms", "256ms", "1024ms"], 2, S) + "" },
        { label: "操作时间", value: now },
        { label: "操作人", value: pick(["系统管理员", "审计员", "操作员", "自动任务"], 3, S) },
        { label: "备注", value: functionName + "的操作执行" },
      ];
      this.detailVisible = true;
    },
    openConfigDialog(functionName, S, now) {
      this.configureTitle = functionName;
      this.configureForm = {
        配置名称: functionName,
        配置编号: "CFG-" + String(S).slice(-6),
        配置类型: pick(["系统配置", "网络配置", "安全配置", "性能配置"], 0, S),
        环境: pick(["生产环境", "测试环境", "开发环境", "预发布环境"], 1, S),
        生效范围: pick(["全局生效", "模块生效", "节点生效", "会话生效"], 2, S),
        配置值: pick(["enabled=true", "timeout=30s", "max_retries=3", "batch_size=100"], 3, S),
        修改原因: pick(["性能优化", "故障修复", "安全加固", "功能调整"], 4, S),
        修改人: pick(["系统管理员", "运维工程师", "安全管理员"], 5, S),
        修改时间: now,
      };
      this.configureVisible = true;
    },
    openSyncDialog(functionName, S, now) {
      this.recvReqTitle = functionName;
      this.recvReqStats = [
        { label: "同步源", value: pick(["主数据库", "备份数据库", "远程节点", "外部系统"], 0, S) },
        { label: "同步目标", value: pick(["本地缓存", "从数据库", "文件系统", "消息队列"], 1, S) },
        { label: "同步状态", value: pick(["已完成", "同步中", "等待中", "失败"], 2, S) },
        { label: "已同步记录", value: pick([1280, 2560, 5120, 10240], 3, S) + "" },
        { label: "冲突记录", value: pick([0, 2, 8, 15], 4, S) + "" },
        { label: "同步耗时", value: pick(["1.2s", "3.5s", "8.7s", "25.3s"], 5, S) },
      ];
      this.recvReqProgress = pick([65, 78, 89, 100], 0, S);
      this.recvReqLog = [
        { time: now, level: "INFO", msg: functionName + " 同步任务启动" },
        { time: now, level: "INFO", msg: "正在同步数据，进度 " + pick(["45%", "67%", "89%"], 1, S) },
        { time: now, level: pick(["INFO", "WARN"], 4, S), msg: pick(["同步完成", "发现数据冲突", "部分记录跳过", "同步速度下降"], 5, S) },
      ];
      this.recvReqVisible = true;
    },
    openPreviewDialog(functionName, S, now) {
      this.detailTitle = functionName;
      this.detailFields = [
        { label: "预览对象", value: functionName },
        { label: "预览编号", value: "PRV-" + String(S).slice(-6) },
        { label: "数据类型", value: pick(["结构化数据", "半结构化数据", "非结构化数据", "混合数据"], 0, S) },
        { label: "记录总数", value: pick([128, 256, 512, 1024], 1, S) + "条" },
        { label: "预览范围", value: pick(["前100条", "随机抽样", "最近更新", "异常记录"], 2, S) },
        { label: "数据大小", value: pick(["12KB", "48KB", "256KB", "1.2MB"], 3, S) },
        { label: "加载耗时", value: pick(["0.2s", "0.5s", "1.2s", "3.8s"], 4, S) },
        { label: "预览时间", value: now },
      ];
      this.detailVisible = true;
    },
    openLogDialog(functionName, S, now) {
      this.recvReqTitle = functionName;
      this.recvReqStats = [
        { label: "日志级别", value: pick(["INFO", "WARN", "ERROR", "DEBUG"], 0, S) },
        { label: "日志总数", value: pick([1280, 2560, 5120, 10240], 1, S) + "" },
        { label: "错误数", value: pick([0, 3, 12, 28], 2, S) + "" },
        { label: "警告数", value: pick([5, 12, 28, 56], 3, S) + "" },
        { label: "时间范围", value: pick(["最近1小时", "最近24小时", "最近7天", "最近30天"], 4, S) },
        { label: "日志来源", value: pick(["应用日志", "系统日志", "安全日志", "审计日志"], 5, S) },
      ];
      this.recvReqProgress = pick([85, 92, 97, 100], 0, S);
      this.recvReqLog = [
        { time: now, level: "INFO", msg: functionName + " 日志查询启动" },
        { time: now, level: "INFO", msg: "匹配到 " + pick([128, 256, 512], 1, S) + " 条日志" },
        { time: now, level: pick(["INFO", "WARN"], 4, S), msg: pick(["日志导出完成", "发现异常模式", "日志量超过阈值", "查询超时"], 5, S) },
      ];
      this.recvReqVisible = true;
    },
    openReportDialog(functionName, S, now) {
      this.analysisTitle = functionName;
      this.analysisMetrics = [
        { label: "报表类型", value: pick(["日报", "周报", "月报", "季报"], 0, S) },
        { label: "数据维度", value: pick(["按模块", "按时间", "按类型", "综合维度"], 1, S) },
        { label: "生成状态", value: pick(["已完成", "生成中", "等待中", "失败"], 2, S) },
        { label: "报表页数", value: pick([5, 12, 28, 56], 3, S) + "页" },
      ];
      this.analysisBars = [
        { name: "数据完整性", value: pick([85, 92, 97, 100], 0, S) },
        { name: "图表覆盖率", value: pick([78, 85, 92, 98], 1, S) },
        { name: "格式规范性", value: pick([90, 95, 98, 100], 2, S) },
        { name: "生成耗时", value: pick([65, 78, 85, 92], 3, S) },
      ];
      this.analysisVisible = true;
    },
    openValidateDialog(functionName, S, now) {
      this.queryTitle = functionName;
      const count = (S % 3) + 3;
      this.queryResults = Array.from({ length: count }).map((_, i) => ({
        序号: i + 1,
        数据项: pick(["完整性校验", "一致性校验", "准确性校验", "时效性校验", "合规性校验"], i, S),
        结果数量: pick([12, 28, 56, 128], i, S),
        查询耗时: pick(["12ms", "28ms", "56ms", "128ms"], i, S) + "",
        状态: pick(["通过", "不通过", "部分通过", "待校验"], i, S),
      }));
      this.queryVisible = true;
    },
    openTransformDialog(functionName, S, now) {
      this.invokeTitle = functionName;
      this.invokeSteps = [
        { step: "数据解析", status: pick(["已完成", "进行中", "等待中"], 0, S), time: pick(["128ms", "256ms", "-"], 1, S) + "" },
        { step: "格式转换", status: pick(["已完成", "进行中", "等待中"], 2, S), time: pick(["56ms", "128ms", "-"], 3, S) + "" },
        { step: "数据映射", status: pick(["已完成", "进行中", "等待中"], 4, S), time: pick(["23ms", "56ms", "-"], 5, S) + "" },
        { step: "数据验证", status: pick(["已完成", "进行中", "等待中"], 6, S), time: pick(["18ms", "35ms", "-"], 7, S) + "" },
        { step: "结果输出", status: pick(["已完成", "进行中", "等待中"], 8, S), time: pick(["12ms", "28ms", "-"], 9, S) + "" },
      ];
      this.invokeCurrentStep = this.invokeSteps.findIndex(s => s.status === "进行中") + 1;
      this.invokeProgress = Math.round((this.invokeSteps.filter(s => s.status === "已完成").length / this.invokeSteps.length) * 100);
      this.invokeVisible = true;
    },
    openScheduleDialog(functionName, S, now) {
      this.configureTitle = functionName;
      this.configureForm = {
        任务名称: functionName,
        调度编号: "SCH-" + String(S).slice(-6),
        调度类型: pick(["定时调度", "事件触发", "条件触发", "手动触发"], 0, S),
        执行频率: pick(["每天", "每周", "每月", "每小时"], 1, S),
        下次执行: now,
        执行节点: pick(["主节点", "备节点", "边缘节点", "任意节点"], 2, S),
        超时时间: pick(["30s", "60s", "120s", "300s"], 3, S),
        重试策略: pick(["不重试", "重试1次", "重试3次", "无限重试"], 4, S),
      };
      this.configureVisible = true;
    },
    add() {
      this.formMode = "add";
      this.formTitle = "新增规则";
      this.formData = { ...defaultRow };
      this.formVisible = true;
    },
    edit(row) {
      this.formMode = "edit";
      this.formTitle = "修改规则";
      this.formData = { ...row };
      this.formVisible = true;
    },
    detail(row) {
      this.formMode = "detail";
      this.formTitle = "规则详情";
      this.formData = { ...row };
      this.formVisible = true;
    },
    submitForm() {
      if (this.formMode === "add") {
        const newRow = { ...this.formData, ID: this.nextId() };
        this.allTableData.unshift(newRow);
      } else if (this.formMode === "edit") {
        const index = this.allTableData.findIndex((r) => r.ID === this.formData.ID);
        if (index >= 0) this.$set(this.allTableData, index, { ...this.formData });
      }
      this.formVisible = false;
      this.fetchData();
      this.$message.success("操作成功");
    },
    submitConfigure() {
      const newRow = { ...this.configureForm, ID: this.nextId() };
      this.allTableData.unshift(newRow);
      this.configureVisible = false;
      this.fetchData();
      this.$message.success("配置保存成功");
    },
    deleteRow(row) {
      this.$confirm("确定删除？", "提示", { type: "warning" }).then(() => {
        this.allTableData = this.allTableData.filter((i) => i.ID !== row.ID);
        this.fetchData();
        this.$message.success("删除成功");
      }).catch(() => {});
    },
    handleImport() {
      this.importTitle = "导入";
      this.importFileList = [];
      this.importProgress = 0;
      this.importVisible = true;
    },
    handleImportFileChange(f) {
      this.importFileList = [f];
      this.importProgress = 50;
      setTimeout(() => { this.importProgress = 100; }, 800);
    },
    handleImportFileRemove() {
      this.importFileList = [];
      this.importProgress = 0;
    },
    confirmImport() {
      const importData = [];
      const columns = this.editableColumns;
      for (let i = 0; i < 3; i++) {
        const row = {};
        columns.forEach((col) => {
          if (/编号|ID/.test(col.prop)) row[col.prop] = "IMP-" + String(Date.now() + i).slice(-6);
          else if (/状态/.test(col.prop)) row[col.prop] = "待处理";
          else if (/时间/.test(col.prop)) row[col.prop] = this.now();
          else if (/数量/.test(col.prop)) row[col.prop] = Math.floor(Math.random() * 100);
          else row[col.prop] = this.importFunctionName + "-导入" + (i + 1);
        });
        importData.push(row);
      }
      importData.forEach((item) => {
        const newRow = { ...item, ID: this.nextId() };
        this.allTableData.unshift(newRow);
      });
      this.importVisible = false;
      this.fetchData();
      this.$message.success("导入成功，共导入 " + importData.length + " 条数据");
    },
    exportFile() {
      exportXLSX(this.allTableData, "上报数据对比规则库");
    },
    openInitiateAuditDialog(functionName, S, now) {
      const pool = ["张伟", "李娜", "王强", "赵敏", "刘洋", "陈静"];
      this.initiateAuditTitle = functionName;
      this.initiateAuditForm = {
        billNo: "AUDIT-" + String(S).slice(-6),
        auditType: pick(["安全审计", "合规审计", "系统审计", "数据审计"], 0, S),
        applicant: pick(pool, 5, S),
        dept: pick(["安全运维部", "网络管理部", "资产管理部", "信息安全部"], 2, S),
        scope: pick(["全量数据", "增量数据", "指定范围", "异常数据"], 3, S),
        description: functionName + "的审核申请，请相关部门审批。",
      };
      this.initiateAuditStep = 1;
      const applicant = pick(pool, 5, S);
      this.initiateAuditNodes = [
        { step: "发起申请", handler: applicant, time: now, status: "已完成", remark: "已提交审核申请" },
        { step: "部门初审", handler: pick(pool, 0, S), time: now, status: "进行中", remark: "初审中，请等待" },
        { step: "技术审核", handler: pick(pool, 1, S), time: "-", status: "待处理", remark: "等待技术审核" },
        { step: "安全审核", handler: pick(pool, 2, S), time: "-", status: "待处理", remark: "等待安全审核通过" },
        { step: "分管审批", handler: pick(pool, 3, S), time: "-", status: "待处理", remark: "等待分管审批" },
        { step: "归档完成", handler: "system", time: "-", status: "待处理", remark: "等待所有审批完成" },
      ];
      this.initiateAuditVisible = true;
    },
    confirmInitiateAudit() {
      this.$confirm("确认提交【" + this.initiateAuditTitle + "】审核申请？", "提示", {
        confirmButtonText: "确认提交", cancelButtonText: "取消", type: "info",
      }).then(() => {
        const nodes = this.initiateAuditNodes;
        const currentIdx = nodes.findIndex(n => n.status === "进行中");
        if (currentIdx >= 0) {
          nodes[currentIdx].status = "已完成";
          if (currentIdx + 1 < nodes.length) {
            nodes[currentIdx + 1].status = "进行中";
            nodes[currentIdx + 1].time = this.now();
          }
        }
        this.initiateAuditStep = Math.min(this.initiateAuditStep + 1, nodes.length);
        if (currentIdx + 1 >= nodes.length) {
          this.initiateAuditVisible = false;
          this.$message.success("审核流程已全部完成，已归档");
        } else {
          this.$message.success("审核申请已提交，进入下一节点：" + nodes[currentIdx + 1].step);
        }
      }).catch(() => {});
    },
    openApprovalDialog(functionName, S, now) {
      this.approvalTitle = functionName;
      var levels = ["部门主管", "分管领导", "安全审计", "最终审批"];
      this.approvalSteps = levels.map(function(level, i) {
        var status = i < 2 ? "已通过" : i === 2 ? pick(["已通过", "审批中", "已驳回"], i, S) : "待审批";
        return {
          level: level,
          approver: pick(["张伟", "李娜", "王强", "赵敏", "刘洋", "陈静"], i, S),
          status: status,
          time: status === "待审批" ? "-" : now,
          remark: status === "已通过" ? "同意，符合规范" : status === "已驳回" ? "资料不全，退回补充" : status === "审批中" ? "审核中..." : "-",
        };
      });
      var passed = this.approvalSteps.filter(function(s) { return s.status === "已通过"; }).length;
      this.approvalProgress = Math.round((passed / this.approvalSteps.length) * 100);
      this.approvalFinalStatus = passed === this.approvalSteps.length ? "已通过" : this.approvalSteps.some(function(s) { return s.status === "已驳回"; }) ? "已驳回" : "审批中";
      this.approvalVisible = true;
    },
    approvalAction(action) {
      this.$confirm("确定【" + action + "】此审批？", "确认操作", {
        confirmButtonText: "确定", cancelButtonText: "取消", type: "warning",
      }).then(() => {
        var steps = this.approvalSteps;
        var current = steps.find(function(s) { return s.status === "审批中"; });
        if (current) {
          current.status = action === "通过" ? "已通过" : "已驳回";
          current.time = this.now();
          current.remark = action === "通过" ? "同意" : "驳回";
        }
        if (action === "通过") {
          var next = steps.find(function(s) { return s.status === "待审批"; });
          if (next) { next.status = "审批中"; }
          else { this.approvalFinalStatus = "已通过"; }
        } else {
          this.approvalFinalStatus = "已驳回";
        }
        var passed = steps.filter(function(s) { return s.status === "已通过"; }).length;
        this.approvalProgress = Math.round((passed / steps.length) * 100);
        this.$message.success("审批" + action + "成功");
      }).catch(function() {});
    },
  },
};
</script>

<style scoped>
.function-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.mt10 { margin-top: 10px; }
.mb10 { margin-bottom: 10px; }
.crud-container { background: #fff; padding: 16px; border-radius: 4px; }
.operate-container { display: flex; justify-content: space-between; align-items: center; }
.analysis-panel { display: flex; gap: 16px; margin-bottom: 16px; }
.metric-card { flex: 1; padding: 12px; background: #f5f7fa; border-radius: 4px; text-align: center; }
.metric-card span { display: block; font-size: 12px; color: #909399; margin-bottom: 4px; }
.metric-card strong { font-size: 20px; color: #303133; }
.bar-list { margin-top: 12px; }
.bar-row { display: flex; align-items: center; margin-bottom: 8px; }
.bar-row span { width: 80px; font-size: 13px; color: #606266; }
.bar-track { flex: 1; height: 16px; background: #f0f0f0; border-radius: 8px; overflow: hidden; }
.bar-value { height: 100%; background: #409eff; border-radius: 8px; transition: width 0.3s; }
.bar-row em { width: 40px; text-align: right; font-size: 12px; color: #909399; font-style: normal; margin-left: 8px; }
.detail-form .el-form-item { margin-bottom: 8px; }
</style>
