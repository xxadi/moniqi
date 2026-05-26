<template>
  <el-dialog
    ref="editDialog"
    :title="dialogTitle"
    :visible.sync="editDialogVisible"
    :close-on-click-modal="false"
    width="30%"
    :before-close="refesh"
    append-to-body
  >
    <cs-editform
      ref="editForm"
      v-loading="formLoading"
      :editFormData="editFormData"
      :editFormConfig="editFormConfig"
      :disabled="dialogTitle === '详情'"
      :showOperateButton="dialogTitle !== '详情'"
      labelWidth="100px"
      @submit="submitForm"
      @cancel="refesh"
    >
      <el-form-item label="ID" prop="ID">
        <el-input v-model="editFormData.ID" :disabled="dialogTitle === '详情'" clearable />
      </el-form-item>
      <el-form-item label="编号" prop="编号">
        <el-input v-model="editFormData.编号" :disabled="dialogTitle === '详情'" clearable />
      </el-form-item>
      <el-form-item label="名称" prop="名称">
        <el-input v-model="editFormData.名称" :disabled="dialogTitle === '详情'" clearable />
      </el-form-item>
      <el-form-item label="类型" prop="类型">
        <el-input v-model="editFormData.类型" :disabled="dialogTitle === '详情'" clearable />
      </el-form-item>
      <el-form-item label="状态" prop="状态">
        <el-select v-model="editFormData.状态" :disabled="dialogTitle === '详情'" clearable>
          <el-option label="启用" value="启用"></el-option>
          <el-option label="处理中" value="处理中"></el-option>
          <el-option label="待审批" value="待审批"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="时间" prop="时间">
        <el-date-picker v-model="editFormData.时间" type="datetime" format="yyyy-MM-dd HH:mm:ss" value-format="yyyy-MM-dd HH:mm:ss" :disabled="dialogTitle === '详情'" clearable></el-date-picker>
      </el-form-item>
      <el-form-item label="所属部门" prop="所属部门">
        <el-input v-model="editFormData.所属部门" :disabled="dialogTitle === '详情'" clearable />
      </el-form-item>
      <el-form-item label="负责人" prop="负责人">
        <el-input v-model="editFormData.负责人" :disabled="dialogTitle === '详情'" clearable />
      </el-form-item>
    </cs-editform>
  </el-dialog>
</template>
<script>
export default {
  props: {
    configData: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      dialogTitle: "add",
      editDialogVisible: false,
      editFormData: {},
      editFormConfig: [],
      formLoading: false,
    };
  },
  mounted() {
    this.editFormConfig = this.configData.map((item) => {
      const newObj = {
        ...item,
        field: item.prop,
      };
      return newObj;
    });
    this.refeshData();
  },
  methods: {
    // 初始化表单数据
    initEditFormData() {
      const newObject = {};
      this.configData.forEach((column) => {
        if (column.prop) {
          newObject[column.prop] = "";
        }
    });
      return newObject;
    },
    refeshData() {
      this.editFormData = this.initEditFormData();
    },
    handleClose(done) {
      this.refeshData();
      this.$refs.editForm.refesh();
      done();
    },
    add() {
      this.dialogTitle = "新增";
      this.refeshData();
      this.editDialogVisible = true;
    },
    edit(row) {
      this.dialogTitle = "修改";
      this.$nextTick(() => {
        Object.keys(this.editFormData).map(
          (key) => (this.editFormData[key] = row[key])
        );
        this.editFormData.ID = row.ID;
      });
      this.editDialogVisible = true;
    },
    copy(row) {
      this.dialogTitle = "新增";
      this.$nextTick(() => {
        Object.keys(this.editFormData).map(
          (key) => (this.editFormData[key] = row[key])
        );
      });
      this.editDialogVisible = true;
    },
    detail(row) {
      this.dialogTitle = "详情";
      this.$nextTick(() => {
        Object.keys(this.editFormData).map(
          (key) => (this.editFormData[key] = row[key])
        );
      });
      this.editFormData.ID = row.ID;
      this.editDialogVisible = true;
    },

    submitForm() {
      if (this.dialogTitle === "修改") {
        this.modifyData();
      } else {
        this.addData();
      }
    },
    addData() {
      const params = {
        ...this.editFormData,
      };
      this.$emit("addItem", params);
      this.$message.success("新增成功");
      this.refesh();
    },
    modifyData() {
      const params = {
        ...this.editFormData,
      };
      this.$emit("updateItem", JSON.parse(JSON.stringify(params)));
      this.$message.success("修改成功");
      this.refesh();
    },

    refesh() {
      this.editDialogVisible = false;
    },
  },
};
</script>