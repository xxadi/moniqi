import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

import "normalize.css/normalize.css"; // 重写css
// import "font-awesome/css/font-awesome.min.css";
import ElementUI from "element-ui"; // 引入Element-UI
import "element-ui/lib/theme-chalk/index.css";

import "@/styles/index.scss"; // 全局 css

import "./icons"; // 图标

import "./router/routers-guards"; // router路由守卫（权限处理）

import "@/components/componentsRegister"; // 自定义组件全局注册

Vue.use(ElementUI, {
  size: window.sessionStorage.getItem("size") || "small",
});
Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");
