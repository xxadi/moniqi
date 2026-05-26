<template>
  <div>
    <el-form
      ref="detailForm"
      :model="detailFormData"
      :label-width="labelWidth"
      :label-position="labelPosition"
      :label-suffix="labelSuffix"
    >
      <el-row>
        <template v-for="(item, index) in detailFormConfig">
          <slot v-if="item.slot" :name="item.slot" />

          <el-col v-else :key="index" :span="item.width ? item.width : 24">
            <el-form-item v-if="item.type === 'select'" :label="item.label">
              <div>
                {{ valueToLabel(detailFormData[item.field], item.options) }}
              </div>
            </el-form-item>
            <el-form-item v-if="item.type === 'input'" :label="item.label">
              <div>{{ detailFormData[item.field] }}</div>
            </el-form-item>
          </el-col>
        </template>
      </el-row>
    </el-form>
  </div>
</template>
<script>
export default {
  name: "DetailForm",
  props: {
    detailFormData: {
      type: Object,
      default: () => {},
    },
    labelWidth: {
      type: String,
      default: () => "80px",
    },
    labelPosition: {
      type: String,
      default: () => "right",
    },
    labelSuffix: {
      type: String,
      default: () => "：",
    },
    detailFormConfig: {
      type: Array,
      default: () => [],
    },
  },
  methods: {
    valueToLabel(val, options) {
      if (options && options.length > 0) {
        let name;
        options.map((item) => {
          if (val === item.value) {
            name = item.label;
          }
    });
        return name;
      } else {
        return val;
      }
    },
  },
};
</script>
