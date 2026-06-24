<template>
  <div>
    <cs-searchpanel :searchConfig="searchConfig" :searchData="searchData" @handelSearch="search" @handelReset="reset" labelWidth="100px"></cs-searchpanel>
    <div class="mt10 crud-container">
      <div class="mb10 operate-container">
        <div class="function-actions">
          <el-button plain type="primary" icon="el-icon-edit-outline" @click="handleFunction('新增所属安全域考核质量可用性上传任务')">新增所属安全域考核质量可用性上传任务</el-button>
          <el-button plain type="danger" icon="el-icon-delete" @click="handleFunction('删除所属安全域考核质量可用性上传任务')">删除所属安全域考核质量可用性上传任务</el-button>
          <el-button plain type="primary" icon="el-icon-edit" @click="handleFunction('修改所属安全域考核质量可用性上传任务')">修改所属安全域考核质量可用性上传任务</el-button>
          <el-button plain type="primary" icon="el-icon-search" @click="handleFunction('查询所属安全域考核质量可用性上传任务')">查询所属安全域考核质量可用性上传任务</el-button>
          <el-button plain type="primary" icon="el-icon-refresh" @click="handleFunction('所属安全域考核质量可用性上传任务启用/禁用')">所属安全域考核质量可用性上传任务启用/禁用</el-button>
          <el-button plain type="primary" icon="el-icon-upload" @click="handleFunction('所属安全域考核质量可用性稽核数据上传')">所属安全域考核质量可用性稽核数据上传</el-button>
          <el-button plain type="primary" icon="el-icon-monitor" @click="handleFunction('所属安全域考核质量可用性稽核数据接口监控')">所属安全域考核质量可用性稽核数据接口监控</el-button>
        </div>
        <el-button type="text" icon="el-icon-back" @click="$router.back()">返回上级</el-button>
      </div>
      <cs-pagetable pageTableRef="pageTableRef" :showSelection="true" :tableData="tableData" :tableColumns="tableColumns" :pageTotal="pageTotal" :page.sync="pageOptions.pageNum" :limit.sync="pageOptions.pageSize" @handleSelectionChange="handleSelectionChange" @handleSelectAll="handleSelectionChange" @handleCurrentChange="fetchData" @handleSizeChange="fetchData">
        <el-table-column slot="operate" label="操作" width="260" fixed="right">
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
          <el-select v-if="/状态/.test(col.prop) || /上传状态/.test(col.prop)" v-model="formData[col.prop]" style="width:100%">
            <el-option v-for="opt in (col.options || [])" :key="opt.value" :label="opt.label" :value="opt.value"></el-option>
          </el-select>
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
  </div>
</template>

<script>
import { filterData, exportXLSX, getActionType, getButtonIcon } from "@/utils/index";

const rows = [
  { ID: 1, 任务编号: "SAR-001", 任务名称: "React开源框架数据采集上传", 上传状态: "已完成", 上传时间: "2026-06-01 10:00:00", 数据量: "12580", 负责人: "张明" },
  { ID: 2, 任务编号: "SAR-002", 任务名称: "Vue.js开源框架数据采集上传", 上传状态: "上传中", 上传时间: "2026-06-02 14:30:00", 数据量: "9832", 负责人: "李华" },
  { ID: 3, 任务编号: "SAR-003", 任务名称: "Angular开源框架数据采集上传", 上传状态: "待上传", 上传时间: "2026-06-03 09:15:00", 数据量: "7654", 负责人: "王芳" },
  { ID: 4, 任务编号: "SAR-004", 任务名称: "Spring Boot开源框架数据采集上传", 上传状态: "失败", 上传时间: "2026-06-04 16:20:00", 数据量: "5421", 负责人: "赵强" },
  { ID: 5, 任务编号: "SAR-005", 任务名称: "Django开源框架数据采集上传", 上传状态: "已完成", 上传时间: "2026-06-05 08:45:00", 数据量: "3210", 负责人: "刘洋" },
];
const cols = [
  { prop: "任务编号", label: "任务编号", type: "text", search: true },
  { prop: "任务名称", label: "任务名称", type: "text", search: true },
  { prop: "上传状态", label: "上传状态", type: "select", options: [{ value: "待上传", label: "待上传" }, { value: "上传中", label: "上传中" }, { value: "已完成", label: "已完成" }, { value: "失败", label: "失败" }], search: true },
  { prop: "上传时间", label: "上传时间", type: "text", width: 170 },
  { prop: "数据量", label: "数据量", type: "text" },
  { prop: "负责人", label: "负责人", type: "text", search: true },
  { slot: "operate", label: "操作" },
];
const defaultRow = { 任务编号: "", 任务名称: "", 上传状态: "待上传", 上传时间: "", 数据量: "", 负责人: "" };

