/**
 * 更新拒绝弹窗：点击通过/驳回后显示审核结果，不立即关闭
 */
const fs = require("fs");
const path = require("path");

const basePath = path.join(
  __dirname,
  "..",
  "src",
  "views",
  "资产信息上报调整",
  "JL吉林COSMIC"
);

// 新的弹窗模板
const NEW_DIALOG = `    <!-- 结果审核弹窗（通过/驳回） -->
    <el-dialog :title="rejectTitle" :visible.sync="rejectVisible" width="600px" append-to-body>
      <el-form label-width="120px">
        <el-form-item v-for="item in rejectFields" :key="item.label" :label="item.label">
          <span :style="{ color: /失败|超时|异常|驳回/.test(item.value) ? '#F56C6C' : /成功|通过|已完成/.test(item.value) ? '#67C23A' : '' }">{{ item.value }}</span>
        </el-form-item>
        <el-form-item v-if="rejectResult" label="审核结果">
          <el-tag :type="rejectResult === '已通过' ? 'success' : 'danger'" size="medium">{{ rejectResult }}</el-tag>
        </el-form-item>
        <el-form-item v-if="rejectResult" label="审核时间">
          <span>{{ rejectResultTime }}</span>
        </el-form-item>
      </el-form>
      <span slot="footer" v-if="!rejectResult">
        <el-button @click="rejectVisible = false">取 消</el-button>
        <el-button type="danger" @click="handleReject('已驳回')">驳 回</el-button>
        <el-button type="primary" @click="handleReject('已通过')">通 过</el-button>
      </span>
      <span slot="footer" v-else>
        <el-button @click="rejectVisible = false; rejectResult = ''">关 闭</el-button>
      </span>
    </el-dialog>`;

// 新的数据属性
const NEW_DATA = `
      rejectResult: "",
      rejectResultTime: "",`;

// 新的方法
const NEW_METHOD = `
    handleReject(result) {
      this.rejectResult = result;
      this.rejectResultTime = this.now();
    },`;

function findVueFiles(dir) {
  const results = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results.push(...findVueFiles(full));
    } else if (item === "index.vue") {
      results.push(full);
    }
  }
  return results;
}

const files = findVueFiles(basePath);
let count = 0;

for (const filePath of files) {
  let content = fs.readFileSync(filePath, "utf8");
  let changed = false;

  // 1. 替换弹窗模板
  const oldDialogRe = /    <!-- 结果审核弹窗[\s\S]*?<\/el-dialog>/;
  if (oldDialogRe.test(content)) {
    content = content.replace(oldDialogRe, NEW_DIALOG);
    changed = true;
  }

  // 2. 添加数据属性
  if (!content.includes("rejectResult:")) {
    content = content.replace(
      /(rejectFields: \[\],)/,
      "$1" + NEW_DATA
    );
    changed = true;
  }

  // 3. 添加 handleReject 方法（在 openRejectDialog 后面）
  if (!content.includes("handleReject")) {
    content = content.replace(
      /(this\.rejectVisible = true;\s*\n    \},)/,
      "$1" + NEW_METHOD
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
    count++;
  }
}

console.log(`Done. Updated ${count} files.`);
