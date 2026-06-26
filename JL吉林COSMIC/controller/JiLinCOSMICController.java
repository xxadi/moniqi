package com.neusoft.mid.controller.gen;

import com.neusoft.mid.common.base.BaseController;
import io.swagger.annotations.Api;
import org.apache.shiro.authz.annotation.RequiresPermissions;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * JL吉林COSMIC功能入口
 */
@Controller
@RequestMapping("/JiLinCOSMICController")
@Api(value = "JiLinCOSMICController", tags = "JL吉林COSMIC功能")
public class JiLinCOSMICController extends BaseController {

    private final String prefix = "gen/jiLinCOSMIC";

    @GetMapping("IPv4扫描器调度任务管理")
    @RequiresPermissions("gen:JiLinCOSMICController:IPv4扫描器调度任务管理:view")
    public String page001() {
        return prefix + "/IPv4扫描器调度任务管理";
    }

    @GetMapping("IPv6扫描器调度任务管理")
    @RequiresPermissions("gen:JiLinCOSMICController:IPv6扫描器调度任务管理:view")
    public String page002() {
        return prefix + "/IPv6扫描器调度任务管理";
    }

    @GetMapping("IP可访问信息探测管理")
    @RequiresPermissions("gen:JiLinCOSMICController:IP可访问信息探测管理:view")
    public String page003() {
        return prefix + "/IP可访问信息探测管理";
    }

    @GetMapping("IP扫描任务分发流程管理")
    @RequiresPermissions("gen:JiLinCOSMICController:IP扫描任务分发流程管理:view")
    public String page004() {
        return prefix + "/IP扫描任务分发流程管理";
    }

    @GetMapping("IP扫描指令下发接口")
    @RequiresPermissions("gen:JiLinCOSMICController:IP扫描指令下发接口:view")
    public String page005() {
        return prefix + "/IP扫描指令下发接口";
    }

    @GetMapping("IP扫描指令反馈接口")
    @RequiresPermissions("gen:JiLinCOSMICController:IP扫描指令反馈接口:view")
    public String page006() {
        return prefix + "/IP扫描指令反馈接口";
    }

    @GetMapping("IP扫描指令接收管理")
    @RequiresPermissions("gen:JiLinCOSMICController:IP扫描指令接收管理:view")
    public String page007() {
        return prefix + "/IP扫描指令接收管理";
    }

    @GetMapping("IP段扫描规则管理")
    @RequiresPermissions("gen:JiLinCOSMICController:IP段扫描规则管理:view")
    public String page008() {
        return prefix + "/IP段扫描规则管理";
    }

    @GetMapping("IP端口扫描准确性校验任务管理")
    @RequiresPermissions("gen:JiLinCOSMICController:IP端口扫描准确性校验任务管理:view")
    public String page009() {
        return prefix + "/IP端口扫描准确性校验任务管理";
    }

    @GetMapping("IP纳管对比报表")
    @RequiresPermissions("gen:JiLinCOSMICController:IP纳管对比报表:view")
    public String page010() {
        return prefix + "/IP纳管对比报表";
    }

    @GetMapping("IP资产组件反馈接口")
    @RequiresPermissions("gen:JiLinCOSMICController:IP资产组件反馈接口:view")
    public String page011() {
        return prefix + "/IP资产组件反馈接口";
    }

    @GetMapping("SFTP传输通道监控")
    @RequiresPermissions("gen:JiLinCOSMICController:SFTP传输通道监控:view")
    public String page012() {
        return prefix + "/SFTP传输通道监控";
    }

    @GetMapping("content文件生成任务管理")
    @RequiresPermissions("gen:JiLinCOSMICController:content文件生成任务管理:view")
    public String page013() {
        return prefix + "/content文件生成任务管理";
    }

    @GetMapping("三方资源库管理")
    @RequiresPermissions("gen:JiLinCOSMICController:三方资源库管理:view")
    public String page014() {
        return prefix + "/三方资源库管理";
    }

    @GetMapping("上报任务调度管理")
    @RequiresPermissions("gen:JiLinCOSMICController:上报任务调度管理:view")
    public String page015() {
        return prefix + "/上报任务调度管理";
    }

