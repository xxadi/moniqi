<template>
  <div class="editFormRef">
    <el-form
      ref="editFormRef"
      :model="modelData"
      :rules="editFormRules"
      :inline="inline"
      :label-position="labelPosition"
      :label-width="labelWidth"
      :label-suffix="labelSuffix"
      :hide-required-asterisk="hideRequiredAsterisk"
      :show-message="showMessage"
      :inline-message="inlineMessage"
      :status-icon="statusIcon"
      :validate-on-rule-change="validateOnRuleChange"
      :size="size"
      :disabled="disabled"
    >
      <el-row>
        <template v-for="(item, index) in editFormConfig">
          <slot v-if="item.slot" :name="item.slot" />
          <el-col v-else :key="index" :span="item.span ? item.span : 24">
            <el-form-item
              :prop="item.field"
              :label="item.label"
              :rules="item.rules"
            >
              <!-- 输入框 -->
              <template v-if="item.type === 'text'">
                <el-input
                  v-model.trim="modelData[item.field]"
                  :placeholder="item.placeholder ? item.placeholder : '请输入'"
                  :clearable="item.clearable ? item.clearable : true"
                  :disabled="item.disabled"
                  @input="inputInput($event, index, item.field)"
                  @change="inputChange($event, index, item.field)"
                />
              </template>
              <!-- 文本域 -->
              <template v-if="item.type === 'textarea'">
                <el-input
                  v-model.trim="modelData[item.field]"
                  type="textarea"
                  :placeholder="
                    item.placeholder ? item.placeholder : '请输入内容'
                  "
                  :disabled="item.disabled"
                  :autosize="{
                    minRows: item.minRows ? item.minRows : 4,
                    maxRows: item.maxRows ? item.maxRows : 6,
                  }"
                />
              </template>
              <!-- 下拉框 -->
              <template v-if="item.type === 'select'">
                <el-select
                  v-model="modelData[item.field]"
                  :placeholder="item.placeholder ? item.placeholder : '请选择'"
                  :clearable="item.clearable"
                  :disabled="item.disabled"
                  :multiple="item.multiple"
                  :filterable="item.filterable"
                  @change="selectChange($event, index, item.field)"
                >
                  <el-option
                    v-for="(selectItem, selectIndex) in item.options"
                    :key="selectIndex"
                    :label="selectItem.label"
                    :value="selectItem.value"
                  />
                </el-select>
              </template>
              <!-- 单选框默认 -->
              <template v-if="item.type === 'radio'">
                <el-radio-group
                  v-model="modelData[item.field]"
                  @change="radioChange($event, index, item.field)"
                >
                  <el-radio
                    v-for="radioItem in item.options"
                    :key="radioItem.value"
                    :label="radioItem.value"
                    :disabled="radioItem.disabled"
                    >{{ radioItem.label }}</el-radio
                  >
                </el-radio-group>
              </template>
              <!-- 日期范围 -->
              <template v-if="item.type === 'datetimerangePicker'">
                <el-date-picker
                  style="width: 100%"
                  v-model="modelData[item.field]"
                  type="datetimerange"
                  :align="item.align ? item.align : 'center'"
                  :value-format="
                    item.valueFormat && item.valueFormat !== ''
                      ? item.valueFormat
                      : 'yyyy-MM-dd HH:mm:ss'
                  "
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                />
              </template>
              <template v-if="item.type === 'datePicker'">
                <!-- 时间日期选择器 -->
                <el-date-picker
                  v-model="modelData[item.field]"
                  type="datetime"
                  :default-time="
                    item.defaultTime ? item.defaultTime : '00:00:00'
                  "
                  :align="item.align ? item.align : 'center'"
                  :value-format="
                    item.valueFormat && item.valueFormat !== ''
                      ? item.valueFormat
                      : 'yyyy-MM-dd HH:mm:ss'
                  "
                  placeholder="选择日期时间"
                />
              </template>
              <template v-if="item.type === 'transfer'">
                <!-- 穿梭 -->
                <el-transfer
                  :titles="['待选', '已选']"
                  v-model="modelData[item.field]"
                  :data="item.options"
                ></el-transfer>
              </template>
              <template v-if="item.type === 'fileUpload'">
                <!-- 文件上传 -->
                <file-upload
                  ref="fileUploadRef"
                  :fileType="item.fileType"
                  :uploadFileUrl="item.uploadFileUrl"
                  :autoUpload="item.autoUpload"
                  :drag="item.drag"
                  :limit="item.limit"
                  :fileSize="item.fileSize"
                  :isShowTip="item.isShowTip"
                  :fileName="item.fileName"
                  :multiple="item.multiple"
                  @change="fileUploadChange"
                ></file-upload>
              </template>
            </el-form-item>
          </el-col>
        </template>
      </el-row>
      <div
        v-if="showOperateButton"
        class="footer-button"
        :style="{ textAlign: buttonPosition }"
      >
        <el-button type="primary" @click="submitForm('editFormRef')"
          >确定</el-button
        >
        <el-button type="default" @click="cancel()">取消</el-button>
      </div>
    </el-form>
  </div>
