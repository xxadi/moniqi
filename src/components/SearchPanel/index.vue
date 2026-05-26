<template>
  <div class="search-panel">
    <el-form
      :ref="searchFormRef"
      :model="searchData"
      :rules="rules"
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
      <template v-for="(item, index) in searchConfig">
        <!-- 设置slot插槽 -->
        <slot v-if="item.slot" :name="item.slot" />
        <el-form-item
          v-else
          :key="index"
          :prop="item.field"
          :label="item.label"
          :label-width="item.labelWidth"
          :required="item.required"
          :rules="item.rules"
          :error="item.error"
          :show-message="item.showMessage"
          :inline-message="item.inlineMessage"
          :size="item.size"
        >
          <!-- 输入框 -->
          <template v-if="item.type === 'text'">
            <el-input
              v-model.trim="modelData[item.field]"
              :placeholder="item.placeholder ? item.placeholder : '请输入'"
              :clearable="item.clearable ? item.clearable : true"
            />
          </template>
          <!-- 普通下拉框 -->
          <template v-if="item.type === 'select'">
            <el-select
              v-model="modelData[item.field]"
              :clearable="item.clearable ? item.clearable : true"
              :placeholder="item.placeholder ? item.placeholder : '请选择'"
              @change="selectChange($event, index, item.field)"
            >
              <el-option
                v-for="optionItem in item.options"
                :key="optionItem.value"
                :label="optionItem.label"
                :value="optionItem.value"
              />
            </el-select>
          </template>
          <!-- 日期范围 -->
          <template v-if="item.type === 'datePicker'">
            <el-date-picker
              v-model="modelData[item.field]"
              :type="item.rangeType ? item.rangeType : 'daterange'"
              :align="item.align ? item.align : 'right'"
              :unlink-panels="item.unlinkPanels"
              :range-separator="
                item.rangeSeparator ? item.rangeSeparator : '至'
              "
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              :picker-options="pickerOptions"
              :value-format="item.valueFormat ? item.valueFormat : 'yyyy-MM-dd'"
              :default-value="item.defaultValue ? item.defaultValue : null"
            >
            </el-date-picker>
          </template>
        </el-form-item>
      </template>
      <el-form-item v-if="showSearchButton" label="">
        <el-button plain type="primary" icon="el-icon-search" @click="searchSubmit"
          >搜索</el-button
        >
        <el-button
          type="default"
          icon="el-icon-refresh"
          @click="searchReset(searchFormRef)"
          >重置</el-button
        >
      </el-form-item>
    </el-form>
  </div>
</template>
<script>
export default {
  name: "SearchPanel",
  props: {
    searchFormRef: {
      type: String,
      default: () => "searchFormRef",
    },
    searchData: {
      type: Object,
      required: true,
      default: () => {},
    },
    rules: {
      type: Object,
      default: () => {},
    },
    inline: {
      type: Boolean,
      default: true,
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
    searchConfig: {
      type: Array,
      default: () => [],
    },
    showSearchButton: {
      type: Boolean,
      default: true,
    },
  },
  computed: {
    modelData: {
      get() {
        return this.searchData;
      },
      set(value) {
        this.$emit("update:searchData", value);
      },
    },
  },
  data() {
    return {
      pickerOptions: {
        shortcuts: [
          {
            text: "最近一周",
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "最近一个月",
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
              picker.$emit("pick", [start, end]);
            },
          },
          {
            text: "最近三个月",
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
              picker.$emit("pick", [start, end]);
            },
          },
        ],
      },
    };
  },
  methods: {
    // select的change事件
    selectChange(value, index, field) {
      this.$emit("selectChange", value, index, field);
    },
    searchSubmit() {
      this.$emit("handelSearch");
    },
    searchReset(formName) {
      this.$refs[formName].resetFields();
      this.$emit("handelReset");
    },
  },
};
</script>
<style lang="scss" scoped>
.search-panel {
  background-color: #fff;
  padding: 10px;
  & .el-form-item {
    margin-bottom: 5px;
  }
    }
</style>