    @GetMapping("上报失败原因分析")
    @RequiresPermissions("gen:JiLinCOSMICController:上报失败原因分析:view")
    public String page016() {
        return prefix + "/上报失败原因分析";
    }

    @GetMapping("上报结果接收接口")
    @RequiresPermissions("gen:JiLinCOSMICController:上报结果接收接口:view")
    public String page017() {
        return prefix + "/上报结果接收接口";
    }

    @GetMapping("主机资产报表")
    @RequiresPermissions("gen:JiLinCOSMICController:主机资产报表:view")
    public String page018() {
        return prefix + "/主机资产报表";
    }

    @GetMapping("主机资产采集管理")
    @RequiresPermissions("gen:JiLinCOSMICController:主机资产采集管理:view")
    public String page019() {
        return prefix + "/主机资产采集管理";
    }

    @GetMapping("内网资产content结果反馈管理")
    @RequiresPermissions("gen:JiLinCOSMICController:内网资产content结果反馈管理:view")
    public String page020() {
        return prefix + "/内网资产content结果反馈管理";
    }

    @GetMapping("内网资产识别模型管理")
    @RequiresPermissions("gen:JiLinCOSMICController:内网资产识别模型管理:view")
    public String page021() {
        return prefix + "/内网资产识别模型管理";
    }

    @GetMapping("内网采集上报数据管理")
    @RequiresPermissions("gen:JiLinCOSMICController:内网采集上报数据管理:view")
    public String page022() {
        return prefix + "/内网采集上报数据管理";
    }

    @GetMapping("内网采集任务接收管理")
    @RequiresPermissions("gen:JiLinCOSMICController:内网采集任务接收管理:view")
    public String page023() {
        return prefix + "/内网采集任务接收管理";
    }

    @GetMapping("内网采集任务调度监控管理")
    @RequiresPermissions("gen:JiLinCOSMICController:内网采集任务调度监控管理:view")
    public String page024() {
        return prefix + "/内网采集任务调度监控管理";
    }

    @GetMapping("内网采集指令文件管理")
    @RequiresPermissions("gen:JiLinCOSMICController:内网采集指令文件管理:view")
    public String page025() {
        return prefix + "/内网采集指令文件管理";
    }

    @GetMapping("内网采集结果上报接口")
    @RequiresPermissions("gen:JiLinCOSMICController:内网采集结果上报接口:view")
    public String page026() {
        return prefix + "/内网采集结果上报接口";
    }

    @GetMapping("内网采集资产模拟校验任务管理")
    @RequiresPermissions("gen:JiLinCOSMICController:内网采集资产模拟校验任务管理:view")
    public String page027() {
        return prefix + "/内网采集资产模拟校验任务管理";
    }

    @GetMapping("内网采集资产管理")
    @RequiresPermissions("gen:JiLinCOSMICController:内网采集资产管理:view")
    public String page028() {
        return prefix + "/内网采集资产管理";
    }

    @GetMapping("办公外设资产管理")
    @RequiresPermissions("gen:JiLinCOSMICController:办公外设资产管理:view")
    public String page029() {
        return prefix + "/办公外设资产管理";
    }

    @GetMapping("单IP扫描流程管理")
    @RequiresPermissions("gen:JiLinCOSMICController:单IP扫描流程管理:view")
    public String page030() {
        return prefix + "/单IP扫描流程管理";
    }

    @GetMapping("厂商品牌型号代码管理")
    @RequiresPermissions("gen:JiLinCOSMICController:厂商品牌型号代码管理:view")
    public String page031() {
        return prefix + "/厂商品牌型号代码管理";
    }

    @GetMapping("反馈资产完整性校验管理")
    @RequiresPermissions("gen:JiLinCOSMICController:反馈资产完整性校验管理:view")
    public String page032() {
        return prefix + "/反馈资产完整性校验管理";
    }

    @GetMapping("反馈资产状态监控")
    @RequiresPermissions("gen:JiLinCOSMICController:反馈资产状态监控:view")
    public String page033() {
        return prefix + "/反馈资产状态监控";
    }