export default {
  name: "XiangMuWanZhengXing_SuoShuAnQuanYu_ShangChuanRenWu",
  data() {
    return {
      searchData: {},
      searchConfig: [],
      allTableData: rows.map((item) => ({ ...item })),
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
    };
  },
  computed: {
    editableColumns() {
      return this.tableColumns.filter((item) => item.prop && item.prop !== "ID");
    },
  },
  created() {
    this.initConfig();
    this.fetchData();
  },
  methods: {
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
    handleSelectionChange(selection) {
      this.selectedRows = selection || [];
    },
    handleFunction(name) {
      this.activeFunction = name;
      const type = getActionType(name);
      if (/新增/.test(name)) {
        this.formMode = "add";
        this.formTitle = name;
        this.formData = { ...defaultRow };
        this.formVisible = true;
      } else if (/修改/.test(name)) {
        this.formMode = "edit";
        this.formTitle = name;
        this.formData = { ...(this.tableData[0] || defaultRow) };
        this.formVisible = true;
      } else if (/查询/.test(name)) {
        if (!this.selectedRows.length) { this.$message.warning("请先选择要查看的记录"); return; }
        this.openDetail(this.selectedRows[0]);
      } else if (type === "delete") {
        if (!this.selectedRows.length) { this.$message.warning("请先选择要删除的记录"); return; }
        this.$confirm("确定要执行【" + name + "】删除选中的 " + this.selectedRows.length + " 条记录吗？", "提示", { type: "warning" }).then(() => {
          const ids = new Set(this.selectedRows.map((r) => r.ID));
          this.allTableData = this.allTableData.filter((item) => !ids.has(item.ID));
          this.fetchData();
          this.$message.success("删除成功，共删除 " + ids.size + " 条记录");
        }).catch(() => {});
      } else if (/启用.*禁用/.test(name)) {
        if (!this.selectedRows.length) { this.$message.warning("请先选择要操作的记录"); return; }
        const row = this.selectedRows[0];
        const newStatus = row.上传状态 === "已完成" ? "待上传" : "已完成";
        const index = this.allTableData.findIndex((item) => item.ID === row.ID);
        if (index !== -1) {
          this.$set(this.allTableData[index], "上传状态", newStatus);
          this.fetchData();
          this.$message.success("任务已" + (newStatus === "已完成" ? "启用" : "禁用") + "成功");
        }
      } else if (/上传/.test(name) && /稽核数据/.test(name) && !/监控/.test(name)) {
        this.$message.success("所属安全域考核质量可用性稽核数据上传 - 上传演示成功，数据已提交处理");
      } else if (/监控/.test(name)) {
        this.$message.info("所属安全域考核质量可用性稽核数据接口监控 - 接口监控演示：当前监控接口3个，全部正常运行");
      } else {
        this.$message.info(name + " - 功能演示");
      }
    },
    openEdit(row) {
      this.formMode = "edit";
      this.formTitle = "修改";
      this.formData = { ...row };
      this.formVisible = true;
    },
    openDetail(row) {
      this.detailTitle = "详情";
      this.detailFields = this.editableColumns.map((col) => ({
        label: col.label,
        value: row[col.prop] || "-",
      }));
      this.detailVisible = true;
    },
    submitForm() {
      if (this.formMode === "add") {
        const newRow = { ...this.formData, ID: this.nextId() };
        this.allTableData.unshift(newRow);
      } else {
        const index = this.allTableData.findIndex((item) => item.ID === this.formData.ID);
        if (index !== -1) {
          this.$set(this.allTableData, index, { ...this.formData });
        }
      }
      this.formVisible = false;
      this.fetchData();
      this.$message.success("操作成功");
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
.detail-form .el-form-item { margin-bottom: 8px; }
</style>
