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
 * 根据列名生成逼真的模拟值
 * @param {string} prop - 列字段名
 * @param {number} index - 行序号 (1-based)
 * @returns {*} - 生成的模拟值
 */
function generateRealisticValue(prop, index) {
  const cycle = (arr) => arr[(index - 1) % arr.length];

  // ========== ID / 编号类 ==========
  if (prop === "指令ID") return `UP-CMD-2026052600${index}`;
  if (prop === "任务编号") return `ST-${59200 + index * 7 + 2}`;
  if (prop === "指令编号") return `CMD-${20260526000 + index}`;
  if (prop === "指令流水号") return `FLOW-2026052600${index}`;
  if (prop === "工单编号") return `WO-${59200 + index * 3}`;
  if (prop === "上报编号") return `UP-${59200 + index * 5}`;
  if (prop === "下发编号") return `DW-${59200 + index * 4}`;
  if (prop === "入库编号") return `IN-${59200 + index * 6}`;
  if (prop === "校验编号") return `CHK-${59200 + index * 2}`;
  if (prop === "反馈编号") return `FB-${59200 + index * 8}`;
  if (prop === "事件编号") return `EVT-${59200 + index * 9}`;
  if (prop === "资源编号") return `RES-${59200 + index * 7}`;
  if (prop === "条目编号") return `ITM-${59200 + index * 11}`;
  if (prop === "规则编号") return `RUL-${59200 + index * 3}`;
  if (prop === "日志编号") return `LOG-${59200 + index * 5}`;
  if (prop === "资产编号") return `AST-${59200 + index * 4}`;
  if (prop === "接口编号") return `API-${59200 + index * 6}`;
  if (prop === "参数编号") return `PRM-${59200 + index * 2}`;
  if (prop === "采集批次") return `BAT-${index}`;
  if (prop === "扫描批次") return `SBAT-${index}`;
  if (prop === "数据批次") return `DBAT-${index}`;
  if (prop === "校验批次") return `VBAT-${index}`;
  if (prop === "编号") return `NO_${String(index).padStart(3, "0")}`;
  if (prop === "ID") return `ID-2026052600${index}`;

  // ========== 名称类 ==========
  if (prop === "任务名称") return cycle(["资产漏洞扫描任务", "数据库指纹采集任务", "主机存活探测任务", "端口开放性扫描任务", "配置合规性检查任务"]);
  if (prop === "业务名称") return cycle(["资产核查业务", "指令同步业务", "数据采集业务", "状态上报业务", "告警处理业务"]);
  if (prop === "资产名称") return cycle(["核心交换机-01", "防火墙-FW01", "服务器-SRV02", "数据库-DB01", "路由器-RT01"]);
  if (prop === "资源名称") return cycle(["CPU监控资源", "内存监控资源", "磁盘监控资源", "网络监控资源", "进程监控资源"]);
  if (prop === "报表名称") return cycle(["月度资产统计报表", "安全事件汇总报表", "扫描任务执行报表", "漏洞修复进度报表", "资产变更记录报表"]);
  if (prop === "规则名称") return cycle(["端口开放检测规则", "弱口令扫描规则", "配置合规检查规则", "异常流量检测规则", "资产变更告警规则"]);
  if (prop === "模块名称") return cycle(["资产采集模块", "漏洞扫描模块", "指令解析模块", "数据同步模块", "告警处理模块"]);
  if (prop === "监控对象") return cycle(["核心交换机", "数据库服务器", "Web应用服务器", "防火墙设备", "负载均衡器"]);
  if (prop === "监控指标") return cycle(["CPU使用率", "内存使用率", "磁盘IO", "网络带宽", "连接数"]);
  if (prop === "关联对象") return cycle(["资产扫描任务", "指令下发任务", "数据采集任务", "配置备份任务", "漏洞修复任务"]);
  if (prop === "关联资产") return cycle(["172.20.14.10 核心交换机", "10.24.18.20 数据库", "192.168.1.30 服务器"]);
  if (prop === "关联指令") return cycle(["UP-CMD-20260520001", "UP-CMD-20260522002", "UP-CMD-20260524003"]);
  if (prop === "对接系统") return cycle(["工信部安全管理平台", "资产管理系统", "运维监控系统", "漏洞管理系统"]);
  if (prop === "来源系统") return cycle(["工信部内网系统", "资产采集系统", "运维管理系统"]);
  if (prop === "目标系统") return cycle(["安全运营中心", "资产管理系统", "漏洞管理平台"]);
  if (prop === "数据源") return cycle(["SNMP采集器", "WMI采集器", "主动扫描引擎", "被动流量分析"]);
  if (prop === "名称") return cycle(["核心交换机监控", "防火墙策略审计", "服务器指纹采集", "数据库访问监控", "网络流量分析"]);
  if (prop === "指令名称") return cycle(["资产核查指令下发", "配置备份指令", "漏洞扫描指令", "数据采集指令", "策略下发指令"]);

  // ========== 状态类（以"状态"结尾）==========
  if (prop === "任务状态") return cycle(["待处理", "执行中", "已完成", "已下发", "已入库"]);
  if (prop === "指令状态") return cycle(["已完成", "执行中", "失败", "已暂停"]);
  if (prop === "处理状态") return cycle(["待处理", "处理中", "已完成", "已驳回"]);
  if (prop === "执行状态") return cycle(["待执行", "执行中", "已完成", "执行失败"]);
  if (prop === "扫描状态") return cycle(["待扫描", "扫描中", "已完成", "异常"]);
  if (prop === "采集状态") return cycle(["待采集", "采集中", "已完成", "采集失败"]);
  if (prop === "上报状态") return cycle(["待上报", "上报中", "已上报", "上报失败"]);
  if (prop === "下发状态") return cycle(["待下发", "下发中", "已下发", "下发失败"]);
  if (prop === "入库状态") return cycle(["待入库", "入库中", "已入库", "入库失败"]);
  if (prop === "同步状态") return cycle(["待同步", "同步中", "已同步", "同步失败"]);
  if (prop === "校验状态") return cycle(["待校验", "校验中", "已通过", "校验失败"]);
  if (prop === "核验状态") return cycle(["待核验", "核验中", "已通过", "核验失败"]);
  if (prop === "回执状态") return cycle(["待回执", "已回执", "回执异常"]);
  if (prop === "工单状态") return cycle(["待处理", "处理中", "已关闭", "已挂起"]);
  if (prop === "告警状态") return cycle(["正常", "告警", "严重", "已确认"]);
  if (prop === "解析状态") return cycle(["待解析", "解析中", "解析成功", "解析失败"]);
  if (prop === "调用状态") return cycle(["待调用", "调用中", "调用成功", "调用失败"]);
  if (prop === "通道状态") return cycle(["正常", "异常", "已断开"]);
  if (prop === "配置状态") return cycle(["已配置", "未配置", "配置异常"]);
  if (prop === "启用状态") return cycle(["启用", "停用"]);
  if (prop === "纳管状态") return cycle(["已纳管", "未纳管", "纳管中"]);
  if (prop === "生成状态") return cycle(["已生成", "未生成", "生成中"]);
  if (prop === "处置状态") return cycle(["待处置", "处置中", "已处置", "已忽略"]);
  if (prop === "状态") return cycle(["启用", "处理中", "待审批", "已停用"]);

  // ========== 类型类（以"类型"结尾）==========
  if (prop === "任务类型") return cycle(["全端口扫描", "指纹识别", "漏洞检测", "存活探测"]);
  if (prop === "业务类型") return cycle(["资产核查", "指令同步", "数据采集", "状态上报", "告警处理"]);
  if (prop === "指令类型") return cycle(["查询指令", "资产扫描指令", "资产核查指令", "数据采集指令", "配置下发指令"]);
  if (prop === "资产类型") return cycle(["服务器", "交换机", "路由器", "防火墙", "数据库"]);
  if (prop === "资产分类") return cycle(["网络设备", "安全设备", "服务器", "存储设备", "终端设备"]);
  if (prop === "资源类型") return cycle(["CPU", "内存", "磁盘", "网络", "进程"]);
  if (prop === "报表类型") return cycle(["日报", "周报", "月报", "年报"]);
  if (prop === "规则类型") return cycle(["检测规则", "告警规则", "过滤规则", "关联规则"]);
  if (prop === "工单类型") return cycle(["故障工单", "变更工单", "巡检工单", "应急工单"]);
  if (prop === "事件类型") return cycle(["安全事件", "运维事件", "网络事件", "系统事件"]);
  if (prop === "数据类型") return cycle(["结构化数据", "半结构化数据", "非结构化数据"]);
  if (prop === "数据格式") return cycle(["JSON", "XML", "CSV", "二进制"]);
  if (prop === "采集协议") return cycle(["SNMP", "WMI", "SSH", "Telnet", "HTTPS"]);
  if (prop === "采集器类型") return cycle(["流式采集", "批量采集", "实时采集"]);
  if (prop === "扫描类型") return cycle(["全端口扫描", "快速扫描", "深度扫描"]);
  if (prop === "类型") return cycle(["常规类型", "高级类型", "自定义类型"]);

  // ========== 时间类 ==========
  if (prop.includes("时间")) {
    return cycle([
      "2026-05-20 09:15:23",
      "2026-05-22 14:32:07",
      "2026-05-24 10:48:51",
      "2026-05-25 16:20:33",
      "2026-05-26 08:05:12",
    ]);
  }

  // ========== 人员类 ==========
  if (prop.includes("负责人") || prop.includes("操作人") || prop.includes("处理人") || prop.includes("审核人") || prop.includes("创建人")) {
    return cycle(["张伟", "王芳", "李娜", "刘洋", "陈静", "杨磊", "赵敏", "黄强", "周涛", "吴昊", "徐明", "孙丽", "马超", "朱军", "郭敏"]);
  }
  if (prop === "用户名") return cycle(["zhangwei", "wangfang", "lina", "liuyang", "chenjinglei", "yanglei", "zhaomin", "huangqiang", "zhoutao", "wuhao"]);
  if (prop === "手机号") return cycle(["138****1234", "159****5678", "186****9012", "137****3456", "155****7890", "188****2345", "136****6789", "150****0123"]);
  if (prop === "邮箱") return cycle(["zhangwei@example.com", "wangfang@example.com", "lina@example.com", "liuyang@example.com", "chenjing@example.com"]);
  if (prop.includes("部门")) return cycle(["安全运维部", "网络安全部", "资产管理部", "技术保障部", "信息安全部", "运维监控部", "数据管理部"]);
  if (prop.includes("区域")) return cycle(["华北区域", "华东区域", "华南区域", "西南区域", "华中区域", "西北区域"]);

  // ========== IP / 地址类 ==========
  if (prop === "扫描目标" || prop === "IP范围" || prop === "目标IP段") {
    return cycle(["172.20.14.0/24", "10.24.18.0/24", "192.168.1.0/24", "10.0.0.0/16"]);
  }
  if (prop === "IP地址") return cycle(["172.20.14.10", "10.24.18.20", "192.168.1.30"]);
  if (prop === "接口地址") return cycle(["https://api.example.com/v1/scan", "http://10.24.18.100:8080/api"]);
  if (prop === "接口名称") return cycle(["资产扫描接口", "数据采集接口", "状态上报接口", "指令下发接口"]);
  if (prop.includes("地址")) return `https://api.example.com/v1/${index}`;

  // ========== 扫描 / 执行类 ==========
  if (prop === "扫描器节点") return cycle(["中心扫描引擎", "分布式节点A", "边缘采集节点"]);
  if (prop === "扫描器") return cycle(["Nmap引擎", "Zmap引擎", "Masscan引擎"]);
  if (prop === "扫描对象") return cycle(["172.20.14.0/24 网段", "10.24.18.0/24 网段", "核心服务器群"]);
  if (prop === "扫描节点") return cycle(["节点A-北京", "节点B-上海", "节点C-广州"]);
  if (prop === "扫描端口") return cycle(["1-1024", "1-65535", "80,443,3306,8080"]);
  if (prop === "扫描策略") return cycle(["保守策略", "标准策略", "激进策略"]);
  if (prop === "执行节点") return cycle(["主节点", "备用节点", "分布式节点"]);
  if (prop === "执行结果") return cycle(["成功", "部分成功", "失败"]);
  if (prop === "执行耗时") return cycle(["120ms", "350ms", "780ms", "1.2s"]);
  if (prop === "扫描耗时") return cycle(["45s", "2min 30s", "5min 12s"]);
  if (prop === "平均耗时") return cycle(["120ms", "250ms", "500ms"]);
  if (prop === "耗时(ms)") return cycle([85, 230, 450, 1200]);
  if (prop === "成功率") return cycle(["98.5%", "95.2%", "87.3%", "99.1%"]);
  if (prop === "进度") return cycle(["25%", "50%", "75%", "100%"]);

  // ========== 数值类 ==========
  if (prop === "存活主机数" || prop === "发现资产数") return cycle([45, 128, 73, 196, 32]);
  if (prop === "端口覆盖率") return cycle(["75%", "88%", "92%", "67%", "95%"]);
  if (prop === "端口开放数") return cycle([120, 350, 78, 420, 56]);
  if (prop.includes("数据量")) return cycle([1024, 2048, 512, 4096, 768]);
  if (prop === "资产数量") return cycle([156, 238, 89, 312, 45]);
  if (prop === "入库数量") return cycle([120, 200, 75, 280, 40]);
  if (prop === "异常数量" || prop === "异常资产数" || prop === "不一致数") return cycle([3, 12, 5, 8, 1]);
  if (prop === "记录总数" || prop === "记录条数") return cycle([1560, 2380, 890, 3120, 450]);
  if (prop === "调用次数") return cycle([1200, 3500, 780, 4200]);
  if (prop === "命中次数") return cycle([45, 128, 73, 196]);
  if (prop === "重试次数") return cycle([0, 1, 2, 3]);
  if (prop === "线程数") return cycle([4, 8, 16, 32]);
  if (prop === "导出次数") return cycle([5, 12, 3, 8]);
  if (prop === "CPU/内存") return cycle(["45%/60%", "72%/85%", "30%/42%", "88%/91%"]);
  if (prop === "IP段数量") return cycle([5, 12, 3, 8, 15]);
  if (prop === "阈值") return cycle([80, 90, 70, 95]);
  if (prop === "当前值") return cycle([65, 82, 45, 93]);
  if (prop === "分类置信度") return cycle(["92%", "87%", "95%", "78%"]);

  // ========== 告警 / 优先级 / 级别 ==========
  if (prop === "告警级别" || prop === "事件级别" || prop === "风险等级") {
    return cycle(["低", "中", "高", "严重"]);
  }
  if (prop === "优先级") return cycle(["P1-紧急", "P2-高", "P3-中", "P4-低"]);

  // ========== 系统 / 模块 / 对象 ==========
  if (prop === "所属主机") return cycle(["172.20.14.10", "10.24.18.20", "192.168.1.30"]);
  if (prop === "资产归属") return cycle(["网络组", "安全组", "运维组", "开发组"]);
  if (prop === "字段来源") return cycle(["系统采集", "手动录入", "接口同步"]);
  if (prop === "数据来源") return cycle(["SNMP采集", "WMI采集", "主动扫描", "流量分析"]);
  if (prop === "采集来源") return cycle(["资产扫描", "指令下发", "自动发现"]);
  if (prop === "指令来源") return cycle(["工信部平台", "省级平台", "本地触发"]);
  if (prop === "发现方式") return cycle(["主动扫描", "被动发现", "手动录入", "接口同步"]);
  if (prop === "监控频率") return cycle(["每5分钟", "每15分钟", "每小时", "每日"]);
  if (prop === "更新频率") return cycle(["实时", "每小时", "每日", "每周"]);

  // ========== 调用 / 请求 ==========
  if (prop === "调用方式" || prop === "请求方式") return cycle(["POST", "GET", "PUT", "DELETE"]);
  if (prop.includes("方式")) return cycle(["POST", "GET", "PUT"]);

  // ========== 周期 ==========
  if (prop.includes("周期")) return cycle(["每日", "每周", "每月"]);

  // ========== 结果类 ==========
  if (prop === "指令解析结果") return cycle(["解析成功", "解析失败"]);
  if (prop === "执行结果" || prop === "反馈结果" || prop === "校验结果") return cycle(["成功", "部分成功", "失败"]);
  if (prop.includes("结果")) return cycle(["成功", "部分成功", "失败"]);

  // ========== 说明 / 摘要 ==========
  if (prop.includes("说明")) return cycle(["自动扫描资产存活状态", "采集设备指纹信息", "检测端口开放情况", "验证配置合规性"]);
  if (prop === "日志摘要") return cycle(["扫描任务启动成功", "数据采集完成", "指令解析异常", "同步任务完成"]);

  // ========== 日志级别 ==========
  if (prop === "日志级别") return cycle(["INFO", "WARN", "ERROR", "DEBUG"]);

  // ========== 其他特定字段 ==========
  if (prop === "默认值") return cycle(["是", "否", "自动"]);
  if (prop === "所在主机") return cycle(["172.20.14.10", "10.24.18.20", "192.168.1.30"]);
  if (prop === "当前环节") return cycle(["受理中", "处理中", "审核中", "已完成"]);
  if (prop === "统计周期") return cycle(["近7天", "近30天", "近90天", "本月"]);
  if (prop === "接收系统") return cycle(["省级平台", "工信部平台", "地市平台"]);
  if (prop === "超时标记") return cycle(["正常", "超时", "即将超时"]);
  if (prop === "参数值") return cycle(["192.168.1.0/24", "80,443", "300", "true"]);
  if (prop === "参数名称") return cycle(["目标网段", "扫描端口", "超时时间", "启用指纹"]);

  // ========== 通用兜底：基于prop名推断 ==========
  // 编号类兜底
  if (prop.includes("编号")) return `NO-${String(index).padStart(3, "0")}`;
  // 名称类兜底
  if (prop.includes("名称")) return `示例${prop}${index}`;
  // 状态类兜底
  if (prop.includes("状态")) return cycle(["正常", "异常", "待确认"]);
  // 类型类兜底
  if (prop.includes("类型")) return cycle(["类型A", "类型B", "类型C"]);
  // 数量类兜底
  if (prop.includes("数量") || prop.includes("数")) return [10, 25, 48, 72, 15][(index - 1) % 5];
  // 次数类兜底
  if (prop.includes("次数")) return [3, 8, 15, 22, 5][(index - 1) % 5];

  // 最终兜底
  return `示例${prop}${index}`;
}