</template>
<script>
import FileUpload from "@/components/FileUpload/index.vue";
export default {
  name: "editForm",
  components: {
    FileUpload,
  },
  props: {
    editFormData: {
      type: Object,
      required: true,
      default: () => {},
    },
    editFormRules: {
      type: Object,
      default: () => {},
    },
    inline: {
      type: Boolean,
      default: false,
    },
    labelPosition: {
      type: String,
      default: () => "right",
    },
    labelWidth: {
      type: String,
      default: () => "80px",
    },
    labelSuffix: {
      type: String,
      default: () => "",
    },
    hideRequiredAsterisk: {
      type: Boolean,
      default: false,
    },
    showMessage: {
      type: Boolean,
      default: true,
    },
    inlineMessage: {
      type: Boolean,
      default: false,
    },
    statusIcon: {
      type: Boolean,
      default: false,
    },
    validateOnRuleChange: {
      type: Boolean,
      default: true,
    },
    size: {
      type: String,
      default: () => "",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    editFormConfig: {
      type: Array,
      default: () => [],
    },
    buttonPosition: {
      type: String,
      default: () => "right",
    },
    showOperateButton: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    modelData: {
      get() {
        return this.editFormData;
      },
      set(value) {
        this.$emit("update:editFormData", value);
      },
    },
  },
  methods: {
    // input的input事件
    inputInput(value, index, field) {
      this.$emit("inputInput", value, index, field);
    },
    // input的change事件
    inputChange(value, index, field) {
      this.$emit("inputChange", value, index, field);
    },
    // select的change事件
    selectChange(value, index, model) {
      this.$emit("selectChange", value, index, model);
    },
    // radio的change事件
    radioChange(value, index, field) {
      this.$emit("radioChange", value, index, field);
    },
    fileUploadChange(val) {
      this.modelData.files = val.newfile;
      this.$refs.editFormRef.validateField("files");
    },
    submitForm(editFormRef) {
      this.$refs[editFormRef].validate((valid) => {
        if (valid) {
          this.$emit("submit");
        } else {
          this.$message.warning("请将信息填写完整！");
          return false;
        }
    });
    },
    cancel() {
      this.$emit("cancel");
    },
    clearValidate() {
      // 此处为了清理上传组件中的残余文件
      if (this.$refs.fileUploadRef && this.$refs.fileUploadRef.length > 0) {
        this.$refs.fileUploadRef.forEach((element) => {
          element.clearFilesList();
        });
      }
      this.$nextTick(() => {
        this.$refs.editFormRef.clearValidate();
      });
    },
  },
};
</script>
<style lang="scss" scoped>
.editFormRef {
  .footer-button {
    text-align: right;
  }
  // 解决表单select对齐
  .el-select {
    width: 100%;
  }
  ::v-deep .el-form-item__label {
    color: #333333;
  }
    }
</style>
