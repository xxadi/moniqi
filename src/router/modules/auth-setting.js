/* Layout */
import Layout from "@/layout";
const authSetting = [
  {
    path: "/auth-setting",
    name: "AuthSetting",
    component: Layout,
    redirect: "/auth-setting/users",
    meta: { title: "系统管理", icon: "setting" },
    children: [
      {
        path: "users",
        name: "usersView",
        component: () => import("@/views/auth-setting/users/index"),
        meta: { title: "用户管理" },
      },
      {
        path: "roles",
        name: "rolesView",
        component: () => import("@/views/auth-setting/roles/index"),
        meta: { title: "角色管理" },
      },
      {
        path: "menus",
        name: "menusView",
        component: () => import("@/views/auth-setting/menus/index"),
        meta: { title: "菜单管理" },
      },
      {
        path: "auth",
        name: "authView",
        component: () => import("@/views/auth-setting/auth/index"),
        meta: { title: "权限管理" },
      },
    ],
  },
];
export default authSetting;
