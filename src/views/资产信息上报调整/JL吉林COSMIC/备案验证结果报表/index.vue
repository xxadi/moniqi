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
          <el-button plain type="primary" icon="el-icon-edit-outline" @click='handleFunction("新增备案验证结果信息", "form")'>新增备案验证结果信息</el-button>
          <el-button plain type="primary" icon="el-icon-view" @click='handleFunction("查看备案验证结果信息", "detail")'>查看备案验证结果信息</el-button>
          <el-button plain type="primary" icon="el-icon-data-analysis" @click='handleFunction("备案验证结果数据提取", "validate")'>备案验证结果数据提取</el-button>
          <el-button plain type="primary" icon="el-icon-data-analysis" @click='handleFunction("备案验证结果数据识别", "monitor")'>备案验证结果数据识别</el-button>
          <el-button plain type="primary" icon="el-icon-data-analysis" @click='handleFunction("备案验证结果分级", "statistics")'>备案验证结果分级</el-button>
          <el-button plain type="primary" icon="el-icon-data-analysis" @click='handleFunction("备案验证结果实时计算", "analysis")'>备案验证结果实时计算</el-button>
          <el-button plain type="primary" icon="el-icon-data-analysis" @click='handleFunction("备案验证结果聚合", "alert")'>备案验证结果聚合</el-button>
          <el-button plain type="primary" icon="el-icon-s-operation" @click='handleFunction("备案验证结果可视化展示", "operation")'>备案验证结果可视化展示</el-button>
          <el-button plain type="primary" icon="el-icon-data-analysis" @click='handleFunction("备案验证结果数据审查", "audit")'>备案验证结果数据审查</el-button>
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

    <!-- 录入/配置弹窗 -->
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
          <span :style="{ color: /失败|超时|异常/.test(item.value) ? '#F56C6C' : /成功|200/.test(item.value) ? '#67C23A' : '' }">{{ item.value }}</span>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="feedbackVisible = false">关闭</el-button>
        <el-button type="primary" @click="feedbackVisible = false; $message.success('反馈已确认')">确认</el-button>
      </span>
    </el-dialog>

    <!-- 查询结果弹窗 -->
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

    <!-- 接收请求监控弹窗 -->
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

    <!-- 接收反馈数据弹窗 -->
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
      <el-alert title="执行成功" type="success" :closable="false" show-icon style="margin-bottom:16px;"></el-alert>
      <el-form label-width="120px">
        <el-form-item v-for="item in fbResultFields" :key="item.label" :label="item.label">
          <span :style="{ color: /失败|超时|异常|500|504/.test(item.value) ? '#F56C6C' : /成功|200|202/.test(item.value) ? '#67C23A' : '' }">{{ item.value }}</span>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="fbResultVisible = false">关闭</el-button>
        <el-button type="primary" @click="fbResultVisible = false">确认</el-button>
      </span>
    </el-dialog>

    <!-- 发起审核流程弹窗 -->
    <el-dialog :title="initiateAuditTitle" :visible.sync="initiateAuditVisible" width="720px" append-to-body>
      <el-form :model="initiateAuditForm" label-width="110px" style="margin-bottom:16px;">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="审核编号">
              <el-input v-model="initiateAuditForm.billNo" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="审核类型">
              <el-select v-model="initiateAuditForm.auditType" style="width:100%">
                <el-option label="合规审核" value="合规审核"></el-option>
                <el-option label="安全审核" value="安全审核"></el-option>
                <el-option label="数据审核" value="数据审核"></el-option>
                <el-option label="变更审核" value="变更审核"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="申请人">
              <el-input v-model="initiateAuditForm.applicant" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="审核部门">
              <el-select v-model="initiateAuditForm.dept" style="width:100%">
                <el-option label="安全运维部" value="安全运维部"></el-option>
                <el-option label="信息安全部" value="信息安全部"></el-option>
                <el-option label="技术管理部" value="技术管理部"></el-option>
                <el-option label="综合管理部" value="综合管理部"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="审核范围">
          <el-input v-model="initiateAuditForm.scope" placeholder="请输入审核范围描述"></el-input>
        </el-form-item>
        <el-form-item label="审核说明">
          <el-input v-model="initiateAuditForm.description" type="textarea" :rows="3" placeholder="请输入审核流程发起的详细说明"></el-input>
        </el-form-item>
      </el-form>
      <div style="font-size:13px;color:#606266;margin-bottom:8px;font-weight:500;">审核流程节点</div>
      <el-steps :active="initiateAuditStep" align-center style="margin-bottom:16px;">
        <el-step v-for="(node, idx) in initiateAuditNodes" :key="idx" :title="node.title" :description="node.approver"></el-step>
      </el-steps>
      <el-table :data="initiateAuditNodes" border size="mini" style="width:100%;margin-bottom:12px;">
        <el-table-column prop="title" label="节点" width="100"></el-table-column>
        <el-table-column prop="approver" label="审批人" width="100"></el-table-column>
        <el-table-column prop="dept" label="部门" width="120"></el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.status === '待审批'" type="info" size="mini">待审批</el-tag>
            <el-tag v-else-if="scope.row.status === '审批中'" type="warning" size="mini">审批中</el-tag>
            <el-tag v-else type="success" size="mini">已完成</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="说明"></el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="initiateAuditVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmInitiateAudit" icon="el-icon-s-check">确认发起审核流程</el-button>
      </span>
    </el-dialog>

    <!-- 逐级审批弹窗 -->
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
        <el-form-item label="审批进度">
          <el-progress :percentage="approvalProgress" :status="approvalProgress===100?'success':''" style="width:80%"></el-progress>
        </el-form-item>
        <el-form-item label="最终状态">
          <el-tag :type="approvalFinalStatus==='已通过'?'success':approvalFinalStatus==='已驳回'?'danger':'warning'" size="medium">{{ approvalFinalStatus }}</el-tag>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="approvalVisible = false">关 闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { exportXLSX, filterData } from "@/utils/index";

