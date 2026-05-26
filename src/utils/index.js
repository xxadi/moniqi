import * as XLSX from "xlsx";
export function exportXLSX(data, fileName) {
  // 将数据转换为工作簿
  const ws = XLSX.utils.json_to_sheet(data);
  // 创建工作簿
  const wb = XLSX.utils.book_new();
  // 将工作表添加到工作簿
  XLSX.utils.book_append_sheet(wb, ws, fileName);
  // 导出为 XLSX 文件
  XLSX.writeFile(wb, fileName + ".xlsx");
}

export function filterData(data, condition) {
  if (!data) {
    return [];
  }
  return data.filter((item) => {
    for (const key in condition) {
      // 关键修改：使用 Object.prototype.hasOwnProperty.call 替代 condition.hasOwnProperty
      if (
        Object.prototype.hasOwnProperty.call(condition, key) &&
        condition[key] !== ""
      ) {
        if (key.indexOf("时间") >= 0) {
          const itemDate = new Date(item[key].replace(/-/g, "/"));
          const startDate = new Date(condition[key][0].replace(/-/g, "/"));
          const endDate = new Date(condition[key][1].replace(/-/g, "/"));
          if (itemDate < startDate || itemDate > endDate) {
            return false;
          }
        } else {
          const conditionValue = String(condition[key]).toLowerCase();
          const itemValue = String(item[key]).toLowerCase();

          if (!itemValue.includes(conditionValue)) {
            return false;
          }
        }
      }
    }
    return true;
  });
}
/**
 * 从 public/mockFiles 目录下载文件
 * @param {string} fileName - 完整文件名（含后缀，如：test.pdf、data.xlsx）
 * @param {string} [customFileName] - 下载后的自定义文件名（可选，默认使用原文件名）
 * @param {string} [filePathPrefix] - 文件路径前缀（默认：/mockFiles/，可根据实际目录调整）
 * @returns {Promise<void>} - 下载Promise（失败时reject）
 */
export const downloadMockFile = (
  fileName,
  customFileName = fileName,
  filePathPrefix = "/mockFiles/"
) => {
  return new Promise((resolve, reject) => {
    // 1. 校验文件名必填
    if (!fileName) {
      reject(new Error("文件名不能为空"));
      return;
    }

    // 2. 拼接完整文件路径（public目录下的绝对路径）
    const fileFullPath = `${filePathPrefix}${fileName}`;

    // 3. 创建隐藏的a标签用于触发下载
    const link = document.createElement("a");
    link.href = fileFullPath;
    // 设置下载文件名（自定义或原文件名）
    link.download = customFileName;
    // 隐藏a标签
    link.style.display = "none";

    // 4. 处理文件存在性校验（可选，通过图片预加载判断文件是否存在）
    const checkFileExists = () => {
      // 针对非图片文件，通过XMLHttpRequest校验状态码
      const xhr = new XMLHttpRequest();
      xhr.open("HEAD", fileFullPath, true);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // 文件存在，触发下载
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          resolve(`文件 ${fileName} 下载触发成功`);
        } else {
          reject(new Error(`文件 ${fileName} 不存在（状态码：${xhr.status}）`));
        }
      };
      xhr.onerror = () => {
        reject(new Error(`文件 ${fileName} 下载失败（网络错误或路径错误）`));
      };
      xhr.send();
    };

    checkFileExists();
  });
};

/**
 * 解析Excel文件，提取数据
 * @param {File} file - Excel文件对象
 * @returns {Promise<Array>} - 解析后的数据数组
 */
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        // 获取第一个工作表
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        // 转换为JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        resolve(jsonData);
      } catch (error) {
        reject(new Error("解析Excel文件失败：" + error.message));
      }
    };
    reader.onerror = () => reject(new Error("读取文件失败"));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 根据列配置生成模拟数据（数组格式，用于 aoa_to_sheet）
 * @param {Array} columns - 表格列配置数组
 * @returns {Array<Array>} - 模拟数据行数组
 */
function generateMockData(columns) {
  const props = columns.map((col) => col.prop);
  const rows = [];
  // 生成3条模拟数据
  for (let i = 1; i <= 3; i++) {
    const row = props.map((prop) => {
      // 根据prop名称生成合适的模拟数据
      if (prop === "ID" || prop === "编号") {
        return 1000 + i;
      } else if (prop.includes("名称") || prop.includes("任务")) {
        return `模拟${prop}${i}`;
      } else if (prop === "类型") {
        return "常规类型";
      } else if (prop === "状态") {
        return "启用";
      } else if (prop.includes("时间")) {
        return "2026-05-07 12:00:00";
      } else if (prop.includes("负责人")) {
        return `负责人${i}`;
      } else if (prop.includes("部门")) {
        return `部门${i}`;
      } else if (prop.includes("周期")) {
        return "每日";
      } else if (prop.includes("地址")) {
        return `http://api.example.com/${i}`;
      } else if (prop.includes("方式")) {
        return "POST";
      } else if (prop.includes("说明")) {
        return `这是第${i}条数据的说明`;
      } else {
        return `数据${i}`;
      }
    });
    rows.push(row);
  }
  return rows;
}

/**
 * 生成并下载导入模板
 * @param {Array} columns - 表格列配置数组，如 [{prop: "名称", label: "名称"}, ...]
 * @param {string} templateName - 模板文件名（不含后缀）
 */
export function downloadImportTemplate(columns, templateName = "导入模板") {
  // 生成表头行（使用prop作为列名，对应表格数据的字段）
  const header = columns.map((col) => col.prop);
  // 生成模拟数据行（数组格式）
  const mockRows = generateMockData(columns);

  // 构建工作表数据：第一行是表头（prop名），后面是模拟数据
  const wsData = [header, ...mockRows];

  // 创建工作簿
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // 设置列宽
  ws["!cols"] = columns.map(() => ({ wch: 20 }));

  XLSX.utils.book_append_sheet(wb, ws, "导入模板");
  XLSX.writeFile(wb, templateName + ".xlsx");
}
