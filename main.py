# coding: utf-8
import paramiko
import sys
import select
import re
import datetime
import os
import base64
from xml.etree.ElementTree import Element, SubElement, tostring
import configparser
import sqlite3
import logging
import time
import platform
import collections
import IPy
import traceback
import requests

from requests import RequestException

from tool import Tool
import importlib
import chardet

RULE_TYPE_MATCH = 0
RULE_TYPE_RE = 1
RULE_TYPE_BASE64_RE = 2
RULE_TYPE_END = 3

LOGIN_SUCCESS = 0
LOGIN_FAILED = 1
LOGIN_TIMEOUT = 1
DELIMIT = "_____"
EXE_RESULT = list()


def ansi_escape(ansi_str):
    """
    替换字符串中ANSI转义字符
    """
    ansi_escape_reg = re.compile('\[\d+;\d+m')
    ansi_escape_reg2 = re.compile('\[\d+m')

    # 使用正则表达式替换ANSI转义序列为空字符串
    clean_ansi_str = ansi_escape_reg.sub('', ansi_str)
    clean_ansi_str = ansi_escape_reg2.sub('', clean_ansi_str)


def bclinux_switch_anolis(version_str):
    """
    Bcloud转换为 Anolis
    by zw
    """
    # 处理 "For LDK" 和 "for DCOS" 版本 - 返回 OS_CENTOS by zw
    if re.search(r'For LDK|for DCOS', version_str, re.I):
        return "OS_CENTOS"
    # 处理 7.6, 7.7, 7.8 版本 - 返回 OS_CENTOS by zw
    if re.search(r' 7\.[678]', version_str):
        return "OS_CENTOS"
    # 处理 8.0, 8.1 版本 - 返回原版本
    if re.search(r'8\.0|8\.1', version_str):
        return version_str
    # 处理 7.x (除7.6/7.7/7.8外) 和 6.x 版本 - 返回原版本
    elif re.search(r' 7.\d+| 6.\d+', version_str):
        return version_str
    # 处理 8.2-9 版本 - 返回 OS_ANOLIS by zw
    elif re.search(r' 8\.[2-9]| 9\.\d+', version_str):
        return "OS_ANOLIS"
    # 处理其他 8.x 版本 - 返回原版本
    elif re.search(r' 8.\d+', version_str):
        return version_str
    else:
        return version_str


def get_str_encoding(unkown_data):
    """
    获取数据的编码类型
    """
    result = chardet.detect(unkown_data)
    encoding = result['encoding']
    return encoding


def netmaskOfIpv4(ipv4):
    mask_len = int(ipv4[ipv4.index('/') + 1:])
    mo = mask_len // 8
    yu = mask_len % 8

    yu_mask = list()
    for i in range(8):
        if i < yu:
            yu_mask.append('1')
        else:
            yu_mask.append('0')

    tmp_mask = list()
    for i in range(mo):
        tmp_mask.append('255')

    if yu != 0:
        tmp_mask.append(str(int(''.join(yu_mask), 2)))

    for i in range(4):
        if i >= len(tmp_mask):
            tmp_mask.append('0')
    return '.'.join(tmp_mask)


def netmaskOfIpv6(ipv6):
    mask_len = int(ipv6[ipv6.index('/') + 1:])
    mo = mask_len // 16
    yu = mask_len % 16

    yu_mask = list()
    for i in range(16):
        if i < yu:
            yu_mask.append('1')
        else:
            yu_mask.append('0')

    tmp_mask = list()
    for i in range(mo):
        tmp_mask.append('ffff')
    if yu != 0:
        tmp_mask.append(hex(int(''.join(yu_mask), 2))[2:])

    for i in range(8):
        if i >= len(tmp_mask):
            tmp_mask.append('0000')
    return ':'.join(tmp_mask)


def indent(elem, level=0):
    i = "\n" + level * "\t"
    if len(elem):
        if not elem.text or not elem.text.strip():
            elem.text = i + "\t"
        if not elem.tail or not elem.tail.strip():
            elem.tail = i
        for elem in elem:
            indent(elem, level + 1)
        if not elem.tail or not elem.tail.strip():
            elem.tail = i
    else:
        if level and (not elem.tail or not elem.tail.strip()):
            elem.tail = i


def log_info(info1):
    global logger
    logger.info(info1)


def log_banner(info):
    global err_detail
    if re.search('Welcome.*to GBA.*Relay', info):
        delimit = re.search('Welcome.*to GBA.*Relay', info).group()
        index = info.find(delimit)
        if index > 0:
            info = info[index:]
    err_detail = err_detail + info


def log_err(info):
    global err_buf
    err_buf = err_buf + info


def login_stat(stat):
    global g_status
    g_status = stat


def connect_ip(username, ip, password, port):
    client = None
    ssh_shell = None
    global err_connect
    try:
        log_info("connect_ip username [%s] ip [%s] password [%s] port [%d]" % (username, ip, password, port))
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        # connect to client
        # 设置超时时间，浙江业支发现有些IP 虽然能登录，但是验证密码超时，会导致失败
        client.connect(ip, port, username, password, allow_agent=False, look_for_keys=False,
                       banner_timeout=180,
                       auth_timeout=100,
                       )
        # get shell

        ssh_shell = client.invoke_shell(width=3072, height=1024)
        return ssh_shell, client
    except Exception as e:
        # e.message
        log_info("login ip failed:[%s]\n" % (traceback.format_exc()))
        repr_str("login ip failed")
        err_connect = (traceback.format_exc())
        return ssh_shell, client


def match_end(endwitch_lh, endline, cmd=''):
    endline = del_control_no_cr(endline.strip())
    for endwitch in endwitch_lh:
        rule, rule_type = endwitch
        if rule:
            if rule_type == RULE_TYPE_MATCH:
                # ljk增加cmd指令入参,判断通道返回消息是否有当前指令信息,处理因登录成功返回多行回车导致返回信息错乱问题
                if endline.endswith(rule.strip()) and re.search(cmd.replace('\n', ''), endline):
                    log_info("============111111=====2==========%s\n" % endline)
                    return 1
            elif rule_type == RULE_TYPE_RE:
                if re.search(rule, endline, re.M):
                    log_info("============111111=====1==========%s\n" % endline)
                    return 1
            else:
                rule_base64_decode = base64.b64decode(rule)
                rule_encoding = get_str_encoding(rule_base64_decode)
                rule = rule_base64_decode.decode(rule_encoding)
                if re.search(rule, endline, re.M):
                    log_info("============111111=====3==========%s\n" % endline)
                    return 1
    # log_info('match_end:::endline[%s] endwithch_lh[%s]' % (endline, (endwitch_lh)))
    return 0


def recv(channel, endwitch_lh, atime=3, cmd=''):
    recv_buf = ""
    stderr = []
    interval = 0.01
    total = int(atime / interval)
    cnt = 0
    rv = LOGIN_SUCCESS
    try:
        while True:
            readlist, writelist, errlist = select.select([channel], [], [], interval)
            cnt = cnt + 1
            if len(readlist) == 0:
                if recv_buf and recv_buf[-1] == '\n':
                    if cnt > total:
                        return recv_buf, LOGIN_TIMEOUT
                    continue
                bbb = recv_buf.split('\n')
                if len(bbb) > 0:
                    endline = bbb[-1]
                else:
                    endline = ""
                # log_info("recv_buf11:[%s]\n" % recv_buf)
                rst = match_end(endwitch_lh, endline)
                if rst > 0:
                    return recv_buf, LOGIN_SUCCESS
                if cnt > total:
                    return recv_buf, LOGIN_TIMEOUT
            # cnt = cnt + 1
            else:
                if channel in readlist:
                    res = ""
                    res = channel.recv(10240).decode(errors="ignore")

                    if not res:
                        if recv_buf and recv_buf[-1] == '\n':
                            if cnt > total:
                                log_info("recv_buf:[%s]\n" % recv_buf)
                                return recv_buf, LOGIN_TIMEOUT
                            continue
                        bbb = recv_buf.split('\n')
                        if len(bbb) > 0:
                            endline = bbb[-1]
                        else:
                            endline = ""
                        # log_info("recv_buf22:[%s]\n" % recv_buf)
                        rst = match_end(endwitch_lh, endline)
                        if rst > 0:
                            return recv_buf, LOGIN_SUCCESS
                        if cnt > total:
                            return recv_buf, LOGIN_TIMEOUT
                        else:
                            # cnt = cnt + 1
                            continue

                    recv_buf = recv_buf + res
                # cnt = cnt + 1
    except Exception as e:
        log_info("recv:[%s]\n" % (traceback.format_exc()))
        return recv_buf, LOGIN_FAILED


def recv_plus(channel, command=None, timeout=1):
    endswith_list = ['#', ':', '$', '>']
    # recv_detail = ''
    recv_detail = channel.recv(10240).decode(errors="ignore")
    global g_status
    global login_detail_lt
    channel.settimeout(timeout)
    if command:
        channel.send("%s\n" % command)
    while not channel.closed:
        has_error = False
        for k, v in list(login_detail_lt.items()):
            if re.search(k, recv_detail, re.I):
                has_error = True
                log_err(v[0])
                break
        if has_error:
            g_status = 1
            break

        try:
            tmp_recv = channel.recv(10240).decode(errors="ignore")
            if len(tmp_recv) == 0:
                break
            recv_detail += tmp_recv

            if recv_detail.rstrip()[-1] in endswith_list:
                try:
                    # 如果获取到结束位置,设置超时时间1s,判断channel是否还有数据
                    channel.settimeout(0.5)
                    tmp_recv = channel.recv(10240).decode(errors="ignore")
                    if len(tmp_recv) == 0:
                        break
                    recv_detail += tmp_recv
                    channel.settimeout(timeout)
                    if recv_detail.rstrip()[-1] in ['#', '$', '>']:
                        break
                except:
                    g_status = 0
                    break
        except:
            log_err("链接超时")
            g_status = 1
            break

    # 如果结束输入提示符是:,则有可能是需要输入账号或者密码,提示返回错误
    if len(recv_detail.rstrip()) > 0 and recv_detail.rstrip()[-1] == ':':
        g_status = 2
    return recv_detail, g_status


def transfor(args):
    args = args.replace('&', '&amp;')
    args = args.replace('<', '&lt;')
    args = args.replace('>', '&gt;')
    args = args.replace('\'', '&apos;')
    args = args.replace('\"', '&quot;')
    return args


def exec_cmd_string(channel, cmd, time=3, exe=''):
    ecs_buf = ""
    global end_lh
    # LDY add for exec_cmd return all result
    exe_result = ""
    # global querytype
    # print querytype
    try:
        channel.sendall(cmd)
        ecs_buf, rst = recv(channel, end_lh, time)
        # log_info("ecs_buf_old:[%s]\n" % ecs_buf)
        exe_result = ecs_buf
        global lang_flag
        if lang_flag == 1:
            ecs_buf = ecs_buf.encode('UTF-8').decode('UTF-8')
        log_info("ecs_buf:[%s]\n" % ecs_buf)
        ecs_buf = ecs_buf.replace('\r', '').split('\n')
        if len(ecs_buf) <= 2:
            return ""
        ecs_buf = ecs_buf[-2].strip()
    except Exception as e:
        ecs_buf = ""
        err = (traceback.format_exc())
    # LDY add for exec_cmd return all result
    if re.search(
            'Permission denied|权限不够|(No info could be read for "-p": geteuid\(\)=1004 but you should be root.)',
            exe_result, re.I):
        # print "Permission denied:1234567890"
        # print "%sservice:%s,cmd:%s,err_result:%s" % (DELIMIT,exe,cmd,exe_result)
        # print "%sservice:%s,cmd:%s,err_result:%s %s\n" % (DELIMIT,exe, cmd, exe_result, err)
        # EXE_RESULT.append("%sservice:%s,cmd:%s,err_result:%s %s\n" % (DELIMIT,exe, cmd, exe_result, err))
        err_result = "%sservice:%s,type:%s,cmd:%s,err_result:%s\n" % (DELIMIT, exe, querytype, cmd, exe_result)
        EXE_RESULT.append(err_result)
    return ecs_buf


def exec_cmd_string_all(channel, cmd, times=3, exe=''):
    ecsa_buf = ""
    global end_lh
    # LDY add for exec_cmd return all result
    exe_result = ""
    # global querytype
    # print querytype
    try:
        begin_time = time.time()
        log_info("cmd:[%s]\n" % cmd)
        channel.sendall(cmd)
        ecsa_buf, rst = recv(channel, end_lh, times, cmd)
        # log_info("ecsa_buf_old:[%s]\n" % ecsa_buf)
        exe_result = ecsa_buf
        global lang_flag
        if lang_flag == 1:
            ecsa_buf = ecsa_buf.encode('UTF-8').decode('UTF-8')
        ecsa_buf = ecsa_buf.replace('\r', '').strip()
        ecsa_buf = deal_info(ecsa_buf)
        log_info("esca:[%s]\n" % ecsa_buf)
        use_time = time.time() - begin_time
        log_info("use time:[%s]\n" % use_time)
    except Exception as e:
        ecsa_buf = ""
        err = (traceback.format_exc())
    # LDY add for exec_cmd return all result
    if re.search(
            'Permission denied|权限不够|(No info could be read for "-p": geteuid\(\)=1004 but you should be root.)',
            exe_result, re.I):
        # print "Permission denied:1234567890"
        # print "%sservice:%s,cmd:%s,err_result:%s" % (DELIMIT,exe,cmd,exe_result)
        # print "%s,%s"%(cmd,exe_result)
        # print "%sservice:%s,cmd:%s,err_result:%s %s\n" % (DELIMIT,exe, cmd, exe_result, err)
        # EXE_RESULT.append("%sservice:%s,cmd:%s,err_result:%s %s\n" % (DELIMIT,exe, cmd, exe_result, err))
        err_result = "%sservice:%s,type:%s,cmd:%s,err_result:%s\n" % (DELIMIT, exe, querytype, cmd, exe_result)
        EXE_RESULT.append(err_result)
    return ecsa_buf


def deal_info(info):
    ansi_escape = re.compile(r'''
    \x1B  # ESC
    (?:   # 7-bit C1 Fe (except CSI)
        [@-Z\\-_]
    |     # or [ for CSI, followed by a control sequence
        \[
        [0-?]*  # Parameter bytes
        [ -/]*  # Intermediate bytes
        [@-~]   # Final byte
    )
''', re.VERBOSE)

    return ansi_escape.sub('', info)


def exec_cmd_list(channel, cmd, time=3, exe=''):
    ecl = list()
    ecl_buf = ""
    global end_lh
    # LDY add for exec_cmd return all result
    exe_result = ""
    # global querytype
    # print querytype
    try:
        channel.sendall(cmd)
        ecl_buf, rst = recv(channel, end_lh, time)
        exe_result = ecl_buf
        # print exe_result
        # log_info("ecl_buf_old:[%s]\n" % ecl_buf)
        global lang_flag
        if lang_flag == 1:
            ecl_buf = ecl_buf.encode('UTF-8').decode('UTF-8')
        log_info("ecl_buf:[%s]\n" % ecl_buf)
        ecl_buf = ecl_buf.replace('\r', '').split('\n')
        if len(ecl_buf) <= 2:
            return ecl
        ecl = ecl_buf[1:-1]
    except Exception as e:
        log_info("exec_cmd_list err:%s" % e)
        pass
    # LDY add for exec_cmd return all result
    if re.search(
            'Permission denied|权限不够|(No info could be read for "-p": geteuid\(\)=1004 but you should be root.)',
            exe_result, re.I):
        # print "Permission denied:1234567890"
        # print "%sservice:%s,cmd:%s,err_result:%s" % (DELIMIT,exe,cmd,exe_result)
        err_result = "%sservice:%s,type:%s,cmd:%s,err_result:%s\n" % (DELIMIT, exe, querytype, cmd, exe_result)
        EXE_RESULT.append(err_result)
    return ecl


def send_break(channel, buf):
    for item in break_lt:
        (rule, send_cmd) = item
        if re.search(rule, buf, re.I):
            temp = exec_cmd_string_all(channel, send_cmd)
            break


def str_Nempty(s):
    return list([s for s in s if s and s.strip()])


class Check:
    _channel = None
    _client = None

    def __init__(self):
        pass

    def check_Linux(self, channel):
        redhat_str = "Redhat|Red Hat|rhel|redhat"
        bigCloud_str = "BigCloud"
        # 修改：添加更精确的 NewStart 匹配，排除 Anolis by zw
        newStart_str = r"NewStart\s+Carrier\s+Grade|CGSL"
        openEuler_str = "openEuler|Euler"
        ubuntu_str = "Ubuntu"
        suse_str = "SUSE"
        solaris_str = 'Solaris'
        debian_str = 'Debian'
        mips_str = "Cavium-Octeon"
        nxp_str = "QorIQ"
        openswitch_str = "openswitch"
        openeuler_str = "openEuler"
        centos_str = "centos|CentOS"
        # 修改：Anolis 需要更精确的匹配，避免与 NewStart 混淆 by zw
        anolis_str = r"Anolis\s+OS|anolis"
        union_tech_str = "UnionTech"
        fedora_str = "Fedora"
        h3linux_str = "H3Linux"
        result = ""

        cmd = "cat /etc/*release\n"
        detail = exec_cmd_string_all(channel, cmd, 20)

        if re.search(union_tech_str, detail, re.I):
            return "UnionTech"
        if re.search(bigCloud_str, detail, re.I):
            tem_info = re.search('PRETTY_NAME=.*', detail).group()
            os = re.findall('\"(.+?)\"', tem_info)[0]
            if re.search("For Euler", detail, re.I):
                return "EULER"
            switch_result = bclinux_switch_anolis(os)
            if re.search(anolis_str, switch_result, re.I):
                return "ANOLIS"
            return "BIGCLOUD"
        # 修改：中兴系统的优先级高 - 使用更精确的匹配 by zw
        if re.search(newStart_str, detail, re.I):
            return "NEWSTART"
        # Anolis 判断 - 确保不是 NewStart 系统 by zw
        if re.search(anolis_str, detail, re.I):
            # 再次检查是否真的是 Anolis，而不是包含 Anolis 字符的 NewStart by zw
            if not re.search(r'NewStart', detail, re.I):
                return "ANOLIS"
        if re.search(openEuler_str, detail, re.I):
            return "EULER"
        if re.search(h3linux_str, detail, re.I):
            return "H3LINUX"

        if re.search(openeuler_str, detail, re.I):
            return "EULER"  # by zw

        if re.search(ubuntu_str, detail, re.I):
            return "Ubuntu"
        elif re.search(debian_str, detail, re.I):
            return "Debian"
        elif re.search(suse_str, detail, re.I):
            return "SUSE"
        elif re.search(solaris_str, detail, re.I):
            return "Solaris"
        if re.search(centos_str, detail, re.I):
            return "CentOS"
        if re.search(redhat_str, detail, re.I):
            return "RedHat"

        elif re.search(nxp_str, detail, re.I):
            return "RedHat"
        elif re.search(openswitch_str, detail, re.I):
            return "Switch"

        elif re.search(fedora_str, detail, re.I):
            return "Fedora"

        # 低版本的centos ，需要用换个指令
        cmd = "cat /etc/centos-release\n"
        detail = exec_cmd_string_all(channel, cmd, 20)
        if (re.search(centos_str, detail, re.I)
                and not re.search('Invalid input', detail, re.I)
                and not re.search('No such file or directory', detail,re.I)
                and not re.search('Unrecognized command found',detail, re.I)
                and not re.search('Unknown command',detail, re.I)
                and not re.search('Error: Bad command',detail, re.I)
                and not re.search('cat: cannot open /etc/centos-release',detail, re.I)
                and not re.search('没有那个文件或目录',detail, re.I)
                and not re.search('Error: Wrong parameter',detail, re.I)):
            return "CentOS"
        elif re.search(solaris_str, detail, re.I):
            return "Solaris"


        # 浙江部分Euler系统，需要用这个指令
        cmd = "\n hostnamectl\n"
        detail = exec_cmd_string_all(channel, cmd, 10)
        if re.search(openEuler_str, detail, re.I):
            return "EULER"  # by zw

        cmd = "uname -a\n"
        detail = exec_cmd_string_all(channel, cmd, 3)
        if re.search(mips_str, detail, re.I):
            return "RedHat"

        return result

    def check_AIX(self, channel):
        result = ""
        cmd = "uname -a\n"
        other_v = exec_cmd_string_all(channel, cmd, 15)
        log_info("AIX Version:[%s]\n" % other_v)
        if re.search('AIX', other_v, re.M):
            result = "AIX"
        return result

    def check_HPUX_FREEBSD(self, channel):
        result = ""
        other_v = ""
        cmd = "uname -a\n"
        other_v = exec_cmd_string_all(channel, cmd, 10)
        log_info("check_HPUNIX:[%s]\n" % other_v)
        if re.search('HP-UX', other_v, re.I | re.M):
            result = "HP-UX"
        elif re.search("FreeBSD", other_v, re.I | re.M):
            result = "FreeBSD"
        return result

    def check_welcome(self, channel, t_buf):
        result = ""
        # LDY modify in 20220120 for guizhou,H3C device match for HUAWEI rule,add:re.search('H3C', t_buf, re.I | re.M) is None
        if re.search('Login authentication', t_buf, re.I | re.M) and re.search('H3C', t_buf, re.I | re.M) is None:
            result = "HUAWEI"
        elif re.search('Array NetWorks', t_buf, re.I | re.M):
            result = "Array"
        elif re.search('Think on These Things', t_buf, re.I | re.M):
            result = "Cisco"
        elif re.search('DOPRALINUX', t_buf, re.I | re.M):
            result = "DOPRALINUX"
        elif re.search('Commands to clear statistics for a specified entity or to clear and reset the entity', t_buf,
                       re.I | re.M):
            result = "Nokia"
        elif re.search('Valid license from HP', t_buf, re.I | re.M):
            result = "HP-UX"
        elif re.search('The HOST is running normally', t_buf, re.I | re.M):
            result = "Ruijie"
        elif re.search('FreeBSD', t_buf, re.I | re.M):
            result = "FreeBSD"
        elif re.search('Extreme Networks|ExtremeXOS|Extreme', t_buf, re.I | re.M):
            result = "Extreme"
        elif re.search('ngsoc', t_buf, re.I | re.M):
            result = "SkyEye 360"
        elif re.search('JUNOS', t_buf, re.I | re.M):
            result = "JUNOS"
        elif re.search('DPtech', t_buf, re.I | re.M):
            result = "DPtech"
        elif re.search('ZXR10', t_buf, re.I | re.M):
            result = "ZTE"
        # ljk去掉Company,适配登录成功只有HAOHAN字样的机器
        elif re.search('HAOHAN', t_buf, re.I | re.M):
            result = "HAOHAN"
        elif re.search('YMOS-', t_buf, re.I | re.M):
            result = "RedHat"
        elif re.search('bclinux|openEuler', t_buf, re.I | re.M):
            result = "EULER"  # by zw
        return result

    def check_show_version(self, channel):
        result = ""
        recv_buf = ""
        temp_buf = ""
        version = ""
        try:
            cmd = "show version\n"
            recv_buf = exec_cmd_string_all(channel, cmd, 10)
            if re.search('AC_ZTE', recv_buf, re.I | re.M):
                version = 'ZTE_AC'
            elif re.search("Array", recv_buf, re.I | re.M):
                version = "Array"
            elif re.search('ZTE', recv_buf, re.I | re.M):
                version = 'ZTE'
            elif re.search('FC7000', recv_buf, re.I | re.M):
                version = 'ZTE'
            # LDY modify in 20220119 for guizhou add:5900D rule
            elif re.search('5900D', recv_buf, re.I | re.M):
                version = 'ZTE'
            elif re.search('Ruijie', recv_buf, re.I | re.M):
                version = "Ruijie"
            elif re.search('Mypower', recv_buf, re.I | re.M):
                version = "Mypower"
            elif re.search('Nokia.*Copyright', recv_buf, re.I | re.M):
                version = "Nokia"
            elif re.search('ExtremeXOS|Extreme', recv_buf, re.I | re.M):
                version = "Extreme"
            elif re.search("JUNOS", recv_buf, re.I | re.M):
                version = "JUNOS"
            elif re.search("DPtech", recv_buf, re.I | re.M):
                version = "DPtech"
            elif re.search("cisco", recv_buf, re.I | re.M):
                version = "Cisco"
            elif re.search("Broadband Networks Operating System Software", recv_buf, re.I | re.M):
                version = "ZTAC"
            elif re.search("GenieATM", recv_buf, re.I | re.M):
                version = "GenieATM"
            elif re.search("Ericsson", recv_buf, re.I | re.M):
                version = "Ericsson"
            elif re.search("ALCATEL", recv_buf, re.I | re.M):
                version = "ALCATEL"
            elif re.search("FiberHome", recv_buf, re.I | re.M):
                version = "FiberHome"
            elif re.search("A10 Networks", recv_buf, re.I | re.M):
                version = "A10 Networks"
            elif re.search("Aruba", recv_buf, re.I | re.M):
                version = "Aruba"
            send_break(channel, recv_buf)

        except Exception as e:
            log_info("check_show_version:[%s]\n" % (traceback.format_exc()))

        return version

    def check_display_version(self, channel):
        result = ""
        cmd = "display version\n"
        try:
            recv_buf = exec_cmd_string_all(channel, cmd, 10)
            buf = recv_buf.replace('\r', '')
            log_info("display version:[%s]\n" % buf)
            if re.search("HUAWEI|VRP", buf, re.I | re.M):
                result = "HUAWEI"
            elif re.search('H3C', buf, re.I | re.M):
                result = "H3C"
            elif re.search('backplane<K>.*frameid/slotid<S>', buf, re.I | re.M):
                cmd = "\n"
                buf = exec_cmd_string_all(channel, cmd, 10)
                result = "HUAWEI-OLT"
            elif re.search('ALCATEL', buf, re.I | re.M):
                result = "ALCATEL"
            send_break(channel, buf)
        except Exception as e:
            log_info("check_display_version[%s]\n" % (traceback.format_exc()))

        return result

    def check_NetDevice_Juniper(self, channel):
        result = ""

        try:
            cmd = "Get system\n"
            recv_buf = exec_cmd_string_all(channel, cmd)
            buf = recv_buf.replace('\r', '')
            if re.search('Product Name: ', buf, re.I | re.M):
                result = "Juniper"

            send_break(channel, buf)

        except Exception as e:
            log_info("check_NetDevice_Juniper[%s]\n" % (traceback.format_exc()))

        return result

    def check_EulerOS(self, channel):
        result = ""
        detail = ""
        # cmd = "cat /etc/*release\n"

        cmd = " hostnamectl \n"
        detail = exec_cmd_string_all(channel, cmd, 30)
        if re.search('Euler', detail, re.I | re.M):
            result = "EULER"
        return result

    def check_haohan(self, channel):
        result = ""
        detail = ""
        cmd = "SHOW SYSTEM\n"
        detail = exec_cmd_string_all(channel, cmd, 10)
        if re.search("HAOHAN", detail, re.I | re.M):
            result = "HAOHAN"
        return result

    def check_maipu(self, channel):
        """
        迈普
        :param channel:
        :return:
        """
        result = ""
        detail = ""
        cmd = "SHOW SYSTEM\n"
        detail = exec_cmd_string_all(channel, cmd, 10)
        if re.search("maipu", detail, re.I | re.M):
            result = "Maipu"
        return result

    def check_raisecom(self, channel):
        """
        瑞斯康达
        :param channel:
        :return:
        """
        result = ""
        detail = ""
        cmd = "SHOW SYSTEM\n"
        detail = exec_cmd_string_all(channel, cmd, 10)
        if re.search("Raisecom", detail, re.I | re.M):
            result = "Raisecom"
        return result

    def check_os(self, channel, type, t_buf):
        version = ""
        version = self.check_welcome(channel, t_buf)
        if version:
            return version

        version = self.check_AIX(channel)
        log_info("version-AIX:[%s]\n" % version)
        if version:
            return version

        version = self.check_EulerOS(channel)
        log_info("version-check_EulerOS:[%s]\n" % version)
        if version:
            return version

        version = self.check_Linux(channel)
        log_info("version-check_Linux:[%s]\n" % version)
        if version:
            return version

        version = self.check_HPUX_FREEBSD(channel)
        log_info("version-check_HPUX:[%s]\n" % version)
        if version:
            return version

        version = self.check_display_version(channel)
        log_info("version-check_display_version:[%s]\n" % version)
        if version:
            return version
        version = self.check_show_version(channel)
        log_info("version-check_show_version:[%s]\n" % version)
        if version:
            return version

        version = self.check_NetDevice_Juniper(channel)
        log_info("version-check_NetDevice_Juniper:[%s]\n" % version)
        if version:
            return version

        version = self.check_haohan(channel)
        log_info("version-check_haohan:[%s]\n" % version)
        if version:
            return version
        version = self.check_maipu(channel)
        log_info("version-check_maipu:[%s]\n" % version)
        if version:
            return version
        version = self.check_raisecom(channel)
        log_info("version-check_raisecom:[%s]\n" % version)
        if version:
            return version

        return ""


def get_lang(channel):
    lang = ""
    global lang_flag
    cmd = "echo $LANG\n"
    lang = exec_cmd_string_all(channel, cmd, 20)
    if re.search('UTF', lang, re.I):
        lang_flag = 0
    # elif lang == "":
    #    lang_flag = 2
    else:
        lang_flag = 1
    send_break(channel, lang)
    log_info("lang_flag:%s" % str(lang_flag))
    return


