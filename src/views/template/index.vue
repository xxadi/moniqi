<template>
  <div>
    <cs-searchpanel :searchConfig="searchConfig" :searchData="searchData" @handelSearch="search" @handelReset="reset"
      labelWidth="100px"></cs-searchpanel>
    <div class="mt10 crud-container">
      <div class="mb10 operate-container">
        <div>
          <el-button plain type="primary" icon="el-icon-plus" @click="add">新增</el-button>
          <el-button plain type="primary" icon="el-icon-download" @click="handleImport">导入</el-button>
          <el-button plain type="primary" icon="el-icon-upload2" @click="exportFile">导出</el-button>
        </div>
      </div>
      <cs-pagetable pageTableRef="pageTableRef" :tableData="tableData" :tableColumns="tableColumns"
        :pageTotal="pageTotal" :page.sync="pageOptions.pageNum" :limit.sync="pageOptions.pageSize"
        @handleCurrentChange="fetchData" @handleSizeChange="fetchData">
        <el-table-column slot="operate" label="操作" width="260" fixed="right" style="white-space: nowrap;">
          <template slot-scope="scope">
            <el-button type="text" icon="el-icon-edit-outline" @click="detail(scope.row)">详情</el-button>
            <el-button type="text" icon="el-icon-edit-outline" @click="exportData(scope.row)">校验数据</el-button>
            <el-button type="text" icon="el-icon-delete" style="color:#F56C6C" @click="deleteRow(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </cs-pagetable>
    </div>
    <!-- 编辑 -->
    <FormEdit ref="editComponent" :configData="tableColumns" @addItem="addItem" @updateItem="updateItem" />
    <!-- 导入 -->
    <ImportDialog ref="importDialog" :tableColumns="tableColumns" :templateName="exportFileName" @import="onImport" />
  </div>
</template>
<script>
import FormEdit from "./FormEdit.vue";
import ImportDialog from "./ImportDialog.vue";
import { filterData, exportXLSX, downloadMockFile } from "@/utils/index";
export default {
  name: "usersView",
  components: {
    FormEdit,
    ImportDialog,
  },
  data() {
    return {
      searchData: {},
      searchConfig: [],
      exportFileName: "指令清单", //导出文件名
      tableLoading: false,
      allTableData: window.指令清单,
      tableData: [],
      tableColumns: [
        { prop: "指令ID", label: "指令ID", type: "text", search: true },
        {
          prop: "指令状态",
          label: "指令状态",
          type: "select",
          options: [
            {
              value: "已完成",
              label: "已完成",
            },
            {
              value: "失败",
              label: "失败",
            },
          ],
          search: true,
        },
        {
          prop: "指令类型",
          label: "指令类型",
          type: "select",
          options: [
            {
              value: "查询指令",
              label: "查询指令",
            },
            {
              value: "资产扫描指令",
              label: "资产扫描指令",
            },
            {
              value: "资产核查指令",
              label: "资产核查指令",
            },
            {
              value: "数据采集指令",
              label: "数据采集指令",
            },
            {
              value: "配置下发指令",
              label: "配置下发指令",
            },
          ],
          search: true,
        },
        {
          prop: "指令解析结果",
          label: "指令解析结果",
          type: "select",
          options: [
            {
              value: "成功",
              label: "成功",
            },
            {
              value: "失败",
              label: "失败",
            },
          ],
          search: true,
        },
        { prop: "指令时间", label: "指令时间", type: "text" },
        { slot: "operate", label: "操作" },
      ],
      pageTotal: 0,
      pageOptions: {
        pageNum: 1,
        pageSize: 10,
      },
    };
  },
  created() {
    this.initConfig();
  },
  mounted() {
    // 页面加载时获取数据
    this.fetchData();
  },
  methods: {
    // 初始化查询项
    initConfig() {
      this.searchConfig = this.tableColumns
        .map(
          (item) => item.type && item.search && { ...item, field: item.prop },
        )
        .filter(Boolean);
    },
    // 模拟获取表格数据
    fetchData() {
      this.tableLoading = true;
      // 模拟API请求
      setTimeout(() => {
        // 假数据
        const mockData = filterData(this.allTableData, this.searchData);
        // 模拟分页数据
        const start =
          (this.pageOptions.pageNum - 1) * this.pageOptions.pageSize;
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
      const params = {
        ...item,
        序号: this.allTableData.length + 1,
      };
      this.allTableData.unshift(params);
      this.fetchData();
    },
    edit(row) {
      this.$refs.editComponent.edit(row);
    },
    updateItem(item) {
      this.allTableData.some((u) => {
        if (u.序号 === item.序号) {
          Object.keys(u).map((key) => (u[key] = item[key]));
          return true;
        }
    });
      this.fetchData();
    },
    detail(row) {
      this.$refs.editComponent.detail(row);
    },
    exportData() {
      // 下载本地文件
      downloadMockFile("校验数据.docx");
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
    // 导入
    handleImport() {
      this.$refs.importDialog.open();
    },
    onImport(importData) {
      // 导入数据，添加序号
      importData.forEach((item) => {
        const newRow = { ...item };
        // 如果没有序号则生成
        if (!newRow.序号) {
          newRow.序号 = window.makeRadom ? window.makeRadom(8) : this.allTableData.length + 1;
        }
        this.allTableData.push(newRow);
      });
      this.fetchData();
    },
    // 导出
    exportFile() {
      exportXLSX(this.allTableData, this.exportFileName);
    },
  },
};
</script>
