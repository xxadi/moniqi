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
        <el-table-column slot="operate" label="操作" width="200" fixed="right" style="white-space: nowrap;">
          <template slot-scope="scope">
            <el-button type="text" icon="el-icon-edit-outline" @click="detail(scope.row)">详情</el-button>
            <el-button type="text" icon="el-icon-edit-outline" @click="exportData(scope.row)">校验数据</el-button>
          </template>
        </el-table-column>
      </cs-pagetable>
    </div>
    <!-- 编辑 -->
    <FormEdit ref="editComponent" :configData="tableColumns" @addItem="addItem" @updateItem="updateItem" />
  </div>
</template>
<script>
/*eslint-disable */
import FormEdit from "./FormEdit.vue";
import { filterData, exportXLSX, downloadMockFile } from "@/utils/index";
export default {
  name: "usersView",
  components: {
    FormEdit,
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
    // 导入
    handleImport() {
      const input = document.createElement("input");
      input.type = "file";
      input.style.display = "none"; // 隐藏input元素
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) {
          // 如果没有选择文件，也要清理input元素
          if (input.parentNode) {
            document.body.removeChild(input);
          }
          return;
        }
        // 处理文件导入逻辑
        const row = JSON.parse(JSON.stringify(window["指令清单_导入"]));

        row.forEach((item) => {
          item.序号 = window.makeRadom(8);
        });

        this.allTableData.push(...row);
        this.fetchData();

        // 清理input元素
        if (input.parentNode) {
          document.body.removeChild(input);
        }
    };

      // 将input添加到DOM中
      document.body.appendChild(input);
      input.click();
    },
    // 导出
    exportFile() {
      exportXLSX(this.allTableData, this.exportFileName);
    },
  },
};
</script>
