# "author": "xiaozhublog <zhu.qch@neusoft.com>",
# vue2-admin-template

> 建议查看Vue风格指南，更优美的书写代码![文档](https://cn.vuejs.org/v2/style-guide/)

# 进入项目目录
cd vue2-admin-template

# 安装依赖
npm install

# 建议不要直接使用 cnpm 安装以来，会有各种诡异的 bug。可以通过如下操作解决 npm 下载速度慢的问题
npm install --registry=https://registry.npm.taobao.org

# 启动服务
npm run serve

## 特别提示！！！请知悉。
+ 1、开启tag多标签，同时开启keep-alive。 页面name需与router中name一致，页面name不写或者与路由不匹配不缓存，菜单暂无是否缓存配置
+ 2、纯前端路由，配置请参考路由index.js中注释
+ 3、按钮级权限，直接配置v-permission 对应权限标识
+ 4、数据使用mock.js。

## 功能
- 登录/注销
- 权限验证
- 基础权限管理
- Svg Sprite 图标
- 表格,表单,详情页,模糊搜索等 二次封装


## 目录结构
```shell
├── public                     // 入口文件
├── src                        // 源代码
│   ├── api                    // 所有请求
│   ├── assets                 // 主题 图片等静态资源
│   ├── components             // 全局公用组件
│   ├── directive              // 全局指令
│   ├── icons                  // 项目svg icons
│   ├── router                 // 路由
│   ├── store                  // 全局 store
│   ├── styles                 // 全局样式
│   ├── utils                  // 全局公用方法
│   ├── views                  // views
│   ├── App.vue                // 入口页面
│   ├── main.js                // 入口js 初始化 加载组件等
│   └── permission.js          // 权限管理
│   └── settings.js            // 基础功能设置
├── ..browserslistrc           // 浏览器兼容
├── .eslintignore              // eslint 忽略项
├── .eslintrc.js               // eslint 配置项
├── .gitignore                 // git 忽略项
├── babel.config.js            // babel-loader 配置
├── jsconfig.js                // 路径引入
└── package.json               // package.json
└── vue.config.js              // webpack相关配置

```