/**
 * 根据列配置生成模拟数据（数组格式，用于 aoa_to_sheet）
 * @param {Array} columns - 表格列配置数组
 * @returns {Array<Array>} - 模拟数据行数组
 */
function generateMockData(columns) {
  const props = columns.map((col) => col.prop);
  const rows = [];
  for (let i = 1; i <= 3; i++) {
    const row = props.map((prop) => generateRealisticValue(prop, i));
    rows.push(row);
  }
  return rows;
}

/**
 * 根据列配置生成默认数据行（所有字段都有值）
 * @param {Array} columns - 表格列配置数组，如 [{prop: "名称", label: "名称", type: "select", options: [...]}]
 * @param {number} rowCount - 生成的行数，默认3
 * @returns {Array<Object>} - 默认数据行数组
 */
export function generateDefaultData(columns, rowCount = Math.floor(Math.random() * 6) + 3) {
  const dataColumns = columns.filter(
    (col) => col.slot !== "operate" && col.prop && col.label
  );
  const rows = [];
  for (let i = 1; i <= rowCount; i++) {
    const row = {};
    dataColumns.forEach((col) => {
      const prop = col.prop;
      if (col.type === "select" && col.options && col.options.length > 0) {
        row[prop] = col.options[(i - 1) % col.options.length].value;
      } else {
        row[prop] = generateRealisticValue(prop, i);
      }
    });
    rows.push(row);
  }
  return rows;
}

