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
    title="反馈"
    :visible.sync="feedbackDialogVisible"
    width="30%"
    :before-close="closeFeedbackDialog"
    append-to-body
  >
    <el-form :model="feedbackFormData" label-width="100px">
      <el-form-item label="反馈对象">
        <el-input v-model="feedbackFormData['反馈对象']"></el-input>
      </el-form-item>
      <el-form-item label="反馈状态">
        <el-select v-model="feedbackFormData['反馈状态']">
          <el-option label="处理中" value="处理中"></el-option>
          <el-option label="已完成" value="已完成"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="反馈时间">
        <el-date-picker
          v-model="feedbackFormData['反馈时间']"
          type="datetime"
          placeholder="选择日期时间"
        ></el-date-picker>
      </el-form-item>
      <el-form-item label="反馈结果">
        <el-input
          type="textarea"
          v-model="feedbackFormData['反馈结果']"
        ></el-input>
      </el-form-item>
      <el-form-item label="反馈说明">
        <el-input
          type="textarea"
          v-model="feedbackFormData['反馈说明']"
        ></el-input>
      </el-form-item>
      <el-form-item label="处理人">
        <el-input v-model="feedbackFormData['处理人']"></el-input>
      </el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="closeFeedbackDialog">取 消</el-button>
      <el-button type="primary" @click="submitFeedback">确 定</el-button>
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
      feedbackDialogVisible: false,
      feedbackFormData: {
        "反馈对象": "",
        "反馈状态": "",
        "反馈时间": "",
        "反馈结果": "",
        "反馈说明": "",
        "处理人": "",
      },
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
    feedback(row) {
      this.dialogTitle = "反馈";
      this.$nextTick(() => {
        Object.keys(this.feedbackFormData).map(
          (key) => (this.feedbackFormData[key] = "")
        );
      });
      this.feedbackDialogVisible = true;
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
    closeFeedbackDialog() {
      this.feedbackDialogVisible = false;
    },
    submitFeedback() {
      this.$message.success("反馈提交成功");
      this.closeFeedbackDialog();
    },
  },
};
</script>