    @GetMapping("变更资产查询接口")
    @RequiresPermissions("gen:JiLinCOSMICController:变更资产查询接口:view")
    public String page034() {
        return prefix + "/变更资产查询接口";
    }

    @GetMapping("处置下发工单管理")
    @RequiresPermissions("gen:JiLinCOSMICController:处置下发工单管理:view")
    public String page035() {
        return prefix + "/处置下发工单管理";
    }

    @GetMapping("备案对比校验规则管理")
    @RequiresPermissions("gen:JiLinCOSMICController:备案对比校验规则管理:view")
    public String page036() {
        return prefix + "/备案对比校验规则管理";
    }

    @GetMapping("备案验证结果报表")
    @RequiresPermissions("gen:JiLinCOSMICController:备案验证结果报表:view")
    public String page037() {
        return prefix + "/备案验证结果报表";
    }

    @GetMapping("大模型资产管理")
    @RequiresPermissions("gen:JiLinCOSMICController:大模型资产管理:view")
    public String page038() {
        return prefix + "/大模型资产管理";
    }

    @GetMapping("存量未纳管资产管理")
    @RequiresPermissions("gen:JiLinCOSMICController:存量未纳管资产管理:view")
    public String page039() {
        return prefix + "/存量未纳管资产管理";
    }

    @GetMapping("存量资产对比模型管理")
    @RequiresPermissions("gen:JiLinCOSMICController:存量资产对比模型管理:view")
    public String page040() {
        return prefix + "/存量资产对比模型管理";
    }

    @GetMapping("定级对象上报库管理")
    @RequiresPermissions("gen:JiLinCOSMICController:定级对象上报库管理:view")
    public String page041() {
        return prefix + "/定级对象上报库管理";
    }

    @GetMapping("工信部内网采集联动接口")
    @RequiresPermissions("gen:JiLinCOSMICController:工信部内网采集联动接口:view")
    public String page042() {
        return prefix + "/工信部内网采集联动接口";
    }

    @GetMapping("工信部支持组件管理")
    @RequiresPermissions("gen:JiLinCOSMICController:工信部支持组件管理:view")
    public String page043() {
        return prefix + "/工信部支持组件管理";
    }

    @GetMapping("工信部联动扫描任务管理")
    @RequiresPermissions("gen:JiLinCOSMICController:工信部联动扫描任务管理:view")
    public String page044() {
        return prefix + "/工信部联动扫描任务管理";
    }

    @GetMapping("工信部采集策略配置管理")
    @RequiresPermissions("gen:JiLinCOSMICController:工信部采集策略配置管理:view")
    public String page045() {
        return prefix + "/工信部采集策略配置管理";
    }

    @GetMapping("应用软件资产管理")
    @RequiresPermissions("gen:JiLinCOSMICController:应用软件资产管理:view")
    public String page046() {
        return prefix + "/应用软件资产管理";
    }

    @GetMapping("待分析数据管理")
    @RequiresPermissions("gen:JiLinCOSMICController:待分析数据管理:view")
    public String page047() {
        return prefix + "/待分析数据管理";
    }

    @GetMapping("扫描任务动态分配规则管理")
    @RequiresPermissions("gen:JiLinCOSMICController:扫描任务动态分配规则管理:view")
    public String page048() {
        return prefix + "/扫描任务动态分配规则管理";
    }

    @GetMapping("扫描任务接收管理")
    @RequiresPermissions("gen:JiLinCOSMICController:扫描任务接收管理:view")
    public String page049() {
        return prefix + "/扫描任务接收管理";
    }

    @GetMapping("扫描任务日志上报接口")
    @RequiresPermissions("gen:JiLinCOSMICController:扫描任务日志上报接口:view")
    public String page050() {
        return prefix + "/扫描任务日志上报接口";
    }

    @GetMapping("扫描任务日志管理")
    @RequiresPermissions("gen:JiLinCOSMICController:扫描任务日志管理:view")
    public String page051() {
        return prefix + "/扫描任务日志管理";
    }

    @GetMapping("扫描探针管理")
    @RequiresPermissions("gen:JiLinCOSMICController:扫描探针管理:view")
    public String page052() {
        return prefix + "/扫描探针管理";
    }

