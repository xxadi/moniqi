<template>
  <div>
    <cs-searchpanel :searchConfig="searchConfig" :searchData="searchData" @handelSearch="search" @handelReset="reset"
      labelWidth="100px"></cs-searchpanel>
    <div class="mt10 crud-container">
      <div class="mb10 operate-container">
        <div>
          <el-button plain type="primary" icon="el-icon-plus" @click="add">新增</el-button>
          
          
          <el-button plain type="primary" icon="el-icon-data-analysis" @click="showstatisticsForm">统计</el-button>
          <el-button plain type="primary" icon="el-icon-data-analysis" @click="showanalyzeForm">分析</el-button>
        </div>
      </div>
      <cs-pagetable pageTableRef="pageTableRef" :tableData="tableData" :tableColumns="tableColumns"
        :pageTotal="pageTotal" :page.sync="pageOptions.pageNum" :limit.sync="pageOptions.pageSize"
        @handleCurrentChange="fetchData" @handleSizeChange="fetchData">
        <el-table-column slot="operate" label="操作" :min-width="220" fixed="right" style="white-space: nowrap">
          <template slot-scope="scope">
            <el-button type="text" icon="el-icon-edit" @click="edit(scope.row)">修改</el-button>
            <el-button type="text" icon="el-icon-delete" @click="deleteItem(scope.row)">删除</el-button>
            <el-button type="text" icon="el-icon-data-analysis" @click="showstatisticsForm(scope.row)">统计</el-button>
            <el-button type="text" icon="el-icon-s-data" @click="showanalyzeForm(scope.row)">分析</el-button>
          </template>
        </el-table-column>
      </cs-pagetable>
    </div>
    <!-- 编辑 -->
    <FormEdit ref="editComponent" :configData="tableColumns" @addItem="addItem" @updateItem="updateItem" />
    <!-- 导入弹窗 -->
    <ImportDialog ref="importDialog" :tableColumns="tableColumns" :templateName="exportFileName" @import="onImport" />
    
    <!-- 统计弹窗 -->
    <el-dialog title="统计" :visible.sync="statisticsDialogVisible" width="50%" :before-close="closestatisticsForm" append-to-body>
      <el-form :model="statisticsFormData" label-width="100px">
        
        <el-form-item label="统计维度">
          <el-input v-model="statisticsFormData.统计维度" placeholder="请输入"></el-input>
        </el-form-item>
        <el-form-item label="统计周期">
          <el-input v-model="statisticsFormData.统计周期" placeholder="请输入"></el-input>
        </el-form-item>
        <el-form-item label="统计结果">
          <el-input v-model="statisticsFormData.统计结果" placeholder="请输入"></el-input>
        </el-form-item>
        <el-form-item label="说明">
          <el-input type="textarea" v-model="statisticsFormData.说明"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closestatisticsForm">取 消</el-button>
        <el-button type="primary" @click="submitstatisticsForm">确 定</el-button>
      </span>
    </el-dialog>
    <!-- 分析弹窗 -->
    <el-dialog title="分析" :visible.sync="analyzeDialogVisible" width="50%" :before-close="closeanalyzeForm" append-to-body>
      <el-form :model="analyzeFormData" label-width="100px">
        
        <el-form-item label="分析维度">
          <el-input v-model="analyzeFormData.分析维度" placeholder="请输入"></el-input>
        </el-form-item>
        <el-form-item label="分析范围">
          <el-input v-model="analyzeFormData.分析范围" placeholder="请输入"></el-input>
        </el-form-item>
        <el-form-item label="分析结果">
          <el-input type="textarea" v-model="analyzeFormData.分析结果"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeanalyzeForm">取 消</el-button>
        <el-button type="primary" @click="submitanalyzeForm">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import FormEdit from "./FormEdit.vue";
import ImportDialog from "./ImportDialog.vue";
import { filterData, exportXLSX } from "@/utils/index";

