import router from "@/router";
import store from "@/store";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { getToken } from "@/utils/auth";
NProgress.configure({ showSpinner: false });

const whiteList = ["/login"];

router.beforeEach(async (to, from, next) => {
  NProgress.start();
  // const hasToken = getToken();
  // if (hasToken) {
  //   if (to.path === "/login") {
  //     next({ path: "/" });
  //   } else {
      const hasRoles =
        store.getters["permission_routes"] &&
        store.getters["permission_routes"].length > 0;
      if (hasRoles) {
        next();
      } else {
        await store.dispatch("user/getInfo");
        await store.dispatch("permission/generateRoutes");
        next({ ...to, replace: true });
      }
  //   }
  // } else {
  //   if (whiteList.indexOf(to.path) !== -1) {
  //     next();
  //   } else {
  //     next(`/login`);
      NProgress.done();
  //   }
  // }
});

router.afterEach(() => {
  NProgress.done();
});
