<template>
  <el-dialog
    ref="lookDialog"
    title="查看"
    :visible.sync="lookDialogVisible"
    width="40%"
    :close-on-click-modal="false"
    :before-close="resetForm"
  >
    <div class="preview-box">
      <el-image
        style="max-height: 70vh"
        :src="url"
        fit="contain"
        :preview-src-list="srcList"
      ></el-image>
    </div>
  </el-dialog>
</template>
<script>
export default {
  data() {
    return {
      lookDialogVisible: false,
      url: "",
      srcList: [],
    };
  },
  methods: {
    init(filePath) {
      this.url = filePath;
      this.srcList.push(filePath);
      this.lookDialogVisible = true;
    },
    resetForm() {
      this.url = "";
      this.srcList = [];
      this.lookDialogVisible = false;
    },
  },
};
</script>
<style lang="scss">
.preview-box {
  width: 100%;
  max-height: 70vh;
  margin: 0 auto;
  display: flex;
  justify-content: center;
}
</style>