const initialRows = [
  {
    "ID": 1,
    "报表类型": "趋势报表",
    "更新频率": "手动",
    "报表名称": "风险评估报表",
    "数据量": "8.3MB",
    "扫描策略": "全量扫描",
    "校验规则": "合规性校验"
  },
  {
    "ID": 2,
    "报表类型": "排名报表",
    "更新频率": "触发式",
    "报表名称": "纳管对比报表",
    "数据量": "45.6MB",
    "扫描策略": "增量扫描",
    "校验规则": "可用性校验"
  },
  {
    "ID": 3,
    "报表类型": "汇总报表",
    "更新频率": "实时",
    "报表名称": "资产统计报表",
    "数据量": "1.2MB",
    "扫描策略": "快速扫描",
    "校验规则": "完整性校验"
  },
  {
    "ID": 4,
    "报表类型": "明细报表",
    "更新频率": "每日",
    "报表名称": "漏洞分布报表",
    "数据量": "4.5MB",
    "扫描策略": "深度扫描",
    "校验规则": "一致性校验"
  },
  {
    "ID": 5,
    "报表类型": "分析报表",
    "更新频率": "每周",
    "报表名称": "扫描结果报表",
    "数据量": "12.8MB",
    "扫描策略": "常规扫描",
    "校验规则": "准确性校验"
  },
  {
    "ID": 6,
    "报表类型": "对比报表",
    "更新频率": "每月",
    "报表名称": "合规分析报表",
    "数据量": "256KB",
    "扫描策略": "定向扫描",
    "校验规则": "时效性校验"
  },
  {
    "ID": 7,
    "报表类型": "趋势报表",
    "更新频率": "手动",
    "报表名称": "风险评估报表",
    "数据量": "8.3MB",
    "扫描策略": "全量扫描",
    "校验规则": "合规性校验"
  },
  {
    "ID": 8,
    "报表类型": "排名报表",
    "更新频率": "触发式",
    "报表名称": "纳管对比报表",
    "数据量": "45.6MB",
    "扫描策略": "增量扫描",
    "校验规则": "可用性校验"
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
    "prop": "报表类型",
    "label": "报表类型",
    "type": "text",
    "search": true,
    "showTooltip": true
  },
  {
    "prop": "更新频率",
    "label": "更新频率",
    "type": "text",
    "search": false,
    "showTooltip": true
  },
  {
    "prop": "报表名称",
    "label": "报表名称",
    "type": "text",
    "search": true,
    "showTooltip": true
  },
  {
    "prop": "数据量",
    "label": "数据量",
    "type": "text",
    "search": false,
    "showTooltip": true
  },
  {
    "prop": "扫描策略",
    "label": "扫描策略",
    "type": "text",
    "search": false,
    "showTooltip": true
  },
  {
    "prop": "校验规则",
    "label": "校验规则",
    "type": "text",
    "search": false,
    "showTooltip": true
  },
  {
    "prop": "校验规则",
    "label": "校验规则",
    "type": "text",
    "search": true,
    "showTooltip": true
  },
  {
    "slot": "operate",
    "label": "操作"
  }
];
const defaultRow = {
  "ID": "",
  "报表类型": "",
  "更新频率": "",
  "报表名称": "",
  "数据量": "",
  "扫描策略": "",
  "校验规则": ""
};
const importTemplateRow = {
  "报表类型": "",
  "更新频率": "",
  "报表名称": "",
  "数据量": "",
  "扫描策略": "",
  "校验规则": "",
  "导入来源": "备案验证结果报表导入模板.xlsx"
};

function pageHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 100000;
  return h;
}
const pick = (items, index, seed) => items[(seed + index) % items.length];

export default {
  name: "JLPage5134",
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
      initiateAuditVisible: false,
      initiateAuditTitle: "发起审核流程",
      initiateAuditForm: {
        billNo: "",
        auditType: "合规审核",
        applicant: "",
        dept: "安全运维部",
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
    handleFunction(functionName, dialogType) {
      this.activeFunction = functionName;
      this.activeActionType = dialogType;
      this.openFunctionDialog(functionName, dialogType);
    },
    // ─── 统一功能弹窗：根据类型和名称生成独特内容 ───
    openFunctionDialog(functionName, type) {
      const S = pageHash(functionName);
      const now = this.now();

      // 根据类型生成独特的弹窗内容
      switch (type) {
        case "form":
          this.openFormDialog(functionName, S, now);
          break;
        case "detail":
          this.openDetailDialog(functionName, S, now);
          break;
        case "monitor":
          this.openMonitorDialog(functionName, S, now);
          break;
        case "statistics":
          this.openStatisticsDialog(functionName, S, now);
          break;
        case "analysis":
          this.openAnalysisDialog(functionName, S, now);
          break;
        case "alert":
          this.openAlertDialog(functionName, S, now);
          break;
        case "audit":
          this.openAuditDialog(functionName, S, now);
          break;
        case "workflow":
          this.openWorkflowDialog(functionName, S, now);
          break;
        case "dispatch":
          this.openDispatchDialog(functionName, S, now);
          break;
        case "receive":
          this.openReceiveDialog(functionName, S, now);
          break;
        case "feedback":
          this.openFeedbackDialog(functionName, S, now);
          break;
        case "export":
          this.openExportDialog(functionName, S, now);
          break;
        case "api":
          this.openApiDialog(functionName, S, now);
          break;
        case "dataprocess":
          this.openDataProcessDialog(functionName, S, now);
          break;
        case "config":
          this.openConfigDialog(functionName, S, now);
          break;
        case "sync":
          this.openSyncDialog(functionName, S, now);
          break;
        case "preview":
          this.openPreviewDialog(functionName, S, now);
          break;
        case "log":
          this.openLogDialog(functionName, S, now);
          break;
        case "report":
          this.openReportDialog(functionName, S, now);
          break;
        case "validate":
          this.openValidateDialog(functionName, S, now);
          break;
        case "transform":
          this.openTransformDialog(functionName, S, now);
          break;
        case "schedule":
          this.openScheduleDialog(functionName, S, now);
          break;
        case "initiate_audit":
          this.openInitiateAuditDialog(functionName, S, now);
          break;
        case "approval":
          this.openApprovalDialog(functionName, S, now);
          break;
        default:
          this.openOperationDialog(functionName, S, now);
      }
    },
    // ─── 新增/配置类弹窗 ───
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
    // ─── 查看/详情类弹窗 ───
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
    // ─── 监控类弹窗 ───
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
    // ─── 统计类弹窗 ───
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
    // ─── 分析/评估类弹窗 ───
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
    // ─── 告警类弹窗 ───
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
    // ─── 稽核/审批类弹窗 ───
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
    // ─── 流程/工作流类弹窗 ───
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
    // ─── 调度类弹窗 ───
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
    // ─── 接收类弹窗 ───
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
    // ─── 反馈类弹窗 ───
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
      this.fbResultVisible = true;
    },
    // ─── 导出类弹窗 ───
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
    // ─── 接口类弹窗 ───
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
    // ─── 数据处理类弹窗 ───
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
    // ─── 默认操作类弹窗 ───
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
    // ─── 配置管理类弹窗 ───
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
    // ─── 数据同步类弹窗 ───
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
    // ─── 预览类弹窗 ───
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
    // ─── 日志查看类弹窗 ───
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
    // ─── 报表生成类弹窗 ───
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
    // ─── 校验验证类弹窗 ───
    openValidateDialog(functionName, S, now) {
      this.queryTitle = functionName;
      const count = (S % 3) + 3;
      this.queryResults = Array.from({ length: count }).map((_, i) => ({
        序号: i + 1,
        数据项: pick(["格式校验", "范围校验", "一致性校验", "完整性校验", "唯一性校验"], i, S),
        结果数量: pick([12, 28, 56, 128], i, S),
        校验耗时: pick(["12ms", "28ms", "56ms", "128ms"], i, S) + "",
        状态: pick(["通过", "未通过", "警告", "跳过"], i, S),
      }));
      this.queryVisible = true;
    },
    // ─── 数据转换类弹窗 ───
    openTransformDialog(functionName, S, now) {
      this.invokeTitle = functionName;
      this.invokeSteps = [
        { step: "读取源数据", status: pick(["已完成", "进行中", "等待中"], 0, S), time: pick(["56ms", "128ms", "-"], 1, S) + "" },
        { step: "字段映射", status: pick(["已完成", "进行中", "等待中"], 2, S), time: pick(["23ms", "56ms", "-"], 3, S) + "" },
        { step: "类型转换", status: pick(["已完成", "进行中", "等待中"], 4, S), time: pick(["18ms", "35ms", "-"], 5, S) + "" },
        { step: "数据聚合", status: pick(["已完成", "进行中", "等待中"], 6, S), time: pick(["86ms", "186ms", "-"], 7, S) + "" },
        { step: "写入目标", status: pick(["已完成", "进行中", "等待中"], 8, S), time: pick(["35ms", "86ms", "-"], 9, S) + "" },
      ];
      this.invokeCurrentStep = this.invokeSteps.findIndex(s => s.status === "进行中") + 1;
      this.invokeProgress = Math.round((this.invokeSteps.filter(s => s.status === "已完成").length / this.invokeSteps.length) * 100);
      this.invokeVisible = true;
    },
    // ─── 调度计划类弹窗 ───
    openScheduleDialog(functionName, S, now) {
      this.sendTitle = functionName;
      this.sendFields = [
        { label: "计划名称", value: functionName },
        { label: "计划编号", value: "SCH-" + String(S).slice(-6) },
        { label: "调度类型", value: pick(["单次执行", "定时执行", "周期执行", "事件触发"], 0, S) },
        { label: "执行频率", value: pick(["每5分钟", "每小时", "每天", "每周"], 1, S) },
        { label: "下次执行", value: pick(["2026-05-26 09:00", "2026-05-26 12:00", "2026-05-27 00:00", "2026-06-01 00:00"], 2, S) },
        { label: "执行状态", value: pick(["就绪", "执行中", "已暂停", "已完成"], 3, S) },
        { label: "上次执行", value: pick(["成功", "失败", "超时", "跳过"], 4, S) },
        { label: "重试策略", value: pick(["不重试", "重试1次", "重试3次", "指数退避"], 5, S) },
      ];
      this.sendVisible = true;
    },
    // ─── 发起审核流程弹窗 ───
    openInitiateAuditDialog(functionName, S, now) {
      this.initiateAuditTitle = functionName;
      const billNo = "AUDIT-" + String(S).slice(-6);
      const pool = ["张伟", "李娜", "王强", "赵敏", "刘洋", "陈静"];
      const applicant = pick(pool, 5, S);
      const nodes = [
        { title: "发起申请", approver: applicant, dept: "安全运维部", status: "已完成", remark: "申请已提交" },
        { title: "部门初审", approver: pick(pool, 0, S), dept: "安全运维部", status: "审批中", remark: "待部门主管审批" },
        { title: "技术审核", approver: pick(pool, 1, S), dept: "技术管理部", status: "待审批", remark: "等待技术评审" },
        { title: "安全审核", approver: pick(pool, 2, S), dept: "信息安全部", status: "待审批", remark: "等待安全审核" },
        { title: "分管审批", approver: pick(pool, 3, S), dept: "运营管理部", status: "待审批", remark: "待分管领导审批" },
        { title: "归档完成", approver: "系统自动", dept: "-", status: "待审批", remark: "全部审批通过后自动归档" },
      ];
      this.initiateAuditForm = {
        billNo: billNo,
        auditType: pick(["合规审核", "安全审核", "数据审核", "变更审核"], 5, S),
        applicant: applicant,
        dept: pick(["安全运维部", "信息安全部", "技术管理部", "综合管理部"], 6, S),
        scope: functionName + "相关数据及配置",
        description: "发起【" + functionName + "】审核流程，涉及资产范围" + pick(["核心机房", "全网资产", "指定IP段", "特定区域"], 7, S) + "，请各审批节点依次审核。",
      };
      this.initiateAuditNodes = nodes;
      this.initiateAuditStep = 1;
      this.initiateAuditVisible = true;
    },
    confirmInitiateAudit() {
      const self = this;
      this.$confirm("确定发起此审核流程？流程将按设定节点依次审批。", "确认发起", {
        confirmButtonText: "确定发起",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        this.initiateAuditNodes = this.initiateAuditNodes.map((node, i) => {
          if (i === 0) return { ...node, status: "已完成" };
          if (i === 1) return { ...node, status: "审批中" };
          return { ...node, status: "待审批" };
        });
        this.initiateAuditStep = 2;
        this.$message.success("审核流程已成功发起，请等待各节点审批处理");
        this.initiateAuditVisible = false;
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
    openConfigure(functionName) {
      this.configureTitle = functionName;
      const S = pageHash(functionName);
      const row = this.createEmptyRow();
      const now = this.now();
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
    submitConfigure() {
      const now = this.now();
      const id = "CFG-" + Date.now();
      const primary = this.getPrimaryNameField();
      const newRow = {
        ...this.configureForm,
        "ID": id,
      };
      if (/编号|ID/i.test(primary ? primary.prop : "")) {
        newRow[primary.prop] = id;
      }
      const timeCol = this.editableColumns.find(c => /时间/.test(c.prop));
      if (timeCol) newRow[timeCol.prop] = now;
      this.allTableData.unshift(newRow);
      this.pageTotal = this.allTableData.length;
      this.fetchData();
      const name = primary ? newRow[primary.prop] : id;
      this.$message.success("配置已保存并添加到列表：" + name);
      this.configureVisible = false;
    },
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
    openFeedbackResult(functionName) {
      const S = pageHash(functionName);
      this.fbResultTitle = functionName;
      this.fbResultFields = [
        { label: "操作名称", value: functionName },
        { label: "反馈编号", value: "FB-" + String(S).slice(-6) },
        { label: "返回码", value: pick(["200 OK", "202 ACCEPTED", "500 INTERNAL_ERROR", "504 TIMEOUT"], 0, S) },
        { label: "执行结果", value: pick(["全部成功", "部分成功", "执行失败", "超时终止"], 1, S) },
        { label: "影响记录数", value: pick([0, 12, 48, 128], 2, S) + "条" },
        { label: "处理耗时", value: pick(["23ms", "86ms", "256ms", "1024ms"], 3, S) + "" },
        { label: "错误信息", value: pick(["无", "无", "字段校验失败", "连接超时"], 4, S) },
        { label: "完成时间", value: this.now() },
      ];
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
    deleteRow(row) {
      this.$confirm("确定删除该记录吗？", "删除确认", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        this.allTableData = this.allTableData.filter((item) => item.ID !== row.ID);
        this.fetchData();
        this.$message.success("删除成功");
      }).catch(() => {});
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
      exportXLSX(rows, functionName || "备案验证结果报表导出");
      this.$message.success("导出成功");
    },
    buildExportRows(functionName) {
      if (/数据导出|信息导出|列表导出|全量/.test(functionName)) {
        return this.allTableData;
      }
      if (/执行状态|日志/.test(functionName)) {
        return [
          { 名称: functionName.replace(/导出/g, ""), 状态: "执行成功", 日志: "任务已完成，回执校验通过" },
          { 名称: "备案验证结果报表任务调度", 状态: "执行中", 日志: "正在等待节点返回执行结果" },
          { 名称: "备案验证结果报表异常检查", 状态: "已告警", 日志: "发现1条超时记录，已进入重试队列" },
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
        { 业务名称: "备案验证结果报表业务记录", 业务状态: "已处理", 处理时间: this.now(), 说明: "模拟业务记录" },
        { 业务名称: "备案验证结果报表复核记录", 业务状态: "待复核", 处理时间: this.now(), 说明: "等待人工确认" },
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
        { label: "所属页面", value: "备案验证结果报表" },
        { label: "一级模块", value: "资产信息上报调整" },
        { label: "二级模块", value: "JL吉林COSMIC" },
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

<style scoped>
.function-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.function-actions .el-button {
  margin-left: 0;
}
.mt10 {
  margin-top: 10px;
}
.mb10 {
  margin-bottom: 10px;
}
.crud-container {
  background: #fff;
  padding: 16px;
  border-radius: 4px;
}
.operate-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.analysis-panel {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}
.metric-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 20px;
  background: #f5f7fa;
  border-radius: 6px;
  min-width: 100px;
}
.metric-card span {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}
.metric-card strong {
  font-size: 20px;
  color: #303133;
}
.bar-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.bar-row span {
  width: 60px;
  font-size: 13px;
  color: #606266;
  text-align: right;
}
.bar-track {
  flex: 1;
  height: 18px;
  background: #f0f2f5;
  border-radius: 4px;
  overflow: hidden;
}
.bar-value {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #66b1ff);
  border-radius: 4px;
  transition: width 0.3s;
}
.bar-row em {
  width: 40px;
  font-size: 12px;
  color: #909399;
  font-style: normal;
  text-align: right;
}
.detail-form .el-form-item {
  margin-bottom: 12px;
}
.detail-form .el-form-item span {
  color: #606266;
  font-size: 14px;
}
</style>
