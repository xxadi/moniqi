<template>
  <el-dialog
    ref="lookDialog"
    title="查看"
    :visible.sync="lookDialogVisible"
    width="40%"
    :close-on-click-modal="false"
    :before-close="resetForm"
  >
    <audio controls="controls" ref="audioSource" class="audioDom">
      <source :src="audioSrc" />
      您的浏览器不支持 audio 元素。
    </audio>
  </el-dialog>
</template>
<script>
export default {
  data() {
    return {
      lookDialogVisible: false,
      audioSrc: "",
    };
  },
  methods: {
    init(filePath) {
      this.audioSrc = filePath;
      this.lookDialogVisible = true;
    },
    resetForm() {
      this.$refs.audioSource.pause();
      this.lookDialogVisible = false;
    },
  },
};
</script>
<style lang="scss" scoped>
.audioDom {
  width: 100%;
}
</style>
