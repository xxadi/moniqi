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
    </cs-editform>
  </el-dialog>
  <!-- <el-dialog
    title="上报"
    :visible.sync="reportDialogVisible"
    width="30%"
    :before-close="closeReportDialog"
    append-to-body
  >
    <el-form :model="reportFormData" label-width="100px">
      <el-form-item label="上报对象">
        <el-input v-model="reportFormData['上报对象']"></el-input>
      </el-form-item>
      <el-form-item label="上报状态">
        <el-select v-model="reportFormData['上报状态']">
          <el-option label="待审批" value="待审批"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="上报时间">
        <el-date-picker
          v-model="reportFormData['上报时间']"
          type="datetime"
          placeholder="选择日期时间"
        ></el-date-picker>
      </el-form-item>
      <el-form-item label="上报结果">
        <el-input type="textarea" v-model="reportFormData['上报结果']"></el-input>
      </el-form-item>
      <el-form-item label="上报说明">
        <el-input type="textarea" v-model="reportFormData['上报说明']"></el-input>
      </el-form-item>
      <el-form-item label="处理人">
        <el-input v-model="reportFormData['处理人']"></el-input>
      </el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="closeReportDialog">取 消</el-button>
      <el-button type="primary" @click="submitReport">确 定</el-button>
    </span>
  </el-dialog> -->
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
      reportDialogVisible: false,
      reportFormData: {
        '上报对象': '',
        '上报状态': '待审批',
        '上报时间': '',
        '上报结果': '',
        '上报说明': '',
        '处理人': ''
      }
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
        this.editFormData.序号 = row.序号;
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
      this.editFormData.序号 = row.序号;
      this.editDialogVisible = true;
    },
    report(row) {
      this.dialogTitle = "上报";
      this.$nextTick(() => {
        Object.keys(this.reportFormData).map(
          (key) => (this.reportFormData[key] = row[key] || '')
        );
      });
      this.reportDialogVisible = true;
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
    closeReportDialog() {
      this.reportDialogVisible = false;
    },
    submitReport() {
      this.$message.success("上报成功");
      this.closeReportDialog();
    }
    },
};
</script>