class Redhat:
    end = ""

    def __init__(self):
        pass

    def get_java_depth(self, channel, node, target_dep_name):
        # target_dep_name = 'fastjson'
        exe_name = 'java'
        # find_java_cmd = f"ps -eo pid,ppid,args --no-headers|grep --color=never '{exe_name}'|grep --color=never -v grep\n"
        # find_war_home_path_cmd = "ps -eo pid,ppid,args --no-headers|grep --color=never 'java'|grep --color=never -v grep|awk -F '-D' '{for(i=1;i<=NF;i++) if($i ~/catalina\.home/) print $i}'|awk -F'=' '{print $2}'\n"
        find_war_home_path_cmd = "ps -eo pid,ppid,args --no-headers|grep  'java'|grep  -v grep|awk -F \'-D\' \'{for(i=1;i<=NF;i++) if($i ~/catalina\.home/) print $i}\'|awk -F\'=\' \'{print $2}\'\n"
        war_path_list = exec_cmd_list(channel, find_war_home_path_cmd, 5, exe_name)

        # war_path_list = ['/home/safeassets/safe/miswyh']
        for war_path in war_path_list:
            war_path = war_path.strip()
            find_war_dep_list_cmd = "jar -tf %s/webapps/*.war|grep \'lib\'|grep  -v \'static\'|awk -F\'/\' \'{print $3}\'|awk \'NF\'\n" % war_path
            war_dep_list = exec_cmd_list(channel, find_war_dep_list_cmd, 5, exe_name)
            # war_dep_list = ['fastjson-1.2.83.jar']
            for war_dep_name in war_dep_list:
                if re.search(target_dep_name, war_dep_name):
                    version_pattern = r'(\d+\.\d+(\.\d+)?[\w\d.-]+).jar'
                    match = re.search(version_pattern, war_dep_name)
                    version = match.group(1) if match else None
                    sub_node = SubElement(node, 'node')
                    sub_node1 = SubElement(sub_node, 'name')
                    sub_node1.text = war_dep_name
                    version_node = SubElement(sub_node, 'version')
                    version_node.text = transfor("%s" % version)
                    sub_node1 = SubElement(sub_node, 'path')
                    sub_node1.text = war_path

        find_jar_name_cmd = "ps -eo pid,ppid,args --no-header|grep \'\-jar\'|grep -v grep|awk \'{print $1,$NF}\'\n"
        jar_pid_name_list = exec_cmd_list(channel, find_jar_name_cmd, 5, exe_name)
        for jar_pid_name in jar_pid_name_list:
            jar_pid_name_split_list = jar_pid_name.split()
            jar_pid = jar_pid_name_split_list[0]
            jar_path = jar_pid_name_split_list[1].strip()
            # find_jar_path_cmd = "ls  -l /proc/%s/cwd|awk \'{print $NF}\'\n" % jar_pid
            # jar_path = exec_cmd_string(channel, find_jar_path_cmd, 5, exe_name) + ".jar"
            find_jar_dep_list_cmd = " jar -tf %s|grep \'lib\'|awk -F\'/\' \'{print $3}\'|awk \'NF\'\n" % jar_path
            jar_dep_list = exec_cmd_list(channel, find_jar_dep_list_cmd, 5, exe_name)
            for jar_dep_name in jar_dep_list:
                if re.search(target_dep_name, jar_dep_name):
                    # 提取版本号的正则表达式
                    version_pattern = r'(\d+\.\d+(\.\d+)?[\w\d.-]+).jar'
                    match = re.search(version_pattern, jar_dep_name)
                    version = match.group(1) if match else None
                    sub_node = SubElement(node, 'node')
                    sub_node1 = SubElement(sub_node, 'name')
                    sub_node1.text = jar_dep_name
                    version_node = SubElement(sub_node, 'version')
                    version_node.text = transfor("%s" % version)
                    sub_node1 = SubElement(sub_node, 'path')
                    sub_node1.text = jar_path
        return

    def get_openssl_info(self, channel, node):
        """
        获取 openssl 版本号、可执行文件路径
        """
        app_name = 'openssl'
        find_version_cmd = "%s version|awk \'{print $2}\'\n" % app_name
        version = exec_cmd_string(channel, find_version_cmd, 5, app_name)

        find_path_cmd = 'which %s\n' % app_name
        path = exec_cmd_string(channel, find_path_cmd, 5, app_name)
        if path:
            sub_node = SubElement(node, 'node')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = app_name
            version_node = SubElement(sub_node, 'version')
            version_node.text = transfor("%s" % version)
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = path

    def get_polkit_info(self, channel, node):
        """
        获取 polkit 组件 版本号、可执行文件路径
        """
        find_version_cmd = "pkexec --version|awk \'{print $NF}\'\n"
        version = exec_cmd_string(channel, find_version_cmd, 5)

        find_path_cmd = 'which pkexec\n'
        path = exec_cmd_string(channel, find_path_cmd, 5)
        if path:
            # 提取版本号的正则表达式
            sub_node = SubElement(node, 'node')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = 'polkit'
            version_node = SubElement(sub_node, 'version')
            version_node.text = transfor("%s" % version)
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = path

    def get_k8s_info(self, channel, node):
        """
        获取 k8s 版本号、可执行文件路径
        """

        #
        # app_exist_cmd = "ps -ef| grep kubectl|grep -v grep\n"
        # proc_info = exec_cmd_string(channel, app_exist_cmd, 5)

        k8s_rpm_cmd = "rpm -qa| grep --color=never kubectl\n"
        k8s_rpm_info = exec_cmd_string(channel, k8s_rpm_cmd, 5)
        log_info('k8s_proc_info: %s' % k8s_rpm_info)
        if not k8s_rpm_info:
            return
        find_version_cmd = "kubectl version|awk -F\'GitVersion:\"\' \'{print $2}\'|awk -F\'\"\' \'{print $1}\'\n"
        version = exec_cmd_string(channel, find_version_cmd, 5)

        find_path_cmd = 'which kubectl\n'
        path = exec_cmd_string(channel, find_path_cmd, 5)
        if path:
            sub_node = SubElement(node, 'node')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = 'k8s'
            version_node = SubElement(sub_node, 'version')
            version_node.text = transfor("%s" % version)
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = path

    def get_zabbix_info(self, channel, node):
        """
        获取 zabbix 服务端和客户端版本，执行文件路径
        """

        # zabbix_server 服务端
        find_zabbix_server_cmd = "ps -eo pid,ppid,args|grep --color=never \'zabbix_server\'|awk \'NR>1\'|awk \'{if(NR==1)print $1}\'|xargs -I {} ls -l /proc/{}/exe|awk \'{print $NF}\'\n"
        zabbix_server_path = exec_cmd_string(channel, find_zabbix_server_cmd, 5)

        if zabbix_server_path:
            find_zabbix_server_version_cmd = "%s --version |awk '{if(NR == 1)print $NF}'\n" % zabbix_server_path
            zabbix_server_version = exec_cmd_string(channel, find_zabbix_server_version_cmd, 5)
            sub_node = SubElement(node, 'node')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = 'zabbix'
            version_node = SubElement(sub_node, 'version')
            version_node.text = transfor("%s" % zabbix_server_version)
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = zabbix_server_path
        # zabbix_agentd 客户端
        find_zabbix_agentd_cmd = "ps -eo pid,ppid,args|grep --color=never \'zabbix_agentd\'|awk \'NR>1\'|awk \'{if(NR==1)print $1}\'|xargs -I {} ls -l /proc/{}/exe|awk \'{print $NF}\'\n"
        zabbix_agentd_path = exec_cmd_string(channel, find_zabbix_agentd_cmd, 5)

        if zabbix_agentd_path:
            find_zabbix_agentd_version_cmd = "%s --version |awk \'{if(NR == 1)print $NF}\'\n" % zabbix_agentd_path
            zabbix_agentd_version = exec_cmd_string(channel, find_zabbix_agentd_version_cmd, 5)
            sub_node = SubElement(node, 'node')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = 'zabbix'
            version_node = SubElement(sub_node, 'version')
            version_node.text = transfor("%s" % zabbix_agentd_version)
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = zabbix_agentd_path

        zabbix_server_rpm_cmd = "rpm -qa| grep --color=never zabbix\n"
        zabbix_rpm_info = exec_cmd_string(channel, zabbix_server_rpm_cmd, 5)
        log_info("zabbix_rpm_info: %s" % zabbix_rpm_info)
        if zabbix_rpm_info:
            # version_pattern = r'(\d+\.\d+(\.\d+)?[\w\d.-]+).jar'
            version_pattern = r'(\d+\.\d+\.\d+)'
            match = re.search(version_pattern, zabbix_rpm_info)
            version = match.group(1) if match else None
            sub_node = SubElement(node, 'node')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = 'zabbix'
            version_node = SubElement(sub_node, 'version')
            version_node.text = transfor("%s" % version)
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = "/usr/sbin/"

    def get_hosttype(self, channel, node):
        node.text = "general_purpose"
        return

    def get_every_net(self, channel, node, item):
        global ip
        iplist = list()
        sub_node1 = SubElement(node, 'name')
        sub_node1.text = transfor(item)

        # gateway 网关
        cmd = "ip -4 route | grep %s | grep via | awk -F ' ' '{print $3}' | head -1\n" % item
        ipv4_gateway_buf = exec_cmd_string(channel, cmd, 10, cmd)
        if ipv4_gateway_buf in cmd:
            ipv4_gateway_buf = ''
        cmd = "ip -6 route | grep %s | grep via | awk -F ' ' '{print $3}' | head -1\n" % item
        ipv6_gateway_buf = exec_cmd_string(channel, cmd, 10, cmd)
        if ipv6_gateway_buf in cmd:
            ipv6_gateway_buf = ''

        # ipv4
        # 虚ip
        # cmd = "ip -o -4 addr show dev %s | grep --color=never -v \"global secondary\"\n" % item
        cmd = "ip -o -4 addr show dev %s | grep -E --color=never  \"global|secondary|site\" | awk '{print $4}'\n" % item
        iplist = exec_cmd_list(channel, cmd, 10)
        if len(iplist) > 0:
            for ip4item in iplist:
                if Tool().is_ip(ip4item):
                    ipv4node = SubElement(node, 'ipv4')
                    # 地址
                    ipv4_add_node = SubElement(ipv4node, 'add')
                    ipv4_add_node.text = ip4item[0:ip4item.rfind('/')]
                    # 网关
                    if ipv4_gateway_buf and ipv4_gateway_buf != cmd.replace('\n', ''):
                        ipv4_gateway_node = SubElement(ipv4node, 'gateway')
                        ipv4_gateway_node.text = ipv4_gateway_buf
                    # 掩码
                    ipv4_netmask_node = SubElement(ipv4node, 'netmask')
                    ipv4_netmask_node.text = netmaskOfIpv4(ip4item)
                    if ip4item[0:ip4item.rfind('/')] == ip:
                        main_node = SubElement(node, 'main')
                        main_node.text = ip4item[0:ip4item.rfind('/')]
        # IPV6
        # cmd = "ip -o -6 addr show dev %s | grep --color=never -v \"scope link\"\n" % item
        cmd = "ip -o -6 addr show dev %s | grep -E --color=never \"global|secondary|site\" | awk '{print $4}'\n" % item
        iplist = exec_cmd_list(channel, cmd, 10)
        if len(iplist) > 0:
            for ip6item in iplist:
                if Tool().is_ip(ip6item):
                    ipv6node = SubElement(node, 'ipv6')
                    # 地址
                    ipv6_add_node = SubElement(ipv6node, 'add')
                    ipv6_add_node.text = ip6item[0:ip6item.rfind('/')]
                    # 网关
                    if ipv6_gateway_buf and ipv6_gateway_buf != cmd.replace('\n', ''):
                        ipv6_gateway_node = SubElement(ipv6node, 'gateway')
                        ipv6_gateway_node.text = ipv6_gateway_buf
                    # 掩码
                    ipv6_netmask_node = SubElement(ipv6node, 'netmask')
                    ipv6_netmask_node.text = netmaskOfIpv6(ip6item)
                    if ip6item[0:ip6item.rfind('/')] == ip:
                        main_node = SubElement(node, 'main')
                        main_node.text = ip6item[0:ip6item.rfind('/')]

        # MAC
        cmd = "ip -o link show dev %s | grep --color=never \"link\/ether\"\n" % item
        iplist = exec_cmd_list(channel, cmd, 10)
        if len(iplist) > 0:
            aaa = re.search('link/ether.*brd', iplist[0])
            if aaa:
                item1 = aaa.group().split('link/ether')[1].split('brd')[0].strip()
                sub_node1 = SubElement(node, 'mac')
                sub_node1.text = item1

        sub_node1 = SubElement(node, 'territory')

        return

    def get_net(self, channel, node):
        recv_buf = ""

        cmd = "ip -o link\n"
        env_sh = exec_cmd_list(channel, cmd, 10)
        for item in env_sh:
            item = item.strip()
            if not re.search('link/ether', item):
                continue
            item = item.strip()
            # print env_sh
            if re.search('docker', item):
                continue
            if re.search('state DOWN', item):
                continue
            if not re.search('UP', item):
                continue
            if re.search('SLAVE', item):
                continue
            item = item.split(':')[1].split()[0].split('@')[0]
            sub_node = SubElement(node, 'eth')
            self.get_every_net(channel, sub_node, item)

        return

    def get_hostname(self, channel, node):
        hn = ""
        cmd = "hostname\n"
        hn = exec_cmd_string_all(channel, cmd, 20)
        log_info("get_hostname:[%s]\n" % hn)
        node.text = hn
        return

    def get_core(self, channel, node):
        cmd = "uname -r\n"
        rel = exec_cmd_string(channel, cmd, 10)
        node.text = rel
        return

    def get_os(self, channel, node):
        rel = ""
        os = ""
        rel_list = list()
        cmd = "cat /etc/*release\n"
        rel = exec_cmd_string_all(channel, cmd, 10)
        log_info("os_rel:[%s]\n" % rel)
        b64 = base64.b64decode('6YeR5bqT').decode()
        if re.search(b64, rel):
            cmd = "\n"
            exec_cmd_string(channel, cmd, 5)
            os = ""
        elif re.search('this command is sensitive', rel):
            cmd = "q"
            exec_cmd_string(channel, cmd, 5)
            os = ""
        elif re.search('NewStart Carrier Grade Server Linux.*', rel, re.I):
            os = re.search('NewStart Carrier Grade Server Linux.*', rel, re.I).group().replace('\n', '')
        elif re.search('Anolis OS release.*', rel, re.I):
            os = re.search('Anolis OS release.*', rel, re.I).group().replace('\n', '')
        elif re.search('Anolis OS', rel, re.I) and re.search('PRETTY_NAME=.*', rel, re.I):
            tem_info = re.search('PRETTY_NAME=.*', rel).group()
            os = re.findall('\"(.+?)\"', tem_info)[0]

        elif re.search('BigCloud Enterprise.*', rel, re.I):
            tem_info = re.search('PRETTY_NAME=.*', rel).group()
            os = re.findall('\"(.+?)\"', tem_info)[0]
            os = bclinux_switch_anolis(os)

        elif re.search('H3Linux', rel, re.I):
            tem_info = re.search('PRETTY_NAME=.*', rel, re.I).group()
            os = re.findall('\"(.+?)\"', tem_info)[0]
        # elif re.search('openEuler release.*', rel, re.I):
        #     os = re.search('openEuler release.*', rel, re.I).group().replace('\n', '')

        elif re.search('UnionTech OS Server.*', rel, re.I):
            os = re.search('UnionTech OS Server.*', rel, re.I).group().replace('\n', '')
        elif re.search('openEuler release.*', rel, re.I):
            os = re.search('openEuler release.*', rel, re.I).group().replace('\n', '')
        elif re.search('openEuler', rel):
            tem_info = re.search('PRETTY_NAME=.*', rel).group()
            os = re.findall('\"(.+?)\"', tem_info)[0]

        elif re.search('EulerOS release.*', rel, re.I):
            os = re.search('EulerOS release.*', rel, re.I).group().replace('\n', '')
            # os = re.search('BigCloud Enterprise.*', rel, re.I).group().replace('\n', '')
        elif re.search('.*Carrier Grade Server Linux.*release.*', rel, re.I):
            os = re.search('.*Carrier Grade Server Linux.*release.*', rel, re.I).group().replace('\n', '')

        elif re.search('CentOS Linux release.*', rel, re.I):
            os = re.search('CentOS Linux release.*', rel, re.I).group().replace('\n', '')
        elif re.search('CentOS release.*', rel, re.I):
            os = re.search('CentOS release.*', rel, re.I).group().replace('\n', '')
        elif re.search('CentOS Linux.*', rel, re.I):
            temp_info = re.search('PRETTY_NAME=.*', rel).group()
            os = re.findall('\"(.+?)\"', temp_info)[0]
        elif re.search('Red Hat Enterprise Linux Server release.*', rel, re.I):
            os = re.search('Red Hat Enterprise Linux Server release.*', rel, re.I).group().replace('\n', '')
        elif re.search('Red Hat Enterprise Linux release.*', rel, re.I):
            os = re.search('Red Hat Enterprise Linux release.*', rel, re.I).group().replace('\n', '')
        elif re.search('Redhat Linux release.*', rel, re.I):
            os = re.search('Redhat Linux release.*', rel, re.I).group().replace('\n', '')
        elif re.search('redhat-.*', rel, re.I) and not re.search('redhat-release: Permission denied', rel, re.I):
            os = re.search('redhat-.*', rel, re.I).group().replace('\n', '')
        elif re.search('Redhat release.*', rel, re.I):
            os = re.search('Redhat release.*', rel, re.I).group().replace('\n', '')
        elif re.search('QorIQ SDK.*', rel, re.I):
            os = re.search('QorIQ SDK.*', rel, re.I).group().replace('\n', '')

        elif re.search('Fedora release.*', rel, re.I):
            os = re.search('Fedora release.*', rel, re.I).group().replace('\n', '')

        elif re.search('Oracle Solaris.*', rel, re.I):
            os = re.search('Oracle Solaris.*', rel, re.I).group().replace('\n', '')
        elif re.search('SunOS.*', rel, re.I):
            os = re.search('SunOS.*', rel, re.I).group().replace('\n', '')
        elif re.search('Kylin Linux Advanced Server release.*', rel, re.I):
            os = re.search('Kylin Linux Advanced Server release.*', rel, re.I).group().replace('\n', '')
        elif re.search('SUSE Linux Enterprise.*', rel, re.I):
            os = re.search('SUSE Linux Enterprise.*', rel, re.I).group().replace('\n', '')

        if not os:
            cmd = "cat /proc/version\n"
            rel = exec_cmd_string_all(channel, cmd, 10)
            # b64 = base64.b64decode('6YeR5bqT').decode()
            # if re.search(b64, rel):
            #     cmd = "\n"
            #     exec_cmd_string(channel, cmd, 5)
            #     os = ""
            if re.search('this command is sensitive', rel):
                cmd = "q"
                exec_cmd_string(channel, cmd, 5)
                os = ""
            elif re.search('(Red Hat.*)', rel, re.I):
                os = re.search('(Red Hat.*)', rel, re.I).group().split(")")[0].replace('\n', '')
            elif re.search('Linux version.*-Cavium-Octeon', rel, re.I):
                os = re.search('Linux version.*-Cavium-Octeon', rel, re.I).group().replace('\n', '')

        if not os:
            os = "Linux Server UNKNOWN"
        node.text = os.replace('"', '').strip()
        return

    def get_patch(self, channel, node):
        # LDY modify in 20220128 for wangzhen
        rel = exec_cmd_list(channel, "rpm -qa\n", 20)
        # rel = exec_cmd_list(channel, "rpm -qa | grep --color=never  patch\n", 20)
        for item in rel:
            if re.search('(Permission denied)|(error)', item):
                continue
            sub_node = SubElement(node, 'patch')
            sub_node.text = item.strip()

        return

    def get_port(self, channel, node):
        # TCP4
        cmd = "netstat -na\n"
        log_info("get_port cmd:%s" % cmd)
        # LDY modify in 20220126 mod:timeout 10 -> 120
        rel = exec_cmd_list(channel, cmd, 120)
        for item in rel:
            if re.match('tcp.*LISTEN', item):
                sub_node = SubElement(node, 'TCP4_PORT')
                sub_node.text = item.split()[3].split(':')[-1]
        # TCP6
        for item in rel:
            if re.match('tcp6.*LISTEN', item):
                sub_node = SubElement(node, 'TCP6_PORT')
                sub_node.text = item.split()[3].split(':')[-1]
        # UDP4
        for item in rel:
            if re.match('udp ', item):
                sub_node = SubElement(node, 'UDP4_PORT')
                sub_node.text = item.split()[3].split(':')[-1]
        # UDP6
        for item in rel:
            if re.match('udp6 ', item):
                sub_node = SubElement(node, 'UDP6_PORT')
                sub_node.text = item.split()[3].split(':')[-1]

        return

    def get_proc_name(self, channel, temp):
        name = ""
        if re.search('->', temp):
            name = temp.split('/')[-1].strip(' ')
        return name

    def get_path(self, temp):
        name = ""
        if re.search('->', temp):
            name = '/'.join(temp.split('->')[-1].strip(' ').split('/')[:-1])
        return name

    def get_proc_args(self, channel, pid):
        agrs1 = ""
        args = pid.split()[4:]
        args1 = ' '.join(args)
        args1 = transfor(args1)
        return args1

    def get_soft(self, channel, temp, rpm_dict):
        rel = ""
        version = ""
        out = ""
        if re.search('->', temp):
            rel = temp.split('->')[-1].strip(' ')

        if re.search("postfix", rel):
            for item in rpm_dict:
                if re.search('postfix-[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}', item):
                    version = item.split('-')[1]
                    break
            out = "postfix %s" % version
        elif re.search("sshd", rel):
            for item in rpm_dict:
                if re.search('openssh-server-[0-9]{1, 2}\.[0-9]{1, 2}', item):
                    version = item.split('-')[2]
                    break
                elif re.search('^openssh-[0-9]', item):
                    version = item.split('-')[1]
                    break
            out = "openssh %s" % version
        elif re.search("rsyslogd", rel):
            for item in rpm_dict:
                if re.search('rsyslog-[0-9]{1, 3}\.[0-9]{1, 3}\.[0-9]{1, 3}', item):
                    version = item.split('-')[1]
                    break
            out = "rsyslog %s" % version
        elif re.search("vsftpd", rel):
            for item in rpm_dict:
                if re.search('vsftpd-[0-9]{1, 3}\.[0-9]{1, 3}\.[0-9]{1, 3}', item):
                    version = item.split('-')[1]
                    break
            out = "vsftpd %s" % version
        elif re.search("snmpd", rel):
            for item in rpm_dict:
                if re.search('net-snmp-[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}', item):
                    version = item.split('-')[2]
                    break
            out = "net-snmp %s" % version
        elif re.search("named", rel):
            for item in rpm_dict:
                if re.search('bind-[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}', item):
                    version = item.split('-')[1]
                    break
            out = "named %s" % version
        elif re.search("ntpd", rel):
            for item in rpm_dict:
                if re.search('ntpdate-[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}', item):
                    version = item.split('-')[1]
                    break
            out = "ntpdate %s" % version
        elif re.search("smbd|nmbd", rel):
            for item in rpm_dict:
                if re.search('samba-[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}', item):
                    version = item.split('-')[1]
                    break
            out = "samba %s" % version
        return out

    def get_groups(self, channel, user):
        groups = ""
        cmd = "groups %s|awk -F ':' '{print $2}'\n" % user
        buf = exec_cmd_string(channel, cmd, 2).strip()
        if not re.match('groups:', buf):
            groups = buf.strip()
        return groups

    def get_rpm(self, channel):
        rpmd = list()
        cmd = "rpm -qa\n"
        temp = exec_cmd_list(channel, cmd, 8)
        for item1 in temp:
            rpmd.append(item1)
        return rpmd

    def get_start_tm(self, channel):
        start_dc1 = dict()
        cmd = "ps -eo pid,lstart --no-headers\n"
        start_list = exec_cmd_list(channel, cmd, 30)
        for item in start_list:
            line = item.split()
            pid = line[0]
            start_time = ' '.join(line[1:])
            start_dc1[pid] = start_time
        return start_dc1

    # LDY add for exec_cmd return all result
    def get_proc_path(self, channel, pid, command):
        proc_path = "/bin"
        cmd = "ls -l --color=never /proc/%s/exe\n" % pid
        proc_result = exec_cmd_string(channel, cmd, 5, command)
        if re.search('->', proc_result):
            proc_path = proc_result.split('->')[1].strip()
        return proc_path

    def get_proc(self, channel, node):
        soft = ""
        recv_buf = ""
        groups = ""
        start_dc = dict()
        proc_list = dict()
        groups_list = dict()
        rpm_dict = list()
        cmd = "ps -eo pid,ppid,ruser=user12345678901234567890,command --no-headers|grep --color=never -v \"ps -eo\"|grep --color=never -v grep\n"
        rel = exec_cmd_list(channel, cmd, 60)

        start_dc = self.get_start_tm(channel)
        rpm_dict = self.get_rpm(channel)

        for item in rel:
            line = item.split()

            pid = line[0]
            ppid = line[1]
            user = line[2]
            if (len(ppid) == 0) or int(ppid) == 0 or int(ppid) == 2:
                continue
            # if re.search('ps |grep ', item):指令本身已经剔除，这里的处理会导致结果信息丢失
            #    continue
            sub_node = SubElement(node, 'proc')
            sub_node1 = SubElement(sub_node, 'pid')
            sub_node1.text = pid

            command = ' '.join(line[3:])

            command1 = command.split()[0].strip()
            if re.search("\[", command1):
                command = command1
            else:
                command = command1.split('/')[-1].strip(':')

            # LDY add for exec_cmd return all result
            path = self.get_proc_path(channel, pid, command)
            soft = self.get_soft(channel, path, rpm_dict)
            if user not in groups_list:
                cmd = "groups %s|awk -F ':' '{print $2}'\n" % user
                groups = exec_cmd_string(channel, cmd, 2).strip()
                groups_list[user] = groups

            sub_node1 = SubElement(sub_node, 'proc_name')
            sub_node1.text = command
            sub_node1 = SubElement(sub_node, 'soft')
            sub_node1.text = soft
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = path
            sub_node1 = SubElement(sub_node, 'args')
            sub_node1.text = self.get_proc_args(channel, item)
            sub_node1 = SubElement(sub_node, 'user')
            sub_node1.text = user
            sub_node1 = SubElement(sub_node, 'groups')
            sub_node1.text = groups_list.get(user)
            sub_node1 = SubElement(sub_node, 'creationDate')
            sub_node1.text = start_dc.get(pid, "")

        return

    def get_apache_port_pid(self, channel, pid, exe_name):
        global querytype
        querytype = "port_%s" % exe_name
        # exe_name = "port_%s"%exe_name
        recv_buf = ""
        tcp4_list = list()
        tcp6_list = list()
        udp4_list = list()
        udp6_list = list()
        # TCP4
        cmd = "netstat -nltp|grep --color=never %s\n" % pid
        rel = exec_cmd_list(channel, cmd, 3, exe_name)
        for item in rel:
            if re.search('netstat', item):
                continue
            if not re.search('LISTEN', item):
                continue
            if re.match('tcp ', item):
                port = item.split()[3].split(':')[-1]
                tcp4_list.append(port)
            elif re.match('tcp6 ', item):
                port = item.split()[3].split(':')[-1]
                tcp6_list.append(port)
            elif re.match('udp ', item):
                port = item.split()[3].split(':')[-1]
                udp4_list.append(port)
            elif re.match('udp6 ', item):
                port = item.split()[3].split(':')[-1]
                udp6_list.append(port)
        return tcp4_list, tcp6_list, udp4_list, udp6_list

    def get_apache(self, channel, node):
        recv_buf = ""
        exe_name = "apache"
        exe = "httpd "
        proc_list = dict()
        cmd = "ps -eo pid,ppid,ruser=user12345678901234567890,command --no-headers|grep --color=never '%s'\n" % exe
        rel = exec_cmd_list(channel, cmd, 3, exe_name)

        # log_info ("apache:[%d]\n" % len(rel))
        for item in rel:
            if re.search('grep', item):
                continue
            if not re.search('httpd |httpd-prefork', item):
                continue
            line = item.split()
            pid = line[0]
            ppid = line[1]
            user = line[2]
            comm = line[3]
            if (len(ppid) == 0) or int(ppid) != 1:
                continue
            if not re.search(exe, item):
                continue
            if not re.search(exe, comm):
                continue

            sub_node = SubElement(node, 'node')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = "apache"

            cmd = "ls -l --color=never /proc/%s/exe\n" % pid
            abs_exe = exec_cmd_string(channel, cmd, 1)
            if not re.search('->', abs_exe):
                continue
            abs_exe = abs_exe.split('->')[1].strip()

            tmp = abs_exe.split('/')[:-1]
            path = '/'.join(tmp)

            cmd = "%s -v|grep --color=never \"Server version: Apache/\"|awk -F 'Server version: Apache/' '{print $2}'|awk -F ' ' '{print $1}'\n" % abs_exe
            version = exec_cmd_string(channel, cmd, 3)
            sub_node1 = SubElement(sub_node, 'version')
            sub_node1.text = ("apache %s" % transfor(version))

            tcp4, tcp6, udp4, udp6 = self.get_apache_port_pid(channel, pid, exe_name)
            for port in tcp4:
                sub_node1 = SubElement(sub_node, 'TCP4_PORT')
                sub_node1.text = port
            for port in tcp6:
                sub_node1 = SubElement(sub_node, 'TCP6_PORT')
                sub_node1.text = port
            for port in udp4:
                sub_node1 = SubElement(sub_node, 'UDP4_PORT')
                sub_node1.text = port
            for port in udp6:
                sub_node1 = SubElement(sub_node, 'UDP6_PORT')
                sub_node1.text = port

            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = path
            sub_node1 = SubElement(sub_node, 'user')
            sub_node1.text = user
            sub_node1 = SubElement(sub_node, 'language')
            sub_node1.text = "C"
            cmd = "%s -l|grep --color=never -v \"Compiled in modules:\"\n" % abs_exe
            modules = exec_cmd_list(channel, cmd, 10)
            for module in modules:
                sub_node1 = SubElement(sub_node, 'module')
                sub_node1.text = module.strip()

        return

    def get_tomcat(self, channel, node):
        recv_buf = ""
        exe_name = "tomcat"
        exe = "Dcatalina.home"
        proc_list = dict()
        cmd = "ps -eo pid,ppid,ruser=user12345678901234567890,args --no-headers|grep --color=never '%s'|grep --color=never -v grep\n" % exe
        rel = exec_cmd_list(channel, cmd, 5, exe_name)
        catalina = ""
        version = ""
        # print len(rel)
        port_list = dict()
        global g_ip
        for item in rel:
            line = item.split()
            pid = line[0]
            ppid = line[1]
            user = line[2]
            if (len(ppid) == 0) or int(ppid) != 1:
                continue
            if not re.search(exe, item):
                continue
            sub_node = SubElement(node, 'node')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = "tomcat"
            version_node = SubElement(sub_node, 'version')
            java_path = line[3]
            path = item.split('-Dcatalina.home=')[1].split()[0].replace(' ', '')

            cmd = "find %s -name catalina.jar\n" % path
            jar = exec_cmd_string(channel, cmd, 10, exe_name)
            if not re.match('find: ', jar):
                cmd = "%s  -classpath %s org.apache.catalina.util.ServerInfo |grep --color=never 'Server version:'|awk -F '/' '{print $NF}'\n" % (
                    java_path, jar)
                detail = exec_cmd_string(channel, cmd, 5, exe_name)
                # LDY modify in 20220121 for guizhou
                # if not re.search('[0-9]\.[0-9]\.[0-9]', detail):
                #    version = ""
                # else:
                #    version = detail
                version = detail
            version_node.text = transfor("tomcat %s" % version)

            tcp4, tcp6, udp4, udp6 = self.get_apache_port_pid(channel, pid, exe_name)
            for port in tcp4:
                sub_node1 = SubElement(sub_node, 'TCP4_PORT')
                sub_node1.text = port
                if port not in port_list:
                    port_list[port] = ""
            for port in tcp6:
                sub_node1 = SubElement(sub_node, 'TCP6_PORT')
                sub_node1.text = port
                if port not in port_list:
                    port_list[port] = ""
            for port in udp4:
                sub_node1 = SubElement(sub_node, 'UDP4_PORT')
                sub_node1.text = port
                if port not in port_list:
                    port_list[port] = ""
            for port in udp6:
                sub_node1 = SubElement(sub_node, 'UDP6_PORT')
                sub_node1.text = port
                if port not in port_list:
                    port_list[port] = ""
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = path
            sub_node1 = SubElement(sub_node, 'user')
            sub_node1.text = user
            sub_node1 = SubElement(sub_node, 'language')
            sub_node1.text = "JAVA"

            cmd = "ls  --color=never %s/webapps/*/WEB-INF/lib|grep --color=never -v grep --color=never |grep --color=never '.jar'\n" % path
            modules = exec_cmd_list(channel, cmd, 3, cmd)
            for module in modules:
                if re.match('ls: ', module):
                    continue
                sub_node1 = SubElement(sub_node, 'module')
                sub_node1.text = module.strip()
            webapp = ""
            appurl_node = SubElement(sub_node, 'appurl')
            weburl_node1 = SubElement(sub_node, 'weburl')
            cmd = "ls -l --color=never %s/webapps\n" % path
            app_list = exec_cmd_list(channel, cmd, 5)
            weburl = ""
            for item in app_list:
                if not re.search('[rwx-]{9}', item):
                    continue
                app = ""
                bbbb = item.split()
                app = bbbb[-1]
                if re.search('.war', app):
                    continue
                web_app1 = "%s/webapps/%s" % (path, app)
                webapp = "%s===%s" % (webapp, web_app1)
                for item1 in list(port_list.keys()):
                    url1 = ""
                    if re.match('^(8080|8889)$', item1):
                        url1 = "http://%s:%s/%s" % (g_ip, item1, app)
                        weburl = "%s===%s" % (weburl, url1)
                    elif re.match('^(8443)$', item1):
                        url1 = "https://%s:%s/%s" % (g_ip, item1, app)
                        weburl = "%s===%s" % (weburl, url1)

            appurl_node.text = webapp.strip('===')
            weburl_node1.text = weburl.strip('===')
        return

    def get_oracle(self, channel, node):
        exe_name = "oracle"
        all_oracle_version = []
        recv_buf = ""
        exe = "tnslsnr LISTENER"
        detail = ""
        proc_list = dict()
        version1 = ""
        cmd = "ps -eo pid,ppid,ruser=user12345678901234567890,command --no-headers|grep --color=never \"%s\"|grep --color=never -v grep\n" % exe
        rel = exec_cmd_list(channel, cmd, 3, exe_name)
        catalina = ""
        path = ""
        global lang_flag

        for item in rel:
            line = item.split()
            pid = line[0]
            ppid = line[1]
            user = line[2]
            app = line[3]
            if (len(ppid) == 0) or int(ppid) != 1:
                continue
            if not re.search(exe, item):
                continue
            version = ""
            cmd = "su - %s -c \"lsnrctl status |grep --color=never 'LSNRCTL for Linux: Version'\"\n" % user
            version1 = exec_cmd_string_all(channel, cmd, 5, exe_name)
            b64 = base64.b64decode('5Y+j5Luk')
            if re.search(b64, version1):
                cmd = "\x03"
                recv_buf = exec_cmd_string_all(channel, cmd, 3, exe_name)
                version = ""
            elif re.search('Password:', version1):
                cmd = "\n"
                recv_buf = exec_cmd_string_all(channel, cmd, 3, exe_name)
                version = ""
            elif re.search('LSNRCTL for Linux: Version.* -', version1):
                aaa = re.search('LSNRCTL for Linux: Version.* -', version1)
                version = aaa.group().split('LSNRCTL for Linux: Version')[1].replace('-', '').strip()
            else:
                version = ""
            if len(version) == 0:
                cmd = "ls -l --color=never /proc/%s/exe|awk -F 'product/' '{print $2}' |awk -F '/' '{print $1}'\n" % pid
                version1 = exec_cmd_string(channel, cmd, 5, exe_name)
                if re.search('ls -l', version1):
                    version = ""
                else:
                    version = version1
            if len(version) == 0:
                bbb = re.search('[0-9]{1, 3}.[0-9]{1, 3}.[0-9]{1, 3}', item)
                if bbb:
                    version = bbb.group()

            oracle_version = ("oracle %s" % transfor(version.replace('"', '').replace('\'', '')))
            if oracle_version in all_oracle_version:
                continue
            sub_node = SubElement(node, 'node')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = "oracle"
            sub_node1 = SubElement(sub_node, 'version')
            sub_node1.text = oracle_version

            tcp4, tcp6, udp4, udp6 = self.get_apache_port_pid(channel, pid, exe_name)
            for port in tcp4:
                sub_node1 = SubElement(sub_node, 'TCP4_PORT')
                sub_node1.text = port
            for port in tcp6:
                sub_node1 = SubElement(sub_node, 'TCP6_PORT')
                sub_node1.text = port
            for port in udp4:
                sub_node1 = SubElement(sub_node, 'UDP4_PORT')
                sub_node1.text = port
            for port in udp6:
                sub_node1 = SubElement(sub_node, 'UDP6_PORT')
                sub_node1.text = port

            cmd = "ls -l --color=never /proc/%s/exe \n" % pid
            detail = exec_cmd_string(channel, cmd, 3, exe_name)
            if re.search('->', detail):
                path1 = detail.split('->')[1].split('/')[:-1]
                path = '/'.join(path1)
            else:
                path = ""
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = path
            sub_node1 = SubElement(sub_node, 'user')
            sub_node1.text = user
        return

    def get_mysql1(self, channel, node):
        exe = "mysqld "
        proc_list = dict()
        cmd = "ps -eo pid,ppid,ruser=user12345678901234567890,command --no-headers|grep --color=never %s|grep --color=never -v grep\n" % exe
        rel = exec_cmd_list(channel, cmd, 3)
        catalina = ""
        path = ""
        for item in rel:
            line = item.split()
            pid = line[0]
            ppid = line[1]
            user = line[2]
            if (len(ppid) == 0) or int(ppid) != 1:
                continue
            if re.search('mysqld_safe', item):
                cmd = "ps --ppid %s -o pid --no-headers|awk '$1=$1'\n" % pid
                pid = exec_cmd_string(channel, cmd, 1)

            cmd = "ls -l --color=never /proc/%s/exe | awk -F ' -> ' '{print $2}'|awk -F '/mysqld' '{print $1}'\n" % pid
            path = exec_cmd_string(channel, cmd, 1)
            if re.match('ls: ', path) or len(path) == 0:
                path = ""
            cmd = "ls -l --color=never /proc/%s/exe | awk -F ' -> ' '{print $2}'\n" % pid
            command = exec_cmd_string(channel, cmd, 1)
            if re.match('ls: ', command) or len(command) == 0:
                command = ""

            version = ""
            cmd = "%s --help |grep --color=never -v grep --color=never |grep --color=never \"mysqld  Ver \"| awk -F 'mysqld  Ver ' '{print $2}'|awk -F ' ' '{print $1}'|awk -F '-' '{print $1}'\n" % command
            version = exec_cmd_string(channel, cmd, 1)
            if re.search('bash', version):
                version = ""
            sub_node = SubElement(node, 'node')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = "mysql"
            sub_node1 = SubElement(sub_node, 'version')
            sub_node1.text = ("mysql %s" % version)

            tcp4, tcp6, udp4, udp6 = self.get_apache_port_pid(channel, pid)
            for port in tcp4:
                sub_node1 = SubElement(sub_node, 'TCP4_PORT')
                sub_node1.text = port
            for port in tcp6:
                sub_node1 = SubElement(sub_node, 'TCP6_PORT')
                sub_node1.text = port
            for port in udp4:
                sub_node1 = SubElement(sub_node, 'UDP4_PORT')
                sub_node1.text = port
            for port in udp6:
                sub_node1 = SubElement(sub_node, 'UDP6_PORT')
                sub_node1.text = port
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = path
            sub_node1 = SubElement(sub_node, 'user')
            sub_node1.text = user

        return

    def get_mysql(self, channel, node):
        exe = "mysqld "
        proc_list = dict()
        cmd = "ps -eo pid,ppid,ruser=user12345678901234567890,command --no-headers|grep --color=never %s|grep --color=never -v grep\n" % exe
        rel = exec_cmd_list(channel, cmd, 3, exe)
        catalina = ""
        path = ""
        for item in rel:
            line = item.split()
            if len(line) < 3:
                return
            pid = line[0]
            ppid = line[1]
            user = line[2]
            if (len(ppid) == 0) or int(ppid) != 1:
                continue
            if re.search('mysqld_safe', item):
                cmd = "ps --ppid %s -o pid --no-headers|awk '$1=$1'\n" % pid
                pid = exec_cmd_string(channel, cmd, 1, exe)
            command = ""
            cmd = "ps -o pid,command -p %s --no-headers\n" % pid
            temp = exec_cmd_string(channel, cmd, 3, exe)
            if re.search(pid, temp, re.I):
                command = temp.split()[1]
            version = ""
            if command:
                cmd = "%s --help |grep --color=never -v grep --color=never |grep --color=never \"mysqld  Ver \"| awk -F 'mysqld  Ver ' '{print $2}'|awk -F ' ' '{print $1}'|awk -F '-' '{print $1}'\n" % command
                version = exec_cmd_string(channel, cmd, 1, exe)
                if re.search('bash', version):
                    version = ""
            sub_node = SubElement(node, 'node')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = "mysql"
            sub_node1 = SubElement(sub_node, 'version')
            sub_node1.text = ("mysql %s" % version)

            tcp4, tcp6, udp4, udp6 = self.get_apache_port_pid(channel, pid, exe)
            # print tcp4
            for port in tcp4:
                sub_node1 = SubElement(sub_node, 'TCP4_PORT')
                sub_node1.text = port
            for port in tcp6:
                sub_node1 = SubElement(sub_node, 'TCP6_PORT')
                sub_node1.text = port
            for port in udp4:
                sub_node1 = SubElement(sub_node, 'UDP4_PORT')
                sub_node1.text = port
            for port in udp6:
                sub_node1 = SubElement(sub_node, 'UDP6_PORT')
                sub_node1.text = port
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = path
            sub_node1 = SubElement(sub_node, 'user')
            sub_node1.text = user

        return

    def get_pgsql_key(self, channel, result, keyword, node):
        exe_name = "pgsql"
        exe = keyword
        proc_list = dict()
        cmd = "ps -eo pid,ppid,ruser=user12345678901234567890,command --no-headers|grep --color=never '%s'|grep --color=never -v grep\n" % exe
        rel = exec_cmd_list(channel, cmd, 3, exe_name)

        for item in rel:
            line = item.split()
            if len(line) < 3:
                return
            pid = line[0]
            ppid = line[1]
            user = line[2]
            if not (('%s/' % exe) in line[3] or line[3].endswith(exe)):
                continue
            if (len(ppid) == 0) or int(ppid) != 1:
                continue
            if not re.search(exe, item):
                continue
            cmd = "ls -l --color=never /proc/%s/exe | awk -F ' -> ' '{print $2}'\n" % pid
            abs_exe = exec_cmd_string(channel, cmd, 5, exe_name)
            # LDY modify in 20220120 for guizhou get path Permission denied
            log_info("path info:%s" % abs_exe)
            if re.match('ls: ', abs_exe) or len(abs_exe) == 0:
                if re.match('Permission denied', abs_exe):
                    abs_exe = "Permission denied"
                    # log_info(abs_exe)
                else:
                    abs_exe = ""
            version = ""
            # LDY modify in 20220120 add command "psql -V"
            if len(abs_exe) > 0 and abs_exe != "Permission denied":
                cmd = "%s -V |awk -F ' ' '{print $NF}'\n" % abs_exe
                version = exec_cmd_string(channel, cmd)
                if re.match('bash', version):
                    version = ""
            # LDY modify in 20220120  get pg version if not get path
            else:
                cmd = "psql --version | grep psql |awk -F ' ' '{print $NF}'\n"
                version = exec_cmd_string(channel, cmd, 5, exe_name)
            sub_node = SubElement(node, 'node')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = "postgresql"
            sub_node1 = SubElement(sub_node, 'version')
            version = "postgresql %s" % version
            sub_node1.text = transfor(version)

            tcp4, tcp6, udp4, udp6 = self.get_apache_port_pid(channel, pid, exe_name)
            # print tcp4
            for port in tcp4:
                sub_node1 = SubElement(sub_node, 'TCP4_PORT')
                sub_node1.text = port
            for port in tcp6:
                sub_node1 = SubElement(sub_node, 'TCP6_PORT')
                sub_node1.text = port
            for port in udp4:
                sub_node1 = SubElement(sub_node, 'UDP4_PORT')
                sub_node1.text = port
            for port in udp6:
                sub_node1 = SubElement(sub_node, 'UDP6_PORT')
                sub_node1.text = port
            path = ""
            if len(abs_exe) != 0:
                path = '/'.join(abs_exe.split('/')[:-1])
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = path
            sub_node1 = SubElement(sub_node, 'user')
            sub_node1.text = user

        return result

    def get_pgsql(self, channel, node):
        keyword = ['/postgres', '/postmaster']
        temp = ""
        for item in keyword:
            self.get_pgsql_key(channel, temp, item, node)

        return

    def get_iplist(self, channel, node):
        recv_buf = ""

        # IPV4
        cmd = "ip -o -4 addr| grep --color=never -v \"global secondary\"\n"
        iplist = exec_cmd_list(channel, cmd, 5)
        for item in iplist:
            if re.search('lo ', item):
                continue
            aaa = re.search('inet .*brd', item)
            if aaa:
                item1 = aaa.group().split('brd')[0].split('inet')[1].strip()
                sub_node1 = SubElement(node, 'ip')
                sub_node1.text = item1

        # IPV6
        cmd = "ip -o -6 addr | grep --color=never -v 'scope link'|grep -v 'lo '\n"
        iplist = exec_cmd_list(channel, cmd, 5)
        if len(iplist) == 0:
            cmd = "ip -o -6 addr | grep --color=never 'scope link'|grep -v 'lo '\n"
            iplist = exec_cmd_list(channel, cmd, 5)
        for item in iplist:
            if re.search('lo ', item):
                continue
            aaa = re.search('inet6 .*scope', item)
            if aaa:
                item1 = aaa.group().split('scope')[0].split('inet6')[1].strip()
                sub_node1 = SubElement(node, 'ip')
                sub_node1.text = item1

        return

    def get_nat(self, channel, node):
        recv_buf = ""

        # IPV4
        cmd = "iptables -t nat --list\n"
        iplist = exec_cmd_list(channel, cmd, 5)
        for item in iplist:
            if not re.search('SNAT|DNAT', item):
                continue
            it = item.split()
            target = it[0]
            src = it[3]
            dst = ' '.join(it[4:])
            if re.search('to:', dst):
                dst = dst.split('to:')[1].strip()
            sub_node1 = SubElement(node, 'ip')
            sub_node1.text = ("%s===%s" % (src, dst))
        return

    def get_service(self):
        serviced = dict()
        serviced['java'] = 'HTTP'
        serviced['vsftpd'] = 'FTP'
        serviced['tnslsnr'] = 'Oracle'
        serviced['sshd'] = 'SSH'
        serviced['postgres'] = 'Postgresql'
        serviced['mysqld'] = 'MYSQL'
        serviced['httpd'] = 'HTTP'
        serviced['apachectl'] = 'HTTP'
        serviced['apache2'] = 'HTTP'
        serviced['named'] = 'DNS'
        return serviced

    def get_port_service(self, channel, node):
        global g_pservice
        # TCP4
        cmd = "netstat -nltp|grep --color=never LISTEN\n"
        rel = exec_cmd_list(channel, cmd, 3)
        for item in rel:
            if re.match('tcp ', item):
                sub_node = SubElement(node, 'TCP4_PORT')
                it = item.split()
                port = it[3].split(':')[-1]
                port_s = "%s/tcp" % port
                sub_node.text = "%s/%s" % (port, g_pservice.get(port_s, ""))
        # TCP6
        for item in rel:
            if re.match('tcp6 ', item):
                sub_node = SubElement(node, 'TCP6_PORT')
                it = item.split()
                port = it[3].split(':')[-1]
                port_s = "%s/tcp" % port
                sub_node.text = "%s/%s" % (port, g_pservice.get(port_s, ""))
        # UDP4
        for item in rel:
            if re.match('udp ', item):
                sub_node = SubElement(node, 'UDP4_PORT')
                it = item.split()
                port = it[3].split(':')[-1]
                port_s = "%s/udp" % port
                sub_node.text = "%s/%s" % (port, g_pservice.get(port_s, ""))
        # UDP6
        for item in rel:
            if re.match('udp6 ', item):
                sub_node = SubElement(node, 'UDP6_PORT')
                it = item.split()
                port = it[3].split(':')[-1]
                port_s = "%s/udp" % port
                sub_node.text = "%s/%s" % (port, g_pservice.get(port_s, ""))

        return

    def get_start(self, channel, node):
        recv_buf = ""
        '''
		cmd = "chkconfig --list > chk.txt\n"
		aaa = exec_cmd_string_all(channel, cmd, 3)
		cmd = "cat chk.txt\n"
		'''
        cmd = "chkconfig --list\n"
        cl = exec_cmd_list(channel, cmd, 3)
        for item in cl:
            if not re.search('0:.*1:', item):
                continue
            sub_node = SubElement(node, 'item')
            sub_node.text = self.rep_control(item)
        return

    def get_other(self, channel, node):
        node.text = ""
        cmd_lh = ["ls -l /etc/passwd\n", "ls -l /etc/group\n", "ls -l /etc/shadow\n", "ls -l /var/log/messages\n"]
        for cmd in cmd_lh:
            cl = exec_cmd_string(channel, cmd, 1)
            if re.search('ls', cl):
                continue
            node.text = node.text + cl + "\n"
        return

    def get_weblogic(self, channel, node):
        recv_buf = ""
        exe = "weblogic.Server"
        proc_list = dict()
        cmd = "ps -eo pid,ppid,ruser=user12345678901234567890,args --no-headers|grep --color=never '%s'|grep --color=never -v grep\n" % exe
        rel = exec_cmd_list(channel, cmd, 5)
        catalina = ""
        version = ""
        port_list = dict()

        for item in rel:
            line = item.split()
            pid = line[0]
            ppid = line[1]
            user = line[2]
            if (len(ppid) == 0) or int(ppid) != 1:
                continue
            if not re.search(exe, item):
                continue
            sub_node = SubElement(node, 'node')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = "weblogic"
            version_node = SubElement(sub_node, 'version')
            args = line[3]
            java_path = args
            dhome = re.search('-Dweblogic.home=.* ', item).group().replace('-Dweblogic.home=', '').strip()
            cmd = "%s -cp %s/lib/weblogic.jar weblogic.version\n" % (java_path, dhome)
            recv_buf = exec_cmd_string_all(channel, cmd, 5)
            if re.search('WebLogic Server [0-9.]{1,20} ', recv_buf):
                version = re.search('WebLogic Server [0-9.]{1,20} ', recv_buf).group().strip()
            version_node.text = transfor("%s" % version)

            tcp4, tcp6, udp4, udp6 = self.get_apache_port_pid(channel, pid)
            for port in tcp4:
                sub_node1 = SubElement(sub_node, 'TCP4_PORT')
                sub_node1.text = port
                if port not in port_list:
                    port_list[port] = ""
            for port in tcp6:
                sub_node1 = SubElement(sub_node, 'TCP6_PORT')
                sub_node1.text = port
                if port not in port_list:
                    port_list[port] = ""
            for port in udp4:
                sub_node1 = SubElement(sub_node, 'UDP4_PORT')
                sub_node1.text = port
                if port not in port_list:
                    port_list[port] = ""
            for port in udp6:
                sub_node1 = SubElement(sub_node, 'UDP6_PORT')
                sub_node1.text = port
                if port not in port_list:
                    port_list[port] = ""
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = dhome
            sub_node1 = SubElement(sub_node, 'user')
            sub_node1.text = user
            sub_node1 = SubElement(sub_node, 'language')
            sub_node1.text = "JAVA"

            cmd = "ls -l --color=never %s/lib/*.jar\n" % dhome
            jar = exec_cmd_list(channel, cmd, 1)
            for jar_item in jar:
                jar_item1 = jar_item.split()[-1]
                sub_node1 = SubElement(sub_node, 'module')
                sub_node1.text = jar_item1.strip()

        return

    def get_websphere(self, channel, xml_node):
        recv_buf = ""
        exe = "weblogic.Server"
        proc_list = dict()
        cmd = "ps -eo pid,ppid,ruser=user12345678901234567890,args --no-headers|grep --color=never '%s'|grep --color=never -v grep\n" % exe
        rel = exec_cmd_list(channel, cmd, 5)
        catalina = ""
        version = ""
        port_list = dict()

        for item in rel:
            line = item.split()
            pid = line[0]
            ppid = line[1]
            user = line[2]
            if (len(ppid) == 0) or int(ppid) != 1:
                continue
            if not re.search(exe, item):
                continue
            sub_node1 = SubElement(xml_node, 'name')
            sub_node1.text = "weblogic"
            version_node = SubElement(xml_node, 'version')
            args = line[3]
            java_path = args
            dhome = re.search('-Dweblogic.home=.* ', item).group().replace('-Dweblogic.home=', '').strip()
            cmd = "%s -cp %s/lib/weblogic.jar weblogic.version\n" % (java_path, dhome)
            recv_buf = exec_cmd_string_all(channel, cmd, 5)
            if re.search('WebLogic Server [0-9.]{1,20} ', recv_buf):
                version = re.search('WebLogic Server [0-9.]{1,20} ', recv_buf).group().strip()
            version_node.text = transfor("%s" % version)

            tcp4, tcp6, udp4, udp6 = self.get_apache_port_pid(channel, pid)
            for port in tcp4:
                sub_node1 = SubElement(xml_node, 'TCP4_PORT')
                sub_node1.text = port
                if port not in port_list:
                    port_list[port] = ""
            for port in tcp6:
                sub_node1 = SubElement(xml_node, 'TCP6_PORT')
                sub_node1.text = port
                if port not in port_list:
                    port_list[port] = ""
            for port in udp4:
                sub_node1 = SubElement(xml_node, 'UDP4_PORT')
                sub_node1.text = port
                if port not in port_list:
                    port_list[port] = ""
            for port in udp6:
                sub_node1 = SubElement(xml_node, 'UDP6_PORT')
                sub_node1.text = port
                if port not in port_list:
                    port_list[port] = ""
            sub_node1 = SubElement(xml_node, 'path')
            sub_node1.text = dhome
            sub_node1 = SubElement(xml_node, 'user')
            sub_node1.text = user
            sub_node1 = SubElement(xml_node, 'language')
            sub_node1.text = "JAVA"

            cmd = "ls -l --color=never %s/lib/*.jar\n" % dhome
            jar = exec_cmd_list(channel, cmd, 1)
            for jar_item in jar:
                jar_item1 = jar_item.split()[-1]
                sub_node1 = SubElement(xml_node, 'module')
                sub_node1.text = jar_item1.strip()

        return

    def get_mongodb(self, channel, node):
        exe = "mongo"
        cmd = "ps -eo pid,ppid,ruser=user12345678901234567890,command --no-headers|grep --color=never %s|grep --color=never -v grep\n" % exe
        rel = exec_cmd_list(channel, cmd, 3)
        version = ""
        path = ""
        for item in rel:
            line = item.split()
            pid = line[0]
            ppid = line[1]
            user = line[2]
            exe_path = line[3]
            if (len(ppid) == 0) or int(ppid) != 1:
                continue
            if not re.search("mongod", exe_path, re.I):
                continue
            sub_node = SubElement(node, 'node')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = "MongoDB"
            sub_node1 = SubElement(sub_node, 'version')
            cmd = "%s -version\n" % exe_path
            db_str = exec_cmd_string_all(channel, cmd, 5)
            if re.search("[0-9]{1,2}.[0-9]{1,3}.[0-9]{1,3}", db_str):
                version = re.search("[0-9]{1,2}.[0-9]{1,3}.[0-9]{1,3}", db_str).group()
            sub_node1.text = transfor(version)

            tcp4, tcp6, udp4, udp6 = self.get_apache_port_pid(channel, pid)
            for port in tcp4:
                sub_node1 = SubElement(sub_node, 'TCP4_PORT')
                sub_node1.text = port
            for port in tcp6:
                sub_node1 = SubElement(sub_node, 'TCP6_PORT')
                sub_node1.text = port
            for port in udp4:
                sub_node1 = SubElement(sub_node, 'UDP4_PORT')
                sub_node1.text = port
            for port in udp6:
                sub_node1 = SubElement(sub_node, 'UDP6_PORT')
                sub_node1.text = port
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = exe_path
            sub_node1 = SubElement(sub_node, 'user')
            sub_node1.text = user

        return

    def get_redis(self, channel, node):
        exe = "redis-server"
        cmd = "ps -eo pid,ppid,ruser=user12345678901234567890,command --no-headers|grep --color=never %s|grep --color=never -v grep\n" % exe
        rel = exec_cmd_list(channel, cmd, 10)
        version = ""
        path = ""
        for item in rel:
            line = item.split()
            pid = line[0]
            ppid = line[1]
            user = line[2]
            exe_path_old = line[3]
            # if (len(ppid) == 0) or int(ppid) != 1:
            #    continue
            sub_node = SubElement(node, 'node')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = "redis"
            cmd = "ls -l --color=never /proc/%s/exe \n" % pid
            detail = exec_cmd_string(channel, cmd, 3)
            # LDY modify in 20220121 for guizhou add path from "ps -eo"  for "exe_path"
            if re.search('->', detail):
                exe_path = detail.split('->')[1]
            else:
                exe_path = exe_path_old

            sub_node1 = SubElement(sub_node, 'version')
            cmd = "%s -v\n" % exe_path

            db_str = exec_cmd_string_all(channel, cmd, 5)
            if re.search("Redis server v=[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}", db_str):
                version = re.search("[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}", db_str).group()
            version = "redis %s" % version
            sub_node1.text = transfor(version)

            tcp4, tcp6, udp4, udp6 = self.get_apache_port_pid(channel, pid)
            for port in tcp4:
                sub_node1 = SubElement(sub_node, 'TCP4_PORT')
                sub_node1.text = port
            for port in tcp6:
                sub_node1 = SubElement(sub_node, 'TCP6_PORT')
                sub_node1.text = port
            for port in udp4:
                sub_node1 = SubElement(sub_node, 'UDP4_PORT')
                sub_node1.text = port
            for port in udp6:
                sub_node1 = SubElement(sub_node, 'UDP6_PORT')
                sub_node1.text = port
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = exe_path
            sub_node1 = SubElement(sub_node, 'user')
            sub_node1.text = user

        return

    def get_middleware(self, channel, node):
        # mid_node = node.find(node, 'node')
        try:
            self.get_weblogic(channel, node)
        except Exception as e:
            log_info("get_weblogic:[%s]\n" % (traceback.format_exc()))

        try:
            self.get_redis(channel, node)
        except Exception as e:
            log_info("get_redis:[%s]\n" % (traceback.format_exc()))
        return

    def get_database(self, channel, node):
        mid_node = SubElement(node, 'node')

        try:
            self.get_mongodb(channel, mid_node)
        except Exception as e:
            log_info("get_mongodb:[%s]\n" % (traceback.format_exc()))

        return

    def get_info(self, channel):
        # print "redhat-7\n"
        OldLang = ""
        get_lang(channel)
        global root
        global querytype
        try:
            node = SubElement(root, 'dev')
            querytype = "get_hostname"
            self.get_hostname(channel, node)
        except Exception as e:
            log_info("get_hostname:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'dev_type')
            querytype = "get_hosttype"
            self.get_hosttype(channel, node)
        except Exception as e:
            log_info("get_hosttype:[%s]\n" % (traceback.format_exc()))
            pass
        try:
            node = SubElement(root, 'net')
            querytype = "get_net"
            self.get_net(channel, node)
        except Exception as e:
            log_info("get_net:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'os')
            querytype = "get_os"
            self.get_os(channel, node)
        except Exception as e:
            log_info("get_os:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'patchlist')
            querytype = "get_patch"
            self.get_patch(channel, node)
        except Exception as e:
            log_info("get_patch:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'kernel')
            querytype = "get_core"
            self.get_core(channel, node)
        except Exception as e:
            log_info("get_core:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'iplist')
        # self.get_iplist(channel, node)
        except Exception as e:
            log_info("get_iplist:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'natiplist')
        # self.get_nat(channel, node)
        except Exception as e:
            log_info("get_nat:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'PORTLIST')
            querytype = "get_port"
            self.get_port(channel, node)
        except Exception as e:
            log_info("get_port:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'proc_info')
            querytype = "get_proc"
            self.get_proc(channel, node)
        except Exception as e:
            log_info("get_proc_redhat:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'apache')
            querytype = "get_apache"
            self.get_apache(channel, node)
        except Exception as e:
            log_info("get_apache:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'tomcat')
            querytype = "get_tomcat"
            self.get_tomcat(channel, node)
        except Exception as e:
            log_info("get_tomcat:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'oracle')
            querytype = "get_oracle"
            self.get_oracle(channel, node)
        except Exception as e:
            log_info("get_oracle:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'mysql')
            querytype = "get_mysql"
            self.get_mysql(channel, node)
        except Exception as e:
            log_info("get_mysql:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'postgresql')
            querytype = "get_pgsql"
            self.get_pgsql(channel, node)
        except Exception as e:
            log_info("get_pgsql:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'start')
        # self.get_start(channel, node)
        except Exception as e:
            log_info("get_start:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'other')
        # self.get_other(channel, node)
        except Exception as e:
            log_info("get_other:[%s]\n" % (traceback.format_exc()))

        try:
            node = root.find('tomcat')
            querytype = "get_middleware"
            self.get_middleware(channel, node)
        except Exception as e:
            log_info("get_middleware:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'database')
            querytype = "get_database"
            self.get_database(channel, node)
        except Exception as e:
            log_info("get_database:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'fastjson')
            # querytype = "get_database"
            self.get_java_depth(channel, node, 'fastjson')
        except Exception as e:
            log_info("fastjson:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'spring-cloud')
            self.get_java_depth(channel, node, 'spring-cloud')
        except Exception as e:
            log_info("spring-cloud:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'spring-webmvc')
            self.get_java_depth(channel, node, 'spring-webmvc')
        except Exception as e:
            log_info("spring-webmvc:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'dubbo')
            self.get_java_depth(channel, node, 'dubbo')
        except Exception as e:
            log_info("dubbo:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'struts')
            self.get_java_depth(channel, node, 'struts')
        except Exception as e:
            log_info("struts:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'shiro')
            self.get_java_depth(channel, node, 'shiro')
        except Exception as e:
            log_info("shiro:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'openssl')
            self.get_openssl_info(channel, node)
        except Exception as e:
            log_info("openssl:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'polkit')
            self.get_polkit_info(channel, node)
        except Exception as e:
            log_info("polkit:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'k8s')
            self.get_k8s_info(channel, node)
        except Exception as e:
            log_info("k8s:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'zabbix')
            self.get_zabbix_info(channel, node)
        except Exception as e:
            log_info("zabbix:[%s]\n" % (traceback.format_exc()))
        return


class Ubuntu:
    Tool = Redhat()

    def __init__(self):
        self.app_dc = dict()

    def get_os(self, channel, node):
        version = ""
        cmd = "cat /etc/*release\n"
        detail = exec_cmd_string_all(channel, cmd, 2)
        if re.search('PRETTY_NAME="Ubuntu.*"', detail):
            aaa = re.search('PRETTY_NAME="Ubuntu.*"', detail).group()
            version = aaa.split('PRETTY_NAME="')[1].replace('"', '')
        if re.search('DISTRIB_DESCRIPTION="Ubuntu.*"', detail):
            aaa = re.search('DISTRIB_DESCRIPTION="Ubuntu.*"', detail).group()
            version = aaa.split('DISTRIB_DESCRIPTION="')[1].replace('"', '')
        if version:
            node.text = transfor(version)
        else:
            node.text = "Ubuntu UNKNOWN RELEASE"
        return

    def get_patch(self, channel, node):
        # LDY modify in 20220128 for wangzhen
        # cmd = "dpkg -l | grep --color=never patch | awk -F ' ' '{print $2}'\n"
        cmd = "dpkg -l\n"
        rel = exec_cmd_list(channel, cmd)
        for item in rel:
            sub_node = SubElement(node, 'patch')
            sub_node.text = item

        return

    def get_proc(self, channel, node):
        recv_buf = ""
        start_dc = dict()
        proc_list = dict()
        cmd = "ps -eo pid,ppid,ruser=user12345678901234567890,command --no-headers|grep --color=never -v \"ps -eo\"|grep --color=never -v grep\n"
        rel = exec_cmd_list(channel, cmd, 10)
        groups_list = dict()
        cmd = "ls -l --color=never /proc/*/exe\n"
        proc_result = exec_cmd_list(channel, cmd, 5)
        for item1 in proc_result:
            if re.match('ls:', item1):
                continue
            if re.search('->', item1):
                key = item1.split('/proc/')[1].split('/')[0]
                proc_list[key] = item1.replace('*', '')

        cmd = "ps -eo pid,lstart --no-headers|grep --color=never -v \"ps -eo\"|grep --color=never -v grep\n"
        start_list = exec_cmd_list(channel, cmd, 3)
        for item in start_list:
            line = item.split()
            pid = line[0]
            start_time = ' '.join(line[1:])
            start_dc[pid] = start_time

        for item in rel:
            line = item.split()

            pid = line[0]
            ppid = line[1]
            user = line[2]

            if (len(ppid) == 0) or int(ppid) == 0 or int(ppid) == 2:
                continue
            command = ' '.join(line[3:])

            command1 = command.split()[0].strip()
            if re.search('\[', command1):
                command = command1
            else:
                command = command1.split('/')[-1].strip(':')

            if pid not in proc_list:
                soft = ""
                path = ""
            else:
                soft = self.get_soft(channel, proc_list[pid])
                path = self.Tool.get_path(proc_list[pid])
            sub_node = SubElement(node, 'proc')
            sub_node1 = SubElement(sub_node, 'pid')
            sub_node1.text = pid
            sub_node1 = SubElement(sub_node, 'proc_name')
            sub_node1.text = command
            sub_node1 = SubElement(sub_node, 'soft')
            sub_node1.text = soft
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = path
            sub_node1 = SubElement(sub_node, 'args')
            sub_node1.text = self.Tool.get_proc_args(channel, item)
            sub_node1 = SubElement(sub_node, 'user')
            sub_node1.text = user

            if user not in groups_list:
                cmd = "groups %s|awk -F ':' '{print $2}'\n" % user
                groups = exec_cmd_string(channel, cmd).strip()
                groups_list[user] = groups

            sub_node1 = SubElement(sub_node, 'groups')
            sub_node1.text = groups_list.get(user)
            sub_node1 = SubElement(sub_node, 'creationDate')
            sub_node1.text = start_dc.get(pid, "")

        return

    def get_soft(self, channel, temp):
        rel = ""
        version = ""
        out = ""
        if re.search('->', temp):
            rel = temp.split('->')[-1].strip(' ')

        if re.search("postfix", rel):
            cmd = "dpkg -l | grep --color=never postfix|awk -F ' ' '{print $3}'|awk -F '-' '{print $1}'\n"
            version = exec_cmd_string(channel, cmd)
            out = "postfix %s" % version
        elif re.search("sshd", rel):
            cmd = "dpkg -l | grep --color=never \"openssh-server\"|awk -F ' ' '{print $3}'|awk -F ':'  '{print $2}'\n"
            version = exec_cmd_string(channel, cmd)
            out = "openssh %s" % version
        elif re.search("rsyslogd", rel):
            cmd = "%s -v|grep --color=never rsyslogd|awk -F ' ' '{print $2}'|awk -F '-' '{print $1}'\n" % rel
            version = exec_cmd_string(channel, cmd)
            if re.search(',', version):
                version = ""
            else:
                version = version.split(',')[0]
            out = "rsyslogd %s" % version
        elif re.search("vsftpd", rel):
            cmd = "dpkg -l | grep --color=never \"vsftpd\" | awk -F ' ' '{print $3}'|awk -F '-'  '{print $1}'\n"
            version = exec_cmd_string(channel, cmd)
            out = "vsftpd %s" % version
        elif re.search("snmpd", rel):
            cmd = "%s -v|grep --color=never version\n" % rel
            version = exec_cmd_string(channel, cmd)
            if not re.search(':', version):
                version = ""
            else:
                version = version.split(':')[-1].replace(' ', '')
            out = "snmpd %s" % version
        elif re.search("named", rel):
            cmd = "%s -v|awk -F '-' '{print $1}'\n" % rel
            version = exec_cmd_string(channel, cmd)
            if version:
                version = ""
            else:
                version = version.split('')[-1]
            out = "named %s" % version
        elif re.search("ntpd", rel):
            cmd = "dpkg -l |grep --color=never \"ntpd\"|awk -F ':' '{print $2}'| awk -F ' ' '{print $1}'\n"
            version = exec_cmd_string(channel, cmd)
            out = "ntpd %s" % version
        elif re.search("smbd", rel) or re.search("nmbd", rel):
            cmd = "%s -V|awk -F ' ' '{print $NF}'\n" % rel
            version = exec_cmd_string(channel, cmd)
            out = "SMB %s" % version

        return out

    def get_apache(self, channel, node):
        recv_buf = ""
        exe = "apache2"
        proc_list = dict()
        cmd = "ps -eo pid,ppid,ruser=user12345678901234567890,command --no-headers|grep --color=never %s|grep --color=never -v grep\n" % exe
        rel = exec_cmd_list(channel, cmd, 5)

        # print len(rel)
        for item in rel:
            line = item.split()
            pid = line[0]
            ppid = line[1]
            user = line[2]

            if (len(ppid) == 0) or int(ppid) != 1:
                continue

            sub_node = SubElement(node, 'node')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = "apache"

            cmd = "ls -l --color=never /proc/%s/exe\n" % pid
            abs_exe = exec_cmd_string(channel, cmd)
            if not re.search('->', abs_exe):
                continue
            abs_exe = abs_exe.split('->')[1].strip()

            tmp = abs_exe.split('/')[:-2]
            path = '/'.join(tmp)

            cmd = "%s -v|grep --color=never \"Server version: Apache/\"\n" % abs_exe
            version = exec_cmd_string(channel, cmd)
            if re.search("Server version", version):
                version = version.split('/')[1].split()[0]
            else:
                version = ""
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = ("apache %s" % transfor(version))

            tcp4, tcp6, udp4, udp6 = self.Tool.get_apache_port_pid(channel, pid)
            for port in tcp4:
                sub_node1 = SubElement(sub_node, 'TCP4_PORT')
                sub_node1.text = port
            for port in tcp6:
                sub_node1 = SubElement(sub_node, 'TCP6_PORT')
                sub_node1.text = port
            for port in udp4:
                sub_node1 = SubElement(sub_node, 'UDP4_PORT')
                sub_node1.text = port
            for port in udp6:
                sub_node1 = SubElement(sub_node, 'UDP6_PORT')
                sub_node1.text = port
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = path
            sub_node1 = SubElement(sub_node, 'user')
            sub_node1.text = user
            sub_node1 = SubElement(sub_node, 'language')
            sub_node1.text = "C"

            cmd = "%s -l|grep --color=never -v \"Compiled in modules:\"\n" % abs_exe
            modules = exec_cmd_list(channel, cmd)
            for module in modules:
                sub_node1 = SubElement(sub_node, 'module')
                sub_node1.text = module.strip()

        return

    def get_start_level(self, channel, level):
        recv_buf = ""
        rc = dict()
        cmd = "ls -l /etc/rc%d.d\n" % level
        dl = exec_cmd_list(channel, cmd, 3)

        for item in dl:
            if re.search('[SK][0-9][0-9]', item):
                app_start = item.split('->')[0].split()[-1]
                app = app_start[3:]
                start = app_start[0]
                if start == 'S':
                    start = 'on'
                else:
                    start = 'off'

                rc[app] = start
                if app not in self.app_dc:
                    self.app_dc[app] = ""

        return rc

    def get_start(self, channel, node):
        recv_buf = ""
        rc0 = self.get_start_level(channel, 0)
        rc1 = self.get_start_level(channel, 1)
        rc2 = self.get_start_level(channel, 2)
        rc3 = self.get_start_level(channel, 3)
        rc4 = self.get_start_level(channel, 4)
        rc5 = self.get_start_level(channel, 5)
        rc6 = self.get_start_level(channel, 6)

        for key in list(self.app_dc.keys()):
            sub_node = SubElement(node, "item")
            item = "%s    0:%s   1:%s   2:%s    3:%s    4:%s    5:%s    6:%s" % (
                key, rc0.get(key, "off"), rc1.get(key, "off"), rc2.get(key, "off"),
                rc3.get(key, "off"), rc4.get(key, "off"), rc5.get(key, "off"), rc6.get(key, "off"))
            sub_node.text = item
        return

    def get_info(self, channel):
        # print "ubuntu-18\n"
        OldLang = ""
        get_lang(channel)
        global root
        try:
            node = SubElement(root, 'dev')
            self.Tool.get_hostname(channel, node)
        except Exception as e:
            log_info("ubuntu get_hostname:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'dev_type')
            self.Tool.get_hosttype(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            pass
        try:
            node = SubElement(root, 'net')
            self.Tool.get_net(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            pass

        try:
            node = SubElement(root, 'os')
            self.get_os(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            pass
        try:
            node = SubElement(root, 'patchlist')
            self.get_patch(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            pass
        try:
            node = SubElement(root, 'iplist')
        # self.Tool.get_iplist(channel, node)
        except Exception as e:
            log_info("get_iplist:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'natiplist')
        # self.Tool.get_nat(channel, node)
        except Exception as e:
            log_info("get_nat:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'kernel')
            self.Tool.get_core(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            pass

        try:
            node = SubElement(root, 'PORTLIST')
            self.Tool.get_port(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            pass
        try:
            node = SubElement(root, 'proc_info')
            self.get_proc(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            pass
        try:
            node = SubElement(root, 'apache')
            self.get_apache(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            pass
        try:
            node = SubElement(root, 'tomcat')
            self.Tool.get_tomcat(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            pass
        try:
            node = SubElement(root, 'oracle')
            self.Tool.get_oracle(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            pass

        try:
            node = SubElement(root, 'mysql')
            self.Tool.get_mysql(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            pass

        try:
            node = SubElement(root, 'postgresql')
            self.Tool.get_pgsql(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            pass

        try:
            node = SubElement(root, 'start')
        # self.get_start(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            pass
        try:
            node = SubElement(root, 'other')
        # self.Tool.get_other(channel, node)
        except Exception as e:
            log_info("get_other:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'fastjson')
            # querytype = "get_database"
            self.Tool.get_java_depth(channel, node, 'fastjson')
        except Exception as e:
            log_info("fastjson:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'spring-cloud')
            self.Tool.get_java_depth(channel, node, 'spring-cloud')

        except Exception as e:
            log_info("spring-cloud:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'spring-webmvc')
            self.Tool.get_java_depth(channel, node, 'spring-webmvc')
        except Exception as e:
            log_info("spring-webmvc:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'dubbo')
            self.Tool.get_java_depth(channel, node, 'dubbo')
        except Exception as e:
            log_info("dubbo:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'struts')
            self.Tool.get_java_depth(channel, node, 'struts')
        except Exception as e:
            log_info("struts:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'shiro')
            self.Tool.get_java_depth(channel, node, 'shiro')
        except Exception as e:
            log_info("shiro:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'openssl')
            self.Tool.get_openssl_info(channel, node)
        except Exception as e:
            log_info("openssl:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'polkit')
            self.Tool.get_polkit_info(channel, node)
        except Exception as e:
            log_info("polkit:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'k8s')
            self.Tool.get_k8s_info(channel, node)
        except Exception as e:
            log_info("k8s:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'zabbix')
            self.Tool.get_zabbix_info(channel, node)
        except Exception as e:
            log_info("zabbix:[%s]\n" % (traceback.format_exc()))
        return


class Debian:
    Tool = Redhat()

    def __init__(self):
        self.app_dc = dict()

    def get_os(self, channel, node):
        version = ""
        cmd = "cat /etc/os-release\n"
        detail = exec_cmd_string_all(channel, cmd, 2)
        if re.search('PRETTY_NAME="Debian.*"', detail):
            aaa = re.search('PRETTY_NAME="Debian.*"', detail).group()
            version = aaa.split('PRETTY_NAME="')[1].replace('"', '')
        if version:
            node.text = transfor(version)
        else:
            node.text = "Debian UNKNOWN RELEASE"
        return

    def get_patch(self, channel, node):
        cmd = "dpkg -l | grep --color=never patch | awk -F ' ' '{print $2}'\n"
        rel = exec_cmd_list(channel, cmd)
        for item in rel:
            sub_node = SubElement(node, 'patch')
            sub_node.text = item

        return

    def get_proc(self, channel, node):
        recv_buf = ""
        start_dc = dict()
        proc_list = dict()
        cmd = "ps -eo pid,ppid,ruser=user12345678901234567890,command --no-headers|grep --color=never -v \"ps -eo\"|grep --color=never -v grep\n"
        rel = exec_cmd_list(channel, cmd, 10)
        groups_list = dict()
        cmd = "ls -l --color=never /proc/*/exe\n"
        proc_result = exec_cmd_list(channel, cmd, 5)
        for item1 in proc_result:
            if re.match('ls:', item1):
                continue
            if re.search('->', item1):
                key = item1.split('/proc/')[1].split('/')[0]
                proc_list[key] = item1.replace('*', '')

        cmd = "ps -eo pid,lstart --no-headers|grep --color=never -v \"ps -eo\"|grep --color=never -v grep\n"
        # LDY modify in 20220128 for guizhou modify duration 3 to 10
        start_list = exec_cmd_list(channel, cmd, 10)
        for item in start_list:
            line = item.split()
            pid = line[0]
            start_time = ' '.join(line[1:])
            start_dc[pid] = start_time

        for item in rel:
            line = item.split()

            pid = line[0]
            ppid = line[1]
            user = line[2]

            if (len(ppid) == 0) or int(ppid) == 0 or int(ppid) == 2:
                continue
            command = ' '.join(line[3:])

            command1 = command.split()[0].strip()
            if re.search('\[', command1):
                command = command1
            else:
                command = command1.split('/')[-1].strip(':')

            if pid not in proc_list:
                soft = ""
                path = ""
            else:
                soft = self.get_soft(channel, proc_list[pid])
                path = self.Tool.get_path(proc_list[pid])
            sub_node = SubElement(node, 'proc')
            sub_node1 = SubElement(sub_node, 'pid')
            sub_node1.text = pid
            sub_node1 = SubElement(sub_node, 'proc_name')
            sub_node1.text = command
            sub_node1 = SubElement(sub_node, 'soft')
            sub_node1.text = soft
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = path
            sub_node1 = SubElement(sub_node, 'args')
            sub_node1.text = self.Tool.get_proc_args(channel, item)
            sub_node1 = SubElement(sub_node, 'user')
            sub_node1.text = user

            if user not in groups_list:
                cmd = "groups %s|awk -F ':' '{print $2}'\n" % user
                groups = exec_cmd_string(channel, cmd).strip()
                groups_list[user] = groups

            sub_node1 = SubElement(sub_node, 'groups')
            sub_node1.text = groups_list.get(user)
            sub_node1 = SubElement(sub_node, 'creationDate')
            sub_node1.text = start_dc.get(pid, "")

        return

    def get_soft(self, channel, temp):
        rel = ""
        version = ""
        out = ""
        if re.search('->', temp):
            rel = temp.split('->')[-1].strip(' ')

        if re.search("postfix", rel):
            cmd = "dpkg -l | grep --color=never postfix|awk -F ' ' '{print $3}'|awk -F '-' '{print $1}'\n"
            version = exec_cmd_string(channel, cmd)
            out = "postfix %s" % version
        elif re.search("sshd", rel):
            cmd = "dpkg -l | grep --color=never \"openssh-server\"|awk -F ' ' '{print $3}'|awk -F ':'  '{print $2}'\n"
            version = exec_cmd_string(channel, cmd)
            out = "openssh %s" % version
        elif re.search("rsyslogd", rel):
            cmd = "%s -v|grep --color=never rsyslogd|awk -F ' ' '{print $2}'|awk -F '-' '{print $1}'\n" % rel
            version = exec_cmd_string(channel, cmd)
            if re.search(',', version):
                version = ""
            else:
                version = version.split(',')[0]
            out = "rsyslogd %s" % version
        elif re.search("vsftpd", rel):
            cmd = "dpkg -l | grep --color=never \"vsftpd\" | awk -F ' ' '{print $3}'|awk -F '-'  '{print $1}'\n"
            version = exec_cmd_string(channel, cmd)
            out = "vsftpd %s" % version
        elif re.search("snmpd", rel):
            cmd = "%s -v|grep --color=never version\n" % rel
            version = exec_cmd_string(channel, cmd)
            if not re.search(':', version):
                version = ""
            else:
                version = version.split(':')[-1].replace(' ', '')
            out = "snmpd %s" % version
        elif re.search("named", rel):
            cmd = "%s -v|awk -F '-' '{print $1}'\n" % rel
            version = exec_cmd_string(channel, cmd)
            if version:
                version = ""
            else:
                version = version.split('')[-1]
            out = "named %s" % version
        elif re.search("ntpd", rel):
            cmd = "dpkg -l |grep --color=never \"ntpd\"|awk -F ':' '{print $2}'| awk -F ' ' '{print $1}'\n"
            version = exec_cmd_string(channel, cmd)
            out = "ntpd %s" % version
        elif re.search("smbd", rel) or re.search("nmbd", rel):
            cmd = "%s -V|awk -F ' ' '{print $NF}'\n" % rel
            version = exec_cmd_string(channel, cmd)
            out = "SMB %s" % version

        return out

    def get_apache(self, channel, node):
        recv_buf = ""
        exe = "apache2"
        proc_list = dict()
        cmd = "ps -eo pid,ppid,ruser=user12345678901234567890,command --no-headers|grep --color=never %s|grep --color=never -v grep\n" % exe
        rel = exec_cmd_list(channel, cmd, 5)

        # print len(rel)
        for item in rel:
            line = item.split()
            pid = line[0]
            ppid = line[1]
            user = line[2]

            if (len(ppid) == 0) or int(ppid) != 1:
                continue

            sub_node = SubElement(node, 'node')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = "apache"

            cmd = "ls -l --color=never /proc/%s/exe\n" % pid
            abs_exe = exec_cmd_string(channel, cmd)
            if not re.search('->', abs_exe):
                continue
            abs_exe = abs_exe.split('->')[1].strip()

            tmp = abs_exe.split('/')[:-2]
            path = '/'.join(tmp)

            cmd = "%s -v|grep --color=never \"Server version: Apache/\"\n" % abs_exe
            version = exec_cmd_string(channel, cmd)
            if re.search("Server version", version):
                version = version.split('/')[1].split()[0]
            else:
                version = ""
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = ("apache %s" % transfor(version))

            tcp4, tcp6, udp4, udp6 = self.Tool.get_apache_port_pid(channel, pid)
            for port in tcp4:
                sub_node1 = SubElement(sub_node, 'TCP4_PORT')
                sub_node1.text = port
            for port in tcp6:
                sub_node1 = SubElement(sub_node, 'TCP6_PORT')
                sub_node1.text = port
            for port in udp4:
                sub_node1 = SubElement(sub_node, 'UDP4_PORT')
                sub_node1.text = port
            for port in udp6:
                sub_node1 = SubElement(sub_node, 'UDP6_PORT')
                sub_node1.text = port
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = path
            sub_node1 = SubElement(sub_node, 'user')
            sub_node1.text = user
            sub_node1 = SubElement(sub_node, 'language')
            sub_node1.text = "C"

            cmd = "%s -l|grep --color=never -v \"Compiled in modules:\"\n" % abs_exe
            modules = exec_cmd_list(channel, cmd)
            for module in modules:
                sub_node1 = SubElement(sub_node, 'module')
                sub_node1.text = module.strip()

        return

    def get_start_level(self, channel, level):
        recv_buf = ""
        rc = dict()
        cmd = "ls -l /etc/rc%d.d\n" % level
        dl = exec_cmd_list(channel, cmd, 3)

        for item in dl:
            if re.search('[SK][0-9][0-9]', item):
                app_start = item.split('->')[0].split()[-1]
                app = app_start[3:]
                start = app_start[0]
                if start == 'S':
                    start = 'on'
                else:
                    start = 'off'

                rc[app] = start
                if app not in self.app_dc:
                    self.app_dc[app] = ""

        return rc

    def get_start(self, channel, node):
        recv_buf = ""
        rc0 = self.get_start_level(channel, 0)
        rc1 = self.get_start_level(channel, 1)
        rc2 = self.get_start_level(channel, 2)
        rc3 = self.get_start_level(channel, 3)
        rc4 = self.get_start_level(channel, 4)
        rc5 = self.get_start_level(channel, 5)
        rc6 = self.get_start_level(channel, 6)

        for key in list(self.app_dc.keys()):
            sub_node = SubElement(node, "item")
            item = "%s    0:%s   1:%s   2:%s    3:%s    4:%s    5:%s    6:%s" % (
                key, rc0.get(key, "off"), rc1.get(key, "off"), rc2.get(key, "off"),
                rc3.get(key, "off"), rc4.get(key, "off"), rc5.get(key, "off"), rc6.get(key, "off"))
            sub_node.text = item
        return

    def get_info(self, channel):
        # print "Debian-10\n"
        OldLang = ""
        get_lang(channel)
        global root
        try:
            node = SubElement(root, 'dev')
            self.Tool.get_hostname(channel, node)
        except Exception as e:
            log_info("Debian get_hostname:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'dev_type')
            self.Tool.get_hosttype(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            pass
        try:
            node = SubElement(root, 'net')
            self.Tool.get_net(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            pass

        try:
            node = SubElement(root, 'os')
            self.get_os(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            pass
        try:
            node = SubElement(root, 'patchlist')
            self.get_patch(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            pass
        try:
            node = SubElement(root, 'iplist')
        # self.Tool.get_iplist(channel, node)
        except Exception as e:
            log_info("get_iplist:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'natiplist')
        # self.Tool.get_nat(channel, node)
        except Exception as e:
            log_info("get_nat:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'kernel')
            self.Tool.get_core(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            pass

        try:
            node = SubElement(root, 'PORTLIST')
            self.Tool.get_port(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            pass
        try:
            node = SubElement(root, 'proc_info')
            self.get_proc(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            pass
        try:
            node = SubElement(root, 'apache')
            self.get_apache(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            pass
        try:
            node = SubElement(root, 'tomcat')
            self.Tool.get_tomcat(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            pass
        try:
            node = SubElement(root, 'oracle')
            self.Tool.get_oracle(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            pass

        try:
            node = SubElement(root, 'mysql')
            self.Tool.get_mysql(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            pass

        try:
            node = SubElement(root, 'postgresql')
            self.Tool.get_pgsql(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            pass

        try:
            node = SubElement(root, 'start')
        # self.get_start(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            pass
        try:
            node = SubElement(root, 'other')
        # self.Tool.get_other(channel, node)
        except Exception as e:
            log_info("get_other:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'fastjson')
            # querytype = "get_database"
            self.Tool.get_java_depth(channel, node, 'fastjson')
        except Exception as e:
            log_info("fastjson:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'spring-cloud')
            self.Tool.get_java_depth(channel, node, 'spring-cloud')

        except Exception as e:
            log_info("spring-cloud:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'spring-webmvc')
            self.Tool.get_java_depth(channel, node, 'spring-webmvc')
        except Exception as e:
            log_info("spring-webmvc:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'dubbo')
            self.Tool.get_java_depth(channel, node, 'dubbo')
        except Exception as e:
            log_info("dubbo:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'struts')
            self.Tool.get_java_depth(channel, node, 'struts')
        except Exception as e:
            log_info("struts:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'shiro')
            self.Tool.get_java_depth(channel, node, 'shiro')
        except Exception as e:
            log_info("shiro:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'openssl')
            self.Tool.get_openssl_info(channel, node)
        except Exception as e:
            log_info("openssl:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'polkit')
            self.Tool.get_polkit_info(channel, node)
        except Exception as e:
            log_info("polkit:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'k8s')
            self.Tool.get_k8s_info(channel, node)
        except Exception as e:
            log_info("k8s:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'zabbix')
            self.Tool.get_zabbix_info(channel, node)
        except Exception as e:
            log_info("zabbix:[%s]\n" % (traceback.format_exc()))
        return


class Suse:
    Tool = Redhat()

    def __init__(self):
        pass

    def get_os(self, channel, os_node):
        cmd = "lsb_release -a\n"
        os_buf = ""
        detail = exec_cmd_string_all(channel, cmd, 10).strip('"')
        send_break(channel, detail)
        if re.search('SUSE Linux Enterprise Server .*', detail, re.I):
            os_buf = re.search('SUSE Linux Enterprise Server .*', detail, re.I).group()
            os_node.text = transfor(os_buf.replace('"', '')).strip()
            return
        cmd = "cat /etc/*release\n"
        detail = exec_cmd_string_all(channel, cmd, 10)
        if re.search('SUSE Linux Enterprise Server .*', detail, re.I):
            os_buf = re.search('SUSE Linux Enterprise Server .*', detail, re.I).group()
            os_node.text = transfor(os_buf.replace('"', '')).strip()
            return
        if re.search('PRETTY_NAME.*', detail, re.I):
            # os_buf = re.search('SUSE Linux Enterprise Server .*', detail, re.I).group()
            # os_node.text = transfor(os_buf.replace('"', '')).strip()
            tem_info = re.search('PRETTY_NAME=.*', rel).group()
            os = re.findall('\"(.+?)\"', tem_info)[0]
            os_node.text = os
            return

        os_node.text = "SUSE UNKNOWN RELEASE"
        return

    def get_info(self, channel):
        # print "suse-12\n"
        OldLang = ""

        get_lang(channel)
        try:
            node = SubElement(root, 'dev')
            self.Tool.get_hostname(channel, node)
        except Exception as e:
            log_info("get_hostname:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'dev_type')
            self.Tool.get_hosttype(channel, node)
        except Exception as e:
            log_info("get_hosttype:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'net')
            self.Tool.get_net(channel, node)
        except Exception as e:
            log_info("get_net:[%s]\n" % (traceback.format_exc()))

        try:
            os_node = SubElement(root, 'os')
            self.get_os(channel, os_node)
        except Exception as e:
            log_info("get_os:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'patchlist')
            self.Tool.get_patch(channel, node)
        except Exception as e:
            log_info("get_patch:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'iplist')
        # self.Tool.get_iplist(channel, node)
        except Exception as e:
            log_info("get_iplist:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'natiplist')
        # self.Tool.get_nat(channel, node)
        except Exception as e:
            log_info("get_nat:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'kernel')
            self.Tool.get_core(channel, node)
        except Exception as e:
            log_info("get_core:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'PORTLIST')
            self.Tool.get_port(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            log_info("get_port_service:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'proc_info')
            self.Tool.get_proc(channel, node)
        except Exception as e:
            log_info("get_proc:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'apache')
            self.Tool.get_apache(channel, node)
        except Exception as e:
            log_info("get_apache:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'tomcat')
            self.Tool.get_tomcat(channel, node)
        except Exception as e:
            log_info("get_tomcat:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'oracle')
            self.Tool.get_oracle(channel, node)
        except Exception as e:
            log_info("get_oracle:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'mysql')
            self.Tool.get_mysql(channel, node)
        except Exception as e:
            log_info("get_mysql:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'postgresql')
            self.Tool.get_pgsql(channel, node)
        except Exception as e:
            log_info("get_pgsql:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'start')
        # self.Tool.get_start(channel, node)
        except Exception as e:
            log_info("get_start:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'other')
        # self.Tool.get_other(channel, node)
        except Exception as e:
            log_info("get_other:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'fastjson')
            # querytype = "get_database"
            self.Tool.get_java_depth(channel, node, 'fastjson')
        except Exception as e:
            log_info("fastjson:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'spring-cloud')
            self.Tool.get_java_depth(channel, node, 'spring-cloud')

        except Exception as e:
            log_info("spring-cloud:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'spring-webmvc')
            self.Tool.get_java_depth(channel, node, 'spring-webmvc')
        except Exception as e:
            log_info("spring-webmvc:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'dubbo')
            self.Tool.get_java_depth(channel, node, 'dubbo')
        except Exception as e:
            log_info("dubbo:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'struts')
            self.Tool.get_java_depth(channel, node, 'struts')
        except Exception as e:
            log_info("struts:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'shiro')
            self.Tool.get_java_depth(channel, node, 'shiro')
        except Exception as e:
            log_info("shiro:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'openssl')
            self.Tool.get_openssl_info(channel, node)
        except Exception as e:
            log_info("openssl:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'polkit')
            self.Tool.get_polkit_info(channel, node)
        except Exception as e:
            log_info("polkit:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'k8s')
            self.Tool.get_k8s_info(channel, node)
        except Exception as e:
            log_info("k8s:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'zabbix')
            self.Tool.get_zabbix_info(channel, node)
        except Exception as e:
            log_info("zabbix:[%s]\n" % (traceback.format_exc()))

        return


class Solaris:
    Tool = Redhat()

    def __init__(self):
        self.app_dc = dict()

    def get_net_list(self, channel):
        env_list = list()
        env_list1 = list()
        cmd = "dladm show-dev|grep ': up'| nawk -F ' ' '{print $1}'\n"  # solaris 10
        recv_buf = exec_cmd_string_all(channel, cmd, 20)
        if not re.search('Unrecognized subcommand', recv_buf):
            env_list1 = recv_buf.replace('\r', '').split('\n')
            if len(env_list1) > 2:
                env_list = env_list1[1:-1]
            return env_list

        cmd = "dladm show-phys|grep ' up '| nawk -F ' ' '{print $1}'\n"  # solaris 11
        recv_buf = exec_cmd_string_all(channel, cmd, 20)
        if not re.search('Unrecognized subcommand', recv_buf):
            env_list1 = recv_buf.replace('\r', '').split('\n')
            if len(env_list1) > 2:
                env_list = env_list1[1:-1]
            return env_list

    def get_net(self, channel, node):
        cmd = 'hostname\n'
        hostname_buf = exec_cmd_string(channel, cmd, 10, cmd)
        if hostname_buf in cmd:
            hostname_buf = ''

        # 网关
        cmd = "netstat -rn | grep default | awk '{print $2}'\n"
        gateway_buf = exec_cmd_list(channel, cmd, 3, cmd)
        ipv4_gateway_buf = ''
        ipv6_gateway_buf = ''
        if len(gateway_buf) > 0:
            for gateway in gateway_buf:
                if gateway == '0.0.0.0':
                    continue
                if IPy.IP(gateway).version() == 4:
                    ipv4_gateway_buf = gateway
                if IPy.IP(gateway).version() == 6:
                    ipv6_gateway_buf = gateway

        global ip
        recv_buf = ""
        env_sh = list()
        env_sh = self.get_net_list(channel)
        for item in env_sh:
            # print env_sh
            if re.search('docker|dladm|CLASS', item):
                continue
            sub_node = SubElement(node, 'eth')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = item

            # mac
            cmd = "netstat -p | grep %s | grep %s | awk '{print $5}'\n" % (hostname_buf, item)
            mac_buf = exec_cmd_string(channel, cmd, 5, cmd)
            if mac_buf in cmd:
                mac_buf = ''
            mac_node = SubElement(sub_node, 'mac')
            mac_node.text = mac_buf

            # ipv4
            cmd = "ipadm show-addr | grep v4 | grep %s | awk '{print $4}'\n" % item
            iplist = exec_cmd_list(channel, cmd, 5)
            if len(iplist) > 0:
                for ip4item in iplist:
                    if Tool().is_ip(ip4item):
                        ipv4node = SubElement(sub_node, 'ipv4')
                        # 地址
                        ipv4_add_node = SubElement(ipv4node, 'add')
                        ipv4_add_node.text = ip4item[0:ip4item.rfind('/')]
                        # 网关
                        ipv4_gateway_node = SubElement(ipv4node, 'gateway')
                        ipv4_gateway_node.text = ipv4_gateway_buf
                        # 掩码
                        ipv4_netmask_node = SubElement(ipv4node, 'netmask')
                        ipv4_netmask_node.text = netmaskOfIpv4(iplist[0])
                        if ip4item[0:ip4item.rfind('/')] == ip:
                            main_node = SubElement(node, 'main')
                            main_node.text = ip4item[0:ip4item.rfind('/')]

            # IPV6
            cmd = "ipadm show-addr | grep v6 | grep %s | awk '{print $4}'\n\n" % item
            iplist = exec_cmd_list(channel, cmd, 5)
            if len(iplist) > 0:
                for ip6item in iplist:
                    if Tool().is_ip(ip6item):
                        ipv6node = SubElement(node, 'ipv6')
                        # 地址
                        ipv6_add_node = SubElement(ipv6node, 'add')
                        ipv6_add_node.text = ip6item[0:ip6item.rfind('/')]
                        # 网关
                        ipv6_gateway_node = SubElement(ipv6node, 'gateway')
                        ipv6_gateway_node.text = ipv6_gateway_buf
                        # 掩码
                        ipv6_netmask_node = SubElement(ipv6node, 'netmask')
                        ipv6_netmask_node.text = netmaskOfIpv6(ip6item)
                        if ip6item[0:ip6item.rfind('/')] == ip:
                            main_node = SubElement(node, 'main')
                            main_node.text = ip6item[0:ip6item.rfind('/')]

            sub_node1 = SubElement(sub_node, 'territory')
            sub_node1.text = ""

        return

    def get_os(self, channel, node):
        # cmd = "cat /etc/release|grep  Solaris\n"
        os = ''
        cmd = "cat /etc/*release\n"
        rel = exec_cmd_string(channel, cmd, 10)
        log_info("solaris_os_rel:[%s]\n" % rel)
        if re.search('Oracle Solaris.*', rel, re.I):
            os = re.search('Oracle Solaris.*', rel, re.I).group().replace('\n', '')
            node.text = rel
            return
        if not os:
            cmd = "uname -srp\n"
            rel = exec_cmd_string(channel, cmd, 5)
            node.text = rel
        return

    def get_patch(self, channel, node):
        cmd = "showrev -p\n"
        rel = exec_cmd_list(channel, cmd, 60)
        for item in rel:
            if re.search('error', item):
                continue
            if re.match('Patch', item):
                item = item.split('Patch:')[1].strip().split()[0]
                sub_node = SubElement(node, 'patch')
                sub_node.text = item

        return

    def get_port(self, channel, node):
        # TCP4
        cmd = "netstat -P tcp -f inet -an|grep  LISTEN|nawk -F ' ' '{print $1}'|nawk -F '.' '{print $NF}'\n"
        rel = exec_cmd_list(channel, cmd, 5)
        for item in rel:
            # LDY modfiy in 20220127 remove:re.search
            # if re.search('LISTEN', item):
            sub_node = SubElement(node, 'TCP4_PORT')
            sub_node.text = item
        # TCP6
        cmd = "netstat -P tcp -f inet6 -an|grep LISTEN|nawk -F ' ' '{print $1}'|nawk -F '.' '{print $NF}'\n"
        rel = exec_cmd_list(channel, cmd, 5)
        for item in rel:
            # LDY modfiy in 20220127 remove:re.search
            # if re.search('LISTEN', item):
            sub_node = SubElement(node, 'TCP6_PORT')
            sub_node.text = item
        # UDP4
        cmd = "netstat -P udp -f inet -an|grep Idle|nawk -F ' ' '{print $1}'|nawk -F '.' '{print $NF}'\n"
        rel = exec_cmd_list(channel, cmd, 5)
        for item in rel:
            # LDY modfiy in 20220127 remove:re.search
            # if re.search('Idle', item):
            sub_node = SubElement(node, 'UDP4_PORT')
            sub_node.text = item
        # UDP6
        cmd = "netstat -P udp -f inet6 -an|grep Idle|nawk -F ' ' '{print $1}'|nawk -F '.' '{print $NF}'\n"
        rel = exec_cmd_list(channel, cmd, 5)
        for item in rel:
            # LDY modfiy in 20220127 remove:re.search
            # if re.search('Idle', item):
            sub_node = SubElement(node, 'UDP6_PORT')
            sub_node.text = item

        return

    def get_proc_args(self, channel, pid, name, args_map):
        args = ""
        args = args_map.get(pid)
        regex = "%s.*" % name
        args1 = ""
        if re.search(regex, args):
            args1 = re.search(regex, args).group().split(name)[1].strip()
        if args1:
            args = transfor(args1)
        else:
            args = ""
        return args

    def get_args_list(self, channel):
        args = list()
        temp_map = dict()
        cmd = "/usr/ucb/ps -auxwww | grep  -v grep| grep -v \"COMMAND\"\n"
        args = exec_cmd_list(channel, cmd, 10)
        for item in args:
            pid = item.split()[1]
            if pid in temp_map:
                continue
            temp_map[pid] = item

        return temp_map

    def get_comm_list(self, channel):
        args = list()
        temp_map = dict()
        cmd = "ps -eo pid,comm |grep -v \"COMMAND\"|grep  -v grep\n"
        args = exec_cmd_list(channel, cmd, 10)
        for item in args:
            pid = item.split()[0]
            if pid in temp_map:
                continue
            temp_map[pid] = ''.join(item.split()[1:])

        return temp_map

    def get_proc(self, channel, node):
        groups_list = dict()
        proc_name = ""
        path = ""
        proc_user = ""
        creationDate = ""
        ll = list()
        args_map = dict()
        comm_map = dict()
        args_map = self.get_args_list(channel)
        comm_map = self.get_comm_list(channel)
        cmd = "ps -eo pid,user,fname,stime\n"
        rel = exec_cmd_list(channel, cmd, 30)
        for item in rel:
            if re.search('PID|grep', item):
                continue
            item_list = item.split()
            if len(item_list) < 4:
                return
            pid = item_list[0]
            proc_name = item_list[2]
            path = comm_map.get(item_list[0])
            user = item_list[1]
            creationDate = item_list[3:]
            sub_node = SubElement(node, 'proc')
            sub_node1 = SubElement(sub_node, 'pid')
            sub_node1.text = pid
            sub_node1 = SubElement(sub_node, 'proc_name')
            sub_node1.text = proc_name
            sub_node1 = SubElement(sub_node, 'soft')
            sub_node1.text = ""
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = comm_map.get(pid)
            sub_node1 = SubElement(sub_node, 'args')
            sub_node1.text = self.get_proc_args(channel, pid, path, args_map)
            sub_node1 = SubElement(sub_node, 'user')
            sub_node1.text = user

            if user not in groups_list:
                cmd = "groups %s\n" % user
                groups = exec_cmd_string(channel, cmd).strip()
                if not re.search('groups:', groups):
                    groups_list[user] = groups

            sub_node1 = SubElement(sub_node, 'groups')
            sub_node1.text = groups_list.get(user)
            sub_node1 = SubElement(sub_node, 'creationDate')
            sub_node1.text = ' '.join(creationDate)

        return

    def get_apache(self, channel, node):
        recv_buf = ""
        exe = "httpd"
        comm = ""
        proc_list = dict()
        temp_list = list()
        cnt = ""
        cmd = "ps -eo pid,ppid,user,comm|grep %s\n" % exe
        rel = exec_cmd_list(channel, cmd, 5)

        # print len(rel)
        for item in rel:
            line = item.split()
            pid = line[0]
            ppid = line[1]
            user = line[2]
            comm = line[3]
            if (len(ppid) == 0) or int(ppid) != 1:
                continue
            if not re.search(exe, item):
                continue
            sub_node = SubElement(node, 'node')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = "apache"

            cmd = "%s -v|grep  \"Server version: Apache/\"|nawk -F '/' '{print $NF}'\n" % comm
            version = exec_cmd_string(channel, cmd)
            sub_node1 = SubElement(sub_node, 'version')
            sub_node1.text = ("apache %s" % version)
            # TCP4
            cmd = "pfiles /proc/%s |grep \"sockname: AF_INET \" |nawk -F ' ' '{print $NF}'\n" % pid
            temp_list = exec_cmd_list(channel, cmd)
            for port in temp_list:
                if port != '0':
                    cmd = "netstat -P tcp -f inet -an|grep LISTEN|grep -v grep|grep %s|wc -l\n" % port
                    cnt = exec_cmd_string(channel, cmd)
                    if cnt != '0':
                        sub_node1 = SubElement(sub_node, 'TCP4_PORT')
                        sub_node1.text = port
            # TCP6
            cmd = "pfiles /proc/%s |grep \"sockname: AF_INET6 \" |nawk -F ' ' '{print $NF}'\n" % pid
            temp_list = exec_cmd_list(channel, cmd)
            for port in temp_list:
                if port != '0':
                    cmd = "netstat -P tcp -f inet6 -an|grep --color=never LISTEN|grep  -v grep|grep  %s|wc -l\n" % port
                    cnt = exec_cmd_string(channel, cmd)
                    if cnt != '0':
                        sub_node1 = SubElement(sub_node, 'TCP6_PORT')
                        sub_node1.text = port
            ##UDP4
            cmd = "pfiles /proc/%s |grep  \"sockname: AF_INET \" |nawk -F ' ' '{print $NF}'\n" % pid
            temp_list = exec_cmd_list(channel, cmd)
            for port in temp_list:
                if port != '0':
                    cmd = "netstat -P udp -f inet -an|grep  LISTEN|grep  -v grep|grep  %s|wc -l\n" % port
                    cnt = exec_cmd_string(channel, cmd)
                    if cnt != '0':
                        sub_node1 = SubElement(sub_node, 'UDP4_PORT')
                        sub_node1.text = port
            ##UDP6
            cmd = "pfiles /proc/%s |grep \"sockname: AF_INET6 \" |nawk -F ' ' '{print $NF}'\n" % pid
            temp_list = exec_cmd_list(channel, cmd)
            for port in temp_list:
                if port != '0':
                    cmd = "netstat -P udp -f inet6 -an|grep  LISTEN|grep -v grep|grep  %s|wc -l\n" % port
                    cnt = exec_cmd_string(channel, cmd)
                    if cnt != '0':
                        sub_node1 = SubElement(sub_node, 'UDP6_PORT')
                        sub_node1.text = port
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = comm.split(exe)[0]
            sub_node1 = SubElement(sub_node, 'user')
            sub_node1.text = user
            sub_node1 = SubElement(sub_node, 'language')
            sub_node1.text = "C"

            cmd = "%s -l|grep -v \"Compiled in modules:\"\n" % comm
            modules = exec_cmd_list(channel, cmd)
            for module in modules:
                sub_node1 = SubElement(sub_node, 'module')
                sub_node1.text = module.strip()

        return

    def get_tomcat(self, channel, node):
        recv_buf = ""
        exe = "tomcat"
        comm = ""
        proc_list = dict()
        temp_list = list()
        cnt = ""
        tomcat_path = ""
        cmd = "ps -eo pid,ppid,user,comm,args | grep  %s\n" % exe
        rel = exec_cmd_list(channel, cmd, 5)

        for item in rel:
            line = item.split()
            pid = line[0]
            ppid = line[1]
            user = line[2]
            comm = line[3]
            detail = ""
            jar = ""
            version = ""
            tomcat_path = ""
            port_list = dict()
            if (len(ppid) == 0) or int(ppid) != 1:
                continue
            if not re.search(exe, item):
                continue
            sub_node = SubElement(node, 'node')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = "tomcat"

            cmd = "/usr/ucb/ps -auxwww %s | grep  -v grep| grep -v \"COMMAND\"\n" % pid
            detail = exec_cmd_string(channel, cmd, 3)
            if re.search('/usr/ucb/ps -auxwww', detail):
                tomcat_path = ""
            elif re.search('-Dcatalina.home=.* ', detail):
                tomcat_path = re.search('-Dcatalina.home=.*', detail).group().split()[0].split('-Dcatalina.home=')[
                    1].strip()
            elif re.search('-Djava.util.logging.config.file=.* ', detail):
                tomcat_path = re.search('-Djava.util.logging.config.file=.*', detail).group().split()[0].split(
                    '-Djava.util.logging.config.file=')[1].strip()
            if tomcat_path:
                cmd = "find %s -name catalina.jar\n" % tomcat_path
                jar = exec_cmd_string(channel, cmd)
                cmd = "%s  -classpath %s org.apache.catalina.util.ServerInfo |grep 'Server version:'|nawk -F '/' '{print $NF}'\n" % (
                    comm, jar)
                detail = exec_cmd_string(channel, cmd, 3)
                if re.search('org.apache.catalina.util.ServerInfo', detail):
                    version = ""
                else:
                    version = detail
            sub_node1 = SubElement(sub_node, 'version')
            sub_node1.text = transfor("tomcat %s" % version)
            # TCP4
            cmd = "pfiles /proc/%s |grep  \"sockname: AF_INET \" |nawk -F ' ' '{print $NF}'\n" % pid
            temp_list = exec_cmd_list(channel, cmd)
            for port in temp_list:
                if port != '0':
                    cmd = "netstat -P tcp -f inet -an|grep  LISTEN|grep -v grep|grep  %s|wc -l\n" % port
                    cnt = exec_cmd_string(channel, cmd)
                    if cnt != '0':
                        sub_node1 = SubElement(sub_node, 'TCP4_PORT')
                        sub_node1.text = port
                        if port not in port_list:
                            port_list[port] = ""
            ##TCP6
            cmd = "pfiles /proc/%s |grep \"sockname: AF_INET6 \" |nawk -F ' ' '{print $NF}'\n" % pid
            temp_list = exec_cmd_list(channel, cmd)
            for port in temp_list:
                if port != '0':
                    cmd = "netstat -P tcp -f inet6 -an|grep  LISTEN|grep  -v grep|grep  %s|wc -l\n" % port
                    cnt = exec_cmd_string(channel, cmd)
                    if cnt != '0':
                        sub_node1 = SubElement(sub_node, 'TCP6_PORT')
                        sub_node1.text = port
                        if port not in port_list:
                            port_list[port] = ""
            ##UDP4
            cmd = "pfiles /proc/%s |grep  \"sockname: AF_INET \" |nawk -F ' ' '{print $NF}'\n" % pid
            temp_list = exec_cmd_list(channel, cmd)
            for port in temp_list:
                if port != '0':
                    cmd = "netstat -P udp -f inet -an|grep LISTEN|grep  -v grep|grep  %s|wc -l\n" % port
                    cnt = exec_cmd_string(channel, cmd)
                    if cnt != '0':
                        sub_node1 = SubElement(sub_node, 'UDP4_PORT')
                        sub_node1.text = port
                        if port not in port_list:
                            port_list[port] = ""
            ##UDP6
            cmd = "pfiles /proc/%s |grep \"sockname: AF_INET6 \" |nawk -F ' ' '{print $NF}'\n" % pid
            temp_list = exec_cmd_list(channel, cmd)
            for port in temp_list:
                if port != '0':
                    cmd = "netstat -P udp -f inet6 -an|grep LISTEN|grep -v grep|grep %s|wc -l\n" % port
                    cnt = exec_cmd_string(channel, cmd)
                    if cnt != '0':
                        sub_node1 = SubElement(sub_node, 'UDP6_PORT')
                        sub_node1.text = port
                        if port not in port_list:
                            port_list[port] = ""
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = tomcat_path
            sub_node1 = SubElement(sub_node, 'user')
            sub_node1.text = user
            sub_node1 = SubElement(sub_node, 'language')
            sub_node1.text = "JAVA"

            jar_home = "%s/webapps/*/WEB-INF/lib/" % tomcat_path
            cmd = "ls -l %s/*.jar\n" % jar_home
            modules = exec_cmd_list(channel, cmd)
            for module in modules:
                if not re.search('.jar', module):
                    continue
                log_info("moudle:[%s]\n" % module)
                sub_node1 = SubElement(sub_node, 'module')
                sub_node1.text = module.split('.jar')[0].split('/')[-1].strip() + '.jar'
            webapp = ""
            appurl_node = SubElement(sub_node, 'appurl')
            weburl_node = SubElement(sub_node, 'weburl')

            cmd = "ls -l %s/webapps\n" % tomcat_path
            app_list = exec_cmd_list(channel, cmd, 3)
            weburl = ""
            for item in app_list:
                if not re.search('[rwx-]{9}', item):
                    continue
                app = ""
                bbbb = item.split()
                app = bbbb[-1]
                if re.search('.war', app):
                    continue

                web_app1 = "%s/webapps/%s" % (tomcat_path, app)
                webapp = "%s===%s" % (webapp, web_app1)
                for item1 in list(port_list.keys()):
                    url1 = ""
                    if re.match('^(8080|8889)$', item1):
                        url1 = "http://%s:%s/%s" % (g_ip, item1, app)
                        weburl = "%s===%s" % (weburl, url1)
                    elif re.match('^(8443)$', item1):
                        url1 = "https://%s:%s/%s" % (g_ip, item1, app)
                        weburl = "%s===%s" % (weburl, url1)

            appurl_node.text = webapp.strip('===')
            weburl_node.text = weburl.strip('===')

        return

    def get_oracle(self, channel, node):
        recv_buf = ""
        exe = "tnslsnr"
        pid = ""
        ppid = ""
        path = ""
        proc_list = dict()
        temp_list = list()
        cnt = ""
        tomcat_path = ""
        detail = ""
        cmd = "ps -eo pid,ppid,user,comm | grep %s\n" % exe
        rel = exec_cmd_list(channel, cmd)

        # print len(rel)
        for item in rel:
            line = item.split()
            if len(line) < 3:
                return
            pid = line[0]
            ppid = line[1]
            user = line[2]
            path = line[3].split(exe)[0]
            version = ""
            tomcat_path = ""
            if (len(ppid) == 0) or int(ppid) != 1:
                continue
            if not re.search(exe, item):
                continue
            sub_node = SubElement(node, 'node')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = "oracle"

            cmd = "su - %s -c \"lsnrctl status |grep 'TNSLSNR for Solaris: Version '\"\n" % user
            detail = exec_cmd_string(channel, cmd, 3)
            if re.search('su:', detail):
                version = ""
            if re.search('TNSLSNR for Solaris: Version', detail):
                version = detail.replace('\r', '').split('\n')[-2].split('TNSLSNR for Solaris: Version ')[1].split()[0]
            else:
                version = ""
            sub_node1 = SubElement(sub_node, 'version')
            sub_node1.text = transfor("oracle %s" % version.replace('"', ''))
            # TCP4
            cmd = "pfiles /proc/%s |grep \"sockname: AF_INET \" |nawk -F ' ' '{print $NF}'\n" % pid
            temp_list = exec_cmd_list(channel, cmd)
            for port in temp_list:
                if port != '0':
                    cmd = "netstat -P tcp -f inet -an|grep  LISTEN|grep -v grep|grep %s|wc -l\n" % port
                    cnt = exec_cmd_string(channel, cmd)
                    if cnt != '0':
                        sub_node1 = SubElement(sub_node, 'TCP4_PORT')
                        sub_node1.text = port
            ##TCP6
            cmd = "pfiles /proc/%s |grep \"sockname: AF_INET6 \" |nawk -F ' ' '{print $NF}'\n" % pid
            temp_list = exec_cmd_list(channel, cmd)
            for port in temp_list:
                if port != '0':
                    cmd = "netstat -P tcp -f inet6 -an|grep LISTEN|grep -v grep|grep %s|wc -l\n" % port
                    cnt = exec_cmd_string(channel, cmd)
                    if cnt != '0':
                        sub_node1 = SubElement(sub_node, 'TCP6_PORT')
                        sub_node1.text = port
            ##UDP4
            cmd = "pfiles /proc/%s |grep \"sockname: AF_INET \" |nawk -F ' ' '{print $NF}'\n" % pid
            temp_list = exec_cmd_list(channel, cmd)
            for port in temp_list:
                if port != '0':
                    cmd = "netstat -P udp -f inet -an|grep LISTEN|grep -v grep|grep %s|wc -l\n" % port
                    cnt = exec_cmd_string(channel, cmd)
                    if cnt != '0':
                        sub_node1 = SubElement(sub_node, 'UDP4_PORT')
                        sub_node1.text = port
            ##UDP6
            cmd = "pfiles /proc/%s |grep \"sockname: AF_INET6 \" |nawk -F ' ' '{print $NF}'\n" % pid
            temp_list = exec_cmd_list(channel, cmd)
            for port in temp_list:
                if port != '0':
                    cmd = "netstat -P udp -f inet6 -an|grep LISTEN|grep -v grep|grep %s|wc -l\n" % port
                    cnt = exec_cmd_string(channel, cmd)
                    if cnt != '0':
                        sub_node1 = SubElement(sub_node, 'UDP6_PORT')
                        sub_node1.text = port
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = path
            sub_node1 = SubElement(sub_node, 'user')
            sub_node1.text = user

        return

    def get_mysql(self, channel, node):
        recv_buf = ""
        exe = "mysqld_safe"
        pid = ""
        ppid = ""
        path = ""
        temp_list = list()
        cnt = ""
        tomcat_path = ""
        temp = ""
        version = ""
        comm = ""
        cmd = "ps -eo pid,ppid,user,comm,args |grep %s|grep -v grep |wc -l\n" % exe
        temp = exec_cmd_string(channel, cmd)
        if temp == '0':
            exe = "mysqld"

        cmd = "ps -eo pid,ppid,user,comm,args | grep %s\n" % exe
        rel = exec_cmd_list(channel, cmd, 3)

        for item in rel:
            line = item.split()
            if len(line) < 4:
                return
            pid = line[0]
            ppid = line[1]
            user = line[2]
            comm = line[3]

            if (len(ppid) == 0) or int(ppid) != 1:
                continue
            if re.search('mysqld_safe', item):
                cmd = "ps -eo pid,ppid,user,comm | grep mysqld|grep -v grep --color=never | grep -v mysqld_safe\n"
                pid1 = exec_cmd_list(channel, cmd)
                for item1 in pid1:
                    pid = line[0]
                    ppid = line[1]
                    user = line[2]
                    comm = line[3]
            sub_node = SubElement(node, 'node')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = "mysql"
            cmd = "%s --help |grep -v grep |grep \"mysqld  Ver \"| nawk -F 'mysqld  Ver ' '{print $2}'|nawk -F ' ' '{print $1}'|nawk -F '-' '{print $1}'\n" % comm
            version = exec_cmd_string(channel, cmd)
            sub_node1 = SubElement(sub_node, 'version')
            sub_node1.text = ("mysql %s" % version)
            # TCP4
            cmd = "pfiles /proc/%s |grep \"sockname: AF_INET \" |nawk -F ' ' '{print $NF}'\n" % pid
            temp_list = exec_cmd_list(channel, cmd)
            for port in temp_list:
                if port != '0':
                    cmd = "netstat -P tcp -f inet -an|grep  LISTEN|grep -v grep|grep %s|wc -l\n" % port
                    cnt = exec_cmd_string(channel, cmd)
                    if cnt != '0':
                        sub_node1 = SubElement(sub_node, 'TCP4_PORT')
                        sub_node1.text = port
            ##TCP6
            cmd = "pfiles /proc/%s |grep \"sockname: AF_INET6 \" |nawk -F ' ' '{print $NF}'\n" % pid
            temp_list = exec_cmd_list(channel, cmd)
            for port in temp_list:
                if port != '0':
                    cmd = "netstat -P tcp -f inet6 -an|grep  LISTEN|grep -v grep|grep %s|wc -l\n" % port
                    cnt = exec_cmd_string(channel, cmd)
                    if cnt != '0':
                        sub_node1 = SubElement(sub_node, 'TCP6_PORT')
                        sub_node1.text = port
            ##UDP4
            cmd = "pfiles /proc/%s |grep \"sockname: AF_INET \" |nawk -F ' ' '{print $NF}'\n" % pid
            temp_list = exec_cmd_list(channel, cmd)
            for port in temp_list:
                if port != '0':
                    cmd = "netstat -P udp -f inet -an|grep LISTEN|grep -v grep|grep %s|wc -l\n" % port
                    cnt = exec_cmd_string(channel, cmd)
                    if cnt != '0':
                        sub_node1 = SubElement(sub_node, 'UDP4_PORT')
                        sub_node1.text = port
            ##UDP6
            cmd = "pfiles /proc/%s |grep \"sockname: AF_INET6 \" |nawk -F ' ' '{print $NF}'\n" % pid
            temp_list = exec_cmd_list(channel, cmd)
            for port in temp_list:
                if port != '0':
                    cmd = "netstat -P udp -f inet6 -an|grep LISTEN|grep -v grep|grep %s|wc -l\n" % port
                    cnt = exec_cmd_string(channel, cmd)
                    if cnt != '0':
                        sub_node1 = SubElement(sub_node, 'UDP6_PORT')
                        sub_node1.text = port

            path = comm.split('mysqld')[0]
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = path
            sub_node1 = SubElement(sub_node, 'user')
            sub_node1.text = user

        return

    def get_pgsql(self, channel, node):
        recv_buf = ""
        exe = "postgres"
        pid = ""
        ppid = ""
        path = ""
        temp_list = list()
        comm = ""
        cmd = "ps -eo pid,ppid,user,comm,args |grep  %s|grep -v grep --color=never |wc -l\n" % exe
        temp = exec_cmd_string(channel, cmd, 3)
        if temp == '0':
            exe = "/postmaster"

        cmd = "ps -eo pid,ppid,user,comm,args | grep %s\n" % exe
        rel = exec_cmd_list(channel, cmd, 3)

        for item in rel:
            line = item.split()
            if len(line) < 3:
                return
            pid = line[0]
            ppid = line[1]
            user = line[2]
            comm = line[3]

            if (len(ppid) == 0) or int(ppid) != 1:
                continue
            if re.search('greenplum', comm, re.I):
                continue
            sub_node = SubElement(node, 'node')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = "postgresql"
            cmd = "%s -V |nawk -F ' ' '{print $NF}'\n" % comm
            version = exec_cmd_string(channel, cmd)
            sub_node1 = SubElement(sub_node, 'version')
            sub_node1.text = ("postgresql %s" % version)
            # TCP4
            cmd = "pfiles /proc/%s |grep \"sockname: AF_INET \" |nawk -F ' ' '{print $NF}'\n" % pid
            temp_list = exec_cmd_list(channel, cmd)
            for port in temp_list:
                if port != '0':
                    cmd = "netstat -P tcp -f inet -an|grep LISTEN|grep -v grep|grep %s|wc -l\n" % port
                    cnt = exec_cmd_string(channel, cmd)
                    if cnt != '0':
                        sub_node1 = SubElement(sub_node, 'TCP4_PORT')
                        sub_node1.text = port
            ##TCP6
            cmd = "pfiles /proc/%s |grep \"sockname: AF_INET6 \" |nawk -F ' ' '{print $NF}'\n" % pid
            temp_list = exec_cmd_list(channel, cmd)
            for port in temp_list:
                if port != '0':
                    cmd = "netstat -P tcp -f inet6 -an|grep LISTEN|grep -v grep|grep %s|wc -l\n" % port
                    cnt = exec_cmd_string(channel, cmd)
                    if cnt != '0':
                        sub_node1 = SubElement(sub_node, 'TCP6_PORT')
                        sub_node1.text = port
            ##UDP4
            cmd = "pfiles /proc/%s |grep --color=never \"sockname: AF_INET \" |nawk -F ' ' '{print $NF}'\n" % pid
            temp_list = exec_cmd_list(channel, cmd)
            for port in temp_list:
                if port != '0':
                    cmd = "netstat -P udp -f inet -an|grep LISTEN|grep -v grep|grep %s|wc -l\n" % port
                    cnt = exec_cmd_string(channel, cmd)
                    if cnt != '0':
                        sub_node1 = SubElement(sub_node, 'UDP4_PORT')
                        sub_node1.text = port
            ##UDP6
            cmd = "pfiles /proc/%s |grep \"sockname: AF_INET6 \" |nawk -F ' ' '{print $NF}'\n" % pid
            temp_list = exec_cmd_list(channel, cmd)
            for port in temp_list:
                if port != '0':
                    cmd = "netstat -P udp -f inet6 -an|grep LISTEN|grep -v grep|grep %s|wc -l\n" % port
                    cnt = exec_cmd_string(channel, cmd)
                    if cnt != '0':
                        sub_node1 = SubElement(sub_node, 'UDP6_PORT')
                        sub_node1.text = port

            path1 = comm.split('/')
            if len(path1) >= 2:
                path = path1[:-2]
            else:
                path = ""
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = path
            sub_node1 = SubElement(sub_node, 'user')
            sub_node1.text = user

        return

    def get_iplist(self, channel, node):
        recv_buf = ""
        env_sh = list()
        env_sh = self.get_net_list(channel)
        for item in env_sh:
            # print env_sh
            if re.search('docker|dladm|CLASS', item):
                continue
            iplist = list()
            # ipv4
            cmd = "ifconfig %s|grep inet|nawk -F 'inet ' '{print $2}'|nawk -F ' ' '{print $1}'\n" % item
            iplist = exec_cmd_list(channel, cmd, 5)
            for item1 in iplist:
                sub_node1 = SubElement(node, 'ip')
                sub_node1.text = item1

            # IPV6
            cmd = "ifconfig %s|grep inet6|nawk -F 'inet6 ' '{print $2}'|nawk -F ' ' '{print $1}'\n" % item
            iplist = exec_cmd_list(channel, cmd, 5)
            for item1 in iplist:
                sub_node1 = SubElement(node, 'ip')
                sub_node1.text = item1

        return

    def get_nat(self, channel, node):
        recv_buf = ""

        # IPV4
        cmd = "ipnat -l\n"
        iplist = exec_cmd_list(channel, cmd, 5)
        for item in iplist:
            if not re.search('map ', item):
                continue
            it = item.split('->')
            src = it[0].strip().split()[-1]
            dst = it[1].strip()
            sub_node1 = SubElement(node, 'ip')
            sub_node1.text = ("%s===%s" % (src, dst))
        return

    def get_port_list(self, channel):
        recv_buf = ""
        args = ""
        temp = ""
        cmd = "ps -eo pid,args\n"
        rel = exec_cmd_list(channel, cmd, 5)
        proc_dt = list()
        for item in rel:
            if re.search('PID', item):
                continue
            line = item.split()
            pid = line[0]
            args = ' '.join(line[1:])
            recv_buf = ""
            cmd = "pfiles /proc/%s\n" % pid
            recv_buf = exec_cmd_string_all(channel, cmd, 2)
            if re.search('system process', recv_buf):
                continue
            proc_dt.append((recv_buf, args))

        return proc_dt

    def get_port_service(self, channel, node):
        global g_pservice
        # TCP4
        cmd = "netstat -P tcp -f inet -an|grep  LISTEN|nawk -F ' ' '{print $1}'|nawk -F '.' '{print $NF}'\n"
        rel = exec_cmd_list(channel, cmd, 5)
        for item in rel:
            sub_node = SubElement(node, 'TCP4_PORT')
            args = ""
            service = ""
            port_s = "%s/tcp" % item
            sub_node.text = "%s/%s" % (item, g_pservice.get(port_s, ""))
        # TCP6
        cmd = "netstat -P tcp -f inet6 -an|grep LISTEN|nawk -F ' ' '{print $1}'|nawk -F '.' '{print $NF}'\n"
        rel = exec_cmd_list(channel, cmd, 5)
        for item in rel:
            sub_node = SubElement(node, 'TCP6_PORT')
            port_s = "%s/tcp" % item
            sub_node.text = "%s/%s" % (item, g_pservice.get(port_s, ""))
        # UDP4s
        cmd = "netstat -P udp -f inet -an|grep Idle|nawk -F ' ' '{print $1}'|nawk -F '.' '{print $NF}'\n"
        rel = exec_cmd_list(channel, cmd, 5)
        for item in rel:
            sub_node = SubElement(node, 'UDP4_PORT')
            port_s = "%s/udp" % item
            sub_node.text = "%s/%s" % (item, g_pservice.get(port_s, ""))
        # UDP6
        cmd = "netstat -P udp -f inet6 -an|grep Idle|nawk -F ' ' '{print $1}'|nawk -F '.' '{print $NF}'\n"
        rel = exec_cmd_list(channel, cmd, 5)
        for item in rel:
            sub_node = SubElement(node, 'UDP6_PORT')
            port_s = "%s/udp" % item
            sub_node.text = "%s/%s" % (item, g_pservice.get(port_s, ""))
        return

    def get_start_level(self, channel, level):
        recv_buf = ""
        rc = dict()
        cmd = "ls -l /etc/rc%d.d\n" % level
        dl = exec_cmd_list(channel, cmd, 3)

        for item in dl:
            if re.search('[SK][0-9][0-9]', item):
                app_start = item.split('->')[0].split()[-1]
                app = app_start[3:]
                start = app_start[0]
                if start == 'S':
                    start = 'on'
                else:
                    start = 'off'

                rc[app] = start
                if app not in self.app_dc:
                    self.app_dc[app] = ""

        return rc

    def get_core(self, channel, node):
        cmd = "uname -r\n"
        rel = exec_cmd_string(channel, cmd, 10)
        node.text = rel
        return

    def get_start(self, channel, node):
        recv_buf = ""
        rc0 = self.get_start_level(channel, 0)
        rc1 = self.get_start_level(channel, 1)
        rc2 = self.get_start_level(channel, 2)
        rc3 = self.get_start_level(channel, 3)
        rc4 = self.get_start_level(channel, 4)
        rc5 = self.get_start_level(channel, 5)
        rc6 = self.get_start_level(channel, 6)

        for key in list(self.app_dc.keys()):
            sub_node = SubElement(node, "item")
            item = "%s    0:%s   1:%s   2:%s    3:%s    4:%s    5:%s    6:%s" % (
                key, rc0.get(key, "off"), rc1.get(key, "off"), rc2.get(key, "off"),
                rc3.get(key, "off"), rc4.get(key, "off"), rc5.get(key, "off"), rc6.get(key, "off"))
            sub_node.text = item
        return

    def get_info(self, channel):
        # print "solaris-10\n"
        OldLang = ""

        get_lang(channel)
        try:
            node = SubElement(root, 'dev')
            self.Tool.get_hostname(channel, node)
        except Exception as e:
            log_info("get_hostname:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'dev_type')
            self.Tool.get_hosttype(channel, node)
        except Exception as e:
            log_info("get_hosttype:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'net')
            self.get_net(channel, node)
        except Exception as e:
            log_info("get_net:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'os')
            self.get_os(channel, node)
        except Exception as e:
            log_info("get_os:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'patchlist')
            self.get_patch(channel, node)
        except Exception as e:
            log_info("get_patch:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'iplist')
        # self.get_iplist(channel, node)
        except Exception as e:
            log_info("get_iplist:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'natiplist')
        # self.get_nat(channel, node)
        except Exception as e:
            log_info("get_nat:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'kernel')
            self.get_core(channel, node)
        except Exception as e:
            log_info("get_core:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'PORTLIST')
            self.get_port(channel, node)
        except Exception as e:
            log_info("get_port:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'proc_info')
            self.get_proc(channel, node)
        except Exception as e:
            log_info("get_proc:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'apache')
            self.get_apache(channel, node)
        except Exception as e:
            log_info("get_apache:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'tomcat')
            self.get_tomcat(channel, node)
        except Exception as e:
            log_info("get_tomcat:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'oracle')
            self.get_oracle(channel, node)
        except Exception as e:
            log_info("get_oracle:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'mysql')
            self.get_mysql(channel, node)
        except Exception as e:
            log_info("get_mysql:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'postgresql')
            self.get_pgsql(channel, node)
        except Exception as e:
            log_info("get_pgsql:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'start')
        # self.get_start(channel, node)
        except Exception as e:
            log_info("get_start:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'other')
        # self.Tool.get_other(channel, node)
        except Exception as e:
            log_info("get_other:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'fastjson')
            # querytype = "get_database"
            self.Tool.get_java_depth(channel, node, 'fastjson')
        except Exception as e:
            log_info("fastjson:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'spring-cloud')
            self.Tool.get_java_depth(channel, node, 'spring-cloud')

        except Exception as e:
            log_info("spring-cloud:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'spring-webmvc')
            self.Tool.get_java_depth(channel, node, 'spring-webmvc')
        except Exception as e:
            log_info("spring-webmvc:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'dubbo')
            self.Tool.get_java_depth(channel, node, 'dubbo')
        except Exception as e:
            log_info("dubbo:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'struts')
            self.Tool.get_java_depth(channel, node, 'struts')
        except Exception as e:
            log_info("struts:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'shiro')
            self.Tool.get_java_depth(channel, node, 'shiro')
        except Exception as e:
            log_info("shiro:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'openssl')
            self.Tool.get_openssl_info(channel, node)
        except Exception as e:
            log_info("openssl:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'polkit')
            self.Tool.get_polkit_info(channel, node)
        except Exception as e:
            log_info("polkit:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'k8s')
            self.Tool.get_k8s_info(channel, node)
        except Exception as e:
            log_info("k8s:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'zabbix')
            self.Tool.get_zabbix_info(channel, node)
        except Exception as e:
            log_info("zabbix:[%s]\n" % (traceback.format_exc()))
        return


class FreeBsd:
    Tool = Redhat()

    def __init__(self):
        pass

    def get_os(self, channel, node):
        detail = ""
        version = ""
        cmd = "uname -a\n"
        detail = exec_cmd_string(channel, cmd)
        if re.search('FreeBSD.*RELEASE', detail, re.I):
            version = re.search('FreeBSD.*RELEASE', detail, re.I).group().replace('\n', '')
            node.text = transfor(version)
            return
        if not re.search('uname -a', detail):
            version = detail
            # node.text = transfor(version)
            node.text = version.split()[0]
            return
        node.text = "FreeBSD UNKNOWN RELEASE"
        return

    def get_net(self, channel, node):
        global ip
        recv_buf = ""
        env_sh = list()
        iplist = list()
        cmd = "ifconfig -l\n"
        recv_buf = exec_cmd_string(channel, cmd, 3)
        env_sh = recv_buf.split(' ')
        for item in env_sh:
            item = item.strip()
            # print env_sh
            item = item.strip()
            if re.search('docker', item):
                continue
            if re.match('lo', item):
                continue
            cmd = "ifconfig -L %s\n" % item
            recv_buf = exec_cmd_string_all(channel, cmd, 3)
            if not re.search('status: active', recv_buf):
                continue
            sub_node = SubElement(node, 'eth')
            sub_node1 = SubElement(node, 'name')
            sub_node1.text = item

            # ipv4
            cmd = "ifconfig -L %s inet\n" % item
            iplist = exec_cmd_list(channel, cmd)
            for item1 in iplist:
                item1 = item1.strip()
                if re.match('inet', item1):
                    sub_node1 = SubElement(node, 'ipv4')
                    ip4_add_node = SubElement(sub_node1, 'add')
                    ip4_add_node.text = item1.split(' ')[1]
                    if re.findall(r'(.+?)/', item1).pop() == ip:
                        SubElement(node, 'main')
                    break

            # IPV6
            cmd = "ifconfig -L %s inet6\n" % item
            iplist = exec_cmd_list(channel, cmd)
            for item1 in iplist:
                item1 = item1.strip()
                if re.match('inet6', item1):
                    sub_node1 = SubElement(node, 'ipv6')
                    ip6_add_node = SubElement(sub_node1, 'add')
                    ip6_add_node.text = item1.split(' ')[1].split('%')[0]
                    if re.findall(r'(.+?)/', item1).pop() == ip:
                        SubElement(node, 'main')
                    break

            # MAC
            cmd = "ifconfig -L %s ether\n" % item
            iplist = exec_cmd_list(channel, cmd)
            for item1 in iplist:
                item1 = item1.strip()
                if re.match('ehter', item1):
                    sub_node1 = SubElement(node, 'mac')
                    sub_node1.text = item1.split(' ')[1]

                    # gateway 网关
                    cmd = "ip -4 route | grep %s | grep via | awk -F ' ' '{print $3}'\n" % item
                    ipv4_gateway_buf = exec_cmd_string(channel, cmd, 10, cmd)
                    if ipv4_gateway_buf and ipv4_gateway_buf != cmd.replace('\n', ''):
                        sub_node1 = SubElement(node, 'ipv4_gateway')
                        sub_node1.text = ipv4_gateway_buf
                    cmd = "ip -6 route | grep %s | grep via | awk -F ' ' '{print $3}'\n" % item
                    ipv6_gateway_buf = exec_cmd_string(channel, cmd, 10, cmd)
                    if ipv6_gateway_buf and ipv6_gateway_buf != cmd.replace('\n', ''):
                        sub_node1 = SubElement(node, 'ipv6_gateway')
                        sub_node1.text = ipv6_gateway_buf

                    # netmask 掩码
                    if node.findall('ipv4'):
                        sub_node1 = SubElement(node, 'ipv4_netmask')
                        sub_node1.text = netmaskOfIpv4(node.find('ipv4').text)
                    if node.findall('ipv6'):
                        sub_node1 = SubElement(node, 'ipv6_netmask')
                        sub_node1.text = node.find('ipv6').text
                    break
            sub_node1 = SubElement(node, 'territory')
            sub_node1.text = ""

        return

    def get_port(self, channel, node):
        # TCP4

        cmd = "sockstat -l\n"
        rel = exec_cmd_list(channel, cmd)
        temp = dict()
        temp.clear()
        for item in rel:
            if re.search('tcp4 ', item):
                if item.split()[5].split(':')[-1] in temp:
                    continue
                temp[item.split()[5].split(':')[-1]] = ""
                sub_node = SubElement(node, 'TCP4_PORT')
                sub_node.text = item.split()[5].split(':')[-1]

        # TCP6
        temp.clear()
        for item in rel:
            if re.search('tcp6 ', item):
                if item.split()[5].split(':')[-1] in temp:
                    continue
                temp[item.split()[5].split(':')[-1]] = ""
                sub_node = SubElement(node, 'TCP6_PORT')
                sub_node.text = item.split()[5].split(':')[-1]
        # UDP4
        temp.clear()
        for item in rel:
            if re.search('udp4 ', item):
                if item.split()[5].split(':')[-1] in temp:
                    continue
                temp[item.split()[5].split(':')[-1]] = ""
                sub_node = SubElement(node, 'UDP4_PORT')
                sub_node.text = item.split()[5].split(':')[-1]
        # UDP6
        temp.clear()
        for item in rel:
            if re.search('udp6 ', item):
                if item.split()[5].split(':')[-1] in temp:
                    continue
                temp[item.split()[5].split(':')[-1]] = ""
                sub_node = SubElement(node, 'UDP6_PORT')
                sub_node.text = item.split()[5].split(':')[-1]

        return

    def get_proc(self, channel, node):
        soft = ""
        path = ""
        recv_buf = ""
        start_dc = dict()
        groups_list = dict()

        cmd = "ps -eo pid,lstart\n"
        start_list = exec_cmd_list(channel, cmd)
        for item in start_list:
            if re.search('ps -eo', item):
                continue
            if re.search('grep', item):
                continue
            if re.search('STARTED', item):
                continue
            line = item.split()
            pid = line[0]
            start_time = ' '.join(line[1:])
            start_dc[pid] = start_time

        cmd = "ps -eo pid,ppid,ruser,command\n"
        rel = exec_cmd_list(channel, cmd)

        for item in rel:
            if re.search('COMMAND', item):
                continue
            if re.search('ps -eo', item):
                continue
            if re.search('grep', item):
                continue
            line = item.split()

            pid = line[0]
            ppid = line[1]
            user = line[2]
            if (len(ppid) == 0) or int(ppid) == 0 or int(ppid) == 2:
                continue
            command = ' '.join(line[3:])
            sub_node = SubElement(node, 'proc')
            sub_node1 = SubElement(sub_node, 'pid')
            sub_node1.text = pid
            command1 = command.split()[0].strip()
            if re.search("\[", command1):
                command = command1
            else:
                command = command1.split('/')[-1].strip(':')
            sub_node1 = SubElement(sub_node, 'proc_name')
            sub_node1.text = command
            sub_node1 = SubElement(sub_node, 'soft')
            sub_node1.text = ""
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = ""
            sub_node1 = SubElement(sub_node, 'args')
            sub_node1.text = self.Tool.get_proc_args(channel, item)
            sub_node1 = SubElement(sub_node, 'user')
            sub_node1.text = transfor(user)

            if user not in groups_list:
                cmd = "groups %s\n" % user
                groups = exec_cmd_string(channel, cmd).strip()
                groups_list[user] = groups
            sub_node1 = SubElement(sub_node, 'groups')
            sub_node1.text = transfor(groups_list.get(user))
            sub_node1 = SubElement(sub_node, 'creationDate')
            sub_node1.text = transfor(start_dc.get(pid, ""))

        return

    def get_apache_port_pid(self, channel, pid):
        recv_buf = ""
        tcp4_list = list()
        tcp6_list = list()
        udp4_list = list()
        udp6_list = list()
        # TCP4
        cmd = "sockstat -l\n"
        rel = exec_cmd_list(channel, cmd)
        for item in rel:
            regex_tcp4 = "%s.*tcp4" % pid
            regex_tcp6 = "%s.*tcp6" % pid
            regex_udp4 = "%s.*udp4" % pid
            regex_udp6 = "%s.*udp6" % pid
            if re.match(regex_tcp4, item):
                port = item.split()[5].split(':')[-1]
                tcp4_list.append(port)
            elif re.match(regex_tcp6, item):
                port = item.split()[5].split(':')[-1]
                tcp6_list.append(port)
            elif re.match(regex_udp4, item):
                port = item.split()[5].split(':')[-1]
                udp4_list.append(port)
            elif re.match(regex_udp6, item):
                port = item.split()[5].split(':')[-1]
                udp6_list.append(port)
        return tcp4_list, tcp6_list, udp4_list, udp6_list

    def get_apache(self, channel, node):
        recv_buf = ""
        exe = "httpd"
        proc_list = dict()
        path = ""
        cmd = "ps -axo pid,ppid,ruser,command\n"
        rel = exec_cmd_list(channel, cmd)

        # print len(rel)
        for item in rel:
            if re.search('grep', item):
                continue
            if not re.search(exe, item):
                continue
            line = item.split()
            pid = line[0]
            ppid = line[1]
            user = line[2]

            if (len(ppid) == 0) or int(ppid) != 1:
                continue
            sub_node = SubElement(node, 'node')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = "apache"

            abs_exe = line[3].strip()

            cmd = "%s -v|grep --color=never \"Server version: Apache/\"|awk -F 'Server version: Apache/' '{print $2}'|awk -F ' ' '{print $1}'\n" % abs_exe
            version = exec_cmd_string(channel, cmd)
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = ("apache %s" % version)

            tcp4, tcp6, udp4, udp6 = self.get_apache_port_pid(channel, pid)
            for port in tcp4:
                sub_node1 = SubElement(sub_node, 'TCP4_PORT')
                sub_node1.text = port
            for port in tcp6:
                sub_node1 = SubElement(sub_node, 'TCP6_PORT')
                sub_node1.text = port
            for port in udp4:
                sub_node1 = SubElement(sub_node, 'UDP4_PORT')
                sub_node1.text = port
            for port in udp6:
                sub_node1 = SubElement(sub_node, 'UDP6_PORT')
                sub_node1.text = port

            path = '/'.join(abs_exe.split('/')[:-1])
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = path
            sub_node1 = SubElement(sub_node, 'user')
            sub_node1.text = user
            sub_node1 = SubElement(sub_node, 'language')
            sub_node1.text = "C"

            cmd = "%s -l|grep --color=never -v \"Compiled in modules:\"\n" % abs_exe
            modules = exec_cmd_list(channel, cmd)
            for module in modules:
                sub_node1 = SubElement(sub_node, 'module')
                sub_node1.text = module.strip()

        return

    def get_mysql(self, channel, node):
        recv_buf = ""
        exe = "mysqld"
        proc_list = dict()
        path = ""
        cmd = "ps -axo pid,ppid,ruser,command\n"
        rel = exec_cmd_list(channel, cmd)

        # print len(rel)
        for item in rel:
            if re.search('grep', item):
                continue
            if not re.search(exe, item):
                continue
            # print "line--1:[%s]\n" % item
            line = item.split()
            pid = line[0]
            ppid = line[1]
            user = line[2]

            if (len(ppid) == 0) or int(ppid) != 1:
                continue
            sub_node = SubElement(node, 'node')
            sub_node1 = SubElement(node, 'name')
            sub_node1.text = "msyql"

            abs_exe = line[3].strip()

            cmd = "%s --help |grep --color=never -v grep --color=never |grep --color=never \"mysqld  Ver \"| awk -F 'mysqld  Ver ' '{print $2}'|awk -F ' ' '{print $1}'|awk -F '-' '{print $1}'\n" % abs_exe
            version = exec_cmd_string(channel, cmd)
            sub_node1 = SubElement(node, 'version')
            sub_node1.text = ("mysql %s" % version)

            tcp4, tcp6, udp4, udp6 = self.get_apache_port_pid(channel, pid)
            for port in tcp4:
                sub_node1 = SubElement(node, 'TCP4_PORT')
                sub_node1.text = port
            for port in tcp6:
                sub_node1 = SubElement(node, 'TCP6_PORT')
                sub_node1.text = port
            for port in udp4:
                sub_node1 = SubElement(node, 'UDP4_PORT')
                sub_node1.text = port
            for port in udp6:
                sub_node1 = SubElement(node, 'UDP6_PORT')
                sub_node1.text = port
            path = '/'.join(abs_exe.split('/')[:-1])
            sub_node1 = SubElement(node, 'path')
            sub_node1.text = path
            sub_node1 = SubElement(node, 'user')
            sub_node1.text = user

        return

    def get_info(self, channel):
        # print "freebsd\n"
        OldLang = ""
        global root
        get_lang(channel)
        try:
            node = SubElement(root, 'dev')
            self.Tool.get_hostname(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            log_info("get_hostname:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'dev_type')
            self.Tool.get_hosttype(channel, node)
        except Exception as e:
            # print repr
            log_info("get_hosttype:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'net')
            self.get_net(channel, node)
        except Exception as e:
            log_info("get_net:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'os')
            self.get_os(channel, node)
        except Exception as e:
            log_info("get_os:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'patchlist')
        # buf = self.get_patch(channel, node)
        except Exception as e:
            log_info("get_patch:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'kernel')
            self.Tool.get_core(channel, node)
        except Exception as e:
            log_info("get_core:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'PORTLIST')
            self.get_port(channel, node)
        except Exception as e:
            log_info("get_port:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'proc_info')
            self.get_proc(channel, node)
        except Exception as e:
            log_info("get_proc:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'apache')
            self.get_apache(channel, node)
        except Exception as e:
            log_info("get_apache:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'tomcat')
            self.Tool.get_tomcat(channel, node)
        except Exception as e:
            log_info("get_tomcat:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'oracle')
        # self.Tool.get_oracle(channel, node)
        except Exception as e:
            log_info("get_oracle:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'mysql')
            self.get_mysql(channel, node)
        except Exception as e:
            log_info("get_mysql:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'postgresql')
        # self.get_pgsql(channel, node)
        except Exception as e:
            log_info("get_pgsql:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'fastjson')
            # querytype = "get_database"
            self.Tool.get_java_depth(channel, node, 'fastjson')
        except Exception as e:
            log_info("fastjson:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'spring-cloud')
            self.Tool.get_java_depth(channel, node, 'spring-cloud')

        except Exception as e:
            log_info("spring-cloud:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'spring-webmvc')
            self.Tool.get_java_depth(channel, node, 'spring-webmvc')
        except Exception as e:
            log_info("spring-webmvc:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'dubbo')
            self.Tool.get_java_depth(channel, node, 'dubbo')
        except Exception as e:
            log_info("dubbo:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'struts')
            self.Tool.get_java_depth(channel, node, 'struts')
        except Exception as e:
            log_info("struts:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'shiro')
            self.Tool.get_java_depth(channel, node, 'shiro')
        except Exception as e:
            log_info("shiro:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'openssl')
            self.Tool.get_openssl_info(channel, node)
        except Exception as e:
            log_info("openssl:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'polkit')
            self.Tool.get_polkit_info(channel, node)
        except Exception as e:
            log_info("polkit:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'k8s')
            self.Tool.get_k8s_info(channel, node)
        except Exception as e:
            log_info("k8s:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'zabbix')
            self.Tool.get_zabbix_info(channel, node)
        except Exception as e:
            log_info("zabbix:[%s]\n" % (traceback.format_exc()))

        return


class AIX:
    Tool = Redhat()

    def __init__(self):
        pass

    def get_net(self, channel, node):
        global ip
        recv_buf = ""
        name_map = dict()
        name = ""
        temp = list()
        ipv4_fl = 0
        ipv6_fl = 0
        mac_fl = 0
        cmd = "netstat -in\n"
        env_sh = exec_cmd_list(channel, cmd, 20)
        for item in env_sh:
            if re.match('Name|lo', item):
                continue
            name = item.split()[0]
            if name in name_map:
                continue
            else:
                name_map[name] = ""

        for key in list(name_map.keys()):
            sub_node = SubElement(node, 'eth')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = key

            ipv4_fl = 0
            ipv6_fl = 0
            mac_fl = 0
            for item in env_sh:

                if re.match('Name|lo', item):
                    continue

                name = item.split()[0]
                network = item.split()[2]
                address = item.split()[3]
                if name != key:
                    continue

                if re.search('link', network):
                    if mac_fl == 0:
                        sub_node1 = SubElement(sub_node, 'mac')
                        sub_node1.text = address.replace('.', ':')
                        mac_fl = 1
                elif re.search('::', network):
                    if ipv6_fl == 0:
                        sub_node1 = SubElement(sub_node, 'ipv6')
                        ip6_add_node = SubElement(sub_node1, 'add')
                        ip6_add_node.text = address
                        if re.findall(r'(.+?)/', address).pop() == ip:
                            SubElement(node, 'main')
                        ipv6_fl = 1
                elif re.search('[0-9]{1, 3}\.[0-9]{1, 3}\.[0-9]{1, 3}', network):
                    if ipv4_fl == 0:
                        sub_node1 = SubElement(sub_node, 'ipv4')
                        ip4_add_node = SubElement(sub_node1, 'add')
                        ip4_add_node.text = address
                        if re.findall(r'(.+?)/', address).pop() == ip:
                            SubElement(node, 'main')
                        ipv4_fl = 1

            sub_node1 = SubElement(sub_node, 'territory')
            sub_node1.text = ""

        return

    def get_patch(self, channel, node):
        cmd = "oslevel -sq\n"
        rel = exec_cmd_list(channel, cmd, 3)
        for item in rel:
            if re.search('Known Service Packs', item):
                continue
            if re.search('-------', item):
                continue

            sub_node = SubElement(node, 'patch')
            sub_node.text = item.strip()

        return

    def get_os(self, channel, node):
        other_v = ""
        aaa = ""
        version = ""
        cmd = "oslevel\n"

        other_v = exec_cmd_string_all(channel, cmd, 5)
        log_info("other_v:[%s]\n" % other_v)
        aaa = re.search('[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}', other_v)

        if aaa:
            log_info("---oslevel----\n")
            version = aaa.group()
        if version:
            node.text = ("AIX %s" % version)
        else:
            node.text = "AIX UNKNOWN RELEASE"
        return

    def get_core(self, channel, node):
        other_v = ""
        cmd = "oslevel\n"
        version = ""
        aaa = ""
        other_v = exec_cmd_string(channel, cmd, 2)
        aaa = re.search('[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}', other_v)
        if aaa:
            version = aaa.group()
            node.text = version
        return

    def get_port(self, channel, node):
        recv_buf = ""
        # TCP4
        cmd = "netstat -Aan | grep -i -e 'tcp' | grep -i 'listen'\n"
        rel = exec_cmd_list(channel, cmd, 10)
        for item in rel:
            if re.search('tcp4 |tcp ', item):
                addr = item.split()[4]
                sub_node = SubElement(node, 'TCP4_PORT')
                sub_node.text = addr.split('.')[1]
        # TCP6
        for item in rel:
            if re.match('tcp6 ', item):
                addr = item.split()[4]
                sub_node = SubElement(node, 'TCP6_PORT')
                sub_node.text = addr.split('.')[1]

        cmd = "netstat -Aan | grep -i -e 'udp'\n"
        rel = exec_cmd_list(channel, cmd, 10)
        # UDP4
        for item in rel:
            if re.match('udp4 |udp ', item):
                addr = item.split()[4]
                if re.search('\*.[0-9]{1, 5}', item):
                    sub_node = SubElement(node, 'UDP4_PORT')
                    sub_node.text = addr.split('.')[1]
        # UDP6
        for item in rel:
            if re.match('udp6 ', item):
                addr = item.split()[3]
                if re.search('\*.[0-9]{1, 5}', item):
                    sub_node = SubElement(node, 'UDP6_PORT')
                    sub_node.text = addr.split('.')[1]

        return

    def get_proc(self, channel, node):
        soft = ""
        recv_buf = ""
        start_dc = dict()
        proc_list = dict()
        groups_list = dict()
        rpmd = dict()

        rpmd = self.Tool.get_rpm(channel)

        cmd = "ls -l /proc/*/cwd\n"
        proc_result = exec_cmd_list(channel, cmd, 3)
        for item1 in proc_result:
            if re.match('ls:', item1) is None:
                if re.search('->', item1):
                    key = item1.split('/proc/')[1].split('/')[0]
                    proc_list[key] = item1.replace('*', '')

        cmd = "ps -eo pid,start\n"
        start_list = exec_cmd_list(channel, cmd)
        for item in start_list:
            if re.search('PID', item):
                continue
            if re.search('ps -eo', item):
                continue
            line = item.split()
            pid = line[0]
            start_time = ' '.join(line[1:])
            start_dc[pid] = start_time

        cmd = "ps -eo pid,ppid,ruser,args\n"
        rel = exec_cmd_list(channel, cmd)
        # print len(rel)
        for item in rel:
            if re.search('grep|PID', item):
                continue

            line = item.split()

            pid = line[0]
            ppid = line[1]
            user = line[2]
            command = ' '.join(line[3:])
            if not ppid.isdigit() or not pid.isdigit():
                continue
            elif (len(ppid) == 0) or int(ppid) == 0 or int(ppid) == 2:
                continue

            sub_node = SubElement(node, 'proc')
            sub_node1 = SubElement(sub_node, 'pid')
            sub_node1.text = pid

            command1 = command.split()[0].strip()
            if re.search('\[', command1):
                command = command1
            else:
                command = command1.split('/')[-1].strip(':')
            sub_node1 = SubElement(sub_node, 'proc_name')
            sub_node1.text = command

            if pid not in proc_list:
                # LDY modify in 20220125 for guizhou
                if re.search('[/].*[/]', item):
                    path = re.search('[/].*[/]', item).group()
                else:
                    path = ""
                soft = ""
            else:
                soft = self.Tool.get_soft(channel, proc_list[pid], rpmd)
                path = self.Tool.get_path(proc_list[pid])

            sub_node1 = SubElement(sub_node, 'soft')
            sub_node1.text = soft
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = path
            sub_node1 = SubElement(sub_node, 'args')
            item1 = item.decode('gb18030')
            sub_node1.text = self.Tool.get_proc_args(channel, item1)
            sub_node1 = SubElement(sub_node, 'user')
            sub_node1.text = user

            if user not in groups_list:
                cmd = "groups %s|awk -F ':' '{print $2}'\n" % user
                groups = exec_cmd_string(channel, cmd).strip()
                groups_list[user] = groups

            sub_node1 = SubElement(sub_node, 'groups')
            sub_node1.text = groups_list.get(user)
            sub_node1 = SubElement(sub_node, 'creationDate')
            sub_node1.text = start_dc.get(pid, "")

        return

    def get_tcp_port_list(self, channel, pid):
        tcp4_list = list()
        tcp6_list = list()
        cmd = "netstat -Aan | grep -i -e 'tcp' | grep -i 'listen'\n"
        rel = exec_cmd_list(channel, cmd, 10)
        for item in rel:
            if re.search('tcp4 |tcp ', item):
                line = item.split()
                addr = line[4]
                pcb = line[1]
                cmd = "rmsock %s tcpcb\n" % pcb
                recv_buf1 = exec_cmd_string_all(channel, cmd, 10)
                rule = "held by proccess %s" % pid
                if re.search(rule, recv_buf1):
                    tcp4_list.append(addr.split('.')[1])
        # TCP6
        for item in rel:
            if re.match('tcp6 ', item):
                line = item.split()
                addr = line[4]
                pcb = line[1]
                cmd = "rmsock %s tcpcb\n" % pcb
                recv_buf1 = exec_cmd_string_all(channel, cmd, 10)
                rule = "held by proccess %s" % pid
                if re.search(rule, recv_buf1):
                    tcp6_list.append(addr.split('.')[1])
        return tcp4_list, tcp6_list

    def get_oracle(self, channel, node):
        recv_buf = ""
        exe = "tnslsnr LISTENER "
        detail = ""
        proc_list = dict()
        version1 = ""
        # LDY modify in 20220124 for guizhou remove : "--no-headers"
        cmd = "ps -eo pid,ppid,ruser=user12345678901234567890,args |grep \"%s\"|grep -v grep\n" % exe
        rel = exec_cmd_list(channel, cmd, 10)
        catalina = ""
        path = ""

        for item in rel:
            line = item.split()
            log_info("AIX line:%s" % line)
            pid = line[0]
            ppid = line[1]
            user = line[2]
            app = line[3]
            # LDY modify in  20220124  for guizhou
            # log_info("AIX app:%s" %app)
            if (len(ppid) == 0) or int(ppid) != 1:
                continue
            if not re.search(exe, item):
                continue
            version = ""
            sub_node = SubElement(node, 'node')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = "oracle"
            sub_node1 = SubElement(sub_node, 'version')
            # LDY modfiy in 20220124 for guizhou remove:"/"
            exe_path = app.strip('tnslsnr')
            # LDY modify in 20200124  for guizhou
            # log_info("AIX exe_path:%s" %app)
            cmd = "%slsnrctl status |grep 'LSNRCTL for'\n" % exe_path
            recv_buf1 = exec_cmd_string_all(channel, cmd, 5)
            # LDY modify in 20220124 for guizhou
            # rule = 'Version [0-9]{1,3}[/.][0-9]{1-3}[/.][0-9]{1,3}[/.][0-9]{1,3}[/.][0-9]{1,3}'
            rule = 'Version [0-9]{1,3}[/.][0-9]{1,3}[/.][0-9]{1,3}[/.][0-9]{1,3}[/.][0-9]{1,3}'
            if re.search(rule, recv_buf1):
                log_info("AIX oracle version:%s" % re.search(rule, recv_buf1).group().strip('version '))
                version = re.search(rule, recv_buf1).group().strip('Version ')

            tmp_node = sub_node.find('version')
            # LDY modify in 20220125 for guizhou tmp_node.txt - > tmp_node.text
            tmp_node.text = "oracle %s" % version

            p4list, p6list = self.get_tcp_port_list(channel, pid)
            for port in p4list:
                sub_node1 = SubElement(sub_node, 'TCP4_PORT')
                sub_node1.text = port
            for port in p6list:
                sub_node1 = SubElement(sub_node, 'TCP6_PORT')
                sub_node1.text = port

            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = exe_path
            sub_node1 = SubElement(sub_node, 'user')
            sub_node1.text = user
        return

    def get_tomcat(self, channel, node):
        recv_buf = ""
        exe = "Dcatalina.home"
        proc_list = dict()
        # LDY modify in 20220124 for guizhou remove:"--no-headers"
        cmd = "ps -eo pid,ppid,ruser=user12345678901234567890,args |grep '%s'|grep -v grep\n" % exe
        rel = exec_cmd_list(channel, cmd, 5)
        catalina = ""
        version = ""
        # print len(rel)
        port_list = dict()
        global g_ip
        for item in rel:
            line = item.split()
            pid = line[0]
            ppid = line[1]
            user = line[2]
            if (len(ppid) == 0) or int(ppid) != 1:
                continue
            if not re.search(exe, item):
                continue
            sub_node = SubElement(node, 'node')
            sub_node1 = SubElement(sub_node, 'name')
            sub_node1.text = "tomcat"
            version_node = SubElement(sub_node, 'version')
            java_path = line[3]
            path = item.split('-Dcatalina.home=')[1].split()[0].replace(' ', '')

            cmd = "find %s -name catalina.jar\n" % path
            jar = exec_cmd_string(channel, cmd, 10)
            if not re.match('find: ', jar):
                cmd = "%s  -classpath %s org.apache.catalina.util.ServerInfo |grep --color=never 'Server version:'|awk -F '/' '{print $NF}'\n" % (
                    java_path, jar)
                detail = exec_cmd_string(channel, cmd, 5)
                if not re.search('[0-9]\.[0-9]\.[0-9]', detail):
                    version = ""
                else:
                    version = detail

            version_node.text = transfor("tomcat %s" % version)

            p4list, p6list = self.get_tcp_port_list(channel, pid)
            for port in p4list:
                sub_node1 = SubElement(sub_node, 'TCP4_PORT')
                sub_node1.text = port
            for port in p6list:
                sub_node1 = SubElement(sub_node, 'TCP6_PORT')
                sub_node1.text = port
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = path
            sub_node1 = SubElement(sub_node, 'user')
            sub_node1.text = user
            sub_node1 = SubElement(sub_node, 'language')
            sub_node1.text = "JAVA"

            cmd = "ls  --color=never %s/webapps/*/WEB-INF/lib|grep --color=never -v grep --color=never |grep --color=never '.jar'\n" % path
            modules = exec_cmd_list(channel, cmd)
            for module in modules:
                if re.match('ls: ', module):
                    continue
                sub_node1 = SubElement(sub_node, 'module')
                sub_node1.text = module.strip()
            webapp = ""
            appurl_node = SubElement(sub_node, 'appurl')
            weburl_node1 = SubElement(sub_node, 'weburl')

        return

    def get_info(self, channel):
        # print "AIX\n"
        OldLang = ""
        get_lang(channel)
        global root
        try:
            node = SubElement(root, 'dev')
            self.Tool.get_hostname(channel, node)
        except Exception as e:
            log_info("get_hostname:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'dev_type')
            self.Tool.get_hosttype(channel, node)
        except Exception as e:
            log_info("get_hosttype:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'net')
            self.get_net(channel, node)
        except Exception as e:
            log_info("get_net:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'os')
            self.get_os(channel, node)
        except Exception as e:
            log_info("get_os:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'patchlist')
            self.get_patch(channel, node)
        except Exception as e:
            log_info("get_patch:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'kernel')
            self.get_core(channel, node)
        except Exception as e:
            log_info("get_core:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'PORTLIST')
            self.get_port(channel, node)
        except Exception as e:
            log_info("get_port:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'proc_info')
            self.get_proc(channel, node)
        except Exception as e:
            log_info("get_proc:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'apache')
        # self.get_apache(channel, node)
        except Exception as e:
            log_info("get_apache:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'tomcat')
            self.get_tomcat(channel, node)
        except Exception as e:
            log_info("get_tomcat:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'oracle')
            self.get_oracle(channel, node)
        except Exception as e:
            log_info("get_oracle:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'mysql')
        # self.get_mysql(channel, node)
        except Exception as e:
            log_info("get_mysql:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'postgresql')
        # self.get_pgsql(channel, node)
        except Exception as e:
            log_info("get_pgsql:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'fastjson')
            # querytype = "get_database"
            self.Tool.get_java_depth(channel, node, 'fastjson')
        except Exception as e:
            log_info("fastjson:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'spring-cloud')
            self.Tool.get_java_depth(channel, node, 'spring-cloud')

        except Exception as e:
            log_info("spring-cloud:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'spring-webmvc')
            self.Tool.get_java_depth(channel, node, 'spring-webmvc')
        except Exception as e:
            log_info("spring-webmvc:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'dubbo')
            self.Tool.get_java_depth(channel, node, 'dubbo')
        except Exception as e:
            log_info("dubbo:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'struts')
            self.Tool.get_java_depth(channel, node, 'struts')
        except Exception as e:
            log_info("struts:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'shiro')
            self.Tool.get_java_depth(channel, node, 'shiro')
        except Exception as e:
            log_info("shiro:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'openssl')
            self.Tool.get_openssl_info(channel, node)
        except Exception as e:
            log_info("openssl:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'polkit')
            self.Tool.get_polkit_info(channel, node)
        except Exception as e:
            log_info("polkit:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'k8s')
            self.Tool.get_k8s_info(channel, node)
        except Exception as e:
            log_info("k8s:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'zabbix')
            self.Tool.get_zabbix_info(channel, node)
        except Exception as e:
            log_info("zabbix:[%s]\n" % (traceback.format_exc()))

        return


class Huawei:
    def __init__(self):
        pass

    def get_info(self, channel):
        recv_buf = ""
        version = ""
        os_version = ""
        temp = ""
        dev_type = ""
        cmd = " display version\n"
        global root
        try:

            node = SubElement(root, 'dev')
            dev_type_node = SubElement(root, 'dev_type')
            node = SubElement(root, 'eth')
            version_node = SubElement(root, 'os')
            node = SubElement(root, 'patchlist')
            node = SubElement(root, 'PORTLIST')
            node = SubElement(root, 'proc_info')
            node = SubElement(root, 'apache')
            node = SubElement(root, 'tomcat')
            node = SubElement(root, 'oracle')
            node = SubElement(root, 'mysql')
            node = SubElement(root, 'postgresql')

            recv_buf = exec_cmd_string_all(channel, cmd, 10)
            if re.search('HUAWEI.*uptime', recv_buf):
                searchobj = re.search('HUAWEI.*uptime', recv_buf).group()
                version = searchobj.split("uptime")[0].strip()
            elif re.search('Quidway.*uptime', recv_buf):
                searchobj = re.search('Quidway.*uptime', recv_buf).group()
                version = searchobj.split("uptime")[0].strip()
            elif re.search('Eudemon.*uptime', recv_buf):
                searchobj = re.search('Eudemon.*uptime', recv_buf).group()
                version = searchobj.split("uptime")[0].strip()
            elif re.search('Eudemon.*version', recv_buf):
                searchobj = re.search('Eudemon.*version', recv_buf).group()
                version = searchobj.split("version")[0].strip()
            elif re.search('SessionEngine.*uptime', recv_buf):

                searchobj = re.search('SessionEngine.*uptime', recv_buf).group()
                version = searchobj.split("uptime")[0].strip()
            elif re.search('UGW.*Version', recv_buf):
                searchobj = re.search('UGW.*Version', recv_buf).group()
                version = "HUAWEI %s" % searchobj.split("Version")[0].strip()
            elif re.search('NIP.*uptime', recv_buf):
                searchobj = re.search('NIP.*uptime', recv_buf).group()
                version = "HUAWEI %s" % searchobj.replace("uptime", "").strip()
            elif re.search('Huarong.*uptime', recv_buf):
                searchobj = re.search('Huarong.*uptime', recv_buf).group()
                version = "%s" % searchobj.replace("uptime", "").strip()
            elif re.search('IPS.*uptime', recv_buf):
                searchobj = re.search('IPS.*uptime', recv_buf).group()
                version = "%s" % searchobj.replace("uptime", "").strip()
            else:
                version = "HUAWEI UNKNOWN TYPE"
            version_node.text = transfor(version)
            dev_type_node.text = get_device_type(version)

        except Exception as e:
            log_info("get_info %s" % (traceback.format_exc()))
            pass
        return


class ZTE:
    def __init__(self):
        pass

    def get_info_FC7000(self, recv_buf):
        version = ""
        result = ""
        os_version = ""
        temp = ""
        global root

        node = SubElement(root, 'dev')
        # node.text = ""
        dev_type_node = SubElement(root, 'dev_type')
        node = SubElement(root, 'eth')
        # node.text = ""
        version_node = SubElement(root, 'os')

        node = SubElement(root, 'patchlist')
        # node.text = ""
        node = SubElement(root, 'PORTLIST')
        # node.text = ""
        node = SubElement(root, 'proc_info')
        # node.text = ""
        node = SubElement(root, 'apache')
        # node.text = ""
        node = SubElement(root, 'tomcat')
        # node.text = ""
        node = SubElement(root, 'oracle')
        # node.text = ""
        node = SubElement(root, 'mysql')
        # node.text = ""
        node = SubElement(root, 'postgresql')
        # node.text = ""
        searchObj = re.search('Product.*:.*FC7000', recv_buf)
        if searchObj:
            version = searchObj.group().split(':')[1].strip()
        else:
            version = ""
        version_node.text = version
        dev_type_node.text = get_device_type(version)
        return

    def get_info_ZXR10(self, recv_buf):
        result = ""
        version = ""
        os_version = ""
        temp = ""
        rel = list()
        global root
        log_info("ZRX10")
        node = SubElement(root, 'dev')
        dev_type_node = SubElement(root, 'dev_type')
        node = SubElement(root, 'eth')
        version_node = SubElement(root, 'os')
        node = SubElement(root, 'patchlist')
        node = SubElement(root, 'PORTLIST')
        node = SubElement(root, 'proc_info')
        node = SubElement(root, 'apache')
        node = SubElement(root, 'tomcat')
        node = SubElement(root, 'oracle')
        node = SubElement(root, 'mysql')
        node = SubElement(root, 'postgresql')

        if re.search('ZTE ZXR10 Software,( Version:|Version) \S{1,20} ', recv_buf):
            searchObj = re.search('ZTE ZXR10 Software, Version: \S{1,20} ', recv_buf).group()
            version = searchObj.split('ZTE ZXR10 Software, Version: ')[1].strip()
        elif re.search('ZTE ZXR10 .* STACK Software', recv_buf):
            searchObj = re.search('ZTE ZXR10 .* STACK Software', recv_buf).group()
            version = searchObj.replace("STACK Software", "").strip()
        elif re.search('ZXR10 \S{1,20} Software, Version', recv_buf):
            searchObj = re.search('ZXR10 \S{1,20} Software, Version', recv_buf).group()
            version = searchObj.split('Software')[0].replace('ZXR10', '').strip()
        elif re.search('ZXR10 .* STACK Software', recv_buf):
            searchObj = re.search('ZXR10 .* STACK Software', recv_buf).group()
            version = searchObj.split('Software')[0].replace('STACK', '').strip()
        # LDY modify in 20220120 for guizhou add:5900D to ZXR
        elif re.search('5952D Software, 5900D (Version:|Version) \S{1,20} ', recv_buf):
            searchObj = re.search('5952D Software, 5900D (Version:|Version) \S{1,20} ', recv_buf).group()
            log_info("5952D %s" % searchObj)
            version = searchObj.split(',')[1].split(':')[0].strip('Version:').strip('Version').strip()
        elif re.search("ZXR10 5960", recv_buf):
            version = "ZXR10 5960"
        if version:
            version_node.text = ("ZTE %s" % version)
        else:
            version_node.text = "ZTE UNKNOWN TYPE"
        dev_type_node.text = get_device_type(version_node.text)
        return

    # LDY modify in 20220120 for guizhou add:def get_info_5900D
    def get_info_5900D(self, recv_buf):
        result = ""
        version = ""
        os_version = ""
        temp = ""
        rel = list()
        global root
        log_info("ZRX10")
        node = SubElement(root, 'dev')
        dev_type_node = SubElement(root, 'dev_type')
        node = SubElement(root, 'eth')
        version_node = SubElement(root, 'os')
        node = SubElement(root, 'patchlist')
        node = SubElement(root, 'PORTLIST')
        node = SubElement(root, 'proc_info')
        node = SubElement(root, 'apache')
        node = SubElement(root, 'tomcat')
        node = SubElement(root, 'oracle')
        node = SubElement(root, 'mysql')
        node = SubElement(root, 'postgresql')
        searchObj = re.search('5952D Software, 5900D (Version:|Version) \S{1,20} ', recv_buf)
        if searchObj:
            # version = searchObj.group().split(',')[1].split(':')[1].strip()
            version = searchObj.group().split(',')[1].split(':')[0].strip('Version:').strip('Version').strip()
        else:
            version = ""
        version_node.text = ("ZTE 5900D %s" % version)
        dev_type_node.text = get_device_type(version_node.text)
        return

    def get_info_OT(self, recv_buf):
        result = ""
        global root
        node = SubElement(root, 'dev')
        node = SubElement(root, 'dev_type')
        node.text = "switch"
        node = SubElement(root, 'eth')
        node = SubElement(root, 'patchlist')
        node = SubElement(root, 'PORTLIST')
        node = SubElement(root, 'proc_info')
        node = SubElement(root, 'apache')
        node = SubElement(root, 'tomcat')
        node = SubElement(root, 'oracle')
        node = SubElement(root, 'mysql')
        node = SubElement(root, 'postgresql')
        if re.search('5952E Software.*', recv_buf):
            searchObj = re.search('5952E Software', recv_buf).group()
            version = searchObj.replace("Software", "").strip()
            version = ("ZTE %s" % version)
        else:
            version = "ZTE UNKOWN TYPE"
        node = SubElement(root, 'os')
        node.text = version
        return

        return

    def get_info(self, channel):
        recv_buf = ""
        cmd = "show version\n"
        recv_buf = exec_cmd_string_all(channel, cmd)
        if re.search('ZXR10', recv_buf):
            self.get_info_ZXR10(recv_buf)
        elif re.search('FC7000', recv_buf):
            self.get_info_FC7000(recv_buf)
        # LDY modify In 20220120 add:5900D rule
        elif re.search('5900D', recv_buf):
            self.get_info_5900D(recv_buf)
        else:
            self.get_info_OT(recv_buf)

        return


class ZTE_AC:
    Tool = Redhat()

    def __init__(self):
        pass

    def get_info(self, channel):
        recv_buf = ""
        aaa = ""
        global root
        node = SubElement(root, 'dev')
        # node.text = ""
        dev_type_node = SubElement(root, 'dev_type')
        node.text = "WAP"
        node = SubElement(root, 'eth')
        version_node = SubElement(root, 'os')
        node = SubElement(root, 'patchlist')
        node = SubElement(root, 'PORTLIST')
        node = SubElement(root, 'proc_info')
        node = SubElement(root, 'apache')
        node = SubElement(root, 'tomcat')
        node = SubElement(root, 'oracle')
        node = SubElement(root, 'mysql')
        node = SubElement(root, 'postgresql')
        cmd = "show version\n"
        aaa = ""
        recv_buf = exec_cmd_string_all(channel, cmd)
        aaa = re.search('Device Model:.*\n', recv_buf)
        if aaa:
            version_node.text = "ZTE %s" % aaa.group().split('Device Model:')[1].replace('\n', '').strip()
        else:
            version_node.text = "ZTE AC UNKNOWN"
        # dev_type_node.text = get_device_type(version)
        return


class H3C:
    def __init__(self):
        pass

    def get_info(self, channel):
        recv_buf = ""
        version = ""
        os_version = ""
        temp = ""
        rel = list()
        global root
        node = SubElement(root, 'dev')
        dev_type_node = SubElement(root, 'dev_type')
        node = SubElement(root, 'eth')
        version_node = SubElement(root, 'os')
        node = SubElement(root, 'patchlist')
        node = SubElement(root, 'PORTLIST')
        node = SubElement(root, 'proc_info')
        node = SubElement(root, 'apache')
        node = SubElement(root, 'tomcat')
        node = SubElement(root, 'oracle')
        node = SubElement(root, 'mysql')
        node = SubElement(root, 'postgresql')
        cmd = "display version\n"

        try:
            recv_buf = exec_cmd_string_all(channel, cmd)
            if re.search('H3C.*uptime', recv_buf):
                searchObj = re.search('H3C.*uptime', recv_buf).group()
                log_info("====111111=====[%s]\n" % searchObj)
                version = searchObj.split('uptime')[0].strip()
            elif re.search('.*uptime', recv_buf):
                searchObj = re.search('.*uptime', recv_buf).group()
                log_info("====333333=====[%s]\n" % searchObj)
                temp = searchObj.split('uptime')[0].strip()
                version = "H3C %s" % temp

            if re.search('Comware Software, Version.*', recv_buf):
                searchObj = re.search('Comware Software, Version.*', recv_buf).group()
                log_info("====22222=====[%s]\n" % searchObj)
                temp = searchObj.split('Comware Software, Version')[1].strip()
                os_version = "H3C Comware %s" % temp

            if version:
                version_node.text = version
            else:
                version_node.text = "H3C UNKNOWN TYPE"
            dev_type_node.text = get_device_type(version_node.text)

        except Exception as e:
            # (traceback.format_exc())
            pass
        return


class Cisco:
    def __init__(self):
        pass

    def get_cisco_type(self, result):
        type = "switch"
        if re.match('37.*', result):
            type = "router"
        elif re.match('76.*', result):
            type = "router"
        elif re.match('72.*', result):
            type = "router"
        elif re.match('WS.*', result):
            type = "switch"
        return type

    def get_cisco_IOS(self, channel, recv_buf):
        version = ""
        temp = ""
        searchObj = None
        global root
        node = SubElement(root, 'dev')
        node.text = ""
        dev_type_node = SubElement(root, 'dev_type')
        node = SubElement(root, 'eth')
        version_node = SubElement(root, 'os')
        node = SubElement(root, 'patchlist')
        node = SubElement(root, 'PORTLIST')
        node = SubElement(root, 'proc_info')
        node = SubElement(root, 'apache')
        node = SubElement(root, 'tomcat')
        node = SubElement(root, 'oracle')
        node = SubElement(root, 'mysql')
        node = SubElement(root, 'postgresql')

        try:
            if re.search('cisco .*processor', recv_buf,re.I):
                searchObj = re.search('cisco .*processor', recv_buf,re.I).group()
                version = searchObj.split('processor')[0].strip()
            elif re.search('Hardware: .*', recv_buf):
                searchObj = re.search('Hardware: .*', recv_buf).group()
                version = searchObj.split('Hardware:')[1].strip(',')

            if version:
                version_node.text = version
            else:
                version_node.text = "Cisco IOS UNKNOWNWN type"
            dev_type_node.text = get_device_type(version_node.text)
        except Exception as e:
            log_info("Cisco IOS:%s\n" % (traceback.format_exc()))
        return

    def get_cisco_NXOS(self, channel, recv_buf):
        version = ""
        temp = ""
        searchObj = None

        global root
        node = SubElement(root, 'dev')
        node.text = ""
        dev_type_node = SubElement(root, 'dev_type')
        node = SubElement(root, 'eth')
        version_node = SubElement(root, 'os')
        node = SubElement(root, 'patchlist')
        node = SubElement(root, 'PORTLIST')
        node = SubElement(root, 'proc_info')
        node = SubElement(root, 'apache')
        node = SubElement(root, 'tomcat')
        node = SubElement(root, 'oracle')
        node = SubElement(root, 'mysql')
        node = SubElement(root, 'postgresql')

        try:
            recv_buf = recv_buf.replace('\r', '')
            if re.search('cisco Nexus.*Chassis', recv_buf):
                searchObj = re.search('cisco Nexus.*Chassis', recv_buf).group()
                version = searchObj.split('Chassis')[0].strip()

            if version:
                version_node.text = version
            else:
                version_node.text = "Cisco UNKNOWN TYPE"
            dev_type_node.text = get_device_type(version_node.text)
        except Exception as e:
            log_info("Cisco NXOS:%s\n" % (traceback.format_exc()))
        return

    def get_cisco_OT(self, channel, recv_buf):
        recv_buf = ""
        version = ""
        os_version = ""
        temp = ""
        rel = list()

        global root
        node = SubElement(root, 'dev')
        node.text = ""
        node = SubElement(root, 'dev_type')
        node.text = "switch"
        node = SubElement(root, 'eth')
        node = SubElement(root, 'os')
        node.text = "Cisco UNKWONE TYPE"
        node = SubElement(root, 'patchlist')
        node = SubElement(root, 'PORTLIST')
        node = SubElement(root, 'proc_info')
        node = SubElement(root, 'apache')
        node = SubElement(root, 'tomcat')
        node = SubElement(root, 'oracle')
        node = SubElement(root, 'mysql')
        node = SubElement(root, 'postgresql')

        return

    def get_buf(self, channel):
        recv_buf1 = ""
        recv_buf = ""
        tmp = ""
        cmd = "show version\n"
        try:
            recv_buf = exec_cmd_string_all(channel, cmd, 5)
            recv_buf1 = recv_buf
            log_info("recv_buf:[%s]\n" % recv_buf)
            while True:
                if re.search('-More-', recv_buf, re.I):
                    cmd = " "
                    recv_buf = exec_cmd_string_all(channel, cmd, 5)
                    recv_buf1 = recv_buf1 + recv_buf
                else:
                    break
            recv_buf = recv_buf1
        except Exception as e:
            log_info("recv_buf:[%s]\n" % (traceback.format_exc()))
            recv_buf = ""
        return recv_buf

    def get_info(self, channel):
        recv_buf = ""
        recv_buf = self.get_buf(channel)
        if re.search('NX-OS', recv_buf):
            self.get_cisco_NXOS(channel, recv_buf)
        elif re.search('IOS', recv_buf):
            self.get_cisco_IOS(channel, recv_buf)
        else:
            self.get_cisco_OT(channel, recv_buf)
        return


class DOPRALINUX:
    Tool = Redhat()

    def __init__(self):
        pass

    def get_hosttype(self, channel, node):
        node.text = "WAP"
        return

    def get_os(self, channel, node):
        rel = list()
        os = ""
        cmd = "ls -l /etc/DL-Version | wc -l\n"
        cnt = exec_cmd_string(channel, cmd)
        if cnt == '1':
            cmd = "cat /etc/redhat-release\n"
            rel = exec_cmd_list(channel, cmd)
            if len(rel) > 1:
                os = rel[0].replace('"', '').strip()
        node.text = os
        return

    def get_info(self, channel):
        global root
        try:
            node = SubElement(root, 'dev')
            self.Tool.get_hostname(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            log_info("get_hostname:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'dev_type')
            self.get_hosttype(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            log_info("get_hosttype:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'net')
            self.Tool.get_net(channel, node)
        except Exception as e:
            log_info("get_net:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'os')
            self.get_os(channel, node)
        except Exception as e:
            log_info("get_os:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'patchlist')
        # result_buf = get_patch(channel, result_buf)
        except Exception as e:
            log_info("get_patch:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'kernel')
            self.Tool.get_core(channel, node)
        except Exception as e:
            log_info("get_core:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'PORTLIST')
            self.Tool.get_port(channel, node)
        except Exception as e:
            log_info("get_port:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'proc_info')
            self.Tool.get_proc(channel, node)
        except Exception as e:
            log_info("get_proc:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'apache')
        # result_buf = get_apache(channel, result_buf)
        except Exception as e:
            log_info("get_apache:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'tomcat')
        # result_buf = get_tomcat(channel, result_buf)
        except Exception as e:
            log_info("get_tomcat:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'oracle')
        # result_buf = get_oracle(channel, result_buf)
        except Exception as e:
            log_info("get_oracle:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'mysql')
        # result_buf = get_mysql(channel, result_buf)
        except Exception as e:
            log_info("get_mysql:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'postgresql')
        # result_buf = get_pgsql(channel, result_buf)
        except Exception as e:
            log_info("get_pgsql:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'fastjson')
            # querytype = "get_database"
            self.Tool.get_java_depth(channel, node, 'fastjson')
        except Exception as e:
            log_info("fastjson:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'spring-cloud')
            self.Tool.get_java_depth(channel, node, 'spring-cloud')

        except Exception as e:
            log_info("spring-cloud:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'spring-webmvc')
            self.Tool.get_java_depth(channel, node, 'spring-webmvc')
        except Exception as e:
            log_info("spring-webmvc:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'dubbo')
            self.Tool.get_java_depth(channel, node, 'dubbo')
        except Exception as e:
            log_info("dubbo:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'struts')
            self.Tool.get_java_depth(channel, node, 'struts')
        except Exception as e:
            log_info("struts:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'shiro')
            self.Tool.get_java_depth(channel, node, 'shiro')
        except Exception as e:
            log_info("shiro:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'openssl')
            self.Tool.get_openssl_info(channel, node)
        except Exception as e:
            log_info("openssl:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'polkit')
            self.Tool.get_polkit_info(channel, node)
        except Exception as e:
            log_info("polkit:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'k8s')
            self.Tool.get_k8s_info(channel, node)
        except Exception as e:
            log_info("k8s:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'zabbix')
            self.Tool.get_zabbix_info(channel, node)
        except Exception as e:
            log_info("zabbix:[%s]\n" % (traceback.format_exc()))

        return


class Juniper:
    def __init__(self):
        pass

    def get_info(self, channel):
        recv_buf = ""
        version = ""
        os_version = ""
        temp = ""
        rel = list()
        cmd = "Get system\n"
        try:
            recv_buf = exec_cmd_string_all(channel, cmd)
            global root
            dev_node = SubElement(root, 'dev')
            dev_type_node = SubElement(root, 'dev_type')
            node = SubElement(root, 'eth')
            version_node = SubElement(root, 'os')
            node = SubElement(root, 'patchlist')
            node = SubElement(root, 'PORTLIST')
            node = SubElement(root, 'proc_info')
            node = SubElement(root, 'apache')
            node = SubElement(root, 'tomcat')
            node = SubElement(root, 'oracle')
            node = SubElement(root, 'mysql')
            node = SubElement(root, 'postgresql')

            rel = recv_buf.replace('\r', '')
            if re.search('Product Name: .*', rel):
                searchObj = re.search('Product Name: .*', rel).group()
                version = searchObj.split('Product Name:')[1].strip()
            elif re.search('Model: .*', rel):
                searchObj = re.search('Model: .*', rel).group()
                version = searchObj.split('Model: ')[1].strip()
                if re.search('Hostname: .*', rel):
                    searchObj = re.search('Hostname: .*', rel).group()
                    dev_node.text = searchObj
                if re.search('Junos: : .*', rel):
                    os_version = re.search('Junos: : .*', rel).group()

            if version:
                version_node.text = "Juniper %s" % version
            else:
                version_node.text = "Juniper UKONW TYPE"

            dev_type_node.text = get_device_type(version_node.text)
        except Exception as e:
            pass
        return


class Nokia:
    def __init__(self):
        pass

    def get_info(self, channel):
        recv_buf = ""
        version = ""
        os_version = ""
        temp = ""
        rel = list()
        cmd = "show version\n"
        try:
            recv_buf = exec_cmd_string_all(channel, cmd)
            global root
            node = SubElement(root, 'dev')
            dev_type_node = SubElement(root, 'dev_type')
            node = SubElement(root, 'eth')
            version_node = SubElement(root, 'os')
            node = SubElement(root, 'patchlist')
            node = SubElement(root, 'PORTLIST')
            node = SubElement(root, 'proc_info')
            node = SubElement(root, 'apache')
            node = SubElement(root, 'tomcat')
            node = SubElement(root, 'oracle')
            node = SubElement(root, 'mysql')
            node = SubElement(root, 'postgresql')

            if re.search('Nokia.*Copyright', recv_buf.replace('\r', '')):
                searchObj = re.search('Nokia.*Copyright', recv_buf.replace('\r', '')).group()
                version = searchObj.split('Copyright')[0].strip()

            if version:
                version_node.text = "%s" % version
            else:
                version_node.text = "Nokia UKONW TYPE"

            dev_type_node.text = get_device_type(version_node.text)

        except Exception as e:

            log_info("nokia get_info %s \n" % (traceback.format_exc()))
            pass
        return


class HPUX:
    Tool = Redhat()

    def __init__(self):
        pass

    def get_os(self, channel, node):
        rel = ""
        version = ""
        cmd = "uname -a\n"
        rel = exec_cmd_string_all(channel, cmd)
        if re.search('HP-UX.*', rel):
            version = re.search('HP-UX.*', rel).group().replace('\n', '')
        else:
            version = "HP-UX UNKNOWN"
        node.text = transfor(version)
        return

    def get_patch(self, channel, node):
        rel = ""
        version = ""
        cmd = "/usr/sbin/swlist -l patch\n"
        rel = exec_cmd_list(channel, cmd, 60)
        for item in rel:
            if re.search('Initializing|Contacting target|Target:', item):
                continue
            if not re.search('#', item):
                if item.strip() == '#':
                    continue
                sub_node = SubElement(node, 'patch')
                sub_node.text = transfor(item.strip())
        return

    def get_core(self, channel, node):
        rel = ""
        version = ""
        cmd = "model\n"
        rel = exec_cmd_string_all(channel, cmd, 5)
        if re.search('ia64.*\n', rel):
            version = re.search('ia64.*\n', rel).group().replace('\n', '')
        node.text = transfor(version)
        return

    def get_addr(self, ipv4_list, ipv6_list, env):
        ipv4 = ""
        ipv6 = ""
        for item1 in ipv4_list:
            (ip_name1, ip_ip1) = item1
            if env == ip_name1:
                ipv4 = ip_ip1
                break
        for item2 in ipv6_list:
            (ip_name2, ip_ip2) = item2
            if env == ip_name2:
                ipv6 = ip_ip2
                break
        return ipv4, ipv6

    def get_net_list(self, channel):
        iplist2 = list()
        ipv4_list = list()
        ipv6_list = list()
        cmd = "netstat -in\n"
        iplist2 = exec_cmd_list(channel, cmd, 10)
        for item in iplist2:
            if re.search('^lo|Name', item):
                continue
            ens = item.split()[0]
            ip_addr = item.split()[3]
            if ip_addr == 'none':
                continue
            if re.search(r"^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
                         ip_addr):
                ipv4_list.append((ens, ip_addr))
            else:
                ipv6_list.append((ens, ip_addr))
        return ipv4_list, ipv6_list

    def get_net(self, channel, node):
        global ip
        env_sh = list()
        env_sh1 = list()
        list_ipv4 = list()
        list_ipv6 = list()
        MAC = ""
        ip_dc = dict()
        list_ipv4, list_ipv6 = self.get_net_list(channel)
        recv_buf = ""
        cmd = "lanscan\n"
        recv_buf = exec_cmd_string_all(channel, cmd, 10)
        if not re.search('not found', recv_buf):
            env_sh = recv_buf.split('\n')
        if len(env_sh) > 0:
            for item in env_sh:
                if re.search('MAC|Address', item):
                    continue
                MAC = item.split()[1]
                name = item.split()[4]
                if re.match('lo', name):
                    continue
                sub_node = SubElement(node, 'eth')
                sub_node1 = SubElement(sub_node, 'name')
                sub_node1.text = name

                ipv4, ipv6 = self.get_addr(list_ipv4, list_ipv6, name)
                if ipv4:
                    sub_node1 = SubElement(sub_node, 'ipv4')
                    ip4_add_node = SubElement(sub_node1, 'add')
                    ip4_add_node.text = ipv4
                    if re.findall(r'(.+?)/', ipv4).pop() == ip:
                        SubElement(node, 'main')

                if ipv6:
                    sub_node1 = SubElement(sub_node, 'ipv6')
                    ip6_add_node = SubElement(sub_node1, 'add')
                    ip6_add_node.text = ipv6
                    if re.findall(r'(.+?)/', ipv6).pop() == ip:
                        SubElement(node, 'main')

                sub_node1 = SubElement(sub_node, 'mac')
                sub_node1.text = MAC
                sub_node1 = SubElement(sub_node, 'territory')
                sub_node1.text = ""
        else:
            for item in list_ipv4:
                (name, ip_addr) = item
                if name in ip_dc:
                    continue
                else:
                    ip_dc[name] = ""
                sub_node = SubElement(node, 'eth')
                sub_node1 = SubElement(sub_node, 'name')
                sub_node1.text = name
                sub_node1 = SubElement(sub_node, 'ipv4')
                ip4_add_node = SubElement(sub_node1, 'add')
                ip4_add_node.text = ip_addr
                for item1 in list_ipv6:
                    (name1, ip1) = item
                    if name1 == name:
                        sub_node1 = SubElement(sub_node, 'ipv6')
                        ip6_add_node = SubElement(sub_node1, 'add')
                        ip6_add_node.text = ip1
                        break
                sub_node1 = SubElement(sub_node, 'mac')
                sub_node1.text = ""
                sub_node1 = SubElement(sub_node, 'territory')
                sub_node1.text = ""

            for item in list_ipv6:
                (name, ip_addr) = item
                if name in ip_dc:
                    continue
                else:
                    ip_dc[name] = ""
                sub_node = SubElement(node, 'eth')
                sub_node1 = SubElement(sub_node, 'name')
                sub_node1.text = name
                sub_node1 = SubElement(sub_node, 'ipv6')
                ip6_add_node = SubElement(sub_node1, 'add')
                ip6_add_node.text = ip_addr
                sub_node1 = SubElement(sub_node, 'mac')
                sub_node1.text = ""
                sub_node1 = SubElement(sub_node, 'territory')
                sub_node1.text = ""
        return

    def get_port(self, channel, node):
        # TCP4
        cmd = "netstat -an\n"
        rel = exec_cmd_list(channel, cmd, 5)
        for item in rel:
            if re.search('tcp .*LISTEN', item):
                sub_node = SubElement(node, 'TCP4_PORT')
                sub_node.text = item.split()[3].split('.')[-1]
        # TCP6
        for item in rel:
            if re.search('tcp6 .*LISTEN', item):
                sub_node = SubElement(node, 'TCP6_PORT')
                sub_node.text = item.split()[3].split('.')[-1]
        # UDP4
        for item in rel:
            if re.search('udp ', item):
                sub_node = SubElement(node, 'UDP4_PORT')
                sub_node.text = item.split()[3].split('.')[-1]
        # UDP6
        for item in rel:
            if re.search('udp6 ', item):
                sub_node = SubElement(node, 'UDP6_PORT')
                sub_node.text = item.split()[4].split('.')[-1]

        return

    def get_proc(self, channel, node):
        soft = ""
        path = ""
        recv_buf = ""
        start_dc = dict()
        groups_list = dict()
        args = ""
        cmd = "ps -efx\n"
        rel = exec_cmd_list(channel, cmd, 30)
        for item in rel:
            if re.search('UID', item):
                continue
            if re.search('ps -ef', item):
                continue
            if re.search('grep', item):
                continue
            line = item.split()
            user = line[0]
            pid = line[1]
            ppid = line[2]
            sub_node = SubElement(node, 'proc')
            sub_node1 = SubElement(sub_node, 'pid')
            sub_node1.text = pid
            log_info("item:[%s]\n" % item)
            # print line
            if re.search('[0-9]{,2}:[0-9]{,2}:[0-9]{,2}', line[4]):
                creationDate = line[4]
                command = line[7]
                if len(line) > 8:
                    args = ' '.join(line[8:])
            else:
                creationDate = ' '.join(line[4:6])
                command = line[8]
                if len(line) > 9:
                    args = ' '.join(line[9:])

            sub_node1 = SubElement(sub_node, 'proc_name')
            sub_node1.text = transfor(command)
            log_info("proc_name:[%s]\n" % sub_node1.text)
            sub_node1 = SubElement(sub_node, 'soft')
            sub_node1.text = ""
            sub_node1 = SubElement(sub_node, 'path')
            sub_node1.text = transfor(command)
            log_info("path:[%s]\n" % sub_node1.text)
            sub_node1 = SubElement(sub_node, 'args')
            sub_node1.text = transfor(args)
            log_info("args:[%s]\n" % sub_node1.text)
            sub_node1 = SubElement(sub_node, 'user')
            sub_node1.text = user
            log_info("user:[%s]\n" % sub_node1.text)

            if user not in groups_list:
                cmd = "groups %s\n" % user
                groups = exec_cmd_string(channel, cmd).strip()
                groups_list[user] = groups
            sub_node1 = SubElement(sub_node, 'groups')
            sub_node1.text = groups_list.get(user)
            log_info("groups:[%s]\n" % sub_node1.text)
            sub_node1 = SubElement(sub_node, 'creationDate')
            sub_node1.text = creationDate
            log_info("creationDate:[%s]\n" % sub_node1.text)
        return

    def get_info(self, channel):
        # print "HP-UX\n"
        OldLang = ""
        global root
        get_lang(channel)
        try:
            node = SubElement(root, 'dev')
            self.Tool.get_hostname(channel, node)
        except Exception as e:
            # print (traceback.format_exc())
            log_info("HP get_hostname:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'dev_type')
            self.Tool.get_hosttype(channel, node)
        except Exception as e:
            # print repr
            log_info("HP get_hosttype:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'net')
            self.get_net(channel, node)
        except Exception as e:
            log_info("HP get_net:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'os')
            self.get_os(channel, node)
        except Exception as e:
            log_info("HP get_os:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'patchlist')
            self.get_patch(channel, node)
        except Exception as e:
            log_info("HP get_patch:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'kernel')
            self.get_core(channel, node)
        except Exception as e:
            log_info("HP get_core:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'PORTLIST')
            self.get_port(channel, node)
        except Exception as e:
            log_info("HP get_port:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'proc_info')
            self.get_proc(channel, node)
        except Exception as e:
            log_info("HP get_proc:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'apache')
        # self.get_apache(channel, node)
        except Exception as e:
            log_info("HP get_apache:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'tomcat')
        # self.Tool.get_tomcat(channel, node)
        except Exception as e:
            log_info("HP get_tomcat:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'oracle')
        # self.Tool.get_oracle(channel, node)
        except Exception as e:
            log_info("HP get_oracle:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'mysql')
        # self.get_mysql(channel, node)
        except Exception as e:
            log_info("HP get_mysql:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'postgresql')
        # self.get_pgsql(channel, node)
        except Exception as e:
            log_info("HP get_pgsql:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'fastjson')
            # querytype = "get_database"
            self.Tool.get_java_depth(channel, node, 'fastjson')
        except Exception as e:
            log_info("fastjson:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'spring-cloud')
            self.Tool.get_java_depth(channel, node, 'spring-cloud')

        except Exception as e:
            log_info("spring-cloud:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'spring-webmvc')
            self.Tool.get_java_depth(channel, node, 'spring-webmvc')
        except Exception as e:
            log_info("spring-webmvc:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'dubbo')
            self.Tool.get_java_depth(channel, node, 'dubbo')
        except Exception as e:
            log_info("dubbo:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'struts')
            self.Tool.get_java_depth(channel, node, 'struts')
        except Exception as e:
            log_info("struts:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'shiro')
            self.Tool.get_java_depth(channel, node, 'shiro')
        except Exception as e:
            log_info("shiro:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'openssl')
            self.Tool.get_openssl_info(channel, node)
        except Exception as e:
            log_info("openssl:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'polkit')
            self.Tool.get_polkit_info(channel, node)
        except Exception as e:
            log_info("polkit:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'k8s')
            self.Tool.get_k8s_info(channel, node)
        except Exception as e:
            log_info("k8s:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'zabbix')
            self.Tool.get_zabbix_info(channel, node)
        except Exception as e:
            log_info("zabbix:[%s]\n" % (traceback.format_exc()))

        return


class F5:
    def __init__(self):
        pass

    def get_info(self, channel):
        recv_buf = ""
        version = ""
        os_version = ""
        temp = ""
        rel = list()

        try:

            global root
            node = SubElement(root, 'dev')
            dev_type_node = SubElement(root, 'dev_type')
            node = SubElement(root, 'eth')
            version_node = SubElement(root, 'os')
            node = SubElement(root, 'patchlist')
            node = SubElement(root, 'PORTLIST')
            node = SubElement(root, 'proc_info')
            node = SubElement(root, 'apache')
            node = SubElement(root, 'tomcat')
            node = SubElement(root, 'oracle')
            node = SubElement(root, 'mysql')
            node = SubElement(root, 'postgresql')
            cmd = "show sys hardware\n"
            recv_buf = exec_cmd_string_all(channel, cmd)
            if re.search('Name  BIG-IP.*', recv_buf.replace('\r', '')):
                searchObj = re.search('Name  BIG-IP.*', recv_buf.replace('\r', ''))
                if searchObj:
                    version = searchObj.group().split('Name  ')[1].strip()

            if version:
                version_node.text = "F5 %s" % version
            else:
                version_node.text = "F5 UKONW TYPE"

            dev_type_node.text = get_device_type(version_node.text)
        except Exception as e:
            log_info("nokia get_info %s \n" % (traceback.format_exc()))
        return


class Ruijie:
    def __init__(self):
        pass

    def get_info(self, channel):
        recv_buf = ""
        version = ""
        os_version = ""
        temp = ""
        rel = list()
        cmd = "show version\n"
        cmd_tab = "\n\n"
        recv_buf = exec_cmd_string(channel, cmd_tab, 3)
        try:
            recv_buf = exec_cmd_string_all(channel, cmd, 15)
            global root
            node = SubElement(root, 'dev')
            dev_type_node = SubElement(root, 'dev_type')
            node = SubElement(root, 'eth')
            version_node = SubElement(root, 'os')
            node = SubElement(root, 'patchlist')
            node = SubElement(root, 'PORTLIST')
            node = SubElement(root, 'proc_info')
            node = SubElement(root, 'apache')
            node = SubElement(root, 'tomcat')
            node = SubElement(root, 'oracle')
            node = SubElement(root, 'mysql')
            node = SubElement(root, 'postgresql')
            log_info("euijie_get_info %s \n" % (recv_buf))

            if re.search('Ruijie.*By Ruijie Networks', recv_buf):
                searchObj = re.search('Ruijie.*By Ruijie Networks', recv_buf).group()
                version = searchObj.split('By Ruijie Networks')[0].strip()
                log_info("ruijie_get_info2 %s \n" % (version))
            if re.search('Ruijie.*by Ruijie Networks', recv_buf):
                searchObj = re.search('Ruijie.*by Ruijie Networks', recv_buf).group()
                version = searchObj.split('by Ruijie Networks')[0].strip()
                log_info("ruijie_get_info2 %s \n" % (version))

            if version:
                version_node.text = "%s" % version
            else:
                version_node.text = "Ruijie UKONW TYPE"

            dev_type_node.text = get_device_type(version_node.text)
        except Exception as e:
            log_info("Ruijie get_info %s \n" % (traceback.format_exc()))
            pass
        return


class Mypower:
    def __init__(self):
        pass

    def get_info(self, channel):
        recv_buf = ""
        version = ""
        os_version = ""
        temp = ""
        rel = list()
        cmd = "show version\n"
        try:
            recv_buf = exec_cmd_string_all(channel, cmd)
            global root
            node = SubElement(root, 'dev')
            dev_type_node = SubElement(root, 'dev_type')
            node = SubElement(root, 'eth')
            version_node = SubElement(root, 'os')
            node = SubElement(root, 'patchlist')
            node = SubElement(root, 'PORTLIST')
            node = SubElement(root, 'proc_info')
            node = SubElement(root, 'apache')
            node = SubElement(root, 'tomcat')
            node = SubElement(root, 'oracle')
            node = SubElement(root, 'mysql')
            node = SubElement(root, 'postgresql')

            searchObj = re.search('Hardware Model.*', recv_buf.replace('\r', ''))
            if searchObj:
                version = searchObj.group().split(':')[1].strip()
            if version:
                version_node.text = "%s" % version
            else:
                version_node.text = "MyPower UKONW TYPE"

            dev_type_node.text = get_device_type(version_node.text)
        except Exception as e:
            log_info("MyPower get_info:[%s]\n" % (traceback.format_exc()))
            pass
        return


class Extreme:
    def __init__(self):
        pass

    def get_info(self, channel):
        recv_buf = ""
        version = ""
        os_version = ""
        temp = ""
        rel = list()
        cmd = "show switch\n"
        try:
            recv_buf = exec_cmd_string_all(channel, cmd)
            global root
            node = SubElement(root, 'dev')
            dev_type_node = SubElement(root, 'dev_type')
            node = SubElement(root, 'eth')
            version_node = SubElement(root, 'os')
            node = SubElement(root, 'patchlist')
            node = SubElement(root, 'PORTLIST')
            node = SubElement(root, 'proc_info')
            node = SubElement(root, 'apache')
            node = SubElement(root, 'tomcat')
            node = SubElement(root, 'oracle')
            node = SubElement(root, 'mysql')
            node = SubElement(root, 'postgresql')

            searchObj = re.search('System Type:.*\n', recv_buf.replace('\r', ''))
            if searchObj:
                version = searchObj.group().split('System Type:')[1].strip('\n').strip()
            if version:
                version_node.text = "ExtremeXOS %s" % version
            else:
                version_node.text = "ExtremeXOS UKONW TYPE"
            dev_type_node.text = get_device_type(version_node.text)
            if re.search('Press <SPACE>', recv_buf):
                cmd = "q"
                recv_buf = exec_cmd_string_all(channel, cmd)
        except Exception as e:
            log_info("MyPower get_info:[%s]\n" % (traceback.format_exc()))
            pass
        return


class EulerOS:
    Tool = Redhat()

    def __init__(self):
        pass

    def get_os(self, channel, node):
        detail = ""
        os = ""
        # cmd = "cat /etc/system-release\n"
        cmd = "\n hostnamectl\n"
        detail = exec_cmd_string_all(channel, cmd, 30)
        # detail = exec_cmd_string_all(channel, cmd, 3)
        if re.search('Operating System.*', detail):
            node.text = re.search('Operating System.*', detail).group().replace('Operating System:', '').replace('\n',
                                                                                                                 '').strip()
        else:
            cmd = "cat /etc/*release\n"
            detail = exec_cmd_string_all(channel, cmd, 20)

            if re.search('PRETTY_NAME=.*', detail):
                tem_info = re.search('PRETTY_NAME=.*', detail).group()
                os_name = re.findall('\"(.+?)\"', tem_info)[0]
                if os_name:
                    node.text = os_name
        log_info("EulerOS os_name:[%s]\n" % (node.text))
        return

    def get_info(self, channel):
        OldLang = ""
        get_lang(channel)
        global root
        try:
            node = SubElement(root, 'dev')
            self.Tool.get_hostname(channel, node)
        except Exception as e:
            log_info("EulerOS get_hostname:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'dev_type')
            self.Tool.get_hosttype(channel, node)
        except Exception as e:
            log_info("EulerOS get_hosttype:[%s]\n" % (traceback.format_exc()))
            pass
        try:
            node = SubElement(root, 'net')
            self.Tool.get_net(channel, node)
        except Exception as e:
            log_info("EulerOS get_net:[%s]\n" % (traceback.format_exc()))
            pass
        try:
            node = SubElement(root, 'os')
            self.get_os(channel, node)
        except Exception as e:
            log_info("EulerOS get_os:[%s]\n" % (traceback.format_exc()))
            pass
        try:
            node = SubElement(root, 'patchlist')
            self.Tool.get_patch(channel, node)
        except Exception as e:
            log_info("EulerOS get_patch:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'kernel')
            self.Tool.get_core(channel, node)
        except Exception as e:
            log_info("EulerOS get_core:[%s]\n" % (traceback.format_exc()))
            pass
        try:
            node = SubElement(root, 'PORTLIST')
            self.Tool.get_port(channel, node)
        except Exception as e:
            log_info("EulerOS get_port:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'proc_info')
            self.Tool.get_proc(channel, node)
        except Exception as e:
            log_info("EulerOS get_proc_redhat:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'apache')
            self.Tool.get_apache(channel, node)
        except Exception as e:
            log_info("EulerOS get_apache:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'tomcat')
            self.Tool.get_tomcat(channel, node)
        except Exception as e:
            log_info("EulerOS get_tomcat:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'oracle')
            self.Tool.get_oracle(channel, node)
        except Exception as e:
            log_info("EulerOS get_oracle:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'mysql')
            self.Tool.get_mysql(channel, node)
        except Exception as e:
            log_info("EulerOS get_mysql:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'postgresql')
            self.Tool.get_pgsql(channel, node)
        except Exception as e:
            log_info("EulerOS get_pgsql:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'fastjson')
            # querytype = "get_database"
            self.Tool.get_java_depth(channel, node, 'fastjson')
        except Exception as e:
            log_info("fastjson:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'spring-cloud')
            self.Tool.get_java_depth(channel, node, 'spring-cloud')

        except Exception as e:
            log_info("spring-cloud:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'spring-webmvc')
            self.Tool.get_java_depth(channel, node, 'spring-webmvc')
        except Exception as e:
            log_info("spring-webmvc:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'dubbo')
            self.Tool.get_java_depth(channel, node, 'dubbo')
        except Exception as e:
            log_info("dubbo:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'struts')
            self.Tool.get_java_depth(channel, node, 'struts')
        except Exception as e:
            log_info("struts:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'shiro')
            self.Tool.get_java_depth(channel, node, 'shiro')
        except Exception as e:
            log_info("shiro:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'openssl')
            self.Tool.get_openssl_info(channel, node)
        except Exception as e:
            log_info("openssl:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'polkit')
            self.Tool.get_polkit_info(channel, node)
        except Exception as e:
            log_info("polkit:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'k8s')
            self.Tool.get_k8s_info(channel, node)
        except Exception as e:
            log_info("k8s:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'zabbix')
            self.Tool.get_zabbix_info(channel, node)
        except Exception as e:
            log_info("zabbix:[%s]\n" % (traceback.format_exc()))

        return


class Array:
    def __init__(self):
        pass

    def get_info(self, channel):
        recv_buf = ""
        version = ""
        os_version = ""
        temp = ""
        rel = list()
        cmd = "show version\n"
        try:
            recv_buf = exec_cmd_string_all(channel, cmd)
            global root
            node = SubElement(root, 'dev')
            dev_type_node = SubElement(root, 'dev_type')
            node.text = "switch"
            node = SubElement(root, 'eth')
            version_node = SubElement(root, 'os')
            node = SubElement(root, 'patchlist')
            node = SubElement(root, 'PORTLIST')
            node = SubElement(root, 'proc_info')
            node = SubElement(root, 'apache')
            node = SubElement(root, 'tomcat')
            node = SubElement(root, 'oracle')
            node = SubElement(root, 'mysql')
            node = SubElement(root, 'postgresql')

            searchObj = re.search('Model :.*\n', recv_buf.replace('\r', ''))
            if searchObj:
                version = searchObj.group().split('Model :')[1].replace('\n', '').strip()
            if version:
                version_node.text = "%s" % version
            else:
                version_node.text = "Array UKONW TYPE"
            dev_type_node.text = get_device_type(version_node.text)
        except Exception as e:
            log_info("MyPower get_info:[%s]\n" % (traceback.format_exc()))
        return


class SkyEye360:
    def __init__(self):
        pass

    def get_info(self, channel):
        recv_buf = ""
        version = ""
        os_version = ""
        temp = ""
        rel = list()
        cmd = "version\n"
        try:
            recv_buf = exec_cmd_string_all(channel, cmd)
            global root
            node = SubElement(root, 'dev')
            # node.text = ""
            node = SubElement(root, 'dev_type')
            node.text = "switch"
            node = SubElement(root, 'eth')
            # node.text = ""
            version_node = SubElement(root, 'os')
            # version_node.text = version
            node = SubElement(root, 'patchlist')
            # node.text = ""
            node = SubElement(root, 'PORTLIST')
            # node.text = ""
            node = SubElement(root, 'proc_info')
            # node.text = ""
            node = SubElement(root, 'apache')
            # node.text = ""
            node = SubElement(root, 'tomcat')
            # node.text = ""
            node = SubElement(root, 'oracle')
            # node.text = ""
            node = SubElement(root, 'mysql')
            # node.text = ""
            node = SubElement(root, 'postgresql')

            searchObj = re.search('Version.*\n', recv_buf.replace('\r', ''))
            if searchObj:
                version = searchObj.group().split('Version                 :')[1].replace('\n', '').strip()
            if version:
                version_node.text = "360 SkyEye %s" % version
            else:
                version_node.text = "360 SkyEye UKONW TYPE"
        except Exception as e:
            log_info("360 SkyEye get_info:[%s]\n" % (traceback.format_exc()))

        return


class JUNOS:
    def __init__(self):
        pass

    def get_info(self, channel):
        recv_buf = ""
        version = ""
        os_version = ""
        temp = ""
        rel = list()
        cmd = "show version\n"
        try:
            recv_buf = exec_cmd_string_all(channel, cmd)
            global root
            node = SubElement(root, 'dev')
            dev_type_node = SubElement(root, 'dev_type')
            node = SubElement(root, 'eth')
            version_node = SubElement(root, 'os')
            node = SubElement(root, 'patchlist')
            node = SubElement(root, 'PORTLIST')
            node = SubElement(root, 'proc_info')
            node = SubElement(root, 'apache')
            node = SubElement(root, 'tomcat')
            node = SubElement(root, 'oracle')
            node = SubElement(root, 'mysql')
            node = SubElement(root, 'postgresql')
            rel = recv_buf.replace('\r', '')
            searchObj = re.search('Model: .*\n', rel)
            if searchObj:
                version = searchObj.group().split('Model: ')[1].replace('\n', '').strip()
            if version:
                version_node.text = "Juniper %s" % version
            else:
                version_node.text = "Juniper UKONW TYPE"
            dev_type_node.text = get_device_type(version_node.text)
        except Exception as e:
            # (traceback.format_exc())
            pass
        return


class DPtech:
    def __init__(self):
        pass

    def get_info(self, channel):
        recv_buf = ""
        version = ""
        os_version = ""
        temp = ""
        rel = ""
        cmd = "\n\n\n show version\n"
        try:
            recv_buf = exec_cmd_string_all(channel, cmd)
            log_info("DPtech:[%s]\n" % recv_buf)
            global root
            node = SubElement(root, 'dev')
            dev_type_node = SubElement(root, 'dev_type')
            node = SubElement(root, 'eth')
            version_node = SubElement(root, 'os')
            node = SubElement(root, 'patchlist')
            node = SubElement(root, 'PORTLIST')
            node = SubElement(root, 'proc_info')
            node = SubElement(root, 'apache')
            node = SubElement(root, 'tomcat')
            node = SubElement(root, 'oracle')
            node = SubElement(root, 'mysql')
            node = SubElement(root, 'postgresql')
            recv_buf = recv_buf.replace('\r', '')
            searchObj = re.search('.*Uptime', recv_buf, re.I)
            if searchObj:
                version = searchObj.group().split('Uptime')[0].strip()
            if version:
                version_node.text = "DPtech  %s" % version
            else:
                version_node.text = "DPtech  UKONW TYPE"
            dev_type_node.text = get_device_type(version_node.text)
        except Exception as e:
            log_info("DPtech repr:[%s]\n" % (traceback.format_exc()))
            pass
        return


class HuaweiOLT:
    def __init__(self):
        pass

    def get_info(self, channel):
        recv_buf = ""
        version = ""
        os_version = ""
        temp = ""
        dev_type = ""
        rel = list()
        recv_buf = ""
        global root
        try:
            cmd = "display version\n"

            recv_buf = exec_cmd_string_all(channel, cmd)
            if re.search('backplane<K>.*frameid/slotid<S>', recv_buf):
                cmd = "\n"
                recv_buf = exec_cmd_string_all(channel, cmd, 5)

            node = SubElement(root, 'dev')
            dev_type_node = SubElement(root, 'dev_type')
            node = SubElement(root, 'eth')
            version_node = SubElement(root, 'os')

            node = SubElement(root, 'patchlist')
            node = SubElement(root, 'PORTLIST')
            node = SubElement(root, 'proc_info')
            node = SubElement(root, 'apache')
            node = SubElement(root, 'tomcat')
            node = SubElement(root, 'oracle')
            node = SubElement(root, 'mysql')
            node = SubElement(root, 'postgresql')
            bbb = re.search('PRODUCT :.*\n', recv_buf)
            if bbb:
                version = bbb.group().split("PRODUCT :")[1].strip('\n').strip()
                version_node.text = transfor(version)
                dev_type_node.text = get_device_type(version_node.text)
            if re.search("-- More ( Press 'Q' to break ) -", recv_buf):
                cmd = "Q"
                aaa = exec_cmd_string_all(channel, cmd, 5)

        except Exception as e:
            log_info("get_info %s" % (traceback.format_exc()))
        return


class ZTAC:
    Tool = Redhat()

    def __init__(self):
        pass

    def get_info(self, channel):
        recv_buf = ""
        aaa = ""
        global root
        node = SubElement(root, 'dev')
        node = SubElement(root, 'dev_type')
        node.text = "WAP"
        node = SubElement(root, 'eth')
        version_node = SubElement(root, 'os')

        node = SubElement(root, 'patchlist')
        node = SubElement(root, 'PORTLIST')
        node = SubElement(root, 'proc_info')
        node = SubElement(root, 'apache')
        node = SubElement(root, 'tomcat')
        node = SubElement(root, 'oracle')
        node = SubElement(root, 'mysql')
        node = SubElement(root, 'postgresql')
        cmd = "show HOST\n"
        aaa = ""
        recv_buf = exec_cmd_string_all(channel, cmd)
        aaa = re.search('Device type.*\n', recv_buf)
        if aaa:
            version_node.text = "ZT %s" % aaa.group().split('Device type')[1].replace('\n', '').strip()
        else:
            version_node.text = "ZT AC UNKNOWN"
        return


class default:
    def __init__(self):
        pass

    def get_info(self, channel):
        repr_str("Not Support System Type")

        return


class ALCATEL:
    def __init__(self):
        pass

    def get_info(self, channel):
        recv_buf = ""
        version = ""
        os_version = ""
        temp = ""
        rel = list()
        cmd = "show version\n"
        try:
            recv_buf = exec_cmd_string_all(channel, cmd)
            global root
            node = SubElement(root, 'dev')
            dev_type_node = SubElement(root, 'dev_type')
            node.text = "switch"
            node = SubElement(root, 'eth')
            version_node = SubElement(root, 'os')
            node = SubElement(root, 'patchlist')
            node = SubElement(root, 'PORTLIST')
            node = SubElement(root, 'proc_info')
            node = SubElement(root, 'apache')
            node = SubElement(root, 'tomcat')
            node = SubElement(root, 'oracle')
            node = SubElement(root, 'mysql')
            node = SubElement(root, 'postgresql')

            searchObj = re.search('ALCATEL .*Copyright', recv_buf.replace('\r', ''))
            if searchObj:
                version = searchObj.group().split('ALCATEL ')[1].split('Copyright')[0].strip()
            if version:
                version_node.text = "ALCATEL %s" % version
            else:
                version_node.text = "ALCATEL UKONW TYPE"
            dev_type_node.text = get_device_type(version_node.text)
        except Exception as e:
            log_info("ALCATEL get_info:[%s]\n" % (traceback.format_exc()))
            pass
        return


class Ericsson:
    def __init__(self):
        pass

    def get_info(self, channel):
        recv_buf = ""
        version = ""
        os_version = ""
        temp = ""
        rel = list()
        cmd = "show version\n"
        try:
            recv_buf = exec_cmd_string_all(channel, cmd)
            global root
            node = SubElement(root, 'dev')
            dev_type_node = SubElement(root, 'dev_type')
            node = SubElement(root, 'eth')
            version_node = SubElement(root, 'os')
            node = SubElement(root, 'patchlist')
            node = SubElement(root, 'PORTLIST')
            node = SubElement(root, 'proc_info')
            node = SubElement(root, 'apache')
            node = SubElement(root, 'tomcat')
            node = SubElement(root, 'oracle')
            node = SubElement(root, 'mysql')
            node = SubElement(root, 'postgresql')
            rel = recv_buf.replace('\r', '')
            searchObj = re.search('version .*\n', rel, re.I)
            if searchObj:
                version = searchObj.group().split(' ')[1].replace('\n', '').strip()
            if version:
                version_node.text = "Ericsson %s" % version
            else:
                version_node.text = "Ericsson UKONW TYPE"
            dev_type_node.text = get_device_type(version_node.text)
        except Exception as e:

            pass
        return


class GenieATM:
    def __init__(self):
        pass

    def get_info(self, channel):
        recv_buf = ""
        version = ""
        os_version = ""
        temp = ""
        rel = list()
        cmd = "show version\n"
        try:
            recv_buf = exec_cmd_string_all(channel, cmd)
            global root
            node = SubElement(root, 'dev')
            dev_type_node = SubElement(root, 'dev_type')
            node = SubElement(root, 'eth')
            version_node = SubElement(root, 'os')
            node = SubElement(root, 'patchlist')
            node = SubElement(root, 'PORTLIST')
            node = SubElement(root, 'proc_info')
            node = SubElement(root, 'apache')
            node = SubElement(root, 'tomcat')
            node = SubElement(root, 'oracle')
            node = SubElement(root, 'mysql')
            node = SubElement(root, 'postgresql')
            rel = recv_buf.replace('\r', '')
            searchObj = re.search('Model Number.*', rel)
            if searchObj:
                version = searchObj.group().split(':')[1].strip()
            if version:
                version_node.text = "GenieATM %s" % version
            else:
                version_node.text = "GenieATM UKONW TYPE"
            dev_type_node.text = get_device_type(version_node.text)
        except Exception as e:
            pass
        return


class FiberHome:
    def __init__(self):
        pass

    def get_info(self, channel):
        recv_buf = ""
        version = ""
        os_version = ""
        temp = ""
        rel = list()
        cmd = "show version\n"
        try:
            recv_buf = exec_cmd_string_all(channel, cmd)
            global root
            node = SubElement(root, 'dev')
            dev_type_node = SubElement(root, 'dev_type')
            node = SubElement(root, 'eth')
            version_node = SubElement(root, 'os')
            node = SubElement(root, 'patchlist')
            node = SubElement(root, 'PORTLIST')
            node = SubElement(root, 'proc_info')
            node = SubElement(root, 'apache')
            node = SubElement(root, 'tomcat')
            node = SubElement(root, 'oracle')
            node = SubElement(root, 'mysql')
            node = SubElement(root, 'postgresql')
            rel = recv_buf.replace('\r', '')
            if not version:
                searchObj = re.search('FiberHome Fengine.*Routing Switch', rel)
                if searchObj:
                    version = re.search('Fengine [A-Za-z0-9]{0,10}', rel).group().strip()
                    if version:
                        version_node.text = "FiberHome %s" % version
                        dev_type_node.text = get_device_type(rel)
                        return
            if not version:
                searchObj = re.search('FiberHome Fengine.*Switch', rel)
                if searchObj:
                    version = re.search('Fengine [a-zA-Z0-9]{0,10}', rel).group().strip()
                    if version:
                        version_node.text = "FiberHome %s" % version
                        dev_type_node.text = get_device_type(rel)
                        return
            if not version:
                version_node.text = "FiberHome UKONW TYPE"
                dev_type_node.text = get_device_type(rel)
                return
        except Exception as e:
            pass
        return


class A10:
    def __init__(self):
        pass

    def get_info(self, channel):
        recv_buf = ""
        version = ""
        os_version = ""
        temp = ""
        rel = list()
        cmd = "show version\n"
        try:
            recv_buf = exec_cmd_string_all(channel, cmd)
            global root
            node = SubElement(root, 'dev')
            dev_type_node = SubElement(root, 'dev_type')
            node = SubElement(root, 'eth')
            version_node = SubElement(root, 'os')
            node = SubElement(root, 'patchlist')
            node = SubElement(root, 'PORTLIST')
            node = SubElement(root, 'proc_info')
            node = SubElement(root, 'apache')
            node = SubElement(root, 'tomcat')
            node = SubElement(root, 'oracle')
            node = SubElement(root, 'mysql')
            node = SubElement(root, 'postgresql')
            rel = recv_buf.replace('\r', '')
            if not version:
                searchObj = re.search('Thunder Series Unified Application Service Gateway [a-zA-Z0-9]{0,10}', rel)
                if searchObj:
                    version = re.search('Service Gateway [a-zA-Z0-9]{0,10}', rel).group().replace('Service Gateway ',
                                                                                                  '').strip()
                    if version:
                        version_node.text = "A10 Thunder %s" % version
                        dev_type_node.text = get_device_type(rel)
            if not version:
                searchObj = re.search('AX Series Advanced Traffic Manager [a-zA-Z0-9]{0,10}', rel)
                if searchObj:
                    version = re.search('Traffic Manager [a-zA-Z0-9]{0,10}', rel).group().replace('Traffic Manager ',
                                                                                                  '').strip()
                    if version:
                        version_node.text = "A10 AX %s" % version
                        dev_type_node.text = get_device_type(rel)
            if not version:
                version_node.text = "A10 UKONW TYPE"
                dev_type_node.text = get_device_type(rel)
        except Exception as e:
            pass
        return


class Aruba:
    def __init__(self):
        pass

    def get_info(self, channel):
        recv_buf = ""
        version = ""
        os_version = ""
        temp = ""
        rel = list()
        cmd = "show version\n"
        try:
            recv_buf = exec_cmd_string_all(channel, cmd)
            global root
            node = SubElement(root, 'dev')
            dev_type_node = SubElement(root, 'dev_type')
            node = SubElement(root, 'eth')
            version_node = SubElement(root, 'os')
            node = SubElement(root, 'patchlist')
            node = SubElement(root, 'PORTLIST')
            node = SubElement(root, 'proc_info')
            node = SubElement(root, 'apache')
            node = SubElement(root, 'tomcat')
            node = SubElement(root, 'oracle')
            node = SubElement(root, 'mysql')
            node = SubElement(root, 'postgresql')
            rel = recv_buf.replace('\r', '')
            if not version:
                searchObj = re.search('Device Model:.*', rel)
                if searchObj:
                    version = searchObj.group().split(':')[1].strip()
                    if version:
                        version_node.text = "Aruba Networks  %s" % version
                        dev_type_node.text = get_device_type(rel)
            if not version:
                version_node.text = "Aruba Networks UKONW TYPE"
                dev_type_node.text = get_device_type(rel)
        except Exception as e:
            pass
        return


class HAOHAN:
    def __init__(self):
        pass

    def get_info(self, channel):
        recv_buf = ""
        version = ""
        os_version = ""
        temp = ""
        rel = list()
        cmd = "SHOW SYSTEM\n"
        try:
            recv_buf = exec_cmd_string_all(channel, cmd)
            global root
            node = SubElement(root, 'dev')
            dev_type_node = SubElement(root, 'dev_type')
            node = SubElement(root, 'eth')
            version_node = SubElement(root, 'os')
            node = SubElement(root, 'patchlist')
            node = SubElement(root, 'PORTLIST')
            node = SubElement(root, 'proc_info')
            node = SubElement(root, 'apache')
            node = SubElement(root, 'tomcat')
            node = SubElement(root, 'oracle')
            node = SubElement(root, 'mysql')
            node = SubElement(root, 'postgresql')
            rel = recv_buf.replace('\r', '')
            if not version:
                searchObj = re.search('TMA[0-9]{1,10}', rel)
                if searchObj:
                    version = re.search('TMA[0-9]{1,10}', rel).group()
                    if version:
                        version_node.text = "HAOHAN  %s" % version
                        dev_type_node.text = get_device_type(rel)
            if not version:
                version_node.text = "HAOHAN UKONW TYPE"
                dev_type_node.text = get_device_type(rel)
        except Exception as e:
            pass
        return


class Raisecom:
    """
    采集交换机：瑞斯康达
    """

    def __init__(self):
        pass

    def get_info(self, channel):
        recv_buf = ""
        version = ""
        os_version = ""
        temp = ""
        rel = list()
        cmd = "show version\n"
        try:
            recv_buf = exec_cmd_string_all(channel, cmd)
            global root
            node = SubElement(root, 'dev')
            dev_type_node = SubElement(root, 'dev_type')
            node = SubElement(root, 'eth')
            version_node = SubElement(root, 'os')
            node = SubElement(root, 'patchlist')
            node = SubElement(root, 'PORTLIST')
            node = SubElement(root, 'proc_info')
            node = SubElement(root, 'apache')
            node = SubElement(root, 'tomcat')
            node = SubElement(root, 'oracle')
            node = SubElement(root, 'mysql')
            node = SubElement(root, 'postgresql')
            rel = recv_buf.replace('\r', '')
            searchObj = re.search('Model Number.*', rel)
            if searchObj:
                version = searchObj.group().split(':')[1].strip()
            if version:
                version_node.text = "Raisecom %s" % version
            else:
                version_node.text = "Raisecom UKONW TYPE"
            dev_type_node.text = get_device_type(version_node.text)
        except Exception as e:
            pass
        return


class Maipu:
    """
    采集交换机：迈普
    """

    def __init__(self):
        pass

    def get_info(self, channel):
        recv_buf = ""
        version = ""
        os_version = ""
        temp = ""
        rel = list()
        cmd = "show version\n"
        try:
            recv_buf = exec_cmd_string_all(channel, cmd)
            global root
            node = SubElement(root, 'dev')
            dev_type_node = SubElement(root, 'dev_type')
            node = SubElement(root, 'eth')
            version_node = SubElement(root, 'os')
            node = SubElement(root, 'patchlist')
            node = SubElement(root, 'PORTLIST')
            node = SubElement(root, 'proc_info')
            node = SubElement(root, 'apache')
            node = SubElement(root, 'tomcat')
            node = SubElement(root, 'oracle')
            node = SubElement(root, 'mysql')
            node = SubElement(root, 'postgresql')
            rel = recv_buf.replace('\r', '')
            searchObj = re.search('Model Number.*', rel)
            if searchObj:
                version = searchObj.group().split(':')[1].strip()
            if version:
                version_node.text = "Maipu %s" % version
            else:
                version_node.text = "Maipu UKONW TYPE"
            dev_type_node.text = get_device_type(version_node.text)
        except Exception as e:
            pass
        return


class Switch(Redhat):
    end = ""

    def __init__(self):
        pass

    def get_hosttype(self, channel, node):
        node.text = "general_purpose"
        return

    def get_os(self, channel, node):
        os = ""
        cmd = "cat /etc/*release\n"
        rel = exec_cmd_string_all(channel, cmd, 10)
        log_info("os_rel:[%s]\n" % rel)

        os_id = re.search(r'ID=(.*)', rel, re.M | re.I)
        os_version = re.search(r'VERSION_ID=(.*)', rel, re.M | re.I)
        if os_id:
            os = os + os_id.group(1) + "-"
        if os_version:
            os = os + os_version.group(1)

        b64 = base64.b64decode('6YeR5bqT')
        if not os:
            os = "openswitch Linux Server UNKNOWN"
        node.text = os.replace('"', '').strip()
        return

    def get_nat(self, channel, node):
        # openswitch not 'iptables -t nat --list'
        return

    def get_start(self, channel, node):
        # openswitch not 'checkconfig -list'
        return

    def get_info(self, channel):
        get_lang(channel)
        global root
        try:
            node = SubElement(root, 'dev')
            self.get_hostname(channel, node)
        except Exception as e:
            log_info("get_hostname:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'dev_type')
            self.get_hosttype(channel, node)
        except Exception as e:
            log_info("get_hosttype:[%s]\n" % (traceback.format_exc()))
            pass
        try:
            node = SubElement(root, 'net')
            self.get_net(channel, node)
        except Exception as e:
            log_info("get_net:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'os')
            self.get_os(channel, node)
        except Exception as e:
            log_info("get_os:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'patchlist')
            self.get_patch(channel, node)
        except Exception as e:
            log_info("get_patch:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'kernel')
            self.get_core(channel, node)
        except Exception as e:
            log_info("get_core:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'iplist')
        # self.get_iplist(channel, node)
        except Exception as e:
            log_info("get_iplist:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'natiplist')
        # self.get_nat(channel, node)
        except Exception as e:
            log_info("get_nat:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'PORTLIST')
            self.get_port(channel, node)
        except Exception as e:
            log_info("get_port:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'zzzzzzz')
            self.get_proc(channel, node)
        except Exception as e:
            log_info("get_proc_redhat:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'apache')
            self.get_apache(channel, node)
        except Exception as e:
            log_info("get_apache:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'tomcat')
            self.get_tomcat(channel, node)
        except Exception as e:
            log_info("get_tomcat:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'oracle')
            self.get_oracle(channel, node)
        except Exception as e:
            log_info("get_oracle:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'mysql')
            self.get_mysql(channel, node)
        except Exception as e:
            log_info("get_mysql:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'postgresql')
            self.get_pgsql(channel, node)
        except Exception as e:
            log_info("get_pgsql:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'start')
        # self.get_start(channel, node)
        except Exception as e:
            log_info("get_start:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'other')
        # self.get_other(channel, node)
        except Exception as e:
            log_info("get_other:[%s]\n" % (traceback.format_exc()))

        try:
            node = root.find('tomcat')
            self.get_middleware(channel, node)
        except Exception as e:
            log_info("get_middleware:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'database')
            self.get_database(channel, node)
        except Exception as e:
            log_info("get_database:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'fastjson')
            # querytype = "get_database"
            self.Tool.get_java_depth(channel, node, 'fastjson')
        except Exception as e:
            log_info("fastjson:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'spring-cloud')
            self.Tool.get_java_depth(channel, node, 'spring-cloud')

        except Exception as e:
            log_info("spring-cloud:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'spring-webmvc')
            self.Tool.get_java_depth(channel, node, 'spring-webmvc')
        except Exception as e:
            log_info("spring-webmvc:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'dubbo')
            self.Tool.get_java_depth(channel, node, 'dubbo')
        except Exception as e:
            log_info("dubbo:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'struts')
            self.Tool.get_java_depth(channel, node, 'struts')
        except Exception as e:
            log_info("struts:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'shiro')
            self.Tool.get_java_depth(channel, node, 'shiro')
        except Exception as e:
            log_info("shiro:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'openssl')
            self.Tool.get_openssl_info(channel, node)
        except Exception as e:
            log_info("openssl:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'polkit')
            self.Tool.get_polkit_info(channel, node)
        except Exception as e:
            log_info("polkit:[%s]\n" % (traceback.format_exc()))
        try:
            node = SubElement(root, 'k8s')
            self.Tool.get_k8s_info(channel, node)
        except Exception as e:
            log_info("k8s:[%s]\n" % (traceback.format_exc()))

        try:
            node = SubElement(root, 'zabbix')
            self.Tool.get_zabbix_info(channel, node)
        except Exception as e:
            log_info("zabbix:[%s]\n" % (traceback.format_exc()))

        return


def getinfo(channel, t_buf):
    aaa = ""
    bbb = ""
    os_vesion = ""
    switch = {'RedHat': Redhat(),
              'CentOS': Redhat(),
              'Fedora': Redhat(),
              'openeuler': Redhat(),  # by zw
              'Ubuntu': Ubuntu(),
              'Debian': Debian(),
              'SUSE': Suse(),
              'Solaris': Solaris(),
              'HUAWEI': Huawei(),
              'H3C': H3C(),
              'ZTE': ZTE(),
              'Cisco': Cisco(),
              'FreeBSD': FreeBsd(),
              'BIGCLOUD': Redhat(),
              'NEWSTART': Redhat(),
              'UnionTech': Redhat(),
              'EULER': EulerOS(),
              'ANOLIS': Redhat(),
              'LOONGNIX': Redhat(),  # by zw
              'H3LINUX': Redhat(),
              'AIX': AIX(),
              'DOPRALINUX': DOPRALINUX(),
              'ZTE_AC': ZTE_AC(),
              'Juniper': Juniper(),
              'Nokia': Nokia(),
              'HP-UX': HPUX(),
              'F5': F5(),
              'Ruijie': Ruijie(),
              'Mypower': Mypower(),
              'Extreme': Extreme(),
              'EulerOS': EulerOS(),
              'Array': Array(),
              'SkyEye 360': SkyEye360(),
              'JUNOS': JUNOS(),
              'DPtech': DPtech(),
              'HUAWEI-OLT': HuaweiOLT(),
              'ZTAC': ZTAC(),
              'ALCATEL': ALCATEL(),
              'HAOHAN': HAOHAN(),
              'A10 Networks': A10(),
              'FiberHome': FiberHome(),
              'GenieATM': GenieATM(),
              'Switch': Switch(),
              'Ericsson': Ericsson(),
              'Maipu': Maipu(),
              'Raisecom': Raisecom()
              }

    check = Check()
    # 兼容openswitch类型识别逻辑
    os_vesion = check.check_os(channel, 0, t_buf)
    log_info("os_version[%s]\n" % os_vesion)
    switch.get(os_vesion, default()).get_info(channel)
    os_version_change_to_other_list = [
        "Nokia"
    ]
    if os_vesion in os_version_change_to_other_list:
        os_vesion = "OTHER"
    try:
        node = SubElement(root, 'os_name')
        node.text = os_vesion
    except Exception as e:
        log_info("os_vesion:[%s]\n" % repr(e))
    return


def connect_close(channel, tran):
    if channel:
        channel.close()
    if tran:
        tran.close()


def del_control(src):
    dst = src

    dst = dst.replace('\x00', '')
    dst = dst.replace('\x01', '')
    dst = dst.replace('\x02', '')
    dst = dst.replace('\x03', '')
    dst = dst.replace('\x04', '')
    dst = dst.replace('\x05', '')
    dst = dst.replace('\x06', '')
    dst = dst.replace('\x07', '')
    dst = dst.replace('\x08', '')
    dst = dst.replace('\x09', '')
    dst = dst.replace('\x0A', '')
    dst = dst.replace('\x0B', '')
    dst = dst.replace('\x0C', '')
    dst = dst.replace('\x0D', '')
    dst = dst.replace('\x0E', '')
    dst = dst.replace('\x0F', '')
    dst = dst.replace('\x10', '')
    dst = dst.replace('\x11', '')
    dst = dst.replace('\x12', '')
    dst = dst.replace('\x13', '')
    dst = dst.replace('\x14', '')
    dst = dst.replace('\x15', '')
    dst = dst.replace('\x16', '')
    dst = dst.replace('\x17', '')
    dst = dst.replace('\x18', '')
    dst = dst.replace('\x19', '')
    dst = dst.replace('\x1A', '')
    dst = dst.replace('\x1B', '')
    dst = dst.replace('\x1C', '')
    dst = dst.replace('\x1D', '')
    dst = dst.replace('\x1E', '')
    dst = dst.replace('\x7F', '')
    dst = dst.replace('\r', '')
    return dst


def del_control_no_cr(src):
    dst = src
    dst = dst.replace('\x00', '')
    dst = dst.replace('\x01', '')
    dst = dst.replace('\x02', '')
    dst = dst.replace('\x03', '')
    dst = dst.replace('\x04', '')
    dst = dst.replace('\x05', '')
    dst = dst.replace('\x06', '')
    dst = dst.replace('\x07', '')
    dst = dst.replace('\x08', '')
    dst = dst.replace('\x09', '')
    dst = dst.replace('\x0B', '')
    dst = dst.replace('\x0C', '')
    dst = dst.replace('\x0E', '')
    dst = dst.replace('\x0F', '')
    dst = dst.replace('\x10', '')
    dst = dst.replace('\x11', '')
    dst = dst.replace('\x12', '')
    dst = dst.replace('\x13', '')
    dst = dst.replace('\x14', '')
    dst = dst.replace('\x15', '')
    dst = dst.replace('\x16', '')
    dst = dst.replace('\x17', '')
    dst = dst.replace('\x18', '')
    dst = dst.replace('\x19', '')
    dst = dst.replace('\x1A', '')
    dst = dst.replace('\x1B', '')
    dst = dst.replace('\x1C', '')
    dst = dst.replace('\x1D', '')
    dst = dst.replace('\x1E', '')
    dst = dst.replace('\x7F', '')
    dst = dst.replace('\x1a', '')
    dst = dst.replace('\x1b', '')
    dst = dst.replace('\x1c', '')
    dst = dst.replace('\x1d', '')
    dst = dst.replace('\x1e', '')
    dst = dst.replace('\x7f', '')
    return dst


def reg_repalce(src):
    dst = src

    dst = dst.replace('[', '\\[')
    dst = dst.replace(']', '\\]')
    dst = dst.replace('.', '\\.')
    dst = dst.replace('*', '\\*')
    dst = dst.replace('?', '\\?')
    dst = dst.replace('+', '\\+')
    dst = dst.replace('$', '\\$')
    dst = dst.replace('<', '\\<')
    dst = dst.replace('>', '\\>')
    return dst


def repr_str(buf):
    tmp = ""
    global login_detail_lt
    global err_detail
    global err_info
    log_banner(buf)

    if not buf:
        log_err("time out")
        login_stat(LOGIN_FAILED)
        return True

    for key, value in list(login_detail_lt.items()):
        desc, match_type = value
        if match_type == 1:
            if re.search(key, buf, re.I):
                if key == ".*errorcode=.*":
                    tmp = "%s--%s" % (desc, re.search(key, buf, re.I).group())
                else:
                    tmp = desc
                log_err(tmp)
                login_stat(LOGIN_FAILED)
                return True
        else:
            if buf == key:
                log_err(desc)
                login_stat(LOGIN_FAILED)
                return True

    login_stat(LOGIN_SUCCESS)
    return False


def main_direct_telnet(ip, user, passwd, port):
    return


def get_exp_buf(channel, end_lh):
    t_buf2 = ""
    for index in range(3):
        t_buf1, rst1 = recv(channel, end_lh, 3)
        log_info("t_buf1:[%s]\n" % t_buf1)
        if len(t_buf1) == 0:
            break
        t_buf2 = t_buf2 + t_buf1
    log_info("t_buf2:[%s]\n" % t_buf2)
    return t_buf2


def main_direct_ssh(ip, user, passwd, port):
    channel = None
    tran = None
    t_buf = ""
    global end_lh
    end = list()
    try:
        log_info("4A connect\n")
        channel, tran = connect_ip(user, ip, passwd, port)

        if channel:
            endwitch = '((?<!password)(\\]# |%\\]|#:|>:|$\\]|>|#|:|\\$|: |# |> |\\$ |\\]|%)$)|password has ' \
                       'expired|close|Connection timed out '

            end.append((endwitch, RULE_TYPE_RE))
            t_buf, rst = recv(channel, end, 10)
            if rst == LOGIN_TIMEOUT:
                log_err("连接超时")
                login_stat(LOGIN_FAILED)
                repr_str(t_buf)
                log_info("timeout buf:[%s]\n" % t_buf)
                connect_close(channel, tran)
                return
            # 个别服务器登录后会自动执行命令，导致异常。需要特殊处理，但是可能会影响其他服务器的采集
            # t_buf2 = get_exp_buf(channel, end_lh)
            # t_buf = t_buf + t_buf2
            log_info("buf1:[%s]\n" % t_buf)
            if repr_str(t_buf):
                connect_close(channel, tran)
                return

            try:
                host = ""
                if re.search(endwitch, t_buf):
                    host = re.search(endwitch, t_buf).group()
                log_info(host)
                # al = t_buf.split('\n')
                # host = del_control(al[-1].strip())
                # host = reg_repalce(host)
                # host = ("(%s)$" % host)
                end_lh.append((host, RULE_TYPE_MATCH))

                getinfo(channel, t_buf)
            except Exception as e:
                repr_str("safe getinfo err:[%s]\n" % (traceback.format_exc()))
        connect_close(channel, tran)
        return
    except Exception as e:
        repr_str("safe connect error:[%s]" % (traceback.format_exc()))
        connect_close(channel, tran)
        return


def main_yy(ip_4A, port_4A, user_4A, passwd_4A, ip, user, passwd, port, delimit):
    t_buf = ""
    channel = None
    tran = None
    global end_lh
    end = list()
    try:
        log_info("4A connect\n")
        channel, tran = connect_ip(user_4A, ip_4A, passwd_4A, port_4A)

        if channel:
            endwitch = "login @.*devicename:"
            end.append((endwitch, RULE_TYPE_RE))
            t_buf, rst = recv(channel, end, 240)
            if not t_buf:
                repr_str("channel time out")
                log_err("timeout t_buf:[%s]\n" % t_buf)
                connect_close(channel, tran)
                return

            log_info("buf1:[%s]\n" % t_buf)
            if not re.search("login @.*devicename", t_buf):
                connect_close(channel, tran)
                repr_str("login is failed")
                return

            cmd = "%s%s%s\n" % (user, delimit, ip)
            endwitch = "Password:"
            channel.sendall(cmd)
            del end[:]
            end.append((endwitch, RULE_TYPE_RE))
            t_buf, rst = recv(channel, end, 240)
            if not t_buf:
                log_err("连接超时")
                repr_str("channel time out")
                log_err("timeout t_buf:[%s]\n" % t_buf)
                connect_close(channel, tran)
                return
            log_info("buf2:[%s]\n" % t_buf)

            if not re.search("Password:", t_buf):
                log_err("登录失败")
                repr_str("login is failed")
                connect_close(channel, tran)
                return

            cmd = "%s\n" % passwd
            channel.sendall(cmd)
            endwitch = '((?<!password)(\]|>|>:|#|\$|# |> |\$ )$)|password has expired|close|Connection timed out|#\[m$'
            del end[:]
            end.append((endwitch, RULE_TYPE_RE))
            t_buf, rst = recv(channel, end, 240)
            if rst == LOGIN_TIMEOUT:
                log_err("timeout t_buf:[%s]\n" % t_buf)
                repr_str(t_buf)
                connect_close(channel, tran)
                return

            # 个别服务器登录后会自动执行命令，导致异常。需要特殊处理，但是可能会影响其他服务器的采集
            t_buf2 = get_exp_buf(channel, end_lh)
            t_buf = t_buf + t_buf2
            log_info("special buf:[%s]\n" % t_buf2)
            log_info("t_buf:[%s]\n" % t_buf)
            if repr_str(t_buf):
                connect_close(channel, tran)
                return
            try:
                al = t_buf.split('\n')
                host = del_control(al[-1].strip())
                end_lh.append((host, RULE_TYPE_MATCH))
                getinfo(channel, t_buf)
            except Exception as e:
                repr_str("safe getinfo err:[%s]\n" % (traceback.format_exc()))
            connect_close(channel, tran)
        return
    except Exception as e:
        repr_str("safe connect error:[%s]" % (traceback.format_exc()))
        connect_close(channel, tran)
        return


def main_szty(ip_4A, port_4A, user_4A, passwd_4A, ip, user, passwd, port, delimit):
    log_info("ssh -oKexAlgorithms=+diffie-hellman-group1-sha1 -oHostKeyAlgorithms=+ssh-dss "
             " '%s,%s'@%s -p %d'" % (user, ip, ip_4A, port_4A))
    user = "%s%s%s" % (user, delimit, ip)
    channel = None
    tran = None
    t_buf = ""
    end = list()
    try:
        log_info("4A connect\n")
        channel, tran = connect_ip(user, ip_4A, passwd, port_4A)

        if channel:
            # ljk增加诺基亚机型正则匹配,解决诺基亚机型获取不到endwitch导致的访问异常问题
            endwitch = '((?<!password)((\\]# |%\\]|#:|>:|$\\]|>|#|:|\\$|: |# |> |\\$ |\\]|%)$))|#\[m$|MAIN LEVEL COMMAND <___>'
            # endwitch = '((?<!password)((\\]# |%\\]|#:|>:|$\\]|>|#|:|\\$|: |# |> |\\$ |\\]|%)$))|#\[m$'
            end.append((endwitch, RULE_TYPE_RE))
            t_buf, rst = recv(channel, end, 240)
            if rst == LOGIN_TIMEOUT:
                repr_str(t_buf)
                log_err("timeout t_buf:[%s]\n" % t_buf)
                connect_close(channel, tran)
                return
            t_buf2 = get_exp_buf(channel, end_lh)
            t_buf = t_buf + t_buf2
            log_info("special buf:[%s]\n" % t_buf2)
            log_info("t_buf:[%s]\n" % t_buf)
            if repr_str(t_buf):
                connect_close(channel, tran)
                return
            try:
                # al = t_buf.split('\n')
                # host = del_control(al[-1].strip())
                # host = ("(%s)$" % reg_repalce(host))
                # end_lh.append((host, RULE_TYPE_RE))
                host = ""
                if re.search(endwitch, t_buf):
                    host = re.search(endwitch, t_buf).group()
                log_info("host:[%s]" % host)
                end_lh.append((host, RULE_TYPE_MATCH))
                getinfo(channel, t_buf)
            except Exception as e:
                repr_str("safe getinfo err:[%s]\n" % (traceback.format_exc()))
        connect_close(channel, tran)
        return
    except Exception as e:
        repr_str("safe connect error:[%s]" % (traceback.format_exc()))
        connect_close(channel, tran)
        return


def main_yx(ip_4A, port_4A, user_4A, passwd_4A, ip, user, passwd, port, delimit):
    # ssh'cmcc_zb_ismp#$!资源名' @ 指令通道IP
    channel = None
    tran = None
    t_buf = ""
    end = list()
    global end_lh
    user = "%s%s%s" % (user, delimit, ip)
    try:
        log_info("4A connect\n")
        channel, tran = connect_ip(user, ip_4A, passwd, port_4A)

        if channel:
            endwitch = '((?<!password)(\]|>|#|:|\$|: |# |> |\$ |%)$)|password has expired|close|Connection timed out|#\[m$'
            end.append((endwitch, RULE_TYPE_RE))
            endwitch = '\]0;(\w){0,20}@[0-9A-Za-z:\.]{0,100}$'
            end.append((endwitch, RULE_TYPE_RE))
            t_buf, rst = recv(channel, end, 240)
            if rst == LOGIN_TIMEOUT:
                log_err("timeout t_buf:[%s]\n" % t_buf)
                repr_str(t_buf)
                connect_close(channel, tran)
                return
            try:
                # t_buf2 = get_exp_buf(channel, end_lh)
                # t_buf = t_buf + t_buf2
                # log_info("special buf:[%s]\n" % t_buf2)
                log_info("t_buf:[%s]\n" % t_buf)
                if repr_str(t_buf):
                    connect_close(channel, tran)
                    return

                al = t_buf.split('\n')
                host = del_control(al[-1].strip())
                end_lh.append((host, RULE_TYPE_MATCH))
                getinfo(channel, t_buf)
            except Exception as e:
                repr_str("safe getinfo err:[%s]\n" % (traceback.format_exc()))
        connect_close(channel, tran)
        return
    except Exception as e:
        repr_str("safe connect error:[%s]" % (traceback.format_exc()))
        connect_close(channel, tran)
        return


def main_yx_plus(ip_4A, port_4A, user_4A, passwd_4A, ip, user, passwd, port, delimit):
    global end_lh
    global err_detail
    channel = None
    tran = None
    user = "%s%s%s" % (user, delimit, ip)
    try:
        log_info("4A connect\n")
        channel, tran = connect_ip(user, ip_4A, passwd, port_4A)
        if channel:
            welcome, g_status = recv_plus(channel, None, 240)
            log_info("main_yx_plus:::welcome[%s]g_status[%s]" % (welcome, g_status))
            if 1 == g_status:
                err_detail = welcome
            elif 2 == g_status:
                if not repr_str(welcome):
                    log_err("二次登录")
                    err_detail = welcome
            else:
                if not repr_str(welcome):
                    end_lh.append((welcome.rstrip()[-1], RULE_TYPE_MATCH))
                    channel.settimeout(None)
                    getinfo(channel, welcome)

        connect_close(channel, tran)
        return
    except Exception as e:
        repr_str("safe connect error:[%s]" % (traceback.format_exc()))
        connect_close(channel, tran)
        return


def main_dft(ip_4A, port_4A, user_4A, passwd_4A, ip, user, passwd, port, delimit):
    # ssh'cmcc_zb_ismp#$!资源名' @ 指令通道IP
    channel = None
    tran = None
    t_buf = ""
    end = list()
    global end_lh
    user = "%s%s%s" % (user, delimit, ip)
    try:
        log_info("4A connect\n")
        channel, tran = connect_ip(user, ip_4A, passwd, port_4A)

        if channel:
            endwitch = '(>|#|$|# |> |#\[m|\$|\$ )$'
            end.append((endwitch, RULE_TYPE_RE))
            t_buf, rst = recv(channel, end, 180)
            if rst == LOGIN_TIMEOUT:
                log_err("timeout t_buf:[%s]\n" % t_buf)
                repr_str(t_buf)
                connect_close(channel, tran)
                return
            try:
                t_buf2 = get_exp_buf(channel, end_lh)
                t_buf = t_buf + t_buf2
                log_info("special buf:[%s]\n" % t_buf2)
                log_info("t_buf:[%s]\n" % t_buf)
                if repr_str(t_buf):
                    connect_close(channel, tran)
                    return

                al = t_buf.split('\n')
                host = del_control(al[-1].strip())
                end_lh.append((host, RULE_TYPE_MATCH))
                getinfo(channel, t_buf)
            except Exception as e:
                repr_str("safe getinfo err:[%s]\n" % (traceback.format_exc()))
        connect_close(channel, tran)
        return
    except Exception as e:
        repr_str("safe connect error:[%s]" % (traceback.format_exc()))
        connect_close(channel, tran)
        return


def get_device_type(device):
    global device_lt
    for item in device_lt:
        (rule, device_type) = item
        if re.search(rule, device, re.I):
            return device_type
    return "switch"


class DBC:
    db_path = ""

    def __init__(self, db):
        self.db_path = db

    def read_break_conf(self):
        global end_lh
        conn = sqlite3.connect(self.db_path)
        cn = conn.cursor()
        sql = "SELECT RULE, RULE_TYPE FROM BREAK_CONF_TAB"
        cursor = cn.execute(sql)
        for row in cursor:
            rule = row[0]
            rule_type = row[1]
            end_lh.append((rule, rule_type))
        conn.close()

    def read_device_type(self):
        global device_lt
        conn = sqlite3.connect(self.db_path)
        cn = conn.cursor()
        sql = "SELECT RULE, DEVICE FROM DEVICE_TYPE_TAB"
        cursor = cn.execute(sql)
        for row in cursor:
            rule = row[0]
            device = row[1]
            device_lt.append((rule, device))
        conn.close()

    def read_send_cmd(self):
        global break_lt
        conn = sqlite3.connect(self.db_path)
        cn = conn.cursor()
        sql = "SELECT RULE, SEND_CMD FROM SEND_CMD_TAB"
        cursor = cn.execute(sql)
        for row in cursor:
            rule = row[0]
            send_cmd = row[1]
            break_lt.append((rule, send_cmd))

        conn.close()

    def load_login_detail(self, type):
        global login_detail_lt
        conn = sqlite3.connect(self.db_path)
        cn = conn.cursor()
        sql = "SELECT distinct RULE, DETAIL, MATCH_TYPE FROM LOGIN_DETAIL_TAB where type=%d or type=0 order by ID" % type
        cursor = cn.execute(sql)
        for row in cursor:
            rule = row[0]
            detail = row[1]
            match_type = row[2]
            if not login_detail_lt.get(rule):
                login_detail_lt[rule] = (detail, match_type)

    def init_stg(self, type_4A):
        self.read_device_type()
        self.read_send_cmd()
        self.read_break_conf()
        self.load_login_detail(type_4A)


def get_conf(conf_file):
    global conf_dt
    config = configparser.ConfigParser()
    config.read(conf_file)
    conf_dt['sw_base64'] = config.getint('SYSTEM', 'sw_base64')
    conf_dt['db_host'] = config.get('DB', 'db_host')
    conf_dt['db_port'] = config.get('DB', 'db_port')
    conf_dt['db_user'] = config.get('DB', 'db_user')
    conf_dt['db_pass'] = config.get('DB', 'db_pass')
    conf_dt['db_name'] = config.get('DB', 'db_name')


def set_log(log_path):
    global logger
    global g_ip
    # 第一步，创建一个logger
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)  # Log等级总开关
    # 第二步，创建一个handler，用于写入日志文件
    rq = time.strftime('%Y%m%d%H%M%S', time.localtime(time.time()))
    logfile = os.path.join(log_path, "%s_%s.log" % (rq, g_ip.replace(':', '-').replace('/', '')))
    fh = logging.FileHandler(logfile, mode='w')
    fh.setLevel(logging.DEBUG)  # 输出到file的log等级的开关
    # 第三步，定义handler的输出格式
    formatter = logging.Formatter("%(asctime)s - %(filename)s[line:%(lineno)d] - %(levelname)s: %(message)s")
    fh.setFormatter(formatter)
    # 第四步，将logger添加到handler里面
    logger.addHandler(fh)


def get_file():
    db_path = ""
    conf_path = ""
    log_path = ""
    sys = platform.system()
    # 修改配置文件获取方式：在当前目录寻找配置文件
    path = os.path.dirname(os.path.realpath(__file__))
    isExists = os.path.exists(path)
    if not isExists:
        os.makedirs(path)
    db_path = os.path.join(path, "assets.db")
    conf_path = os.path.join(path, "assets.conf")
    log_path = os.path.join(path, "Logs")

    return db_path, conf_path, log_path


#############test start#############
if __name__ == '__main__':
    """
    家里环境测试指令
    python /Users/admin/N-neusoft/tagv360/SafeAssets/python/python39/gather3/main.py \
    0 '' '' '' 22 MTAuMTAuMTY3LjIwMg==  root 'Yg~"b1xJ@tFZ' 22 0 '@'
    """
    starttime = datetime.datetime.now()
    tree_str = ""
    querytype = ""
    root = Element("info")
    root1 = Element("info")
    err_buf = ""
    log_buf = ""
    banner = ""
    err_detail = ""
    g_status = 0
    err_connect = ""
    xml_head = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
    importlib.reload(sys)
    ip = ""
    lang_flag = 0  # 0:UTF-8 1:GBK
    g_ip = ""
    host_end = ""
    end_lh = list()
    conn = None
    conf_dt = dict()
    device_lt = list()
    break_lt = list()
    login_detail_lt = collections.OrderedDict()
    g_dbpath, g_conf_path, log_path = get_file()
    get_conf(g_conf_path)

    logger = None

    # set_end()
    if len(sys.argv) < 12:
        set_log(log_path)
        node = SubElement(root, 'error_info')
        node.text = transfor("运行参数不足")
        node = SubElement(root, 'runtime')
        endtime = datetime.datetime.now()
        node.text = transfor("runtime:[%d]" % (endtime - starttime).seconds)
        node = SubElement(root, 'login_status')
        node.text = "%d" % LOGIN_FAILED
        node = SubElement(root, 'err_detail')
        err_detail = "运行参数不足(参数个数：[%d])" % len(sys.argv)
        node.text = transfor(del_control_no_cr(err_detail))
    else:
        type_4A = int(sys.argv[1])
        ip_4A = sys.argv[2]
        user_4A = sys.argv[3]
        passwd_4A = sys.argv[4].replace('\\', '')
        port_4A = int(sys.argv[5])
        ip = sys.argv[6]
        if conf_dt['sw_base64']:
            ip = base64.b64decode(ip).decode()
        user = sys.argv[7]
        passwd = sys.argv[8].replace('\\', '')
        port = int(sys.argv[9])
        device_type = int(sys.argv[10])
        delimit = sys.argv[11].replace('\\', '')
        buf1 = ""
        g_ip = ip
        DBC(g_dbpath).init_stg(3 if type_4A == 5 else type_4A)
        set_log(log_path)

        log_info("type_4A:[%d] ip_4A:[%s] user_4A:[%s] passwd_4A:[%s] port_4A:[%d] ip:[%s] user:[%s] passwd:[%s] "
                 "port:[%d] device_type:[%d] delimit:[%s]\n" % (type_4A, ip_4A, user_4A, passwd_4A, port_4A,
                                                                ip, user, passwd, port, device_type, delimit))

        if type_4A == 0:
            main_direct_ssh(ip, user, passwd, port)
        elif type_4A == 1:  # yiyang
            main_yy(ip_4A, port_4A, user_4A, passwd_4A, ip, user, passwd, port, delimit)
        elif type_4A == 2:  # szty
            main_szty(ip_4A, port_4A, user_4A, passwd_4A, ip, user, passwd, port, delimit)
        elif type_4A == 3:  # yx
            main_yx(ip_4A, port_4A, user_4A, passwd_4A, ip, user, passwd, port, delimit)
            # main_dft(ip_4A, port_4A, user_4A, passwd_4A, ip, user, passwd, port, delimit)
        elif type_4A == 4:  # dongfangtong
            main_dft(ip_4A, port_4A, user_4A, passwd_4A, ip, user, passwd, port, delimit)
        elif type_4A == 5:  # 黑龙江
            main_yx_plus(ip_4A, port_4A, user_4A, passwd_4A, ip, user, passwd, port, delimit)

        node = SubElement(root, 'error_info')
        if err_buf or len(err_connect) > 0:
            node.text = transfor(err_buf)
            g_status = 1
            err_detail = "%s %s" % (''.join([i if ord(i) < 128 else ' ' for i in err_detail]), err_connect)
        else:
            node.text = ""
            g_status = 0
            err_detail = ''.join([i if ord(i) < 128 else ' ' for i in err_detail])
        endtime = datetime.datetime.now()
        node = SubElement(root, 'runtime')
        node.text = transfor("runtime:[%d]" % (endtime - starttime).seconds)
        node = SubElement(root, 'login_status')
        node.text = "%d" % g_status
        node = SubElement(root, 'err_detail')
        node.text = transfor(del_control_no_cr(err_detail))
        cmd_detail = ''.join(EXE_RESULT)
        node = SubElement(root, 'detail_info')
        node.text = transfor(del_control_no_cr(cmd_detail))
    indent(root, level=0)
    try:
        tree_str = xml_head + tostring(root, encoding="utf-8").decode()
    except Exception as e:
        log_info("xml:[%s]\n" % (traceback.format_exc()))
        SubElement(root1, 'runtime')
        node = SubElement(root1, 'login_status')
        node.text = "1"
        SubElement(root1, 'err_detail')
        node = SubElement(root1, 'error_info')
        err_buf = "%s" % (traceback.format_exc())
        node.text = transfor(err_buf)
        tree_str = xml_head + tostring(root1, encoding="utf-8").decode()
    print(del_control_no_cr(tree_str))