/**
 * 根据功能名称获取操作类型
 * @param {string} name - 功能名称
 * @returns {string} - 操作类型标识
 */
export function getActionType(name) {
  if (/接收.*请求|接收.*处理/.test(name)) return "receive_request";
  if (/接收.*反馈|接收.*信息|接收.*结果/.test(name)) return "receive_feedback";
  if (/接收/.test(name)) return "receive";
  if (/发送/.test(name)) return "send";
  if (/录入|配置|新增|创建|保存|建立|修改/.test(name)) return "configure";
  if (/调用.*流程|调用.*处理/.test(name)) return "invoke";
  if (/反馈.*结果|返回.*结果/.test(name)) return "feedback_result";
  if (/反馈|返回|输出/.test(name)) return "feedback";
  if (/^调度|唤醒/.test(name)) return "dispatch";
  if (/调度(?!模块)/.test(name)) return "dispatch";
  if (/查询|读取|展示|监控|跟踪/.test(name)) return "query";
  if (/导出|下载/.test(name)) return "export";
  if (/删除|移除/.test(name)) return "delete";
  if (/分析|统计|报表/.test(name)) return "analysis";
  if (/导入|上传/.test(name)) return "import";
  return "operation";
}

/**
 * 根据功能名称获取按钮图标
 * @param {string} name - 功能名称
 * @returns {string} - Element UI 图标类名
 */