export default {
  name: "IP扫描/采集完整性校验规则管理",
  components: {
    FormEdit,
    ImportDialog,
  },
  data() {
    return {
      searchData: {},
      searchConfig: [],
      exportFileName: "IP扫描/采集完整性校验规则",
      tableLoading: false,
      allTableData: [],
      tableData: [],
      tableColumns: [
        { prop: "ID", label: "ID", type: "text" },
        { prop: "编号", label: "编号", type: "text", search: true },
        { prop: "状态", label: "状态", type: "select", options: ["待处理", "进行中", "已完成", "失败", "已禁用"] },
        { prop: "创建时间", label: "创建时间", type: "text" },
        { prop: "更新时间", label: "更新时间", type: "text" },
        { prop: "操作人", label: "操作人", type: "text" },
        { prop: "任务名称", label: "任务名称", type: "text", search: true },
        { prop: "任务类型", label: "任务类型", type: "text" },
        { prop: "执行周期", label: "执行周期", type: "text" },
        { prop: "IP范围", label: "IP范围", type: "text" },
        { prop: "扫描结果", label: "扫描结果", type: "text" },
        { slot: "operate", label: "操作" }
      ],
      pageTotal: 0,
      pageOptions: {
        pageNum: 1,
        pageSize: 10,
      },
      
      statisticsDialogVisible: false,
      statisticsFormData: {
        统计维度: '',
        统计周期: '',
        统计结果: '',
        说明: ''
      },
      analyzeDialogVisible: false,
      analyzeFormData: {
        分析维度: '',
        分析范围: '',
        分析结果: ''
      },
    };
  },
  created() {
    this.initConfig();
    this.initMockData();
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    initConfig() {
      this.searchConfig = this.tableColumns
        .map((item) => item.type && item.search && { ...item, field: item.prop })
        .filter(Boolean);
    },
    initMockData() {
      const statuses = ["待处理", "进行中", "已完成", "失败", "已禁用"];
      const mockData = [];
      for (let i = 1; i <= 12; i++) {
        mockData.push({
          ID: i,
          编号: "NO" + String(1000 + i),
          状态: statuses[i % statuses.length],
          创建时间: "2026-05-" + String(i % 9 + 1).padStart(2, "0") + " 12:00:00",
          更新时间: "2026-05-" + String(i % 9 + 1).padStart(2, "0") + " 14:30:00",
          操作人: ["张三", "李四", "王五", "管理员"][i % 4],
          任务名称: '任务名称' + i,
          任务类型: '任务类型' + i,
          执行周期: '执行周期' + i,
          IP范围: 'IP范围' + i,
          扫描结果: '扫描结果' + i
        });
      }
      this.allTableData = mockData;
    },
    fetchData() {
      this.tableLoading = true;
      setTimeout(() => {
        const mockData = filterData(this.allTableData, this.searchData);
        const start = (this.pageOptions.pageNum - 1) * this.pageOptions.pageSize;
        const end = start + this.pageOptions.pageSize;
        this.tableData = mockData.slice(start, end);
        this.pageTotal = mockData.length;
        this.tableLoading = false;
      }, 100);
    },
    search() {
      this.pageOptions.pageNum = 1;
      this.fetchData();
    },
    reset() {
      this.searchData = {};
      this.search();
    },
    add() {
      this.$refs.editComponent.add();
    },
    addItem(item) {
      const params = { ...item, ID: this.allTableData.length + 1 };
      this.allTableData.unshift(params);
      this.fetchData();
      this.$message.success("新增成功");
    },
    edit(row) {
      this.$refs.editComponent.edit(row);
    },
    updateItem(item) {
      this.allTableData.some((u) => {
        if (u.ID === item.ID) {
          Object.keys(u).map((key) => (u[key] = item[key]));
          return true;
        }
    });
      this.fetchData();
      this.$message.success("修改成功");
    },
    deleteItem(row) {
      this.$confirm("确定要删除此条记录吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        this.allTableData = this.allTableData.filter((item) => item.ID !== row.ID);
        this.fetchData();
        this.$message.success("删除成功");
      });
    },
    handleImport() {
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
      this.$message.success("导入成功，共 " + importData.length + " 条数据");
    },
    exportFile() {
      exportXLSX(this.allTableData, this.exportFileName);
      this.$message.success("导出成功");
    },
    
    showstatisticsForm() {
      this.statisticsFormData = { 统计维度: '', 统计周期: '', 统计结果: '', 说明: '' };
      this.statisticsDialogVisible = true;
    },
    closestatisticsForm() {
      this.statisticsDialogVisible = false;
    },
    submitstatisticsForm() {
      this.$message.success("统计成功");
      this.closestatisticsForm();
      this.fetchData();
    },
    showanalyzeForm() {
      this.analyzeFormData = { 分析维度: '', 分析范围: '', 分析结果: '' };
      this.analyzeDialogVisible = true;
    },
    closeanalyzeForm() {
      this.analyzeDialogVisible = false;
    },
    submitanalyzeForm() {
      this.$message.success("分析成功");
      this.closeanalyzeForm();
      this.fetchData();
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
  align-items: center;
}
.mt10 {
  margin-top: 10px;
}
.mb10 {
  margin-bottom: 10px;
}
</style>