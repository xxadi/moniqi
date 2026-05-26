<template>
  <div>
    <cs-searchpanel :searchConfig="searchConfig" :searchData="searchData" @handelSearch="search"
      @handelReset="reset"></cs-searchpanel>
    <div class="mt10 crud-container">
      <div class="mb10 operate-container">
        <div>
          <el-button plain type="primary" icon="el-icon-plus" @click="add">新增</el-button>
          <el-button plain type="primary" icon="el-icon-upload2" @click="handleImport">导入</el-button>
          <el-button plain type="primary" icon="el-icon-download" @click="exportFile">导出</el-button>
        </div>
      </div>
      <cs-pagetable pageTableRef="pageTableRef" :tableData="tableData" :tableColumns="tableColumns"
        :pageTotal="pageTotal" :page.sync="pageOptions.pageNum" :limit.sync="pageOptions.pageSize"
        @handleCurrentChange="fetchData" @handleSizeChange="fetchData">
        <el-table-column slot="operate" label="操作" width="180">
          <template slot-scope="scope">
            <el-button type="text" icon="el-icon-tickets" @click="detail(scope.row)">详情</el-button>
            <el-button type="text" icon="el-icon-edit" @click="edit(scope.row)">编辑</el-button>
            <el-button type="text" icon="el-icon-delete" @click="del(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </cs-pagetable>
    </div>
    <!-- 编辑 -->
    <FormEdit ref="editComponent" :configData="tableColumns" @addItem="addItem" @updateItem="updateItem" />
  </div>
</template>
<script>
import FormEdit from "./FormEdit.vue";
import { filterData, exportXLSX } from "@/utils/index";
export default {
  name: "usersView",
  components: {
    FormEdit,
  },
  data() {
    return {
      searchData: {},
      searchConfig: [],
      exportFileName: "用户管理", //导出文件名
      tableLoading: false,
      allTableData: window.用户管理,
      tableData: [],
      tableColumns: [
        { prop: "用户名", label: "用户名", type: "text" },
        { prop: "邮箱", label: "邮箱", type: "text" },
        { prop: "手机号", label: "手机号", type: "text" },
        {
          prop: "状态",
          label: "状态",
          type: "select",
          options: [
            { label: "正常", value: "正常" },
            { label: "停用", value: "停用" },
          ],
        },
        { prop: "到期时间", label: "到期时间", type: "datePicker" },
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
        .map((item) => item.type && { ...item, field: item.prop })
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
    // 删除
    del(row) {
      // 删除逻辑
      this.$confirm("此操作将永久删除此数据, 是否继续?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        cancelButtonClass: "cancel-button-class",
        type: "warning",
      })
        .then(() => {
          this.allTableData = this.allTableData.filter(
            (u) => u.序号 !== row.序号
          );

          this.$message({
            showClose: true,
            type: "success",
            message: "删除成功",
          });
          this.search();
        })
        .catch(() => {
          this.$message({ showClose: true, type: "info", message: "已取消" });
        });
    },
    // 导入
    handleImport() {
      const input = document.createElement("input");
      input.type = "file";
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        document.body.removeChild(input);
      };
      input.click();
    },
    // 导出
    exportFile() {
      exportXLSX(this.allTableData, this.exportFileName);
    },
  },
};
</script>