    @GetMapping("扫描策略管理")
    @RequiresPermissions("gen:JiLinCOSMICController:扫描策略管理:view")
    public String page053() {
        return prefix + "/扫描策略管理";
    }

    @GetMapping("扫描结果上报接口")
    @RequiresPermissions("gen:JiLinCOSMICController:扫描结果上报接口:view")
    public String page054() {
        return prefix + "/扫描结果上报接口";
    }

    @GetMapping("指令上报接口")
    @RequiresPermissions("gen:JiLinCOSMICController:指令上报接口:view")
    public String page055() {
        return prefix + "/指令上报接口";
    }

    @GetMapping("指令上报时效管理")
    @RequiresPermissions("gen:JiLinCOSMICController:指令上报时效管理:view")
    public String page056() {
        return prefix + "/指令上报时效管理";
    }

    @GetMapping("指令反馈状态同步接口")
    @RequiresPermissions("gen:JiLinCOSMICController:指令反馈状态同步接口:view")
    public String page057() {
        return prefix + "/指令反馈状态同步接口";
    }

    @GetMapping("指令反馈超时预警管理")
    @RequiresPermissions("gen:JiLinCOSMICController:指令反馈超时预警管理:view")
    public String page058() {
        return prefix + "/指令反馈超时预警管理";
    }

    @GetMapping("指令接收任务调度管理")
    @RequiresPermissions("gen:JiLinCOSMICController:指令接收任务调度管理:view")
    public String page059() {
        return prefix + "/指令接收任务调度管理";
    }

    @GetMapping("探针数据解析规则管理")
    @RequiresPermissions("gen:JiLinCOSMICController:探针数据解析规则管理:view")
    public String page060() {
        return prefix + "/探针数据解析规则管理";
    }

    @GetMapping("接收状态反馈管理")
    @RequiresPermissions("gen:JiLinCOSMICController:接收状态反馈管理:view")
    public String page061() {
        return prefix + "/接收状态反馈管理";
    }

    @GetMapping("接收结果数据审查管理")
    @RequiresPermissions("gen:JiLinCOSMICController:接收结果数据审查管理:view")
    public String page062() {
        return prefix + "/接收结果数据审查管理";
    }

    @GetMapping("数据同步管理")
    @RequiresPermissions("gen:JiLinCOSMICController:数据同步管理:view")
    public String page063() {
        return prefix + "/数据同步管理";
    }

    @GetMapping("数据完整性校验规则管理")
    @RequiresPermissions("gen:JiLinCOSMICController:数据完整性校验规则管理:view")
    public String page064() {
        return prefix + "/数据完整性校验规则管理";
    }

    @GetMapping("文件命名与归档管理")
    @RequiresPermissions("gen:JiLinCOSMICController:文件命名与归档管理:view")
    public String page065() {
        return prefix + "/文件命名与归档管理";
    }

    @GetMapping("文件存储路径管理")
    @RequiresPermissions("gen:JiLinCOSMICController:文件存储路径管理:view")
    public String page066() {
        return prefix + "/文件存储路径管理";
    }

    @GetMapping("暴露面资产未纳管预警管理")
    @RequiresPermissions("gen:JiLinCOSMICController:暴露面资产未纳管预警管理:view")
    public String page067() {
        return prefix + "/暴露面资产未纳管预警管理";
    }

    @GetMapping("暴露面资产纳管对比任务管理")
    @RequiresPermissions("gen:JiLinCOSMICController:暴露面资产纳管对比任务管理:view")
    public String page068() {
        return prefix + "/暴露面资产纳管对比任务管理";
    }

    @GetMapping("暴露面资产纳管报表报表")
    @RequiresPermissions("gen:JiLinCOSMICController:暴露面资产纳管报表报表:view")
    public String page069() {
        return prefix + "/暴露面资产纳管报表报表";
    }

    @GetMapping("暴露面资产纳管管理")
    @RequiresPermissions("gen:JiLinCOSMICController:暴露面资产纳管管理:view")
    public String page070() {
        return prefix + "/暴露面资产纳管管理";
    }

