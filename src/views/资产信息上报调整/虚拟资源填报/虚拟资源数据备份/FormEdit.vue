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
    ref="backupDialog"
    title="对虚拟资源进行数据备份"
    :visible.sync="backupDialogVisible"
    :close-on-click-modal="false"
    width="30%"
    :before-close="closeBackupDialog"
    append-to-body
  >
    <el-form :model="backupFormData" label-width="100px">
      <el-form-item label="编号">
        <el-input v-model="backupFormData.编号" placeholder="NO_001"></el-input>
      </el-form-item>
      <el-form-item label="名称">
        <el-input v-model="backupFormData.名称" placeholder="虚拟资源数据备份示例2"></el-input>
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="backupFormData.类型" placeholder="审批">
          <el-option label="审批" value="审批"></el-option>
          <el-option label="文本" value="文本"></el-option>
          <el-option label="接口" value="接口"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="backupFormData.状态" placeholder="启用">
          <el-option label="启用" value="启用"></el-option>
          <el-option label="处理中" value="处理中"></el-option>
          <el-option label="待审批" value="待审批"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="时间">
        <el-date-picker
          v-model="backupFormData.时间"
          type="datetime"
          placeholder="2026-04-08 10:00:00"
        ></el-date-picker>
      </el-form-item>
      <el-form-item label="说明">
        <el-input
          type="textarea"
          v-model="backupFormData.说明"
          placeholder="虚拟资源数据备份处理说明3"
        ></el-input>
      </el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="closeBackupDialog">取 消</el-button>
      <el-button type="primary" @click="submitBackupForm">确 定</el-button>
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
      backupDialogVisible: false,
      backupFormData: {
        编号: "",
        名称: "",
        类型: "",
        状态: "",
        时间: "",
        说明: "",
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
    open(row) {
      if (row) {
        this.backupFormData = { ...row };
      } else {
        this.backupFormData = {
          编号: "",
          名称: "",
          类型: "",
          状态: "",
          时间: "",
          说明: "",
        };
      }
      this.backupDialogVisible = true;
    },
    closeBackupDialog() {
      this.backupDialogVisible = false;
    },
    submitBackupForm() {
      // 模拟接口调用
      setTimeout(() => {
        this.$message.success("数据备份成功");
        this.closeBackupDialog();
      }, 100);
    },
  },
};
</script>