export function getButtonIcon(name) {
  if (/接收.*请求/.test(name)) return "el-icon-download";
  if (/接收.*反馈|接收.*信息/.test(name)) return "el-icon-document-checked";
  if (/接收/.test(name)) return "el-icon-download";
  if (/发送/.test(name)) return "el-icon-s-promotion";
  if (/录入|配置|新增|创建|保存|建立/.test(name)) return "el-icon-edit-outline";
  if (/修改/.test(name)) return "el-icon-edit";
  if (/调用.*流程/.test(name)) return "el-icon-s-claim";
  if (/调用/.test(name)) return "el-icon-s-promotion";
  if (/反馈.*结果/.test(name)) return "el-icon-finished";
  if (/反馈|返回|输出/.test(name)) return "el-icon-upload2";
  if (/^调度|唤醒/.test(name)) return "el-icon-s-opportunity";
  if (/调度(?!模块)/.test(name)) return "el-icon-s-opportunity";
  if (/查询|读取|展示|监控|跟踪/.test(name)) return "el-icon-view";
  if (/导出|下载/.test(name)) return "el-icon-download";
  if (/删除|移除/.test(name)) return "el-icon-delete";
  if (/分析|统计|报表/.test(name)) return "el-icon-data-analysis";
  if (/导入|上传/.test(name)) return "el-icon-upload2";
  return "el-icon-s-operation";
}