    @GetMapping("模拟采集资产报表")
    @RequiresPermissions("gen:JiLinCOSMICController:模拟采集资产报表:view")
    public String page071() {
        return prefix + "/模拟采集资产报表";
    }

    @GetMapping("物理资产管理")
    @RequiresPermissions("gen:JiLinCOSMICController:物理资产管理:view")
    public String page072() {
        return prefix + "/物理资产管理";
    }

    @GetMapping("特定资产组件同步接口")
    @RequiresPermissions("gen:JiLinCOSMICController:特定资产组件同步接口:view")
    public String page073() {
        return prefix + "/特定资产组件同步接口";
    }

    @GetMapping("特定资产范围枚举管理")
    @RequiresPermissions("gen:JiLinCOSMICController:特定资产范围枚举管理:view")
    public String page074() {
        return prefix + "/特定资产范围枚举管理";
    }

    @GetMapping("电信设备资产管理")
    @RequiresPermissions("gen:JiLinCOSMICController:电信设备资产管理:view")
    public String page075() {
        return prefix + "/电信设备资产管理";
    }

    @GetMapping("登录采集指纹管理")
    @RequiresPermissions("gen:JiLinCOSMICController:登录采集指纹管理:view")
    public String page076() {
        return prefix + "/登录采集指纹管理";
    }

    @GetMapping("相似度特征分析管理")
    @RequiresPermissions("gen:JiLinCOSMICController:相似度特征分析管理:view")
    public String page077() {
        return prefix + "/相似度特征分析管理";
    }

    @GetMapping("纳管模拟校验规则管理")
    @RequiresPermissions("gen:JiLinCOSMICController:纳管模拟校验规则管理:view")
    public String page078() {
        return prefix + "/纳管模拟校验规则管理";
    }

    @GetMapping("组件库管理")
    @RequiresPermissions("gen:JiLinCOSMICController:组件库管理:view")
    public String page079() {
        return prefix + "/组件库管理";
    }

    @GetMapping("结果数据解析规则管理")
    @RequiresPermissions("gen:JiLinCOSMICController:结果数据解析规则管理:view")
    public String page080() {
        return prefix + "/结果数据解析规则管理";
    }

    @GetMapping("结果文件与历史对比管理")
    @RequiresPermissions("gen:JiLinCOSMICController:结果文件与历史对比管理:view")
    public String page081() {
        return prefix + "/结果文件与历史对比管理";
    }

    @GetMapping("网络产品资产管理")
    @RequiresPermissions("gen:JiLinCOSMICController:网络产品资产管理:view")
    public String page082() {
        return prefix + "/网络产品资产管理";
    }

    @GetMapping("联动指令控制管理")
    @RequiresPermissions("gen:JiLinCOSMICController:联动指令控制管理:view")
    public String page083() {
        return prefix + "/联动指令控制管理";
    }

    @GetMapping("自动化采集方式验证管理")
    @RequiresPermissions("gen:JiLinCOSMICController:自动化采集方式验证管理:view")
    public String page084() {
        return prefix + "/自动化采集方式验证管理";
    }

    @GetMapping("自动采集对比报表管理")
    @RequiresPermissions("gen:JiLinCOSMICController:自动采集对比报表管理:view")
    public String page085() {
        return prefix + "/自动采集对比报表管理";
    }

    @GetMapping("自定义项一致性校验管理")
    @RequiresPermissions("gen:JiLinCOSMICController:自定义项一致性校验管理:view")
    public String page086() {
        return prefix + "/自定义项一致性校验管理";
    }

    @GetMapping("自定义项一致性校验规则管理")
    @RequiresPermissions("gen:JiLinCOSMICController:自定义项一致性校验规则管理:view")
    public String page087() {
        return prefix + "/自定义项一致性校验规则管理";
    }

    @GetMapping("自定义项校验结果报表")
    @RequiresPermissions("gen:JiLinCOSMICController:自定义项校验结果报表:view")
    public String page088() {
        return prefix + "/自定义项校验结果报表";
    }

    @GetMapping("虚拟资产未纳管预警管理")
    @RequiresPermissions("gen:JiLinCOSMICController:虚拟资产未纳管预警管理:view")
    public String page089() {
        return prefix + "/虚拟资产未纳管预警管理";
    }

