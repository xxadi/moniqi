<template>
  <div class="upload-container">
    <el-upload
      ref="upload"
      :drag="drag"
      :action="uploadFileUrl"
      :limit="limit"
      :file-list="fileList"
      :multiple="multiple"
      :auto-upload="autoUpload"
      :show-file-list="false"
      :accept="accept"
      :on-change="fileChange"
      :on-exceed="handleExceed"
      :before-upload="handleBeforeUpload"
      :on-success="handleUploadSuccess"
      :on-error="handleUploadError"
    >
      <i class="el-icon-upload"></i>
      <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      <div class="el-upload__tip" v-if="showTip" slot="tip">
        <div>
          请上传
          <template v-if="fileSize">
            大小不超过 <b style="color: #f56c6c">{{ fileSize }}MB</b>
          </template>
          <template v-if="fileType.length > 0">
            格式为 <b style="color: #f56c6c">{{ fileType.join("/") }}</b>
          </template>
          的文件
        </div>
        <div v-if="fileName">
          <span>示例文件请点击下载</span>
          <a
            :href="exampleFileHref"
            target="_blank"
            :download="fileName"
            rel="noopener noreferrer"
            class="exampleText"
            >示例文件</a
          >
        </div>
      </div>
    </el-upload>
    <!-- 文件列表 -->
    <transition-group
      name="el-fade-in-linear"
      class="upload-file-list"
      tag="div"
    >
      <div :key="file.timestamp" class="item" v-for="(file, index) in fileList">
        <span class="el-icon-document"> {{ file.name }}</span>
        <div>
          <el-link :underline="false" @click="handleDelete(index)" type="danger"
            >删除</el-link
          >
        </div>
      </div>
    </transition-group>
  </div>
</template>
<script>
// 此组件目前仅仅考虑上传功能，暂时没增加回显功能!!!!!!!!!!!!!!!!!!

/**
 * @description:
 * autoUpload                         是否在选取文件后立即进行上传
 * uploadFileUrl                      上传地址。当选取文件后立即进行上传时有效
 * drag                               是否可拖拽
 * limit                              数量限制
 * fileSize                           大小限制(MB)
 * isShowTip                          是否显示提示
 * multiple                           是否支持多选文件
 *
 *
 * @Function
 * submitFiles  提交附件
 */
export default {
  name: "FileUpload",
  props: {
    // 上传地址。当选取文件后立即进行上传时有效
    uploadFileUrl: {
      type: String,
      default: "#",
    },
    // 是否在选取文件后立即进行上传
    autoUpload: {
      type: Boolean,
      default: false,
    },
    // 是否可拖拽
    drag: {
      type: Boolean,
      default: true,
    },
    // 数量限制
    limit: {
      type: Number,
      default: 1,
    },
    // 大小限制(MB)
    fileSize: {
      type: Number,
      default: 10,
    },
    // 文件类型, 例如['png', 'jpg', 'jpeg']
    fileType: {
      type: Array,
      default: () => [],
    },
    // 是否显示提示
    isShowTip: {
      type: Boolean,
      default: true,
    },
    multiple: {
      type: Boolean,
      default: false,
    },
    fileName: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      fileList: [],
    };
  },
  computed: {
    // 是否显示提示
    showTip() {
      return this.isShowTip && (this.fileType || this.fileSize);
    },
    accept() {
      let temp = this.fileType.map((item) => {
        return "." + item;
      });
      return temp.toString();
    },
    exampleFileHref() {
      return window.location.origin + "/files/" + this.fileName;
    },
  },
  methods: {
    handleBeforeUpload(file) {
      return this.validateFile(file);
    },
    // eslint-disable-next-line
    fileChange(file, fileList) {
      // 当选取文件后立即进行上传情况，校验与文件走handleBeforeUpload
      if (!this.autoUpload) {
        if (this.validateFile(file.raw)) {
          // 此处时间戳为解决<transition-group> 的子节点必须有独立的 key
          file.timestamp = Date.parse(new Date());
          this.fileList.push(file);
          this.emitFun();
        } else {
          console.log(this.fileList);
        }
    }
    },
    validateFile(file) {
      // 校检文件类型
      if (this.fileType.length > 0) {
        let fileExtension = "";
        if (file.name.lastIndexOf(".") > -1) {
          fileExtension = file.name.slice(file.name.lastIndexOf(".") + 1);
        }
        const isTypeOk = this.fileType.some((type) => {
          if (file.type.indexOf(type) > -1) return true;
          if (fileExtension && fileExtension.indexOf(type) > -1) return true;
          return false;
        });
        if (!isTypeOk) {
          this.$message.error(
            `文件格式不正确, 请上传${this.fileType.join("/")}格式文件!`
          );
          this.clearFilesList();
          return false;
        }
    }
      // 校检文件大小
      if (this.fileSize) {
        const isLt = file.size / 1024 / 1024 < this.fileSize;
        if (!isLt) {
          this.$message.error(`上传文件大小不能超过 ${this.fileSize} MB!`);
          this.clearFilesList();
          return false;
        }
    }
      return true;
    },
    // 文件个数超出
    handleExceed() {
      this.$message.error(`上传文件数量不能超过 ${this.limit} 个!`);
    },
    // 删除文件
    handleDelete(index) {
      this.fileList.splice(index, 1);
      this.emitFun();
    },
    // 获取文件
    submitFiles() {
      const formData = this.fileList.filter((item) => item.status === "ready");
      const files = {
        newfile: formData,
        delfile: [],
      };
      return files;
    },
    // 清空文件列表
    clearFilesList() {
      this.fileList = [];
      this.$refs.upload.clearFiles();
    },
    // 上传失败
    handleUploadError() {
      this.$message.error("上传失败, 请重试");
    },
    // 上传成功回调
    handleUploadSuccess(res, file) {
      this.$message.success("上传成功");
      console.log(res, file);
      // 此处需要根据上传成功的数据返回字段 放回fileList中
      // 此处时间戳为解决<transition-group> 的子节点必须有独立的 key
      // this.fileList.push({ name: res.fileName, url: res.fileName,timestamp:Date.parse(new Date()) });
      // this.$emit("uploadSuccess", this.fileList);
    },
    emitFun() {
      const formData = this.fileList.filter((item) => item.status === "ready");
      const files = {
        newfile: formData,
        delfile: [],
      };
      this.$emit("change", files);
    },
  },
};
</script>
<style scoped lang="scss">
.upload-file-list {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  .item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: inherit;
    border: 1px solid #e4e7ed;
    margin-bottom: 5px;
    padding: 0 10px;
  }
    }
.exampleText {
  padding: 0 20px;
  text-decoration: underline;
  color: #409eff;
}
.upload-container {
  ::v-deep.el-upload {
    width: 100%;
    .el-upload-dragger {
      width: 100%;
    }
    }
}
</style>
