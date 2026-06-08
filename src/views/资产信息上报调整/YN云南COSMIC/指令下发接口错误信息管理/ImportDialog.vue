<template>
  <el-dialog
    title="导入"
    :visible.sync="dialogVisible"
    :close-on-click-modal="false"
    width="600px"
    :before-close="handleClose"
    append-to-body
  >
    <div class="import-container">
      <div class="template-download">
        <el-button type="primary" plain icon="el-icon-download" @click="handleDownloadTemplate">下载模板</el-button>
        <span class="template-tip">请先下载模板，填写数据后上传</span>
      </div>
      <el-divider></el-divider>
      <el-form ref="uploadForm" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="选择文件" prop="file">
          <el-upload
            ref="upload"
            class="upload-demo"
            drag
            action="#"
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :file-list="fileList"
          >
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <div class="el-upload__tip" slot="tip">只能上传xlsx/xls文件</div>
          </el-upload>
        </el-form-item>
      </el-form>
    </div>
    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">取 消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="importing">确 定</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { parseExcelFile, downloadImportTemplate } from "@/utils/index";
export default {
  name: "ImportDialog",
  props: {
    tableColumns: {
      type: Array,
      default: () => [],
    },
    templateName: {
      type: String,
      default: "导入模板",
    },
  },
  data() {
    return {
      dialogVisible: false,
      fileList: [],
      importing: false,
      formData: {
        file: null,
      },
      rules: {
        file: [{ required: true, message: "请选择要导入的文件", trigger: "change" }],
      },
    };
  },
  methods: {
    open() {
      this.dialogVisible = true;
    },
    handleDownloadTemplate() {
      if (this.tableColumns && this.tableColumns.length > 0) {
        // 过滤掉操作列等非数据列
        const dataColumns = this.tableColumns.filter(
          (col) => col.slot !== "operate" && col.prop && col.label
        );
        downloadImportTemplate(dataColumns, this.templateName);
      } else {
        // 默认模板列
        downloadImportTemplate(
          [
            { prop: "名称", label: "名称" },
            { prop: "类型", label: "类型" },
            { prop: "状态", label: "状态" },
            { prop: "时间", label: "时间" },
            { prop: "负责人", label: "负责人" },
          ],
          this.templateName
        );
      }
    },
    async handleFileChange(file) {
      this.formData.file = file.raw;
      this.fileList = [file];
    },
    handleFileRemove() {
      this.formData.file = null;
      this.fileList = [];
    },
    handleClose() {
      this.resetForm();
      this.dialogVisible = false;
    },
    resetForm() {
      this.formData = { file: null };
      this.fileList = [];
      this.importing = false;
      this.$refs.uploadForm && this.$refs.uploadForm.resetFields();
      this.$refs.upload && this.$refs.upload.clearFiles();
    },
    async handleSubmit() {
      this.$refs.uploadForm.validate(async (valid) => {
        if (!valid) return;
        if (!this.formData.file) {
          this.$message.warning("请选择要导入的文件");
          return;
        }

        this.importing = true;
        try {
          const data = await parseExcelFile(this.formData.file);
          if (!data || data.length === 0) {
            this.$message.warning("导入文件为空或数据格式不正确");
            return;
          }
          this.$message.success("导入成功，共 " + data.length + " 条数据");
          this.$emit("import", data);
          this.handleClose();
        } catch (error) {
          this.$message.error(error.message || "导入失败");
        } finally {
          this.importing = false;
        }
    });
    },
  },
};
</script>

<style scoped>
.import-container {
  padding: 10px 0;
}
.template-download {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
}
.template-tip {
  color: #909399;
  font-size: 12px;
}
.upload-demo {
  width: 100%;
}
</style>