    @GetMapping("虚拟资产纳管对比任务管理")
    @RequiresPermissions("gen:JiLinCOSMICController:虚拟资产纳管对比任务管理:view")
    public String page090() {
        return prefix + "/虚拟资产纳管对比任务管理";
    }

    @GetMapping("虚拟资产纳管报表")
    @RequiresPermissions("gen:JiLinCOSMICController:虚拟资产纳管报表:view")
    public String page091() {
        return prefix + "/虚拟资产纳管报表";
    }

    @GetMapping("虚拟资产纳管验证管理")
    @RequiresPermissions("gen:JiLinCOSMICController:虚拟资产纳管验证管理:view")
    public String page092() {
        return prefix + "/虚拟资产纳管验证管理";
    }

    @GetMapping("虚拟资源使用审计管理")
    @RequiresPermissions("gen:JiLinCOSMICController:虚拟资源使用审计管理:view")
    public String page093() {
        return prefix + "/虚拟资源使用审计管理";
    }

    @GetMapping("虚拟资源使用监控管理")
    @RequiresPermissions("gen:JiLinCOSMICController:虚拟资源使用监控管理:view")
    public String page094() {
        return prefix + "/虚拟资源使用监控管理";
    }

    @GetMapping("虚拟资源变更审批流程管理")
    @RequiresPermissions("gen:JiLinCOSMICController:虚拟资源变更审批流程管理:view")
    public String page095() {
        return prefix + "/虚拟资源变更审批流程管理";
    }

    @GetMapping("虚拟资源填报管理")
    @RequiresPermissions("gen:JiLinCOSMICController:虚拟资源填报管理:view")
    public String page096() {
        return prefix + "/虚拟资源填报管理";
    }

    @GetMapping("虚拟资源异常监控")
    @RequiresPermissions("gen:JiLinCOSMICController:虚拟资源异常监控:view")
    public String page097() {
        return prefix + "/虚拟资源异常监控";
    }

    @GetMapping("虚拟资源调度管理")
    @RequiresPermissions("gen:JiLinCOSMICController:虚拟资源调度管理:view")
    public String page098() {
        return prefix + "/虚拟资源调度管理";
    }

    @GetMapping("虚拟资源配额管理")
    @RequiresPermissions("gen:JiLinCOSMICController:虚拟资源配额管理:view")
    public String page099() {
        return prefix + "/虚拟资源配额管理";
    }

    @GetMapping("调度平台成功消息上传接口")
    @RequiresPermissions("gen:JiLinCOSMICController:调度平台成功消息上传接口:view")
    public String page100() {
        return prefix + "/调度平台成功消息上传接口";
    }

    @GetMapping("资产IP纳管模拟校验任务管理")
    @RequiresPermissions("gen:JiLinCOSMICController:资产IP纳管模拟校验任务管理:view")
    public String page101() {
        return prefix + "/资产IP纳管模拟校验任务管理";
    }

    @GetMapping("资产依赖查询接口")
    @RequiresPermissions("gen:JiLinCOSMICController:资产依赖查询接口:view")
    public String page102() {
        return prefix + "/资产依赖查询接口";
    }

    @GetMapping("资产分类信息同步接口")
    @RequiresPermissions("gen:JiLinCOSMICController:资产分类信息同步接口:view")
    public String page103() {
        return prefix + "/资产分类信息同步接口";
    }

    @GetMapping("资产分类结构解析规则管理")
    @RequiresPermissions("gen:JiLinCOSMICController:资产分类结构解析规则管理:view")
    public String page104() {
        return prefix + "/资产分类结构解析规则管理";
    }

    @GetMapping("资产发现方式一致性校验规则管理")
    @RequiresPermissions("gen:JiLinCOSMICController:资产发现方式一致性校验规则管理:view")
    public String page105() {
        return prefix + "/资产发现方式一致性校验规则管理";
    }

    @GetMapping("资产发现方式变更审查管理")
    @RequiresPermissions("gen:JiLinCOSMICController:资产发现方式变更审查管理:view")
    public String page106() {
        return prefix + "/资产发现方式变更审查管理";
    }

