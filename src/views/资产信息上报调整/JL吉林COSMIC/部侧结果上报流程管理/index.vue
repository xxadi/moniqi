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
          <el-button plain type="primary" icon="el-icon-s-claim" @click='handleFunction("发起部侧结果上报流程", "initiate_flow")'>发起部侧结果上报流程</el-button>
          <el-button plain type="primary" icon="el-icon-edit-outline" @click='handleFunction("新增部侧结果上报指派信息", "form")'>新增部侧结果上报指派信息</el-button>
          <el-button plain type="primary" icon="el-icon-edit-outline" @click='handleFunction("新增部侧结果上报流程节点", "detail")'>新增部侧结果上报流程节点</el-button>
          <el-button plain type="primary" icon="el-icon-view" @click='handleFunction("部侧结果上报流程节点查询", "node_query")'>部侧结果上报流程节点查询</el-button>
          <el-button plain type="primary" icon="el-icon-s-operation" @click='handleFunction("上传部侧结果上报附件", "upload")'>上传部侧结果上报附件</el-button>
          <el-button plain type="primary" icon="el-icon-bell" @click='handleFunction("部侧结果上报流程通知", "flow_notify")'>部侧结果上报流程通知</el-button>
          <el-button plain type="primary" icon="el-icon-bell" @click='handleFunction("部侧结果上报结果逐级审批", "approval")'>部侧结果上报结果逐级审批</el-button>
          <el-button plain type="primary" icon="el-icon-bell" @click='handleFunction("部侧结果上报结果拒绝和驳回", "reject")'>部侧结果上报结果拒绝和驳回</el-button>
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

    <!-- 统计报表弹窗 (statistics类型) -->
    <el-dialog :title="statsTitle" :visible.sync="statsVisible" width="720px" append-to-body>
      <div style="display:flex;gap:12px;margin-bottom:16px;">
        <div v-for="item in statsCards" :key="item.label" style="flex:1;background:#f5f7fa;border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:12px;color:#909399;margin-bottom:4px;">{{ item.label }}</div>
          <div style="font-size:20px;font-weight:bold;color:#303133;">{{ item.value }}</div>
        </div>
      </div>
      <el-table :data="statsTable" border size="mini" style="width:100%;margin-bottom:12px;">
        <el-table-column prop="name" label="统计项" min-width="140"></el-table-column>
        <el-table-column prop="count" label="数量" width="100" align="center"></el-table-column>
        <el-table-column prop="ratio" label="占比" width="80" align="center"></el-table-column>
        <el-table-column prop="trend" label="趋势" width="80" align="center">
          <template slot-scope="scope">
            <span :style="{ color: scope.row.trend === '↑' ? '#67C23A' : scope.row.trend === '↓' ? '#F56C6C' : '#909399' }">{{ scope.row.trend }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === '达标' ? 'success' : scope.row.status === '未达标' ? 'danger' : 'info'" size="mini">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <div style="font-size:13px;color:#606266;margin-bottom:6px;">{{ statsSummary }}</div>
      <span slot="footer">
        <el-button @click="statsVisible = false">关闭</el-button>
      </span>
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

    <!-- 数据分析弹窗 -->
    <el-dialog :title="dataAnalysisTitle" :visible.sync="dataAnalysisVisible" width="750px" append-to-body>
      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
        <div v-for="item in dataAnalysisMetrics" :key="item.label" style="flex:1;min-width:100px;background:#f5f7fa;border-radius:6px;padding:12px;text-align:center;">
          <div style="font-size:12px;color:#909399;">{{ item.label }}</div>
          <div style="font-size:20px;font-weight:bold;color:#303133;margin-top:4px;">{{ item.value }}</div>
          <div style="font-size:11px;margin-top:2px;" :style="{color: item.trend === '↑' ? '#67C23A' : item.trend === '↓' ? '#F56C6C' : '#909399'}">{{ item.trend }} {{ item.change }}</div>
        </div>
      </div>
      <el-divider content-position="left">趋势数据</el-divider>
      <el-table :data="dataAnalysisTrend" size="mini" border style="width:100%;margin-bottom:16px;">
        <el-table-column prop="period" label="时间段" width="120"></el-table-column>
        <el-table-column prop="count" label="数量" width="80"></el-table-column>
        <el-table-column prop="rate" label="比率" width="80"></el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template slot-scope="{row}">
            <el-tag :type="row.status === '达标' ? 'success' : row.status === '未达标' ? 'danger' : 'warning'" size="mini">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注"></el-table-column>
      </el-table>
      <el-divider content-position="left">分析结论</el-divider>
      <div style="background:#f5f7fa;border-radius:6px;padding:12px;">
        <div v-for="(conclusion, idx) in dataAnalysisConclusions" :key="idx" style="padding:6px 0;border-bottom:1px solid #ebeef5;font-size:13px;">
          <el-tag :type="conclusion.type === '优势' ? 'success' : conclusion.type === '风险' ? 'danger' : 'warning'" size="mini" style="margin-right:8px;">{{ conclusion.type }}</el-tag>
          {{ conclusion.content }}
        </div>
      </div>
      <span slot="footer">
        <el-button @click="dataAnalysisVisible = false">关闭</el-button>
        <el-button type="primary" @click="exportDataAnalysisReport">导出报告</el-button>
      </span>
    </el-dialog>

    <!-- 结果展示弹窗 -->
    <el-dialog :title="resultDisplayTitle" :visible.sync="resultDisplayVisible" width="700px" append-to-body>
      <div style="display:flex;gap:12px;margin-bottom:16px;">
        <div style="flex:1;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:8px;padding:16px;color:#fff;">
          <div style="font-size:12px;opacity:0.8;">总记录数</div>
          <div style="font-size:28px;font-weight:bold;">{{ resultDisplayStats.total }}</div>
        </div>
        <div style="flex:1;background:linear-gradient(135deg,#11998e 0%,#38ef7d 100%);border-radius:8px;padding:16px;color:#fff;">
          <div style="font-size:12px;opacity:0.8;">成功数</div>
          <div style="font-size:28px;font-weight:bold;">{{ resultDisplayStats.success }}</div>
        </div>
        <div style="flex:1;background:linear-gradient(135deg,#ee0979 0%,#ff6a00 100%);border-radius:8px;padding:16px;color:#fff;">
          <div style="font-size:12px;opacity:0.8;">失败数</div>
          <div style="font-size:28px;font-weight:bold;">{{ resultDisplayStats.fail }}</div>
        </div>
      </div>
      <el-table :data="resultDisplayData" size="small" border style="width:100%" max-height="280">
        <el-table-column type="index" label="序号" width="50"></el-table-column>
        <el-table-column prop="name" label="名称" width="150"></el-table-column>
        <el-table-column prop="value" label="结果值" width="120"></el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template slot-scope="{row}">
            <el-tag :type="row.status === '成功' ? 'success' : row.status === '失败' ? 'danger' : 'warning'" size="mini">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="time" label="时间" width="150"></el-table-column>
        <el-table-column prop="remark" label="备注"></el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="resultDisplayVisible = false">关闭</el-button>
        <el-button type="primary" @click="exportResultDisplay">导出结果</el-button>
      </span>
    </el-dialog>

    <!-- 数据提取弹窗 -->
    <el-dialog :title="dataExtractTitle" :visible.sync="dataExtractVisible" width="680px" append-to-body>
      <el-form :model="dataExtractForm" label-width="100px" size="small" style="margin-bottom:16px;">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="数据来源">
              <el-select v-model="dataExtractForm.source" style="width:100%;">
                <el-option label="数据库" value="数据库"></el-option>
                <el-option label="日志文件" value="日志文件"></el-option>
                <el-option label="API接口" value="API接口"></el-option>
                <el-option label="CSV文件" value="CSV文件"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="提取规则">
              <el-select v-model="dataExtractForm.rule" style="width:100%;">
                <el-option label="全量提取" value="全量提取"></el-option>
                <el-option label="增量提取" value="增量提取"></el-option>
                <el-option label="条件提取" value="条件提取"></el-option>
                <el-option label="采样提取" value="采样提取"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="目标表名"><el-input v-model="dataExtractForm.target"></el-input></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="提取状态"><el-tag :type="dataExtractForm.status === '已完成' ? 'success' : dataExtractForm.status === '提取中' ? '' : 'warning'" size="small">{{ dataExtractForm.status }}</el-tag></el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <el-divider content-position="left">提取进度</el-divider>
      <el-progress :percentage="dataExtractProgress" :status="dataExtractProgress === 100 ? 'success' : undefined" style="margin-bottom:16px;"></el-progress>
      <el-table :data="dataExtractFields" size="mini" border style="width:100%;margin-bottom:16px;" max-height="200">
        <el-table-column type="index" label="序号" width="50"></el-table-column>
        <el-table-column prop="field" label="字段名" width="140"></el-table-column>
        <el-table-column prop="type" label="类型" width="100"></el-table-column>
        <el-table-column prop="extracted" label="已提取" width="80">
          <template slot-scope="{row}">
            <el-tag :type="row.extracted ? 'success' : 'info'" size="mini">{{ row.extracted ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="count" label="记录数" width="80"></el-table-column>
        <el-table-column prop="sample" label="示例值"></el-table-column>
      </el-table>
      <div style="display:flex;gap:16px;font-size:12px;color:#909399;">
        <span>总字段: {{ dataExtractFields.length }}</span>
        <span>已提取: {{ dataExtractFields.filter(f => f.extracted).length }}</span>
        <span>总记录: {{ dataExtractStats.totalRecords }}</span>
        <span>耗时: {{ dataExtractStats.duration }}</span>
      </div>
      <span slot="footer">
        <el-button @click="dataExtractVisible = false">关闭</el-button>
        <el-button v-if="dataExtractProgress < 100" type="warning" @click="dataExtractProgress = 100; dataExtractForm.status = '已完成'; dataExtractFields.forEach(f => { f.extracted = true; f.count = Math.floor(Math.random() * 500) + 100; }); $message.success('提取已强制完成')">强制完成</el-button>
        <el-button type="primary" @click="exportDataExtract">导出提取数据</el-button>
      </span>
    </el-dialog>

    <!-- 数据审查弹窗 -->
    <el-dialog :title="dataReviewTitle" :visible.sync="dataReviewVisible" width="700px" append-to-body>
      <div style="display:flex;gap:12px;margin-bottom:16px;">
        <div style="flex:1;background:#f0f9eb;border-radius:6px;padding:12px;text-align:center;border:1px solid #e1f3d8;">
          <div style="font-size:12px;color:#67C23A;">通过</div>
          <div style="font-size:24px;font-weight:bold;color:#67C23A;">{{ dataReviewStats.pass }}</div>
        </div>
        <div style="flex:1;background:#fdf6ec;border-radius:6px;padding:12px;text-align:center;border:1px solid #faecd8;">
          <div style="font-size:12px;color:#E6A23C;">警告</div>
          <div style="font-size:24px;font-weight:bold;color:#E6A23C;">{{ dataReviewStats.warning }}</div>
        </div>
        <div style="flex:1;background:#fef0f0;border-radius:6px;padding:12px;text-align:center;border:1px solid #fde2e2;">
          <div style="font-size:12px;color:#F56C6C;">不通过</div>
          <div style="font-size:24px;font-weight:bold;color:#F56C6C;">{{ dataReviewStats.fail }}</div>
        </div>
        <div style="flex:1;background:#f4f4f5;border-radius:6px;padding:12px;text-align:center;border:1px solid #e9e9eb;">
          <div style="font-size:12px;color:#909399;">待审查</div>
          <div style="font-size:24px;font-weight:bold;color:#909399;">{{ dataReviewStats.pending }}</div>
        </div>
      </div>
      <el-table :data="dataReviewItems" size="small" border style="width:100%;margin-bottom:16px;" max-height="260">
        <el-table-column type="index" label="序号" width="50"></el-table-column>
        <el-table-column prop="rule" label="审查规则" width="150"></el-table-column>
        <el-table-column prop="category" label="规则类别" width="100"></el-table-column>
        <el-table-column prop="result" label="审查结果" width="90">
          <template slot-scope="{row}">
            <el-tag :type="row.result === '通过' ? 'success' : row.result === '不通过' ? 'danger' : 'warning'" size="mini">{{ row.result }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="count" label="涉及记录" width="90"></el-table-column>
        <el-table-column prop="detail" label="详情"></el-table-column>
      </el-table>
      <el-divider content-position="left">审查说明</el-divider>
      <div style="background:#f5f7fa;border-radius:6px;padding:12px;font-size:13px;">
        <div v-for="(note, idx) in dataReviewNotes" :key="idx" style="padding:4px 0;">
          <el-tag :type="note.type === '重要' ? 'danger' : note.type === '建议' ? 'warning' : 'info'" size="mini" style="margin-right:8px;">{{ note.type }}</el-tag>
          {{ note.content }}
        </div>
      </div>
      <span slot="footer">
        <el-button @click="dataReviewVisible = false">关闭</el-button>
        <el-button type="primary" @click="exportDataReview">导出审查报告</el-button>
      </span>
    </el-dialog>

    <!-- 运行效果评估弹窗 -->
    <el-dialog :title="runEvalTitle" :visible.sync="runEvalVisible" width="720px" append-to-body>
      <div style="text-align:center;margin-bottom:16px;">
        <div style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:50%;width:80px;height:80px;line-height:80px;color:#fff;font-size:28px;font-weight:bold;">{{ runEvalScore }}</div>
        <div style="margin-top:8px;font-size:14px;color:#606266;">综合评分</div>
        <el-tag :type="runEvalScore >= 90 ? 'success' : runEvalScore >= 70 ? 'warning' : 'danger'" size="small">{{ runEvalScore >= 90 ? '优秀' : runEvalScore >= 70 ? '良好' : '需改进' }}</el-tag>
      </div>
      <el-table :data="runEvalItems" size="small" border style="width:100%;margin-bottom:16px;" max-height="240">
        <el-table-column type="index" label="序号" width="50"></el-table-column>
        <el-table-column prop="dimension" label="评估维度" width="130"></el-table-column>
        <el-table-column prop="score" label="得分" width="70">
          <template slot-scope="{row}">
            <span :style="{color: row.score >= 90 ? '#67C23A' : row.score >= 70 ? '#E6A23C' : '#F56C6C', fontWeight:'bold'}">{{ row.score }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="weight" label="权重" width="70"></el-table-column>
        <el-table-column prop="level" label="等级" width="80">
          <template slot-scope="{row}">
            <el-tag :type="row.level === '优秀' ? 'success' : row.level === '良好' ? 'warning' : 'danger'" size="mini">{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="detail" label="评估说明"></el-table-column>
      </el-table>
      <el-divider content-position="left">改进建议</el-divider>
      <div style="background:#f5f7fa;border-radius:6px;padding:12px;">
        <div v-for="(item, idx) in runEvalSuggestions" :key="idx" style="padding:6px 0;border-bottom:1px solid #ebeef5;font-size:13px;">
          <el-tag :type="item.priority === '高' ? 'danger' : item.priority === '中' ? 'warning' : 'info'" size="mini" style="margin-right:8px;">{{ item.priority }}</el-tag>
          {{ item.content }}
        </div>
      </div>
      <span slot="footer">
        <el-button @click="runEvalVisible = false">关闭</el-button>
        <el-button type="primary" @click="exportRunEvaluation">导出评估报告</el-button>
      </span>
    </el-dialog>

    <!-- 可视化展示弹窗 -->
    <el-dialog :title="vizTitle" :visible.sync="vizVisible" width="800px" append-to-body>
      <div style="margin-bottom:16px;">
        <el-row :gutter="16">
          <el-col :span="6" v-for="(card, idx) in vizCards" :key="idx">
            <el-card shadow="hover" style="text-align:center;margin-bottom:12px;">
              <div style="font-size:28px;font-weight:bold;color:#409EFF;">{{ card.value }}</div>
              <div style="font-size:13px;color:#909399;margin-top:4px;">{{ card.label }}</div>
              <div style="font-size:12px;margin-top:4px;">
                <span :style="{color: card.trend > 0 ? '#67C23A' : '#F56C6C'}">
                  <i :class="card.trend > 0 ? 'el-icon-top' : 'el-icon-bottom'"></i>
                  {{ Math.abs(card.trend) }}%
                </span>
                <span style="color:#C0C4CC;margin-left:8px;">较昨日</span>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      <el-divider content-position="left">数据趋势</el-divider>
      <el-table :data="vizTrendData" size="small" border style="width:100%;margin-bottom:16px;" max-height="200">
        <el-table-column type="index" label="序号" width="50"></el-table-column>
        <el-table-column prop="time" label="时间" width="140"></el-table-column>
        <el-table-column prop="metric" label="指标" width="120"></el-table-column>
        <el-table-column prop="value" label="数值" width="100"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="{row}">
            <el-tag :type="row.status === '正常' ? 'success' : row.status === '预警' ? 'warning' : 'danger'" size="mini">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="说明"></el-table-column>
      </el-table>
      <el-divider content-position="left">分布情况</el-divider>
      <el-table :data="vizDistribution" size="small" border style="width:100%;" max-height="160">
        <el-table-column prop="category" label="类别" width="120"></el-table-column>
        <el-table-column prop="count" label="数量" width="80"></el-table-column>
        <el-table-column prop="percentage" label="占比" width="100"></el-table-column>
        <el-table-column prop="description" label="描述"></el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="vizVisible = false">关闭</el-button>
        <el-button type="primary" @click="exportVisualization">导出可视化数据</el-button>
      </span>
    </el-dialog>

    <!-- 分级弹窗 -->
    <el-dialog :title="gradingTitle" :visible.sync="gradingVisible" width="700px" append-to-body>
      <el-alert :title="'当前分级结果: ' + gradingLevel" :type="gradingLevel === '一级' ? 'success' : gradingLevel === '二级' ? 'warning' : 'info'" show-icon style="margin-bottom:16px;"></el-alert>
      <el-table :data="gradingItems" size="small" border style="width:100%;margin-bottom:16px;" max-height="280">
        <el-table-column type="index" label="序号" width="50"></el-table-column>
        <el-table-column prop="criteria" label="分级标准" width="140"></el-table-column>
        <el-table-column prop="score" label="得分" width="80">
          <template slot-scope="{row}">
            <span :style="{color: row.score >= 80 ? '#67C23A' : row.score >= 60 ? '#E6A23C' : '#F56C6C', fontWeight:'bold'}">{{ row.score }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="weight" label="权重" width="80"></el-table-column>
        <el-table-column prop="result" label="评定结果" width="100">
          <template slot-scope="{row}">
            <el-tag :type="row.result === '达标' ? 'success' : row.result === '基本达标' ? 'warning' : 'danger'" size="mini">{{ row.result }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="说明"></el-table-column>
      </el-table>
      <el-divider content-position="left">分级依据</el-divider>
      <div style="background:#f5f7fa;border-radius:6px;padding:12px;">
        <div v-for="(item, idx) in gradingBasis" :key="idx" style="padding:6px 0;border-bottom:1px solid #ebeef5;font-size:13px;">
          <el-tag :type="item.level === '一级' ? 'danger' : item.level === '二级' ? 'warning' : 'info'" size="mini" style="margin-right:8px;">{{ item.level }}</el-tag>
          {{ item.description }}
        </div>
      </div>
      <span slot="footer">
        <el-button @click="gradingVisible = false">关闭</el-button>
        <el-button type="primary" @click="exportGrading">导出分级报告</el-button>
      </span>
    </el-dialog>

    <!-- 数据识别弹窗 -->
    <el-dialog :title="recognitionTitle" :visible.sync="recognitionVisible" width="750px" append-to-body>
      <el-row :gutter="16" style="margin-bottom:16px;">
        <el-col :span="8">
          <el-card shadow="hover">
            <div style="text-align:center;">
              <div style="font-size:32px;font-weight:bold;color:#67C23A;">{{ recognitionStats.total }}</div>
              <div style="font-size:13px;color:#909399;">识别总数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover">
            <div style="text-align:center;">
              <div style="font-size:32px;font-weight:bold;color:#409EFF;">{{ recognitionStats.matched }}</div>
              <div style="font-size:13px;color:#909399;">匹配成功</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover">
            <div style="text-align:center;">
              <div style="font-size:32px;font-weight:bold;color:#F56C6C;">{{ recognitionStats.unmatched }}</div>
              <div style="font-size:13px;color:#909399;">未匹配</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-divider content-position="left">识别结果</el-divider>
      <el-table :data="recognitionItems" size="small" border style="width:100%;margin-bottom:16px;" max-height="260">
        <el-table-column type="index" label="序号" width="50"></el-table-column>
        <el-table-column prop="fieldName" label="字段名称" width="120"></el-table-column>
        <el-table-column prop="fieldType" label="字段类型" width="100"></el-table-column>
        <el-table-column prop="recognizedType" label="识别结果" width="110">
          <template slot-scope="{row}">
            <el-tag :type="row.recognizedType === '敏感数据' ? 'danger' : row.recognizedType === '普通数据' ? 'success' : 'warning'" size="mini">{{ row.recognizedType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="confidence" label="置信度" width="80">
          <template slot-scope="{row}">
            <span :style="{color: row.confidence >= 90 ? '#67C23A' : row.confidence >= 70 ? '#E6A23C' : '#F56C6C'}">{{ row.confidence }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="rule" label="匹配规则"></el-table-column>
      </el-table>
      <el-divider content-position="left">识别规则</el-divider>
      <div style="background:#f5f7fa;border-radius:6px;padding:12px;">
        <div v-for="(item, idx) in recognitionRules" :key="idx" style="padding:6px 0;border-bottom:1px solid #ebeef5;font-size:13px;">
          <el-tag :type="item.level === '高' ? 'danger' : item.level === '中' ? 'warning' : 'info'" size="mini" style="margin-right:8px;">{{ item.level }}</el-tag>
          {{ item.rule }} — {{ item.description }}
        </div>
      </div>
      <span slot="footer">
        <el-button @click="recognitionVisible = false">关闭</el-button>
        <el-button type="primary" @click="exportRecognition">导出识别结果</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="importTitle" :visible.sync="importVisible" width="560px" append-to-body>
      <div style="margin-bottom:16px;">
        <el-button type="primary" plain icon="el-icon-download" @click="downloadImportTemplateFn">下载模板</el-button>
        <span style="color:#909399;font-size:12px;margin-left:8px;">请先下载模板，填写数据后上传</span>
      </div>
      <el-divider style="margin:12px 0;"></el-divider>
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

    <!-- 接收请求监控弹窗 (api类型) -->
    <el-dialog :title="recvReqTitle" :visible.sync="recvReqVisible" width="650px" append-to-body>
      <el-form label-width="100px" style="margin-bottom:12px;">
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
        <el-button type="primary" @click="confirmApiReceive">确认接收</el-button>
      </span>
    </el-dialog>

    <!-- 输入请求任务弹窗 (input_request类型) -->
    <el-dialog :title="inputReqTitle" :visible.sync="inputReqVisible" width="650px" append-to-body>
      <el-form :model="inputReqForm" label-width="100px" style="margin-bottom:16px;">
        <div style="font-size:13px;color:#606266;margin-bottom:8px;font-weight:500;">请求参数录入</div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="请求类型">
              <el-select v-model="inputReqForm.type" style="width:100%">
                <el-option label="数据查询" value="数据查询"></el-option>
                <el-option label="数据同步" value="数据同步"></el-option>
                <el-option label="任务下发" value="任务下发"></el-option>
                <el-option label="状态上报" value="状态上报"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目标系统">
              <el-input v-model="inputReqForm.target"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="超时时间">
              <el-input v-model="inputReqForm.timeout"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-select v-model="inputReqForm.priority" style="width:100%">
                <el-option label="高" value="高"></el-option>
                <el-option label="中" value="中"></el-option>
                <el-option label="低" value="低"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="请求内容">
          <el-input v-model="inputReqForm.content" type="textarea" :rows="2" placeholder="请输入请求内容"></el-input>
        </el-form-item>
      </el-form>
      <div style="text-align:right;margin-bottom:16px;">
        <el-button type="primary" size="small" @click="submitInputReq">提交请求</el-button>
      </div>
      <div v-if="inputReqSubmitted" style="border-top:1px solid #EBEEF5;padding-top:12px;">
        <div style="font-size:13px;color:#606266;margin-bottom:8px;font-weight:500;">请求任务详情</div>
        <el-form label-width="100px" style="margin-bottom:12px;">
          <el-form-item label="处理进度">
            <el-progress :percentage="inputReqProgress" :status="inputReqProgress === 100 ? 'success' : undefined" style="width:80%"></el-progress>
          </el-form-item>
          <el-form-item v-for="item in inputReqStats" :key="item.label" :label="item.label">
            <span>{{ item.value }}</span>
          </el-form-item>
        </el-form>
        <div style="font-size:13px;color:#606266;margin-bottom:8px;font-weight:500;">处理日志</div>
        <el-table :data="inputReqLog" border size="mini" style="width:100%">
          <el-table-column prop="time" label="时间" width="160"></el-table-column>
          <el-table-column prop="level" label="级别" width="70" align="center">
            <template slot-scope="scope">
              <el-tag :type="scope.row.level === 'WARN' ? 'warning' : 'info'" size="mini">{{ scope.row.level }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="msg" label="消息"></el-table-column>
        </el-table>
      </div>
      <span slot="footer">
        <el-button @click="inputReqVisible = false">关闭</el-button>
        <el-button v-if="inputReqSubmitted" type="primary" @click="confirmInputReqReceive">确认接收</el-button>
      </span>
    </el-dialog>

    <!-- 结果监控弹窗 (monitor类型) -->
    <el-dialog :title="monitorTitle" :visible.sync="monitorVisible" width="680px" append-to-body>
      <div style="display:flex;gap:16px;margin-bottom:16px;">
        <div v-for="item in monitorCards" :key="item.label" style="flex:1;background:#f5f7fa;border-radius:8px;padding:12px 16px;text-align:center;">
          <div style="font-size:12px;color:#909399;margin-bottom:4px;">{{ item.label }}</div>
          <div style="font-size:18px;font-weight:bold;" :style="{ color: item.color || '#303133' }">{{ item.value }}</div>
        </div>
      </div>
      <el-form label-width="100px" style="margin-bottom:12px;">
        <el-form-item v-for="item in monitorFields" :key="item.label" :label="item.label">
          <span :style="{ color: /异常|失败|离线/.test(item.value) ? '#F56C6C' : /正常|在线|完成/.test(item.value) ? '#67C23A' : '' }">{{ item.value }}</span>
        </el-form-item>
      </el-form>
      <div style="font-size:13px;color:#606266;margin-bottom:8px;font-weight:500;">监控时间线</div>
      <el-table :data="monitorTimeline" border size="mini" style="width:100%">
        <el-table-column prop="time" label="时间" width="160"></el-table-column>
        <el-table-column prop="level" label="级别" width="70" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.level === 'ERROR' ? 'danger' : scope.row.level === 'WARN' ? 'warning' : 'info'" size="mini">{{ scope.row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="event" label="事件"></el-table-column>
        <el-table-column prop="result" label="结果" width="80" align="center">
          <template slot-scope="scope">
            <span :style="{ color: scope.row.result === '正常' ? '#67C23A' : scope.row.result === '异常' ? '#F56C6C' : '#E6A23C' }">{{ scope.row.result }}</span>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="monitorVisible = false">关闭</el-button>
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

    <!-- 数据转换弹窗 (transform类型) -->
    <el-dialog :title="transformTitle" :visible.sync="transformVisible" width="720px" append-to-body>
      <el-form label-width="100px" style="margin-bottom:12px;">
        <el-form-item label="转换记录数">
          <span>{{ transformRecordCount }} 条</span>
        </el-form-item>
        <el-form-item label="目标格式">
          <span>JSON</span>
        </el-form-item>
        <el-form-item label="转换耗时">
          <span>{{ transformCost }}</span>
        </el-form-item>
        <el-form-item label="数据大小">
          <span>{{ transformSize }}</span>
        </el-form-item>
      </el-form>
      <div style="font-size:13px;color:#606266;margin-bottom:8px;font-weight:500;">转换结果预览</div>
      <div style="background:#f5f7fa;border:1px solid #EBEEF5;border-radius:4px;padding:12px;max-height:320px;overflow:auto;">
        <pre style="margin:0;font-size:12px;color:#303133;white-space:pre-wrap;word-break:break-all;">{{ transformJson }}</pre>
      </div>
      <span slot="footer">
        <el-button @click="transformVisible = false">关闭</el-button>
        <el-button type="primary" icon="el-icon-document-copy" @click="copyTransformJson">复制JSON</el-button>
      </span>
    </el-dialog>

    <!-- 数据预处理弹窗 (preprocess类型) -->
    <el-dialog :title="preprocessTitle" :visible.sync="preprocessVisible" width="650px" append-to-body>
      <el-form label-width="110px" style="margin-bottom:16px;">
        <el-form-item label="数据源">
          <span>{{ preprocessSource }}</span>
        </el-form-item>
        <el-form-item label="记录总数">
          <span>{{ preprocessTotal }} 条</span>
        </el-form-item>
        <el-form-item label="处理进度">
          <el-progress :percentage="preprocessProgress" :status="preprocessProgress === 100 ? 'success' : undefined" style="width:80%"></el-progress>
        </el-form-item>
      </el-form>
      <div style="font-size:13px;color:#606266;margin-bottom:8px;font-weight:500;">预处理步骤</div>
      <el-steps :active="preprocessActiveStep" finish-status="success" align-center style="margin-bottom:16px;">
        <el-step v-for="(step, idx) in preprocessSteps" :key="idx" :title="step.name" :description="step.desc" :status="step.status"></el-step>
      </el-steps>
      <div style="font-size:13px;color:#606266;margin-bottom:8px;font-weight:500;">处理日志</div>
      <el-table :data="preprocessLog" border size="mini" style="width:100%">
        <el-table-column prop="time" label="时间" width="160"></el-table-column>
        <el-table-column prop="step" label="步骤" width="100"></el-table-column>
        <el-table-column prop="msg" label="详情"></el-table-column>
        <el-table-column prop="result" label="结果" width="70" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.result === '成功' ? 'success' : scope.row.result === '失败' ? 'danger' : 'info'" size="mini">{{ scope.row.result }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="preprocessVisible = false">关闭</el-button>
      </span>
    </el-dialog>

    <!-- 数据采集弹窗 (collection类型) -->
    <el-dialog :title="collectionTitle" :visible.sync="collectionVisible" width="650px" append-to-body>
      <el-form label-width="110px" style="margin-bottom:16px;">
        <el-form-item label="采集来源">
          <span>{{ collectionSource }}</span>
        </el-form-item>
        <el-form-item label="采集目标">
          <span>{{ collectionTarget }}</span>
        </el-form-item>
        <el-form-item label="采集状态">
          <el-tag :type="collectionStatus === '已完成' ? 'success' : collectionStatus === '采集中' ? '' : 'info'" size="small">{{ collectionStatus }}</el-tag>
        </el-form-item>
        <el-form-item label="采集进度">
          <el-progress :percentage="collectionProgress" :status="collectionProgress === 100 ? 'success' : undefined" style="width:80%"></el-progress>
        </el-form-item>
      </el-form>
      <div style="display:flex;gap:12px;margin-bottom:16px;">
        <div v-for="item in collectionStats" :key="item.label" style="flex:1;background:#f5f7fa;border-radius:6px;padding:10px;text-align:center;">
          <div style="font-size:12px;color:#909399;">{{ item.label }}</div>
          <div style="font-size:16px;font-weight:bold;color:#303133;">{{ item.value }}</div>
        </div>
      </div>
      <div style="font-size:13px;color:#606266;margin-bottom:8px;font-weight:500;">采集日志</div>
      <el-table :data="collectionLog" border size="mini" style="width:100%;margin-bottom:16px;">
        <el-table-column prop="time" label="时间" width="160"></el-table-column>
        <el-table-column prop="level" label="级别" width="70" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.level === 'ERROR' ? 'danger' : scope.row.level === 'WARN' ? 'warning' : 'info'" size="mini">{{ scope.row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="msg" label="消息"></el-table-column>
      </el-table>
      <div style="font-size:13px;color:#606266;margin-bottom:8px;font-weight:500;">采集数据预览</div>
      <el-table :data="collectionData" border size="mini" style="width:100%;max-height:240px;overflow:auto;">
        <el-table-column v-for="col in collectionColumns" :key="col.prop" :prop="col.prop" :label="col.label" :min-width="col.width || 120" show-overflow-tooltip></el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="collectionVisible = false">关闭</el-button>
      </span>
    </el-dialog>

    <!-- 监控告警弹窗 (monitor_alert类型) -->
    <el-dialog :title="monitorAlertTitle" :visible.sync="monitorAlertVisible" width="720px" append-to-body>
      <div style="display:flex;gap:12px;margin-bottom:16px;">
        <div v-for="item in monitorAlertSummary" :key="item.label" style="flex:1;background:#f5f7fa;border-radius:6px;padding:10px;text-align:center;">
          <div style="font-size:12px;color:#909399;">{{ item.label }}</div>
          <div style="font-size:20px;font-weight:bold;" :style="{ color: item.color }">{{ item.value }}</div>
        </div>
      </div>
      <div style="font-size:13px;color:#606266;margin-bottom:8px;font-weight:500;">告警列表</div>
      <el-table :data="monitorAlertList" border size="mini" style="width:100%;margin-bottom:12px;">
        <el-table-column prop="alertId" label="告警编号" width="130"></el-table-column>
        <el-table-column prop="level" label="级别" width="80" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.level === '紧急' ? 'danger' : scope.row.level === '重要' ? 'warning' : 'info'" size="mini">{{ scope.row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="告警名称" min-width="140" show-overflow-tooltip></el-table-column>
        <el-table-column prop="source" label="告警来源" width="120"></el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === '已处理' ? 'success' : scope.row.status === '处理中' ? '' : 'danger'" size="mini">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="time" label="触发时间" width="160"></el-table-column>
      </el-table>
      <div style="font-size:13px;color:#606266;margin-bottom:8px;font-weight:500;">处理建议</div>
      <el-table :data="monitorAlertSuggestions" border size="mini" style="width:100%">
        <el-table-column prop="target" label="告警对象" min-width="120"></el-table-column>
        <el-table-column prop="suggestion" label="建议操作" min-width="160"></el-table-column>
        <el-table-column prop="priority" label="优先级" width="80" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.priority === '高' ? 'danger' : scope.row.priority === '中' ? 'warning' : 'info'" size="mini">{{ scope.row.priority }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="monitorAlertVisible = false">关闭</el-button>
      </span>
    </el-dialog>

    <!-- 附件上传弹窗 (upload类型) -->
    <el-dialog :title="uploadTitle" :visible.sync="uploadVisible" width="680px" append-to-body>
      <el-upload
        ref="uploadComp"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleUploadFileChange"
        :file-list="uploadFileList"
        :on-remove="handleUploadFileRemove"
        multiple
      >
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <div slot="tip" class="el-upload__tip">支持任意格式文件，单个文件不超过50MB</div>
      </el-upload>
      <div style="text-align:right;margin:12px 0;">
        <el-button type="primary" size="small" :disabled="!uploadFileList.length" @click="submitUpload">确认上传</el-button>
      </div>
      <el-divider content-position="left">上传历史记录</el-divider>
      <el-table :data="uploadHistory" border size="mini" style="width:100%">
        <el-table-column prop="fileName" label="文件名" min-width="160" show-overflow-tooltip></el-table-column>
        <el-table-column prop="fileSize" label="大小" width="90" align="center"></el-table-column>
        <el-table-column prop="fileType" label="类型" width="80" align="center">
          <template slot-scope="scope">
            <el-tag size="mini">{{ scope.row.fileType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="uploadTime" label="上传时间" width="160"></el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.status === '成功' ? 'success' : scope.row.status === '失败' ? 'danger' : 'info'" size="mini">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="mini" icon="el-icon-view" @click="previewUploadFile(scope.row)">查看</el-button>
            <el-button type="text" size="mini" icon="el-icon-download" @click="downloadUploadFile(scope.row)">下载</el-button>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="uploadVisible = false">关 闭</el-button>
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

    <!-- 发起流程弹窗 -->
    <el-dialog :title="initFlowTitle" :visible.sync="initFlowVisible" width="650px" append-to-body>
      <el-form :model="initFlowForm" label-width="110px" size="small">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="流程编号">{{ initFlowForm.flowNo }}</el-form-item></el-col>
          <el-col :span="12"><el-form-item label="流程类型">{{ initFlowForm.flowType }}</el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="发起人">{{ initFlowForm.applicant }}</el-form-item></el-col>
          <el-col :span="12"><el-form-item label="优先级"><el-tag :type="initFlowForm.priority === '紧急' ? 'danger' : initFlowForm.priority === '高' ? 'warning' : ''" size="small">{{ initFlowForm.priority }}</el-tag></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="分发范围">{{ initFlowForm.scope }}</el-form-item></el-col>
          <el-col :span="12"><el-form-item label="目标节点数">{{ initFlowForm.nodeCount }}个</el-form-item></el-col>
        </el-row>
        <el-form-item label="分发进度">
          <el-progress :percentage="initFlowProgress" :status="initFlowProgress === 100 ? 'success' : undefined" style="width:80%"></el-progress>
        </el-form-item>
      </el-form>
      <div style="margin-top:8px;">
        <div style="font-size:13px;font-weight:bold;margin-bottom:6px;">目标节点状态</div>
        <el-table :data="initFlowNodes" size="mini" border style="width:100%">
          <el-table-column prop="node" label="节点名称" width="140"></el-table-column>
          <el-table-column prop="ip" label="IP地址" width="130"></el-table-column>
          <el-table-column prop="status" label="状态" width="90">
            <template slot-scope="{row}">
              <el-tag :type="row.status === '已完成' ? 'success' : row.status === '分发中' ? '' : row.status === '失败' ? 'danger' : 'info'" size="mini">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="time" label="耗时" width="80"></el-table-column>
          <el-table-column prop="msg" label="备注"></el-table-column>
        </el-table>
      </div>
      <span slot="footer">
        <el-button @click="initFlowVisible = false">关闭</el-button>
        <el-button v-if="initFlowProgress < 100" type="warning" @click="initFlowProgress = 100; initFlowNodes.forEach(n => { n.status = '已完成'; n.time = pick(['128ms','256ms','512ms'], 0, 99); n.msg = '分发成功'; }); $message.success('已强制完成所有分发')">强制完成</el-button>
        <el-button type="primary" @click="initFlowVisible = false; $message.success('流程分发已确认完成')">确认完成</el-button>
      </span>
    </el-dialog>

    <!-- 指派信息弹窗 -->
    <el-dialog :title="assignTitle" :visible.sync="assignVisible" width="600px" append-to-body>
      <el-form :model="assignForm" label-width="100px" size="small">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="指派编号">{{ assignForm.assignNo }}</el-form-item></el-col>
          <el-col :span="12"><el-form-item label="指派类型"><el-tag size="small">{{ assignForm.type }}</el-tag></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="指派对象">{{ assignForm.target }}</el-form-item></el-col>
          <el-col :span="12"><el-form-item label="所属部门">{{ assignForm.dept }}</el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="优先级"><el-tag :type="assignForm.priority === '紧急' ? 'danger' : assignForm.priority === '高' ? 'warning' : ''" size="small">{{ assignForm.priority }}</el-tag></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="截止时间">{{ assignForm.deadline }}</el-form-item></el-col>
        </el-row>
        <el-form-item label="任务描述">{{ assignForm.description }}</el-form-item>
        <el-form-item label="通知方式">
          <el-checkbox-group v-model="assignForm.notifyMethods">
            <el-checkbox label="系统消息"></el-checkbox>
            <el-checkbox label="短信通知"></el-checkbox>
            <el-checkbox label="邮件通知"></el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <el-table :data="assignHistory" size="mini" border style="width:100%;margin-top:8px;" max-height="160">
        <el-table-column prop="time" label="时间" width="150"></el-table-column>
        <el-table-column prop="operator" label="操作人" width="120"></el-table-column>
        <el-table-column prop="action" label="操作" width="100"></el-table-column>
        <el-table-column prop="remark" label="备注"></el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" @click="assignVisible = false; $message.success('指派成功，已通知' + assignForm.target)">确认指派</el-button>
      </span>
    </el-dialog>

    <!-- 节点查询弹窗 -->
    <el-dialog :title="nodeQueryTitle" :visible.sync="nodeQueryVisible" width="700px" append-to-body>
      <el-form :inline="true" size="small" style="margin-bottom:12px;">
        <el-form-item label="节点名称">
          <el-input v-model="nodeQueryFilter" placeholder="输入节点名称筛选" clearable style="width:180px;"></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="nodeQueryStatusFilter" placeholder="全部" clearable style="width:120px;">
            <el-option label="在线" value="在线"></el-option>
            <el-option label="离线" value="离线"></el-option>
            <el-option label="异常" value="异常"></el-option>
            <el-option label="维护中" value="维护中"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="$message.success('查询完成，共' + nodeQueryNodes.length + '个节点')">查询</el-button>
        </el-form-item>
      </el-form>
      <el-table :data="nodeQueryNodes.filter(n => (!nodeQueryFilter || n.name.includes(nodeQueryFilter)) && (!nodeQueryStatusFilter || n.status === nodeQueryStatusFilter))" size="small" border style="width:100%" max-height="340">
        <el-table-column type="index" label="序号" width="50"></el-table-column>
        <el-table-column prop="name" label="节点名称" width="130"></el-table-column>
        <el-table-column prop="ip" label="IP地址" width="130"></el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template slot-scope="{row}">
            <el-tag :type="row.status === '在线' ? 'success' : row.status === '离线' ? 'info' : row.status === '异常' ? 'danger' : 'warning'" size="mini">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="cpu" label="CPU" width="70"></el-table-column>
        <el-table-column prop="mem" label="内存" width="70"></el-table-column>
        <el-table-column prop="disk" label="磁盘" width="70"></el-table-column>
        <el-table-column prop="tasks" label="任务数" width="70"></el-table-column>
        <el-table-column prop="lastHeartbeat" label="最后心跳" width="150"></el-table-column>
        <el-table-column prop="region" label="所属区域"></el-table-column>
      </el-table>
      <div style="margin-top:12px;display:flex;gap:16px;">
        <el-tag type="success" size="small">在线: {{ nodeQueryNodes.filter(n => n.status === '在线').length }}</el-tag>
        <el-tag type="info" size="small">离线: {{ nodeQueryNodes.filter(n => n.status === '离线').length }}</el-tag>
        <el-tag type="danger" size="small">异常: {{ nodeQueryNodes.filter(n => n.status === '异常').length }}</el-tag>
        <el-tag type="warning" size="small">维护中: {{ nodeQueryNodes.filter(n => n.status === '维护中').length }}</el-tag>
      </div>
      <span slot="footer">
        <el-button @click="nodeQueryVisible = false">关闭</el-button>
        <el-button type="primary" @click="nodeQueryVisible = false; $message.success('节点状态已刷新')">刷新状态</el-button>
      </span>
    </el-dialog>

    <!-- 流程通知弹窗 -->
    <el-dialog :title="flowNotifyTitle" :visible.sync="flowNotifyVisible" width="650px" append-to-body>
      <el-tabs v-model="flowNotifyTab" type="border-card">
        <el-tab-pane label="通知列表" name="list">
          <el-table :data="flowNotifyList" size="small" border style="width:100%" max-height="280" @row-click="flowNotifyDetail = $event; flowNotifyTab = 'detail'">
            <el-table-column type="index" label="序号" width="50"></el-table-column>
            <el-table-column prop="time" label="时间" width="150"></el-table-column>
            <el-table-column prop="type" label="类型" width="90">
              <template slot-scope="{row}">
                <el-tag :type="row.type === '审批通知' ? 'primary' : row.type === '异常通知' ? 'danger' : row.type === '完成通知' ? 'success' : 'warning'" size="mini">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="标题" width="180"></el-table-column>
            <el-table-column prop="sender" label="发送人" width="100"></el-table-column>
            <el-table-column prop="status" label="状态" width="80">
              <template slot-scope="{row}">
                <el-tag :type="row.status === '已读' ? 'info' : 'danger'" size="mini">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="通知详情" name="detail">
          <div v-if="flowNotifyDetail" style="padding:8px;">
            <el-form label-width="90px" size="small">
              <el-form-item label="通知标题"><span style="font-weight:bold;">{{ flowNotifyDetail.title }}</span></el-form-item>
              <el-form-item label="通知类型"><el-tag size="small">{{ flowNotifyDetail.type }}</el-tag></el-form-item>
              <el-form-item label="发送人">{{ flowNotifyDetail.sender }}</el-form-item>
              <el-form-item label="发送时间">{{ flowNotifyDetail.time }}</el-form-item>
              <el-form-item label="通知内容">{{ flowNotifyDetail.content }}</el-form-item>
              <el-form-item label="关联流程">{{ flowNotifyDetail.flowName }}</el-form-item>
              <el-form-item label="处理状态"><el-tag :type="flowNotifyDetail.status === '已读' ? 'info' : 'warning'" size="small">{{ flowNotifyDetail.status }}</el-tag></el-form-item>
            </el-form>
          </div>
          <div v-else style="text-align:center;color:#909399;padding:40px 0;">请在通知列表中点击查看详情</div>
        </el-tab-pane>
        <el-tab-pane label="发送通知" name="send">
          <el-form :model="flowNotifySendForm" label-width="90px" size="small" style="padding:8px;">
            <el-form-item label="通知标题"><el-input v-model="flowNotifySendForm.title" placeholder="请输入通知标题"></el-input></el-form-item>
            <el-form-item label="通知类型">
              <el-select v-model="flowNotifySendForm.type" style="width:100%;">
                <el-option label="审批通知" value="审批通知"></el-option>
                <el-option label="异常通知" value="异常通知"></el-option>
                <el-option label="完成通知" value="完成通知"></el-option>
                <el-option label="提醒通知" value="提醒通知"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="接收人"><el-input v-model="flowNotifySendForm.receiver" placeholder="请输入接收人"></el-input></el-form-item>
            <el-form-item label="通知内容"><el-input v-model="flowNotifySendForm.content" type="textarea" :rows="3" placeholder="请输入通知内容"></el-input></el-form-item>
            <el-form-item label="通知方式">
              <el-checkbox-group v-model="flowNotifySendForm.methods">
                <el-checkbox label="系统消息"></el-checkbox>
                <el-checkbox label="短信"></el-checkbox>
                <el-checkbox label="邮件"></el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <span slot="footer">
        <el-button @click="flowNotifyVisible = false">关闭</el-button>
        <el-button v-if="flowNotifyTab === 'send'" type="primary" @click="flowNotifyVisible = false; $message.success('通知已发送给' + flowNotifySendForm.receiver)">发送通知</el-button>
        <el-button v-if="flowNotifyTab === 'list'" type="primary" @click="flowNotifyList.forEach(n => n.status = '已读'); $message.success('全部标记为已读')">全部已读</el-button>
      </span>
    </el-dialog>

    <!-- 流程图查看弹窗 -->
    <el-dialog :title="flowchartTitle" :visible.sync="flowchartVisible" width="750px" append-to-body>
      <div style="text-align:center;margin-bottom:12px;">
        <el-tag type="info" size="small">流程编号: {{ flowchartFlowNo }}</el-tag>
        <el-tag :type="flowchartStatus === '已完成' ? 'success' : flowchartStatus === '执行中' ? '' : 'warning'" size="small" style="margin-left:8px;">状态: {{ flowchartStatus }}</el-tag>
      </div>
      <div style="position:relative;padding:20px 10px;overflow-x:auto;">
        <div style="display:flex;align-items:flex-start;justify-content:center;gap:0;min-width:600px;">
          <div v-for="(node, idx) in flowchartNodes" :key="idx" style="display:flex;flex-direction:column;align-items:center;position:relative;">
            <div style="display:flex;flex-direction:column;align-items:center;min-width:90px;">
              <div :style="{width:'56px',height:'56px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',color:'#fff',background: node.status === '已完成' ? '#67C23A' : node.status === '执行中' ? '#409EFF' : node.status === '等待中' ? '#E6A23C' : node.status === '异常' ? '#F56C6C' : '#909399',boxShadow: node.status === '执行中' ? '0 0 12px rgba(64,158,255,0.5)' : 'none'}">
                <i :class="node.icon"></i>
              </div>
              <div style="margin-top:8px;font-size:12px;font-weight:bold;text-align:center;max-width:90px;">{{ node.name }}</div>
              <el-tag :type="node.status === '已完成' ? 'success' : node.status === '执行中' ? '' : node.status === '等待中' ? 'warning' : node.status === '异常' ? 'danger' : 'info'" size="mini" style="margin-top:4px;">{{ node.status }}</el-tag>
              <div style="font-size:11px;color:#909399;margin-top:2px;">{{ node.time }}</div>
            </div>
            <div v-if="idx < flowchartNodes.length - 1" style="display:flex;align-items:center;margin-top:28px;">
              <div :style="{width:'40px',height:'3px',background: node.status === '已完成' ? '#67C23A' : '#DCDFE6'}"></div>
              <i class="el-icon-right" :style="{color: node.status === '已完成' ? '#67C23A' : '#DCDFE6',fontSize:'14px'}"></i>
            </div>
          </div>
        </div>
      </div>
      <el-divider content-position="left">流程详情</el-divider>
      <el-table :data="flowchartNodes" size="mini" border style="width:100%">
        <el-table-column type="index" label="序号" width="50"></el-table-column>
        <el-table-column prop="name" label="节点名称" width="120"></el-table-column>
        <el-table-column prop="handler" label="处理人" width="110"></el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template slot-scope="{row}">
            <el-tag :type="row.status === '已完成' ? 'success' : row.status === '执行中' ? '' : row.status === '等待中' ? 'warning' : row.status === '异常' ? 'danger' : 'info'" size="mini">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="150"></el-table-column>
        <el-table-column prop="endTime" label="结束时间" width="150"></el-table-column>
        <el-table-column prop="remark" label="备注"></el-table-column>
      </el-table>
      <span slot="footer">
        <el-button @click="flowchartVisible = false">关闭</el-button>
        <el-button type="primary" @click="flowchartVisible = false; $message.success('流程图已刷新')">刷新</el-button>
      </span>
    </el-dialog>

    <!-- 驳回/拒绝弹窗 -->
    <el-dialog :title="rejectTitle" :visible.sync="rejectVisible" width="550px" append-to-body>
      <el-alert title="请填写驳回/拒绝原因，确认后将退回至上一节点" type="warning" :closable="false" show-icon style="margin-bottom:16px;"></el-alert>
      <el-form :model="rejectForm" label-width="100px" size="small">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="操作类型">
              <el-select v-model="rejectForm.type" style="width:100%;">
                <el-option label="驳回" value="驳回"></el-option>
                <el-option label="拒绝" value="拒绝"></el-option>
                <el-option label="退回" value="退回"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="驳回级别">
              <el-select v-model="rejectForm.level" style="width:100%;">
                <el-option label="一级驳回" value="一级驳回"></el-option>
                <el-option label="二级驳回" value="二级驳回"></el-option>
                <el-option label="三级驳回" value="三级驳回"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="驳回原因">
          <el-select v-model="rejectForm.reason" style="width:100%;">
            <el-option label="信息不完整" value="信息不完整"></el-option>
            <el-option label="数据有误" value="数据有误"></el-option>
            <el-option label="不符合规范" value="不符合规范"></el-option>
            <el-option label="流程不符合要求" value="流程不符合要求"></el-option>
            <el-option label="其他原因" value="其他原因"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="详细说明">
          <el-input v-model="rejectForm.comment" type="textarea" :rows="3" placeholder="请输入驳回/拒绝的详细说明"></el-input>
        </el-form-item>
        <el-form-item label="处理人">{{ rejectForm.handler }}</el-form-item>
        <el-form-item label="处理时间">{{ rejectForm.time }}</el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" @click="rejectVisible = false; $message.error(rejectForm.type + '成功，已退回至提交人')">确认{{ rejectForm.type }}</el-button>
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
          <el-progress :percentage="approvalProgress" :status="approvalProgress===100?'success':undefined" style="width:80%"></el-progress>
        </el-form-item>
        <el-form-item label="最终状态">
          <el-tag :type="approvalFinalStatus==='已通过'?'success':approvalFinalStatus==='已驳回'?'danger':'warning'" size="medium">{{ approvalFinalStatus }}</el-tag>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="approvalVisible = false">关 闭</el-button>
        <el-button type="danger" icon="el-icon-close" @click="handleApprovalReject">驳 回</el-button>
        <el-button type="success" icon="el-icon-check" @click="handleApprovalPass">通 过</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { exportXLSX, filterData } from "@/utils/index";

const initialRows = [
  {
    "ID": 1,
    "上报状态": "已上报",
    "失败原因": "网络超时",
    "重试次数": 0,
    "记录条数": 1200,
    "目标系统": "资产管理",
    "命中次数": 120
  },
  {
    "ID": 2,
    "上报状态": "上报中",
    "失败原因": "格式错误",
    "重试次数": 1,
    "记录条数": 3500,
    "目标系统": "漏洞管理",
    "命中次数": 456
  },
  {
    "ID": 3,
    "上报状态": "上报失败",
    "失败原因": "鉴权失败",
    "重试次数": 2,
    "记录条数": 8000,
    "目标系统": "合规平台",
    "命中次数": 1023
  },
  {
    "ID": 4,
    "上报状态": "待上报",
    "失败原因": "数据校验失败",
    "重试次数": 3,
    "记录条数": 15000,
    "目标系统": "态势感知",
    "命中次数": 5678
  },
  {
    "ID": 5,
    "上报状态": "部分成功",
    "失败原因": "对端拒绝",
    "重试次数": 5,
    "记录条数": 500,
    "目标系统": "安全运营",
    "命中次数": 89
  },
  {
    "ID": 6,
    "上报状态": "已撤回",
    "失败原因": "通道不可用",
    "重试次数": 8,
    "记录条数": 20000,
    "目标系统": "资产管理",
    "命中次数": 3000
  },
  {
    "ID": 7,
    "上报状态": "已上报",
    "失败原因": "网络超时",
    "重试次数": 0,
    "记录条数": 1200,
    "目标系统": "资产管理",
    "命中次数": 120
  },
  {
    "ID": 8,
    "上报状态": "上报中",
    "失败原因": "格式错误",
    "重试次数": 1,
    "记录条数": 3500,
    "目标系统": "漏洞管理",
    "命中次数": 456
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
    "prop": "上报状态",
    "label": "上报状态",
    "type": "text",
    "search": true,
    "showTooltip": true
  },
  {
    "prop": "失败原因",
    "label": "失败原因",
    "type": "text",
    "search": false,
    "showTooltip": true
  },
  {
    "prop": "重试次数",
    "label": "重试次数",
    "type": "text",
    "search": false,
    "showTooltip": true
  },
  {
    "prop": "记录条数",
    "label": "记录条数",
    "type": "text",
    "search": false,
    "showTooltip": true
  },
  {
    "prop": "目标系统",
    "label": "目标系统",
    "type": "text",
    "search": false,
    "showTooltip": true
  },
  {
    "prop": "命中次数",
    "label": "命中次数",
    "type": "text",
    "search": false,
    "showTooltip": true
  },
  {
    "slot": "operate",
    "label": "操作"
  }
];
const defaultRow = {
  "ID": "",
  "上报状态": "",
  "失败原因": "",
  "重试次数": "",
  "记录条数": "",
  "目标系统": "",
  "命中次数": ""
};
const importTemplateRow = {
  "上报状态": "已完成",
  "失败原因": "失败原因导入值",
  "重试次数": 70,
  "记录条数": "记录条数导入值",
  "目标系统": "目标系统导入值",
  "命中次数": 66,
  "导入来源": "部侧结果上报流程管理导入模板.xlsx"
};

function pageHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 100000;
  return h;
}
const pick = (items, index, seed) => items[(seed + index) % items.length];

export default {
  name: "JLPage5040",
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
      dataAnalysisVisible: false,
      dataAnalysisTitle: "数据分析",
      dataAnalysisMetrics: [],
      dataAnalysisTrend: [],
      dataAnalysisConclusions: [],
      resultDisplayVisible: false,
      resultDisplayTitle: "结果展示",
      resultDisplayStats: { total: 0, success: 0, fail: 0 },
      resultDisplayData: [],
      dataExtractVisible: false,
      dataExtractTitle: "数据提取",
      dataExtractForm: { source: "数据库", rule: "全量提取", target: "", status: "提取中" },
      dataExtractFields: [],
      dataExtractProgress: 0,
      dataExtractStats: { totalRecords: 0, duration: "" },
      dataReviewVisible: false,
      dataReviewTitle: "数据审查",
      dataReviewStats: { pass: 0, warning: 0, fail: 0, pending: 0 },
      dataReviewItems: [],
      dataReviewNotes: [],
      runEvalVisible: false,
      runEvalTitle: "运行效果评估",
      runEvalScore: 0,
      runEvalItems: [],
      runEvalSuggestions: [],
      vizVisible: false,
      vizTitle: "可视化展示",
      vizCards: [],
      vizTrendData: [],
      vizDistribution: [],
      gradingVisible: false,
      gradingTitle: "分级",
      gradingLevel: "",
      gradingItems: [],
      gradingBasis: [],
      recognitionVisible: false,
      recognitionTitle: "数据识别",
      recognitionStats: { total: 0, matched: 0, unmatched: 0 },
      recognitionItems: [],
      recognitionRules: [],
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
      inputReqVisible: false,
      inputReqTitle: "输入请求任务",
      inputReqStats: [],
      inputReqProgress: 0,
      inputReqLog: [],
      inputReqSubmitted: false,
      inputReqForm: { type: "数据查询", target: "", timeout: "30s", priority: "中", content: "" },
      monitorVisible: false,
      monitorTitle: "结果监控",
      monitorCards: [],
      monitorFields: [],
      monitorTimeline: [],
      statsVisible: false,
      statsTitle: "统计报表",
      statsCards: [],
      statsTable: [],
      statsSummary: "",
      transformVisible: false,
      transformTitle: "数据转换",
      transformRecordCount: 0,
      transformCost: "",
      transformSize: "",
      transformJson: "",
      preprocessVisible: false,
      preprocessTitle: "数据预处理",
      preprocessSource: "",
      preprocessTotal: 0,
      preprocessProgress: 0,
      preprocessActiveStep: 0,
      preprocessSteps: [],
      preprocessLog: [],
      collectionVisible: false,
      collectionTitle: "数据采集",
      collectionSource: "",
      collectionTarget: "",
      collectionStatus: "",
      collectionProgress: 0,
      collectionStats: [],
      collectionLog: [],
      collectionData: [],
      collectionColumns: [],
      monitorAlertVisible: false,
      monitorAlertTitle: "监控告警",
      monitorAlertSummary: [],
      monitorAlertList: [],
      monitorAlertSuggestions: [],
      uploadVisible: false,
      uploadTitle: "附件上传",
      uploadFileList: [],
      uploadHistory: [],
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
      initFlowVisible: false,
      initFlowTitle: "发起流程",
      initFlowForm: { flowNo: "", flowType: "", applicant: "", priority: "", scope: "", nodeCount: 0 },
      initFlowNodes: [],
      initFlowProgress: 0,
      assignVisible: false,
      assignTitle: "指派信息",
      assignForm: { assignNo: "", type: "", target: "", dept: "", priority: "", deadline: "", description: "", notifyMethods: ["系统消息"] },
      assignHistory: [],
      nodeQueryVisible: false,
      nodeQueryTitle: "节点查询",
      nodeQueryNodes: [],
      nodeQueryFilter: "",
      nodeQueryStatusFilter: "",
      flowNotifyVisible: false,
      flowNotifyTitle: "流程通知",
      flowNotifyTab: "list",
      flowNotifyList: [],
      flowNotifyDetail: null,
      flowNotifySendForm: { title: "", type: "审批通知", receiver: "", content: "", methods: ["系统消息"] },
      flowchartVisible: false,
      flowchartTitle: "流程图查看",
      flowchartFlowNo: "",
      flowchartStatus: "",
      flowchartNodes: [],
      rejectVisible: false,
      rejectTitle: "驳回/拒绝",
      rejectForm: { type: "驳回", level: "一级驳回", reason: "", comment: "", handler: "", time: "" },
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
        case "data_analysis":
          this.openDataAnalysisDialog(functionName, S, now);
          break;
        case "result_display":
          this.openResultDisplayDialog(functionName, S, now);
          break;
        case "data_extract":
          this.openDataExtractDialog(functionName, S, now);
          break;
        case "data_review":
          this.openDataReviewDialog(functionName, S, now);
          break;
        case "run_evaluation":
          this.openRunEvaluationDialog(functionName, S, now);
          break;
        case "visualization":
          this.openVisualizationDialog(functionName, S, now);
          break;
        case "grading":
          this.openGradingDialog(functionName, S, now);
          break;
        case "data_recognition":
          this.openDataRecognitionDialog(functionName, S, now);
          break;
        case "alert":
          this.openAlertDialog(functionName, S, now);
          break;
        case "monitor_alert":
          this.openMonitorAlertDialog(functionName, S, now);
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
        case "input_request":
          this.openInputRequestDialog(functionName, S, now);
          break;
        case "feedback":
          this.openFeedbackDialog(functionName, S, now);
          break;
        case "upload":
          this.openUploadDialog(functionName, S, now);
          break;
        case "export":
          this.openExportDialog(functionName, S, now);
          break;
        case "api":
          this.openApiDialog(functionName, S, now);
          break;
        case "collection":
          this.openCollectionDialog(functionName, S, now);
          break;
        case "preprocess":
          this.openPreprocessDialog(functionName, S, now);
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
        case "initiate_flow":
          this.openInitiateFlowDialog(functionName, S, now);
          break;
        case "assign":
          this.openAssignDialog(functionName, S, now);
          break;
        case "node_query":
          this.openNodeQueryDialog(functionName, S, now);
          break;
        case "flow_notify":
          this.openFlowNotifyDialog(functionName, S, now);
          break;
        case "flowchart":
          this.openFlowchartDialog(functionName, S, now);
          break;
        case "reject":
          this.openRejectDialog(functionName, S, now);
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
      // 仅当明确找到名称/类型字段时才填入按钮名称，避免误填到端口、编号等字段
      if (primary && /名称|类型/.test(primary.prop)) row[primary.prop] = functionName;
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
        { label: "操作人", value: pick(["王建国", "李明辉", "张晓峰", "刘志远", "陈思涵", "赵鹏飞"], 4, S) },
        { label: "备注", value: functionName + "的查看详情" },
      ];
      this.detailVisible = true;
    },
    // ─── 监控类弹窗 ───
    openMonitorDialog(functionName, S, now) {
      this.monitorTitle = functionName;
      var prefix = functionName.replace(/(结果监控|状态监控|运行监控|采集监控|监控告警|监控)/g, "").trim() || functionName;
      var onlineStatus = pick(["在线", "离线", "部分异常"], 0, S);
      this.monitorCards = [
        { label: "运行状态", value: onlineStatus, color: onlineStatus === "在线" ? "#67C23A" : onlineStatus === "离线" ? "#F56C6C" : "#E6A23C" },
        { label: "响应延迟", value: pick(["12ms", "28ms", "56ms", "120ms"], 1, S), color: "#409EFF" },
        { label: "成功率", value: pick(["99.8%", "99.2%", "97.5%", "95.1%"], 2, S), color: "#67C23A" },
        { label: "今日告警", value: pick([0, 1, 3, 8], 3, S) + "次", color: pick([0, 1, 3, 8], 3, S) > 2 ? "#F56C6C" : "#909399" },
      ];
      this.monitorFields = [
        { label: "监控目标", value: prefix },
        { label: "在线状态", value: onlineStatus },
        { label: "运行时长", value: pick(["2h 15m", "5h 32m", "12h 8m", "24h 45m"], 4, S) },
        { label: "当前负载", value: pick(["23%", "45%", "67%", "89%"], 5, S) },
        { label: "错误率", value: pick(["0.1%", "0.5%", "1.2%", "3.8%"], 6, S) },
        { label: "最后采集", value: now },
      ];
      this.monitorTimeline = [
        { time: now, level: "INFO", event: functionName + " 监控已启动", result: "正常" },
        { time: now, level: "INFO", event: "数据采集完成，延迟 " + pick(["12ms", "28ms", "56ms"], 7, S), result: "正常" },
        { time: now, level: pick(["INFO", "WARN", "ERROR"], 8, S), event: pick(["指标采集正常", "发现异常波动", "连接超时重试", "负载超过阈值"], 9, S), result: pick(["正常", "异常", "警告"], 10, S) },
        { time: now, level: "INFO", event: pick(["心跳检测正常", "数据同步完成", "指标恢复正常"], 11, S), result: "正常" },
      ];
      this.monitorVisible = true;
    },
    // ─── 统计类弹窗 ───
    openStatisticsDialog(functionName, S, now) {
      this.statsTitle = functionName;
      var total = pick([1280, 2560, 5120, 10240], 0, S);
      this.statsCards = [
        { label: "统计总量", value: total.toLocaleString() },
        { label: "有效数据", value: pick([1200, 2450, 4980, 10100], 1, S).toLocaleString() },
        { label: "覆盖率", value: pick(["93.7%", "95.7%", "97.3%", "98.6%"], 2, S) },
        { label: "日均增长", value: pick(["12%", "18%", "25%", "32%"], 3, S) },
      ];
      var names = ["正常数据", "异常数据", "待处理数据", "已过期数据", "新增数据"];
      this.statsTable = names.map((name, i) => {
        var cnt = pick([980, 45, 128, 32, 95], i, S);
        return {
          name: name,
          count: cnt,
          ratio: (cnt / total * 100).toFixed(1) + "%",
          trend: pick(["↑", "↓", "→"], i + 4, S),
          status: pick(["达标", "达标", "未达标", "达标", "达标"], i + 5, S),
        };
      });
      this.statsSummary = "统计周期：" + pick(["近7天", "近30天", "近90天", "本年度"], 6, S) + "，数据更新时间：" + now;
      this.statsVisible = true;
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
    // ─── 数据分析弹窗 ───
    openDataAnalysisDialog(functionName, S, now) {
      this.dataAnalysisTitle = functionName;
      var nameHash = functionName.split("").reduce(function(a, c) { return a + c.charCodeAt(0); }, 0);
      var base = nameHash % 1000;
      this.dataAnalysisMetrics = [
        { label: "分析总量", value: 1024 + (base * 7) % 7168, trend: "↑", change: ((base % 20) + 3) + "%" },
        { label: "异常数量", value: 10 + (base * 3) % 250, trend: "↓", change: ((base % 10) + 1) + "%" },
        { label: "准确率", value: (95 + (base % 5)) + "." + ((base * 3) % 10) + "%", trend: "↑", change: "0." + ((base % 8) + 1) + "%" },
        { label: "处理效率", value: (80 + (base % 16)) + "%", trend: "↑", change: ((base % 12) + 1) + "%" },
      ];
      var periods = ["第1周", "第2周", "第3周", "第4周", "第5周", "第6周"];
      this.dataAnalysisTrend = periods.map((p, i) => ({
        period: p,
        count: 100 + ((base + i * 37) % 500),
        rate: (88 + ((base + i * 5) % 12)) + "%",
        status: ((base + i * 7) % 10) > 2 ? "达标" : "未达标",
        remark: pick(["数据量稳定", "效率提升明显", "需关注异常", "表现优秀", "小幅波动", "持续优化"], i, nameHash),
      }));
      var conclusions = [
        { type: "优势", content: "分析准确率" + (95 + (base % 5)) + "%，数据处理能力稳步提升。" },
        { type: "风险", content: "第3周异常检出率偏高，建议检查数据源质量。" },
        { type: "建议", content: "建议增加自动化分析比例，减少人工复核环节。" },
        { type: "优势", content: "趋势数据显示处理效率持续向好，符合预期目标。" },
      ];
      this.dataAnalysisConclusions = conclusions.slice(0, 2 + (base % 2));
      this.dataAnalysisVisible = true;
    },
    exportDataAnalysisReport() {
      var reportData = this.dataAnalysisTrend.map(function(item) {
        return { "时间段": item.period, "数量": item.count, "比率": item.rate, "状态": item.status, "备注": item.remark };
      });
      exportXLSX(reportData, this.dataAnalysisTitle + "-分析报告");
      this.dataAnalysisVisible = false;
    },
    // ─── 结果展示弹窗 ───
    openResultDisplayDialog(functionName, S, now) {
      this.resultDisplayTitle = functionName;
      var names = ["扫描结果", "检测结果", "分析结果", "校验结果", "上报结果", "同步结果"];
      var sources = ["自动扫描", "手动检测", "系统分析", "规则校验", "定时上报", "实时同步"];
      var details = [
        "扫描任务已完成，共扫描IP段10.10." + (S % 256) + ".0/24，发现活跃主机128台。",
        "安全检测完成，发现高危漏洞3个，中危漏洞8个，低危漏洞15个。",
        "数据分析完成，样本总量2048条，异常数据28条，准确率98.5%。",
        "规则校验通过，共校验1024条记录，99.2%通过校验。",
        "数据上报成功，已上报至部侧平台，上报编号RPT-" + String(S).slice(-6) + "。",
        "数据同步完成，本地数据库已更新，同步延迟128ms。",
      ];
      var count = (S % 3) + 5;
      this.resultDisplayData = Array.from({ length: count }).map((_, i) => ({
        name: names[i % names.length],
        value: pick(["通过", "成功", "完成", "正常", "128条", "98.5%"], i, S),
        status: pick(["成功", "成功", "成功", "失败", "部分成功"], i, S),
        time: now.slice(0, 11) + pick(["08:15:00", "09:30:00", "10:45:00", "12:00:00", "13:30:00"], i, S),
        remark: pick(["正常完成", "有异常记录", "需人工复核", "已自动处理", "已标记"], i, S),
        duration: pick(["128ms", "256ms", "512ms", "1.2s", "2.5s"], i, S),
        source: sources[i % sources.length],
        detail: details[i % details.length],
      }));
      var successCount = this.resultDisplayData.filter(function(d) { return d.status === "成功"; }).length;
      this.resultDisplayStats = {
        total: this.resultDisplayData.length,
        success: successCount,
        fail: this.resultDisplayData.length - successCount,
      };
      this.resultDisplayVisible = true;
    },
    exportResultDisplay() {
      var data = this.resultDisplayData.map(function(item) {
        return { "名称": item.name, "结果值": item.value, "状态": item.status, "时间": item.time, "耗时": item.duration, "来源": item.source, "备注": item.remark };
      });
      exportXLSX(data, this.resultDisplayTitle + "-结果");
      this.resultDisplayVisible = false;
    },
    // ─── 数据提取弹窗 ───
    openDataExtractDialog(functionName, S, now) {
      this.dataExtractTitle = functionName;
      var sources = ["数据库", "日志文件", "API接口", "CSV文件"];
      var rules = ["全量提取", "增量提取", "条件提取", "采样提取"];
      var targets = ["asset_info", "scan_result", "alert_log", "task_status", "node_config", "scan_rule", "sync_data"];
      this.dataExtractForm = {
        source: sources[S % sources.length],
        rule: rules[S % rules.length],
        target: targets[S % targets.length],
        status: pick(["提取中", "等待中", "已完成"], 0, S),
      };
      // 根据函数名生成不同的字段
      var nameHash = functionName.split("").reduce(function(a, c) { return a + c.charCodeAt(0); }, 0);
      var fieldSets = [
        [
          { field: "id", type: "INT", sample: "1001" },
          { field: "asset_name", type: "VARCHAR", sample: "核心交换机" + (nameHash % 100) },
          { field: "ip_address", type: "VARCHAR", sample: "10.10." + (S % 256) + "." + (10 + S % 50) },
          { field: "asset_type", type: "ENUM", sample: pick(["网络设备", "服务器", "终端", "安全设备"], 0, S) },
          { field: "status", type: "ENUM", sample: pick(["在线", "离线", "维护中"], 1, S) },
          { field: "owner", type: "VARCHAR", sample: pick(["王建国", "李明辉", "张晓峰"], 2, S) },
          { field: "create_time", type: "DATETIME", sample: now },
          { field: "update_time", type: "DATETIME", sample: now },
        ],
        [
          { field: "scan_id", type: "VARCHAR", sample: "SCAN-" + String(nameHash).slice(-6) },
          { field: "target_ip", type: "VARCHAR", sample: "10.10." + (S % 256) + "." + (20 + S % 80) },
          { field: "scan_type", type: "ENUM", sample: pick(["端口扫描", "漏洞扫描", "配置检查", "基线检查"], 3, S) },
          { field: "result", type: "TEXT", sample: pick(["通过", "不通过", "待确认"], 4, S) },
          { field: "risk_level", type: "ENUM", sample: pick(["高危", "中危", "低危", "信息"], 5, S) },
          { field: "scan_time", type: "DATETIME", sample: now },
          { field: "duration", type: "VARCHAR", sample: pick(["128ms", "256ms", "1.2s", "3.5s"], 6, S) },
        ],
        [
          { field: "task_id", type: "VARCHAR", sample: "TASK-" + String(nameHash).slice(-6) },
          { field: "task_name", type: "VARCHAR", sample: functionName.slice(0, 6) + "任务" },
          { field: "progress", type: "INT", sample: pick([25, 50, 75, 100], 7, S) },
          { field: "start_time", type: "DATETIME", sample: now },
          { field: "end_time", type: "DATETIME", sample: now },
          { field: "operator", type: "VARCHAR", sample: pick(["系统自动", "王建国", "李明辉"], 8, S) },
          { field: "remark", type: "TEXT", sample: pick(["正常执行", "部分完成", "执行中"], 9, S) },
        ],
        [
          { field: "record_id", type: "INT", sample: String(2024000 + nameHash % 1000) },
          { field: "data_type", type: "ENUM", sample: pick(["JSON", "XML", "CSV", "二进制"], 10, S) },
          { field: "data_size", type: "VARCHAR", sample: pick(["12KB", "48KB", "256KB", "1.2MB"], 11, S) },
          { field: "checksum", type: "VARCHAR", sample: "md5:" + String(nameHash).slice(-8) },
          { field: "source_node", type: "VARCHAR", sample: pick(["NODE-MASTER-01", "NODE-SLAVE-01", "NODE-EDGE-01"], 12, S) },
          { field: "target_node", type: "VARCHAR", sample: pick(["NODE-BACKUP-01", "NODE-PROXY-01", "NODE-SLAVE-02"], 13, S) },
          { field: "sync_status", type: "ENUM", sample: pick(["已完成", "同步中", "失败"], 14, S) },
          { field: "sync_time", type: "DATETIME", sample: now },
        ],
      ];
      var fieldDefs = fieldSets[nameHash % fieldSets.length];
      var doneCount = (S % 4) + 4;
      this.dataExtractFields = fieldDefs.map(function(f, i) {
        return {
          field: f.field,
          type: f.type,
          extracted: i < doneCount,
          count: i < doneCount ? Math.floor(Math.random() * 500) + 100 : 0,
          sample: f.sample,
        };
      });
      this.dataExtractProgress = Math.round((doneCount / fieldDefs.length) * 100);
      this.dataExtractStats = {
        totalRecords: this.dataExtractFields.reduce(function(a, f) { return a + f.count; }, 0),
        duration: pick(["1.2s", "2.5s", "4.8s", "8.3s"], 3, S),
      };
      this.dataExtractVisible = true;
    },
    exportDataExtract() {
      var data = this.dataExtractFields.filter(function(f) { return f.extracted; }).map(function(f) {
        return { "字段名": f.field, "类型": f.type, "记录数": f.count, "示例值": f.sample };
      });
      exportXLSX(data, this.dataExtractTitle + "-提取数据");
      this.dataExtractVisible = false;
    },
    // ─── 数据审查弹窗 ───
    openDataReviewDialog(functionName, S, now) {
      this.dataReviewTitle = functionName;
      var nameHash = functionName.split("").reduce(function(a, c) { return a + c.charCodeAt(0); }, 0);
      var base = nameHash % 1000;
      var rules = [
        { rule: "数据完整性校验", category: "完整性" },
        { rule: "数据格式合规检查", category: "合规性" },
        { rule: "字段长度验证", category: "规范性" },
        { rule: "必填项检查", category: "完整性" },
        { rule: "数据类型匹配", category: "准确性" },
        { rule: "编码格式检查", category: "规范性" },
        { rule: "重复数据检测", category: "一致性" },
        { rule: "关联关系校验", category: "一致性" },
        { rule: "业务规则验证", category: "合规性" },
        { rule: "安全敏感词检测", category: "安全性" },
      ];
      var details = [
        "共校验1024条记录，99.2%通过",
        "发现3条格式不规范记录",
        "2个字段超出长度限制",
        "5条记录缺少必填字段",
        "数据类型全部匹配",
        "编码格式统一为UTF-8",
        "发现12条重复记录",
        "关联关系校验通过",
        "业务规则全部符合",
        "未发现安全敏感词",
      ];
      var results = ["通过", "通过", "通过", "警告", "不通过", "通过", "警告", "通过", "通过", "通过"];
      var itemCount = (base % 4) + 6;
      this.dataReviewItems = Array.from({ length: itemCount }).map(function(_, i) {
        return {
          rule: rules[i].rule,
          category: rules[i].category,
          result: results[(base + i) % results.length],
          count: 100 + ((base + i * 37) % 900),
          detail: details[i],
        };
      });
      var passCount = this.dataReviewItems.filter(function(item) { return item.result === "通过"; }).length;
      var warningCount = this.dataReviewItems.filter(function(item) { return item.result === "警告"; }).length;
      var failCount = this.dataReviewItems.filter(function(item) { return item.result === "不通过"; }).length;
      this.dataReviewStats = {
        pass: passCount,
        warning: warningCount,
        fail: failCount,
        pending: itemCount - passCount - warningCount - failCount,
      };
      this.dataReviewNotes = [
        { type: "重要", content: "发现" + failCount + "项不通过规则，建议立即处理。" },
        { type: "建议", content: "数据完整性校验通过率99.2%，建议关注剩余0.8%异常数据。" },
        { type: "信息", content: "审查已完成，共审查" + itemCount + "项规则。" },
      ];
      this.dataReviewVisible = true;
    },
    exportDataReview() {
      var data = this.dataReviewItems.map(function(item) {
        return { "审查规则": item.rule, "规则类别": item.category, "审查结果": item.result, "涉及记录": item.count, "详情": item.detail };
      });
      exportXLSX(data, this.dataReviewTitle + "-审查报告");
      this.dataReviewVisible = false;
    },
    // ─── 运行效果评估弹窗 ───
    openRunEvaluationDialog(functionName, S, now) {
      this.runEvalTitle = functionName;
      var nameHash = functionName.split("").reduce(function(a, c) { return a + c.charCodeAt(0); }, 0);
      var base = nameHash % 1000;
      var dimensions = [
        { dimension: "响应时间", weight: 20 },
        { dimension: "吞吐量", weight: 15 },
        { dimension: "资源利用率", weight: 15 },
        { dimension: "错误率", weight: 20 },
        { dimension: "可用性", weight: 15 },
        { dimension: "稳定性", weight: 15 },
      ];
      this.runEvalItems = dimensions.map(function(d, i) {
        var score = 70 + ((base + i * 13) % 30);
        return {
          dimension: d.dimension,
          score: score,
          weight: d.weight + "%",
          level: score >= 90 ? "优秀" : score >= 80 ? "良好" : score >= 70 ? "一般" : "需改进",
          detail: pick([
            "响应时间平均128ms，符合预期",
            "吞吐量达到设计指标的95%",
            "CPU利用率平均45%，内存使用率62%",
            "错误率0.3%，低于阈值1%",
            "系统可用性99.9%，SLA达标",
            "运行稳定，无异常中断",
          ], i, nameHash),
        };
      });
      var totalWeight = 0;
      var weightedSum = 0;
      this.runEvalItems.forEach(function(item) {
        var w = parseInt(item.weight);
        totalWeight += w;
        weightedSum += item.score * w / 100;
      });
      this.runEvalScore = Math.round(weightedSum);
      var suggestions = [
        { priority: "高", content: "响应时间在高峰期偶有波动，建议优化缓存策略。" },
        { priority: "中", content: "内存使用率偏高，建议增加内存或优化内存回收机制。" },
        { priority: "低", content: "错误率虽达标，但建议持续监控并分析错误日志。" },
        { priority: "中", content: "建议增加自动化监控告警，提前发现潜在问题。" },
      ];
      this.runEvalSuggestions = suggestions.slice(0, 2 + (base % 2));
      this.runEvalVisible = true;
    },
    exportRunEvaluation() {
      var data = this.runEvalItems.map(function(item) {
        return { "评估维度": item.dimension, "得分": item.score, "权重": item.weight, "等级": item.level, "评估说明": item.detail };
      });
      data.push({ "评估维度": "综合评分", "得分": this.runEvalScore, "权重": "100%", "等级": this.runEvalScore >= 90 ? "优秀" : "良好", "评估说明": "加权平均" });
      exportXLSX(data, this.runEvalTitle + "-评估报告");
      this.runEvalVisible = false;
    },
    // ─── 可视化展示弹窗 ───
    openVisualizationDialog(functionName, S, now) {
      this.vizTitle = functionName;
      var nameHash = functionName.split("").reduce(function(a, c) { return a + c.charCodeAt(0); }, 0);
      var base = nameHash % 1000;
      var labels = ["总任务数", "成功率", "平均耗时", "活跃用户"];
      var values = [1280 + base, (95 + (base % 5)) + "%", (120 + (base % 80)) + "ms", 56 + (base % 20)];
      var trends = [12, -3, 8, -5];
      this.vizCards = labels.map(function(label, i) {
        return { label: label, value: values[i], trend: trends[i] + (base % 5 - 2) };
      });
      var metrics = ["任务执行数", "成功率", "响应时间", "资源占用", "错误次数"];
      var statuses = ["正常", "正常", "预警", "正常", "异常"];
      this.vizTrendData = Array.from({ length: 5 }).map(function(_, i) {
        var d = new Date();
        d.setHours(d.getHours() - (4 - i));
        return {
          time: d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") + " " + String(d.getHours()).padStart(2, "0") + ":00:00",
          metric: pick(metrics, i, nameHash),
          value: (80 + (base + i * 7) % 20) + "%",
          status: pick(statuses, i, nameHash),
          remark: pick(["系统运行正常", "略有波动但可控", "接近阈值需关注", "运行稳定", "出现异常需排查"], i, nameHash),
        };
      });
      var categories = ["已完成", "进行中", "待处理", "异常"];
      var total = 100 + (base % 50);
      this.vizDistribution = categories.map(function(cat, i) {
        var count = Math.round(total * pick([0.6, 0.2, 0.15, 0.05], i, nameHash));
        return {
          category: cat,
          count: count,
          percentage: Math.round(count / total * 100) + "%",
          description: pick(["任务正常完成", "正在执行中", "等待调度执行", "执行异常需处理"], i, nameHash),
        };
      });
      this.vizVisible = true;
    },
    exportVisualization() {
      var data = this.vizCards.map(function(card) {
        return { "指标": card.label, "当前值": card.value, "较昨日变化": card.trend + "%" };
      });
      data.push({});
      data.push({ "指标": "---趋势数据---" });
      this.vizTrendData.forEach(function(row) {
        data.push({ "指标": row.metric, "当前值": row.value, "较昨日变化": row.status });
      });
      data.push({});
      data.push({ "指标": "---分布数据---" });
      this.vizDistribution.forEach(function(row) {
        data.push({ "指标": row.category, "当前值": row.count, "较昨日变化": row.percentage });
      });
      exportXLSX(data, this.vizTitle + "-可视化数据");
      this.vizVisible = false;
    },
    // ─── 分级弹窗 ───
    openGradingDialog(functionName, S, now) {
      this.gradingTitle = functionName;
      var nameHash = functionName.split("").reduce(function(a, c) { return a + c.charCodeAt(0); }, 0);
      var base = nameHash % 1000;
      var criteriaList = [
        { criteria: "资产价值", weight: "25%" },
        { criteria: "威胁程度", weight: "25%" },
        { criteria: "脆弱性", weight: "20%" },
        { criteria: "影响范围", weight: "15%" },
        { criteria: "合规要求", weight: "15%" },
      ];
      this.gradingItems = criteriaList.map(function(item, i) {
        var score = 50 + ((base + i * 17) % 50);
        return {
          criteria: item.criteria,
          score: score,
          weight: item.weight,
          result: score >= 80 ? "达标" : score >= 60 ? "基本达标" : "不达标",
          remark: pick([
            "资产价值较高，需重点保护",
            "存在已知威胁，需加强防护",
            "发现多个安全漏洞",
            "影响业务系统较多",
            "符合等保合规要求",
            "安全措施基本到位",
          ], i, nameHash),
        };
      });
      var totalScore = 0;
      this.gradingItems.forEach(function(item) { totalScore += item.score; });
      var avgScore = Math.round(totalScore / this.gradingItems.length);
      this.gradingLevel = avgScore >= 80 ? "一级" : avgScore >= 60 ? "二级" : "三级";
      var levels = [
        { level: "一级", description: "核心资产，需最高等级安全防护，定期审计" },
        { level: "二级", description: "重要资产，需较高等级安全防护，季度审计" },
        { level: "三级", description: "一般资产，需基本安全防护，年度审计" },
      ];
      this.gradingBasis = levels;
      this.gradingVisible = true;
    },
    exportGrading() {
      var data = this.gradingItems.map(function(item) {
        return { "分级标准": item.criteria, "得分": item.score, "权重": item.weight, "评定结果": item.result, "说明": item.remark };
      });
      data.push({ "分级标准": "综合评定", "得分": "-", "权重": "100%", "评定结果": this.gradingLevel, "说明": "加权平均" });
      exportXLSX(data, this.gradingTitle + "-分级报告");
      this.gradingVisible = false;
    },
    // ─── 数据识别弹窗 ───
    openDataRecognitionDialog(functionName, S, now) {
      this.recognitionTitle = functionName;
      var nameHash = functionName.split("").reduce(function(a, c) { return a + c.charCodeAt(0); }, 0);
      var base = nameHash % 1000;
      var fields = [
        { fieldName: "用户姓名", fieldType: "VARCHAR" },
        { fieldName: "身份证号", fieldType: "VARCHAR" },
        { fieldName: "手机号码", fieldType: "VARCHAR" },
        { fieldName: "IP地址", fieldType: "VARCHAR" },
        { fieldName: "设备名称", fieldType: "VARCHAR" },
        { fieldName: "创建时间", fieldType: "DATETIME" },
        { fieldName: "资产编号", fieldType: "VARCHAR" },
        { fieldName: "备注信息", fieldType: "TEXT" },
      ];
      var types = ["敏感数据", "敏感数据", "敏感数据", "普通数据", "普通数据", "普通数据", "内部数据", "普通数据"];
      var rules = ["正则匹配-身份证", "正则匹配-手机号", "正则匹配-姓名", "白名单匹配", "关键词匹配", "格式校验", "编码规则匹配", "通用文本"];
      this.recognitionItems = fields.map(function(f, i) {
        var confidence = 70 + ((base + i * 11) % 30);
        return {
          fieldName: f.fieldName,
          fieldType: f.fieldType,
          recognizedType: pick(types, i, nameHash),
          confidence: confidence,
          rule: pick(rules, i, nameHash),
        };
      });
      var matched = this.recognitionItems.filter(function(item) { return item.confidence >= 75; }).length;
      this.recognitionStats = {
        total: this.recognitionItems.length,
        matched: matched,
        unmatched: this.recognitionItems.length - matched,
      };
      var ruleList = [
        { level: "高", rule: "身份证号识别", description: "18位数字+校验码正则匹配" },
        { level: "高", rule: "手机号识别", description: "11位手机号正则匹配" },
        { level: "中", rule: "姓名识别", description: "中文姓名关键词匹配" },
        { level: "低", rule: "IP地址识别", description: "IPv4/IPv6格式匹配" },
      ];
      this.recognitionRules = ruleList;
      this.recognitionVisible = true;
    },
    exportRecognition() {
      var data = this.recognitionItems.map(function(item) {
        return { "字段名称": item.fieldName, "字段类型": item.fieldType, "识别结果": item.recognizedType, "置信度": item.confidence + "%", "匹配规则": item.rule };
      });
      data.push({});
      data.push({ "字段名称": "统计", "识别结果": "匹配: " + this.recognitionStats.matched + " / 未匹配: " + this.recognitionStats.unmatched });
      exportXLSX(data, this.recognitionTitle + "-识别结果");
      this.recognitionVisible = false;
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
    // ─── 监控告警类弹窗 ───
    openMonitorAlertDialog(functionName, S, now) {
      this.monitorAlertTitle = functionName;
      var critical = pick([1, 2, 3, 5], 0, S);
      var warning = pick([3, 5, 8, 12], 1, S);
      var info = pick([5, 8, 15, 20], 2, S);
      var total = critical + warning + info;
      this.monitorAlertSummary = [
        { label: "总告警数", value: total, color: "#303133" },
        { label: "紧急", value: critical, color: "#F56C6C" },
        { label: "重要", value: warning, color: "#E6A23C" },
        { label: "一般", value: info, color: "#409EFF" },
      ];
      var levels = ["紧急", "重要", "重要", "一般", "一般", "一般"];
      var statuses = ["未处理", "处理中", "已处理", "未处理", "已处理", "处理中"];
      var sources = ["系统检测", "巡检发现", "日志分析", "用户上报", "第三方告警", "自动扫描"];
      var names = ["CPU使用率超阈值", "内存占用异常", "磁盘空间不足", "网络连接超时", "服务响应延迟", "数据同步失败", "证书即将过期", "登录异常"];
      this.monitorAlertList = Array.from({ length: pick([4, 5, 6], 3, S) }).map((_, i) => ({
        alertId: "ALT-" + String(S + i * 1234).slice(-6),
        level: pick(levels, i, S),
        name: pick(names, i + 4, S),
        source: pick(sources, i + 5, S),
        status: pick(statuses, i + 6, S),
        time: now,
      }));
      var targets = ["扫描任务模块", "采集服务", "指令处理模块", "资产管理模块"];
      var suggestions = ["重启相关服务", "扩容资源配额", "检查网络配置", "更新系统补丁", "联系管理员处理"];
      this.monitorAlertSuggestions = targets.slice(0, pick([3, 4], 7, S)).map((t, i) => ({
        target: t,
        suggestion: pick(suggestions, i + 8, S),
        priority: pick(["高", "中", "低"], i + 9, S),
      }));
      this.monitorAlertVisible = true;
    },
    // ─── 附件上传类弹窗 ───
    openUploadDialog(functionName, S, now) {
      this.uploadTitle = functionName;
      this.uploadFileList = [];
      this.uploadHistory = [];
      this.uploadVisible = true;
    },
    handleUploadFileChange(file, fileList) {
      this.uploadFileList = fileList;
    },
    handleUploadFileRemove(file, fileList) {
      this.uploadFileList = fileList;
    },
    submitUpload() {
      var self = this;
      var now = this.now();
      this.uploadFileList.forEach(function(f) {
        var size = f.size ? (f.size > 1048576 ? (f.size / 1048576).toFixed(1) + "MB" : (f.size / 1024).toFixed(1) + "KB") : "未知";
        var ext = f.name.split(".").pop() || "未知";
        self.uploadHistory.unshift({
          fileName: f.name,
          fileSize: size,
          fileType: ext,
          uploadTime: now,
          status: "成功",
          url: "#",
        });
      });
      this.$message.success("上传成功，共 " + this.uploadFileList.length + " 个文件");
      this.uploadFileList = [];
    },
    previewUploadFile(row) {
      var msg = "文件名：" + row.fileName + " | 大小：" + row.fileSize + " | 类型：" + row.fileType + " | 上传时间：" + row.uploadTime + " | 状态：" + row.status;
      this.$alert(msg, "文件详情", { confirmButtonText: "确定", type: "info" });
    },
    downloadUploadFile(row) {
      var content = "文件名：" + row.fileName + " | 大小：" + row.fileSize + " | 类型：" + row.fileType + " | 上传时间：" + row.uploadTime + " | 状态：" + row.status;
      var blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = row.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.$message.success("下载完成：" + row.fileName);
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
    // ─── 发起流程弹窗 ───
    openInitiateFlowDialog(functionName, S, now) {
      this.initFlowTitle = functionName;
      var nodeNames = ["NODE-MASTER-01", "NODE-SLAVE-01", "NODE-SLAVE-02", "NODE-EDGE-01", "NODE-EDGE-02", "NODE-EDGE-03", "NODE-BACKUP-01", "NODE-BACKUP-02"];
      var nodeCount = (S % 4) + 4;
      this.initFlowForm = {
        flowNo: "FLOW-" + String(S).slice(-6),
        flowType: pick(["IP扫描指令分发", "资产信息同步", "安全策略下发", "巡检任务分发"], 0, S),
        applicant: pick(["安全组-王建国", "运维组-李明辉", "网络组-张晓峰", "系统组-刘志远"], 1, S),
        priority: pick(["紧急", "高", "普通", "低"], 2, S),
        scope: pick(["全省范围", "长春区域", "吉林市区域", "跨区域分发"], 3, S),
        nodeCount: nodeCount,
      };
      this.initFlowNodes = Array.from({ length: nodeCount }).map((_, i) => ({
        node: nodeNames[i],
        ip: "10.10." + (S % 256) + "." + (10 + i),
        status: pick(["已完成", "已完成", "分发中", "等待中", "失败"], i, S),
        time: pick(["128ms", "256ms", "512ms", "-"], i + 4, S) + "",
        msg: pick(["分发成功", "分发成功", "正在传输...", "等待连接", "节点不可达"], i + 8, S),
      }));
      this.initFlowProgress = Math.round((this.initFlowNodes.filter(n => n.status === "已完成").length / this.initFlowNodes.length) * 100);
      this.initFlowVisible = true;
    },
    // ─── 指派信息弹窗 ───
    openAssignDialog(functionName, S, now) {
      this.assignTitle = functionName;
      var assignTypes = ["任务指派", "工单指派", "巡检指派", "处置指派", "扫描指派"];
      var targets = ["安全组-王建国", "运维组-李明辉", "网络组-张晓峰", "系统组-刘志远", "安全组-陈思涵", "运维组-赵鹏飞"];
      var descriptions = [
        "请负责完成该IP扫描任务的分发与结果收集工作，确保所有节点反馈完整。",
        "请对指定IP段执行安全扫描，输出扫描报告并提交至资产管理平台。",
        "请协调各分节点完成扫描指令的接收与执行，及时处理异常情况。",
        "请按照分发计划完成任务分配，跟踪执行进度并在截止时间前汇总结果。",
        "请确认扫描任务已正确下发至目标节点，核对节点反馈状态并记录异常。",
      ];
      this.assignForm = {
        assignNo: "ASGN-" + String(S).slice(-6),
        type: pick(assignTypes, 0, S),
        target: pick(targets, 1, S),
        dept: pick(["安全运维部", "网络安全部", "系统管理部", "资产管理部"], 2, S),
        priority: pick(["紧急", "高", "普通", "低"], 3, S),
        deadline: now.slice(0, 10) + " " + pick(["18:00:00", "23:59:59", "次日09:00:00", "本周五17:00:00"], 4, S),
        description: pick(descriptions, 5, S),
        notifyMethods: pick([["系统消息"], ["系统消息", "短信通知"], ["系统消息", "邮件通知"], ["系统消息", "短信通知", "邮件通知"]], 6, S),
      };
      this.assignHistory = [
        { time: now, operator: "系统管理员", action: "创建指派", remark: "新建指派任务" },
        { time: now.slice(0, 11) + "09:30:00", operator: pick(targets, 7, S), action: "确认接收", remark: "已确认接收任务" },
        { time: now.slice(0, 11) + "10:15:00", operator: "系统管理员", action: "发送通知", remark: "已通过系统消息通知" },
      ];
      this.assignVisible = true;
    },
    // ─── 节点查询弹窗 ───
    openNodeQueryDialog(functionName, S, now) {
      this.nodeQueryTitle = functionName;
      this.nodeQueryFilter = "";
      this.nodeQueryStatusFilter = "";
      var nodeNames = ["NODE-MASTER-01", "NODE-SLAVE-01", "NODE-SLAVE-02", "NODE-EDGE-01", "NODE-EDGE-02", "NODE-EDGE-03", "NODE-BACKUP-01", "NODE-BACKUP-02", "NODE-PROXY-01", "NODE-PROXY-02"];
      var regions = ["区域A", "区域B", "区域C", "区域D", "区域E", "区域F", "区域G", "区域H", "区域I", "区域J"];
      var nodeCount = (S % 4) + 6;
      this.nodeQueryNodes = Array.from({ length: nodeCount }).map((_, i) => ({
        name: nodeNames[i],
        ip: "10.10." + (S % 256) + "." + (10 + i),
        status: pick(["在线", "在线", "在线", "离线", "异常", "维护中"], i, S),
        cpu: pick(["12%", "28%", "45%", "67%", "82%", "95%"], i + 2, S),
        mem: pick(["2.1G", "4.8G", "8.2G", "12.5G", "15.3G"], i + 4, S),
        disk: pick(["45%", "52%", "68%", "78%", "91%"], i + 6, S),
        tasks: pick([3, 5, 8, 12, 15, 20], i + 8, S),
        lastHeartbeat: now.slice(0, 11) + pick(["08:12:35", "09:28:41", "10:05:18", "11:33:52", "12:47:09", "13:22:16", "14:58:33", "15:41:27", "16:15:44", "17:03:11"], i + 10, S),
        region: regions[i],
      }));
      this.nodeQueryVisible = true;
    },
    // ─── 流程通知弹窗 ───
    openFlowNotifyDialog(functionName, S, now) {
      this.flowNotifyTitle = functionName;
      this.flowNotifyTab = "list";
      this.flowNotifyDetail = null;
      var titles = ["审批流程待处理通知", "IP扫描任务异常通知", "任务分发完成通知", "节点离线提醒通知", "扫描结果上报通知", "流程超时预警通知"];
      var contents = [
        "您有一条审批流程待处理，请及时登录系统进行审批操作。流程编号：FLOW-" + String(S).slice(-6),
        "IP扫描任务执行过程中发现异常，部分节点响应超时，请检查网络连通性。异常节点：NODE-SLAVE-01。",
        "IP扫描任务分发已完成，共下发至8个节点，成功7个，失败1个。请查看详细结果。",
        "检测到节点[NODE-EDGE-03]已离线超过30分钟，请及时处理。最后心跳时间：" + now.slice(0, 11) + "08:12:35",
        "扫描结果已成功上报至部侧平台，上报编号：RPT-" + String(S).slice(-6) + "，请及时确认。",
        "流程执行已超时（超过2小时），当前进度65%，请检查执行状态或联系技术支持。",
      ];
      var senders = ["安全组-王建国", "运维组-李明辉", "网络组-张晓峰", "系统组-刘志远", "安全组-陈思涵", "运维组-赵鹏飞"];
      this.flowNotifyList = Array.from({ length: 6 }).map((_, i) => ({
        time: now.slice(0, 11) + pick(["08:15:30", "09:42:18", "10:28:45", "11:05:12", "13:38:56", "14:52:09"], i, S),
        type: pick(["审批通知", "异常通知", "完成通知", "提醒通知", "上报通知", "预警通知"], i, S),
        title: titles[i],
        sender: senders[i],
        status: pick(["未读", "未读", "已读", "未读", "已读", "未读"], i, S),
        content: contents[i],
        flowName: "FLOW-" + String(S).slice(-6) + "-" + pick(["分发", "扫描", "审批", "上报", "同步", "调度"], i, S),
      }));
      this.flowNotifySendForm = { title: "", type: "审批通知", receiver: "", content: "", methods: ["系统消息"] };
      this.flowNotifyVisible = true;
    },
    // ─── 流程图查看弹窗 ───
    openFlowchartDialog(functionName, S, now) {
      this.flowchartTitle = functionName;
      this.flowchartFlowNo = "FLOW-" + String(S).slice(-6);
      var handlers = ["安全组-王建国", "运维组-李明辉", "网络组-张晓峰", "系统组-刘志远", "安全组-陈思涵", "运维组-赵鹏飞"];
      var nodeDefs = [
        { name: "发起申请", icon: "el-icon-edit" },
        { name: "初审", icon: "el-icon-s-check" },
        { name: "复审", icon: "el-icon-s-check" },
        { name: "审批", icon: "el-icon-s-order" },
        { name: "执行", icon: "el-icon-s-platform" },
        { name: "完成", icon: "el-icon-s-claim" },
      ];
      var doneCount = (S % 4) + 2;
      this.flowchartNodes = nodeDefs.map((def, i) => {
        var status = i < doneCount ? "已完成" : i === doneCount ? "执行中" : "等待中";
        var startT = i <= doneCount ? now.slice(0, 11) + pick(["08:15:00", "09:30:00", "10:45:00", "12:00:00", "13:30:00", "14:45:00"], i, S) : "-";
        var endT = i < doneCount ? now.slice(0, 11) + pick(["08:30:00", "09:50:00", "11:10:00", "12:25:00", "13:55:00", "15:10:00"], i, S) : "-";
        return {
          name: def.name,
          icon: def.icon,
          status: status,
          handler: status === "等待中" ? "-" : handlers[i % handlers.length],
          time: status === "已完成" ? "完成" : status === "执行中" ? "进行中" : "待执行",
          startTime: startT,
          endTime: endT,
          remark: status === "已完成" ? "审核通过" : status === "执行中" ? "正在处理..." : "等待上一节点完成",
        };
      });
      var lastNode = this.flowchartNodes[this.flowchartNodes.length - 1];
      this.flowchartStatus = lastNode.status === "已完成" ? "已完成" : this.flowchartNodes.some(n => n.status === "异常") ? "异常" : "执行中";
      this.flowchartVisible = true;
    },
    // ─── 驳回/拒绝弹窗 ───
    openRejectDialog(functionName, S, now) {
      this.rejectTitle = functionName;
      var handlers = ["安全组-王建国", "运维组-李明辉", "网络组-张晓峰", "系统组-刘志远", "安全组-陈思涵", "运维组-赵鹏飞"];
      this.rejectForm = {
        type: pick(["驳回", "拒绝", "退回"], 0, S),
        level: pick(["一级驳回", "二级驳回", "三级驳回"], 1, S),
        reason: pick(["信息不完整", "数据有误", "不符合规范", "流程不符合要求"], 2, S),
        comment: pick([
          "提交的处置下发结果信息不完整，缺少关键字段，请补充后重新提交。",
          "扫描结果数据与预期不符，存在异常值，请核实后重新上报。",
          "上报格式不符合规范要求，请按照模板格式修改后重新提交。",
          "流程节点缺少必要的审批环节，请补充审批后重新发起。",
        ], 3, S),
        handler: handlers[S % handlers.length],
        time: now,
      };
      this.rejectVisible = true;
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
        { label: "返回码", value: "200" },
        { label: "执行结果", value: pick(["全部成功", "部分成功", "执行失败", "超时终止"], 1, S) },
        { label: "影响记录数", value: pick([0, 12, 48, 128], 2, S) + "条" },
        { label: "处理耗时", value: pick(["23ms", "86ms", "256ms", "1024ms"], 3, S) + "" },
        { label: "错误信息", value: "无" },
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
      var nameHash = functionName.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      var uniqueId = String(nameHash).padStart(6, "0").slice(-6);
      this.recvReqStats = [
        { label: "接口地址", value: "/api/" + uniqueId + "/" + pick(["query", "submit", "sync", "check"], 0, S) },
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
    confirmApiReceive() {
      const now = this.now();
      // 复制一条已有数据，确保格式和字段完全一致
      const base = this.allTableData[0] ? { ...this.allTableData[0] } : {};
      const newRow = { ...base };
      // 仅更新可明确识别的字段
      newRow["ID"] = this.nextId();
      // 生成唯一工单编号
      const orderCol = this.tableColumns.find(c => /工单编号|编号/.test(c.label));
      if (orderCol) {
        var prefix = orderCol.prop.includes("工单") ? "GD" : "NO";
        newRow[orderCol.prop] = prefix + "-" + String(Date.now()).slice(-8);
      }
      const timeCol = this.tableColumns.find(c => /时间/.test(c.prop));
      if (timeCol) newRow[timeCol.prop] = now;
      this.allTableData.unshift(newRow);
      this.pageOptions.pageNum = 1;
      this.fetchData();
      this.recvReqVisible = false;
      this.$message.success("已确认接收，数据已入库");
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
        { label: "操作人", value: pick(["王建国", "李明辉", "张晓峰", "刘志远", "陈思涵", "赵鹏飞"], 3, S) },
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
        修改人: pick(["王建国", "李明辉", "张晓峰", "刘志远", "陈思涵", "赵鹏飞"], 5, S),
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
      this.transformTitle = functionName;
      var data = this.allTableData || [];
      this.transformRecordCount = data.length;
      this.transformJson = JSON.stringify(data, null, 2);
      var bytes = new Blob([this.transformJson]).size;
      this.transformSize = bytes > 1024 ? (bytes / 1024).toFixed(1) + " KB" : bytes + " B";
      this.transformCost = pick(["12ms", "28ms", "56ms", "120ms"], 0, S);
      this.transformVisible = true;
    },
    copyTransformJson() {
      var text = this.transformJson;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() {
          this.$message.success("JSON已复制到剪贴板");
        }.bind(this));
      } else {
        var ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        this.$message.success("JSON已复制到剪贴板");
      }
    },
    // ─── 数据预处理类弹窗 ───
    openPreprocessDialog(functionName, S, now) {
      this.preprocessTitle = functionName;
      this.preprocessSource = pick(["指令接收系统", "资产扫描系统", "采集任务系统", "上报系统"], 0, S);
      var total = pick([512, 1024, 2048, 4096], 1, S);
      this.preprocessTotal = total;
      var stepNames = ["数据读取", "字段映射", "数据清洗", "格式标准化", "质量校验"];
      var stepDescs = ["读取源数据文件", "匹配目标字段", "去除无效记录", "统一数据格式", "校验数据完整性"];
      var doneCount = pick([3, 4, 5], 2, S);
      this.preprocessSteps = stepNames.map((name, i) => ({
        name: name,
        desc: stepDescs[i],
        status: i < doneCount ? "success" : i === doneCount ? "process" : "wait",
      }));
      this.preprocessActiveStep = doneCount;
      this.preprocessProgress = Math.round((doneCount / stepNames.length) * 100);
      this.preprocessLog = [
        { time: now, step: "数据读取", msg: "读取 " + total + " 条记录", result: "成功" },
        { time: now, step: "字段映射", msg: "匹配 " + pick([12, 18, 24], 3, S) + " 个字段", result: "成功" },
        { time: now, step: "数据清洗", msg: "过滤 " + pick([15, 32, 48], 4, S) + " 条无效记录", result: "成功" },
        { time: now, step: "格式标准化", msg: pick(["时间格式统一", "编码格式转换", "字段类型标准化"], 5, S), result: pick(["成功", "成功", "成功"], 6, S) },
        { time: now, step: "质量校验", msg: "完整率 " + pick(["98.5%", "99.2%", "97.8%"], 7, S), result: doneCount >= 5 ? "成功" : "跳过" },
      ];
      this.preprocessVisible = true;
    },
    // ─── 数据采集类弹窗 ───
    openCollectionDialog(functionName, S, now) {
      this.collectionTitle = functionName;
      this.collectionSource = pick(["指令接收系统", "资产扫描平台", "端口探测模块", "SNMP采集器", "Agent代理"], 0, S);
      this.collectionTarget = pick(["本地数据库", "缓存集群", "数据仓库", "ES索引"], 1, S);
      var progress = pick([75, 88, 95, 100], 2, S);
      this.collectionProgress = progress;
      this.collectionStatus = progress === 100 ? "已完成" : "采集中";
      var data = this.allTableData || [];
      var total = data.length || pick([512, 1024, 2048, 4096], 3, S);
      var success = Math.round(total * pick([0.95, 0.97, 0.99, 1.0], 4, S));
      this.collectionStats = [
        { label: "计划采集", value: total },
        { label: "已采集", value: Math.round(total * progress / 100) },
        { label: "成功", value: success },
        { label: "失败", value: total - success },
      ];
      this.collectionLog = [
        { time: now, level: "INFO", msg: functionName + " 采集任务已启动" },
        { time: now, level: "INFO", msg: "连接采集源 " + this.collectionSource + " 成功" },
        { time: now, level: "INFO", msg: "已采集 " + Math.round(total * progress / 100) + " / " + total + " 条" },
        { time: now, level: progress === 100 ? "INFO" : "WARN", msg: progress === 100 ? "采集任务完成" : "采集中，请稍候..." },
      ];
      this.collectionColumns = [
        { prop: "ip", label: "IP地址", width: 140 },
        { prop: "hostname", label: "主机名", width: 120 },
        { prop: "os", label: "操作系统", width: 110 },
        { prop: "ports", label: "开放端口", width: 130 },
        { prop: "services", label: "服务指纹", width: 160 },
        { prop: "mac", label: "MAC地址", width: 150 },
        { prop: "status", label: "状态", width: 80 },
      ];
      var ips = ["10.10.1.101", "10.10.1.102", "10.10.1.103", "172.16.0.50", "192.168.1.200", "10.20.5.31", "172.20.1.81", "10.0.0.251"];
      var hostnames = ["web-server-01", "db-master", "app-node-03", "cache-redis", "gateway-proxy", "monitor-host", "backup-srv", "dev-test"];
      var oss = ["CentOS 7.9", "Ubuntu 20.04", "Windows Server 2019", "CentOS 8.5", "Debian 11", "Rocky Linux 9", "Kylin V10", "UOS 20"];
      var portsList = ["22,80,443", "3306,6379", "8080,8443", "6379,26379", "80,443,8080", "9090,3000", "22,80", "21,22,80"];
      var servicesList = ["Nginx/1.18", "MySQL/8.0", "Apache/2.4", "Redis/6.2", "Docker/20.10", "Tomcat/9.0", "SSH/OpenSSH/8.4", "IIS/10.0"];
      var macs = ["00:1A:2B:3C:4D:01", "00:1A:2B:3C:4D:02", "00:1A:2B:3C:4D:03", "00:1A:2B:3C:4D:04", "00:1A:2B:3C:4D:05", "00:1A:2B:3C:4D:06", "00:1A:2B:3C:4D:07", "00:1A:2B:3C:4D:08"];
      this.collectionData = Array.from({ length: pick([5, 6, 7, 8], 5, S) }).map((_, i) => ({
        ip: ips[i],
        hostname: hostnames[i],
        os: oss[i],
        ports: portsList[i],
        services: servicesList[i],
        mac: macs[i],
        status: pick(["在线", "在线", "在线", "离线"], i + 6, S),
      }));
      this.collectionVisible = true;
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
    handleApprovalPass() {
      var pending = this.approvalSteps.find(function(s) { return s.status === "待审批" || s.status === "审批中"; });
      if (pending) {
        pending.status = "已通过";
        pending.time = this.now();
        pending.remark = "同意，符合规范";
      }
      var passed = this.approvalSteps.filter(function(s) { return s.status === "已通过"; }).length;
      this.approvalProgress = Math.round((passed / this.approvalSteps.length) * 100);
      this.approvalFinalStatus = passed === this.approvalSteps.length ? "已通过" : "审批中";
      if (this.approvalProgress === 100) {
        this.$message.success("审批已全部通过");
      } else {
        this.$message.success("已通过，进入下一审批层级");
      }
    },
    handleApprovalReject() {
      var pending = this.approvalSteps.find(function(s) { return s.status === "待审批" || s.status === "审批中"; });
      if (pending) {
        pending.status = "已驳回";
        pending.time = this.now();
        pending.remark = "资料不全，退回补充";
      }
      this.approvalFinalStatus = "已驳回";
      this.$message.warning("已驳回，流程终止");
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
    openInputRequestDialog(functionName, S, now) {
      this.inputReqTitle = functionName;
      this.inputReqSubmitted = false;
      this.inputReqForm = { type: "数据查询", target: "", timeout: "30s", priority: "中", content: "" };
      this.inputReqStats = [];
      this.inputReqProgress = 0;
      this.inputReqLog = [];
      this.inputReqVisible = true;
    },
    submitInputReq() {
      const S = pageHash(this.inputReqTitle);
      this.inputReqStats = [
        { label: "请求类型", value: this.inputReqForm.type },
        { label: "目标系统", value: this.inputReqForm.target || "默认系统" },
        { label: "超时设置", value: this.inputReqForm.timeout },
        { label: "优先级", value: this.inputReqForm.priority },
        { label: "队列深度", value: pick([0, 3, 7, 15, 28], 0, S) + "" },
        { label: "处理状态", value: "已完成" },
      ];
      this.inputReqProgress = 100;
      this.inputReqLog = [
        { time: this.now(), level: "INFO", msg: "请求已提交，正在处理..." },
        { time: this.now(), level: "INFO", msg: "参数校验通过，已加入处理队列" },
        { time: this.now(), level: pick(["INFO", "WARN"], 4, S), msg: pick(["请求处理完成", "队列积压告警", "线程池扩容", "请求参数校验通过"], 5, S) },
      ];
      this.inputReqSubmitted = true;
      this.$message.success("请求已提交");
    },
    confirmInputReqReceive() {
      const now = this.now();
      const base = this.allTableData[0] ? { ...this.allTableData[0] } : {};
      const newRow = { ...base };
      newRow["ID"] = this.nextId();
      const timeCol = this.tableColumns.find(c => /时间/.test(c.prop));
      if (timeCol) newRow[timeCol.prop] = now;
      this.allTableData.unshift(newRow);
      this.pageOptions.pageNum = 1;
      this.fetchData();
      this.inputReqVisible = false;
      this.$message.success("已确认接收，数据已入库");
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
    downloadImportTemplateFn() {
      const columns = this.tableColumns.filter(c => c.slot !== "operate" && c.prop && c.label);
      const sampleRows = [0, 1, 2].map(i => {
        return columns.reduce((acc, c) => {
          var val = "";
          if (/编号|ID/i.test(c.prop)) val = "TEMPLATE-" + String(i + 1).padStart(4, "0");
          else if (/名称|类型/.test(c.prop)) val = "示例" + c.label + (i + 1);
          else if (/时间/.test(c.prop)) val = "2026-06-2" + i + " 10:00:00";
          else if (/状态/.test(c.prop)) val = ["待处理", "处理中", "已完成"][i];
          else if (/负责人|操作人|处理人/.test(c.prop)) val = ["王建国", "李明辉", "张晓峰"][i];
          else if (/数量|次数|端口/.test(c.prop)) val = String((i + 1) * 100);
          else val = c.label + "示例" + (i + 1);
          acc[c.label] = val;
          return acc;
        }, {});
      });
      import("@/utils/index").then(({ exportXLSX }) => {
        exportXLSX(sampleRows, (this.importTitle || "导入") + "模板");
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
      exportXLSX(rows, functionName || "部侧结果上报流程管理导出");
      this.$message.success("导出成功");
    },
    buildExportRows(functionName) {
      if (/数据导出|信息导出|列表导出|全量/.test(functionName)) {
        return this.allTableData;
      }
      if (/执行状态|日志/.test(functionName)) {
        return [
          { 名称: functionName.replace(/导出/g, ""), 状态: "执行成功", 日志: "任务已完成，回执校验通过" },
          { 名称: "部侧结果上报流程管理任务调度", 状态: "执行中", 日志: "正在等待节点返回执行结果" },
          { 名称: "部侧结果上报流程管理异常检查", 状态: "已告警", 日志: "发现1条超时记录，已进入重试队列" },
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
        { 业务名称: "部侧结果上报流程管理业务记录", 业务状态: "已处理", 处理时间: this.now(), 说明: "模拟业务记录" },
        { 业务名称: "部侧结果上报流程管理复核记录", 业务状态: "待复核", 处理时间: this.now(), 说明: "等待人工确认" },
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
        { label: "所属页面", value: "部侧结果上报流程管理" },
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
          { label: "操作人", value: "王建国" },
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
