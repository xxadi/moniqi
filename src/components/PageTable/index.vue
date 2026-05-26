<template>
  <div class="page-table">
    <el-table
      :ref="pageTableRef"
      v-loading="loading"
      :data="tableData"
      :stripe="stripe"
      :border="border"
      :size="size"
      :maxHeight="maxHeight"
      :show-header="showHeader"
      :header-cell-style="headerClassName"
      @select-all="handleSelectAll"
      @select="handleSelectionChange"
    >
      <el-table-column
        v-if="showSelection"
        type="selection"
        width="55"
        align="center"
      />
      <!-- <el-table-column v-if="showIndex" label="序号" type="index" width="60" /> -->
      <template v-for="(col, index) in tableColumns">
        <!-- 自定义列 -->
        <slot v-if="col.slot" :name="col.slot" />
        <el-table-column
          v-else-if="col.label !== '序号'"
          :key="index"
          :prop="col.prop"
          :label="col.label"
          :width="col.width ? col.width : ''"
          :align="col.align ? col.align : ''"
          :show-overflow-tooltip="col.showTooltip"
        />
      </template>
    </el-table>
    <el-pagination
      v-if="showPagination"
      style="text-align: right; margin-top: 10px"
      layout="total, prev, pager, next, sizes"
      :page-sizes="pageSizes"
      :current-page.sync="currentPageEl"
      :page-size.sync="pageSizeEl"
      :total="pageTotal"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>
<script>
export default {
  name: "PageTable",
  props: {
    pageTableRef: {
      type: String,
      default: () => "pageTableRef",
    },
    loading: {
      type: Boolean,
      default: false,
    },
    tableData: {
      type: Array,
      default: () => {
        return [];
      },
    },
    stripe: {
      type: Boolean,
      default: false,
    },
    maxHeight: {
      type: String || Number,
    },
    border: {
      type: Boolean,
      default: false,
    },
    size: {
      type: String,
      default: () => "",
    },
    showHeader: {
      type: Boolean,
      default: true,
    },
    showSelection: {
      type: Boolean,
      default: false,
    },
    showIndex: {
      type: Boolean,
      default: false,
    },
    tableColumns: {
      type: Array,
      default: () => {
        return [];
      },
    },
    showPagination: {
      type: Boolean,
      default: true,
    },
    page: {
      type: Number,
      default: () => 1,
    },
    limit: {
      type: Number,
      default: () => 10,
    },
    pageTotal: {
      type: Number,
      default: () => 0,
    },
    pageSizes: {
      type: Array,
      default: () => [10, 20, 30, 40],
    },
  },
  computed: {
    currentPageEl: {
      get() {
        return this.page;
      },
      set(value) {
        this.$emit("update:page", value);
      },
    },
    pageSizeEl: {
      get() {
        return this.limit;
      },
      set(value) {
        this.$emit("update:limit", value);
      },
    },
  },
  methods: {
    handleSizeChange() {
      this.$emit("handleSizeChange");
    },
    handleCurrentChange() {
      this.$emit("handleCurrentChange");
    },
    // 多选切换全部
    handleSelectAll(selection) {
      this.$emit("handleSelectAll", selection);
    },
    handleSelectionChange(val, row) {
      this.$emit("handleSelectionChange", val, row);
    },
    // 获取所有的复选框选项
    getAllSelections() {
      return this.$refs[this.pageTableRef].selection;
    },
    // 用于多选表格默认选中
    toggleSelection(selectList, field) {
      if (selectList.length > 0) {
        selectList.forEach((item) => {
          this.tableData.forEach((row) => {
            if (item === row[field]) {
              this.$refs[this.pageTableRef].toggleRowSelection(row);
            }
    });
        });
      } else {
        this.$refs.table.clearSelection();
      }
    },
    // 表头颜色
    headerClassName() {
      return { color: "#333", backgroundColor: "#eee" };
    },
  },
};
</script>
