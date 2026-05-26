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
      <template v-for="(item, index) in editFormConfig">
        <el-form-item
          v-if="item.prop"
          :key="index"
          :label="item.label"
          :prop="item.prop"
        >
          <el-input
            v-if="item.type === 'text'"
            v-model="editFormData[item.prop]"
          ></el-input>
          <el-select
            v-else-if="item.type === 'select'"
            v-model="editFormData[item.prop]"
          >
            <el-option
              v-for="option in item.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            ></el-option>
          </el-select>
          <el-date-picker
            v-else-if="item.type === 'datetime'"
            v-model="editFormData[item.prop]"
            type="datetime"
            format="yyyy-MM-dd HH:mm:ss"
            value-format="yyyy-MM-dd HH:mm:ss"
          ></el-date-picker>
          <el-input-number
            v-else-if="item.type === 'number'"
            v-model="editFormData[item.prop]"
          ></el-input-number>
          <el-checkbox-group
            v-else-if="item.type === 'checkbox'"
            v-model="editFormData[item.prop]"
          >
            <el-checkbox
              v-for="option in item.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            ></el-checkbox>
          </el-checkbox-group>
          <el-radio-group
            v-else-if="item.type === 'radio'"
            v-model="editFormData[item.prop]"
          >
            <el-radio
              v-for="option in item.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            ></el-radio>
          </el-radio-group>
          <el-upload
            v-else-if="item.type === 'upload'"
            v-model="editFormData[item.prop]"
            action="https://jsonplaceholder.typicode.com/posts/"
          >
            <el-button size="small" type="primary">点击上传</el-button>
          </el-upload>
          <el-input
            v-else-if="item.type === 'textarea'"
            v-model="editFormData[item.prop]"
            type="textarea"
          ></el-input>
        </el-form-item>
      </template>
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