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
          <el-button plain type="primary" icon="el-icon-edit-outline" @click='handleFunction("新增时效状态查询信息", "form")'>新增时效状态查询信息</el-button>
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
          <el-input v-else v-model="formData[col.prop]"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { exportXLSX } from "@/utils";
import { filterData } from "@/utils/index.js";

const tableColumns = [
  { prop: "ID", label: "ID", type: "text", width: 80 },
  { prop: "查询编号", label: "查询编号", type: "text", search: true, showTooltip: true },
  { prop: "查询类型", label: "查询类型", type: "select", search: true, showTooltip: true, options: ["实时查询", "定时查询", "批量查询", "条件查询"] },
  { prop: "查询状态", label: "查询状态", type: "select", search: true, showTooltip: true, options: ["待查询", "查询中", "已完成", "查询失败", "超时"] },
  { prop: "上报时效", label: "上报时效", type: "text", search: false, showTooltip: true },
  { prop: "负责人", label: "负责人", type: "text", search: false, showTooltip: true },
  { prop: "查询时间", label: "查询时间", type: "text", search: false, showTooltip: true, width: 170 },
  { prop: "状态", label: "状态", type: "select", search: true, showTooltip: true, options: ["待处理", "处理中", "已完成", "处理失败", "已暂停", "异常"] },
  { slot: "operate" },
];

const defaultRow = {};
tableColumns.forEach((col) => { defaultRow[col.prop] = ""; });

const namePool = ["安全组-王建国", "运维组-李明辉", "网络组-张晓峰", "系统组-刘志远", "安全组-陈思涵", "运维组-赵鹏飞"];
const statusPool = ["待处理", "处理中", "已完成", "处理失败", "异常"];
const queryTypePool = ["实时查询", "定时查询", "批量查询", "条件查询"];
const queryStatusPool = ["待查询", "查询中", "已完成", "查询失败", "超时"];

function genInitialRows(count) {
  const rows = [];
  for (let i = 0; i < count; i++) {
    const row = { ...defaultRow };
    row["ID"] = i + 1;
    row["查询编号"] = "QS-" + String(2024000 + i);
    row["查询类型"] = queryTypePool[i % queryTypePool.length];
    row["查询状态"] = queryStatusPool[i % queryStatusPool.length];
    row["上报时效"] = pick(["120ms", "256ms", "512ms", "1.2s", "2.5s"], i);
    row["负责人"] = namePool[i % namePool.length];
    row["查询时间"] = genRecentTime(i);
    row["状态"] = statusPool[i % statusPool.length];
    rows.push(row);
  }
  return rows;
}

function pick(arr, idx) { return arr[idx % arr.length]; }

function genRecentTime(offset) {
  const d = new Date();
  d.setDate(d.getDate() - (offset % 30));
  d.setHours(8 + (offset % 12), offset % 60, 0, 0);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") + ":00";
}

export default {
  name: "指令上报时效状态查询信息管理",
  data() {
    return {
      searchData: {},
      searchConfig: [],
      allTableData: genInitialRows(8),
      tableData: [],
      selectedRows: [],
      tableColumns,
      pageTotal: 0,
      pageOptions: { pageNum: 1, pageSize: 10 },
      formVisible: false,
      formMode: "add",
      formTitle: "新增",
      formData: { ...defaultRow },
    };
  },
  computed: {
    editableColumns() {
      return this.tableColumns.filter((c) => c.prop !== "ID");
    },
  },
  created() {
    this.fetchData();
  },
  methods: {
    now() {
      const d = new Date();
      return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") + ":" + String(d.getSeconds()).padStart(2, "0");
    },
    nextId() {
      return this.allTableData.length > 0 ? Math.max(...this.allTableData.map((r) => Number(r["ID"]) || 0)) + 1 : 1;
    },
    fetchData() {
      const mockData = filterData(this.allTableData, this.searchData);
      const start = (this.pageOptions.pageNum - 1) * this.pageOptions.pageSize;
      const end = start + this.pageOptions.pageSize;
      this.tableData = mockData.slice(start, end);
      this.pageTotal = mockData.length;
    },
    search(val) {
      this.searchData = val;
      this.pageOptions.pageNum = 1;
      this.fetchData();
    },
    reset() {
      this.searchData = {};
      this.pageOptions.pageNum = 1;
      this.fetchData();
    },
    handleSelectionChange(rows) {
      this.selectedRows = rows;
    },
    isStatusField(prop) {
      return /状态|类型/.test(prop);
    },
    handleFunction(functionName, type) {
      if (type === "form") {
        this.formMode = "add";
        this.formTitle = functionName;
        this.formData = { ...defaultRow };
        this.formVisible = true;
      }
    },
    openEdit(row) {
      this.formMode = "edit";
      this.formTitle = "修改";
      this.formData = { ...row };
      this.formVisible = true;
    },
    submitForm() {
      if (this.formMode === "add") {
        const newRow = { ...this.formData, ID: this.nextId() };
        this.allTableData.unshift(newRow);
      } else {
        const idx = this.allTableData.findIndex((r) => r.ID === this.formData.ID);
        if (idx !== -1) this.allTableData.splice(idx, 1, { ...this.formData });
      }
      this.formVisible = false;
      this.pageOptions.pageNum = 1;
      this.fetchData();
      this.$message.success("保存成功");
    },
    deleteRow(row) {
      this.$confirm("确定删除该记录？", "提示", { type: "warning" }).then(() => {
        this.allTableData = this.allTableData.filter((r) => r.ID !== row.ID);
        this.fetchData();
        this.$message.success("删除成功");
      }).catch(() => {});
    },
  },
};
</script>