    @GetMapping("资产变更信息管理")
    @RequiresPermissions("gen:JiLinCOSMICController:资产变更信息管理:view")
    public String page107() {
        return prefix + "/资产变更信息管理";
    }

    @GetMapping("资产名称校验规则管理")
    @RequiresPermissions("gen:JiLinCOSMICController:资产名称校验规则管理:view")
    public String page108() {
        return prefix + "/资产名称校验规则管理";
    }

    @GetMapping("资产型号一致性校验任务管理")
    @RequiresPermissions("gen:JiLinCOSMICController:资产型号一致性校验任务管理:view")
    public String page109() {
        return prefix + "/资产型号一致性校验任务管理";
    }

    @GetMapping("资产型号匹配算法管理")
    @RequiresPermissions("gen:JiLinCOSMICController:资产型号匹配算法管理:view")
    public String page110() {
        return prefix + "/资产型号匹配算法管理";
    }

    @GetMapping("资产备份规则管理")
    @RequiresPermissions("gen:JiLinCOSMICController:资产备份规则管理:view")
    public String page111() {
        return prefix + "/资产备份规则管理";
    }

    @GetMapping("资产备案任务管理")
    @RequiresPermissions("gen:JiLinCOSMICController:资产备案任务管理:view")
    public String page112() {
        return prefix + "/资产备案任务管理";
    }

    @GetMapping("资产归一化校验任务管理")
    @RequiresPermissions("gen:JiLinCOSMICController:资产归一化校验任务管理:view")
    public String page113() {
        return prefix + "/资产归一化校验任务管理";
    }

    @GetMapping("资产归属与位置校验规则管理")
    @RequiresPermissions("gen:JiLinCOSMICController:资产归属与位置校验规则管理:view")
    public String page114() {
        return prefix + "/资产归属与位置校验规则管理";
    }

    @GetMapping("资产描述冗余审查管理")
    @RequiresPermissions("gen:JiLinCOSMICController:资产描述冗余审查管理:view")
    public String page115() {
        return prefix + "/资产描述冗余审查管理";
    }

    @GetMapping("资产特征分析规则管理")
    @RequiresPermissions("gen:JiLinCOSMICController:资产特征分析规则管理:view")
    public String page116() {
        return prefix + "/资产特征分析规则管理";
    }

    @GetMapping("资产状态预警管理")
    @RequiresPermissions("gen:JiLinCOSMICController:资产状态预警管理:view")
    public String page117() {
        return prefix + "/资产状态预警管理";
    }

    @GetMapping("资产类别缺失报表")
    @RequiresPermissions("gen:JiLinCOSMICController:资产类别缺失报表:view")
    public String page118() {
        return prefix + "/资产类别缺失报表";
    }

    @GetMapping("资产类别自动化校验任务管理")
    @RequiresPermissions("gen:JiLinCOSMICController:资产类别自动化校验任务管理:view")
    public String page119() {
        return prefix + "/资产类别自动化校验任务管理";
    }

    @GetMapping("资产类型管理")
    @RequiresPermissions("gen:JiLinCOSMICController:资产类型管理:view")
    public String page120() {
        return prefix + "/资产类型管理";
    }

    @GetMapping("资产纳管条目分析管理")
    @RequiresPermissions("gen:JiLinCOSMICController:资产纳管条目分析管理:view")
    public String page121() {
        return prefix + "/资产纳管条目分析管理";
    }

    @GetMapping("资产组件状态查询接口")
    @RequiresPermissions("gen:JiLinCOSMICController:资产组件状态查询接口:view")
    public String page122() {
        return prefix + "/资产组件状态查询接口";
    }

    @GetMapping("资产范围查询接口")
    @RequiresPermissions("gen:JiLinCOSMICController:资产范围查询接口:view")
    public String page123() {
        return prefix + "/资产范围查询接口";
    }

    @GetMapping("资产设备品牌管理")
    @RequiresPermissions("gen:JiLinCOSMICController:资产设备品牌管理:view")
    public String page124() {
        return prefix + "/资产设备品牌管理";
    }

    @GetMapping("边界距离计算管理")
    @RequiresPermissions("gen:JiLinCOSMICController:边界距离计算管理:view")
    public String page125() {
        return prefix + "/边界距离计算管理";
    }

