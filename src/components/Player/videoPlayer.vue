<template>
  <el-dialog
    ref="lookDialog"
    title="查看"
    :visible.sync="lookDialogVisible"
    width="40%"
    :close-on-click-modal="false"
    :before-close="resetForm"
  >
    <video controls="controls" ref="videoSource" class="videoDom">
      <source :src="videoSrc" type="video/mp4" />
      您的浏览器不支持 video 标签。
    </video>
  </el-dialog>
</template>
<script>
export default {
  data() {
    return {
      lookDialogVisible: false,
      videoSrc: "",
    };
  },
  methods: {
    init(filePath) {
      this.lookDialogVisible = true;
      this.videoSrc = filePath;
    },
    resetForm() {
      this.$refs.videoSource.pause();
      this.lookDialogVisible = false;
    },
  },
};
</script>
<style lang="scss" scoped>
.videoDom {
  width: 100%;
  max-height: 70vh;
}
</style>