/**
 * 根据列配置生成单行默认数据（用于新增表单预填充）
 * @param {Array} columns - 表格列配置数组
 * @returns {Object} - 默认数据行
 */
export function generateDefaultRow(columns) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const timeStr =
    now.getFullYear() +
    "-" +
    pad(now.getMonth() + 1) +
    "-" +
    pad(now.getDate()) +
    " " +
    pad(now.getHours()) +
    ":" +
    pad(now.getMinutes()) +
    ":" +
    pad(now.getSeconds());
  const categoryMap = {
    资产类型: ["服务器", "交换机", "路由器", "防火墙", "数据库", "存储设备"],
    资产分类: ["网络设备", "安全设备", "服务器", "存储设备", "终端设备"],
    资产归属: ["网络组", "安全组", "运维组", "开发组"],
    风险等级: ["低", "中", "高", "严重"],
    告警级别: ["低", "中", "高", "严重"],
    事件级别: ["低", "中", "高", "严重"],
    数据来源: ["主动扫描", "被动发现", "手动录入", "接口同步"],
    采集来源: ["资产扫描", "指令下发", "自动发现"],
    发现方式: ["主动扫描", "被动发现", "手动录入", "接口同步"],
    指令来源: ["工信部平台", "省级平台", "本地触发"],
    来源系统: ["工信部内网系统", "资产采集系统", "运维管理系统"],
    对接系统: ["工信部安全管理平台", "资产管理系统", "运维监控系统"],
    优先级: ["P1-紧急", "P2-高", "P3-中", "P4-低"],
    日志级别: ["INFO", "WARN", "ERROR", "DEBUG"],
    数据格式: ["JSON", "XML", "CSV", "二进制"],
    数据类型: ["结构化数据", "半结构化数据", "非结构化数据"],
  };
  const categoryRegex =
    /资产类型|资产分类|资产归属|风险等级|告警级别|事件级别|数据来源|采集来源|发现方式|指令来源|来源系统|对接系统|优先级|日志级别|数据格式|数据类型/;
  const row = {};
  columns.forEach((col) => {
    if (col.slot === "operate" || !col.prop) return;
    if (col.type === "select" && col.options && col.options.length > 0) {
      row[col.prop] = col.options[0].value;
    } else if (/时间/.test(col.prop)) {
      row[col.prop] = timeStr;
    } else if (categoryRegex.test(col.prop)) {
      for (const key of Object.keys(categoryMap)) {
        if (col.prop === key || col.prop.includes(key)) {
          row[col.prop] = categoryMap[key][0];
          break;
        }
      }
      if (!row[col.prop]) row[col.prop] = "";
    } else {
      row[col.prop] = "";
    }
  });
  return row;
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

  // 兼容处理：writeFile 在部分浏览器可能被拦截，使用 Blob + a标签 下载
  try {
    XLSX.writeFile(wb, templateName + ".xlsx");
  } catch (e) {
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = templateName + ".xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