    @GetMapping("部侧IPv4扫描联动接口")
    @RequiresPermissions("gen:JiLinCOSMICController:部侧IPv4扫描联动接口:view")
    public String page126() {
        return prefix + "/部侧IPv4扫描联动接口";
    }

    @GetMapping("部侧content文件管理")
    @RequiresPermissions("gen:JiLinCOSMICController:部侧content文件管理:view")
    public String page127() {
        return prefix + "/部侧content文件管理";
    }

    @GetMapping("部侧上传通道管理")
    @RequiresPermissions("gen:JiLinCOSMICController:部侧上传通道管理:view")
    public String page128() {
        return prefix + "/部侧上传通道管理";
    }

    @GetMapping("部侧上报失败处置流程管理")
    @RequiresPermissions("gen:JiLinCOSMICController:部侧上报失败处置流程管理:view")
    public String page129() {
        return prefix + "/部侧上报失败处置流程管理";
    }

    @GetMapping("部侧历史上报数据分析")
    @RequiresPermissions("gen:JiLinCOSMICController:部侧历史上报数据分析:view")
    public String page130() {
        return prefix + "/部侧历史上报数据分析";
    }

    @GetMapping("部侧扫描上报数据管理")
    @RequiresPermissions("gen:JiLinCOSMICController:部侧扫描上报数据管理:view")
    public String page131() {
        return prefix + "/部侧扫描上报数据管理";
    }

    @GetMapping("部侧结果上报流程管理")
    @RequiresPermissions("gen:JiLinCOSMICController:部侧结果上报流程管理:view")
    public String page132() {
        return prefix + "/部侧结果上报流程管理";
    }

    @GetMapping("部侧资产汇总信息管理")
    @RequiresPermissions("gen:JiLinCOSMICController:部侧资产汇总信息管理:view")
    public String page133() {
        return prefix + "/部侧资产汇总信息管理";
    }

    @GetMapping("采集任务日志上报接口")
    @RequiresPermissions("gen:JiLinCOSMICController:采集任务日志上报接口:view")
    public String page134() {
        return prefix + "/采集任务日志上报接口";
    }

    @GetMapping("采集模拟校验规则管理")
    @RequiresPermissions("gen:JiLinCOSMICController:采集模拟校验规则管理:view")
    public String page135() {
        return prefix + "/采集模拟校验规则管理";
    }

    @GetMapping("重点网络单元类型指纹管理")
    @RequiresPermissions("gen:JiLinCOSMICController:重点网络单元类型指纹管理:view")
    public String page136() {
        return prefix + "/重点网络单元类型指纹管理";
    }

    @GetMapping("重点网络单元类型资产管理")
    @RequiresPermissions("gen:JiLinCOSMICController:重点网络单元类型资产管理:view")
    public String page137() {
        return prefix + "/重点网络单元类型资产管理";
    }

    @GetMapping("重点网络设备指令接收接口")
    @RequiresPermissions("gen:JiLinCOSMICController:重点网络设备指令接收接口:view")
    public String page138() {
        return prefix + "/重点网络设备指令接收接口";
    }

    @GetMapping("重点网络设备指令解析规则管理")
    @RequiresPermissions("gen:JiLinCOSMICController:重点网络设备指令解析规则管理:view")
    public String page139() {
        return prefix + "/重点网络设备指令解析规则管理";
    }

    @GetMapping("重点网络设备接收指令反馈接口")
    @RequiresPermissions("gen:JiLinCOSMICController:重点网络设备接收指令反馈接口:view")
    public String page140() {
        return prefix + "/重点网络设备接收指令反馈接口";
    }

    @GetMapping("重点网络设备结果上报接口")
    @RequiresPermissions("gen:JiLinCOSMICController:重点网络设备结果上报接口:view")
    public String page141() {
        return prefix + "/重点网络设备结果上报接口";
    }

    @GetMapping("重点网络设备结果管理")
    @RequiresPermissions("gen:JiLinCOSMICController:重点网络设备结果管理:view")
    public String page142() {
        return prefix + "/重点网络设备结果管理";
    }
}
