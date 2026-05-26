<template>
  <div class="sideBar-container">
    <logo-title v-if="showLogo" :collapse="isCollapse" />
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        ref="sideMenu"
        :default-active="activeMenu"
        :collapse="isCollapse"
        :text-color="variables.sideBarMenuText"
        :active-text-color="variables.menuActiveText"
        :collapse-transition="false"
      >
        <sidebar-item
          v-for="route in permissionRoutes"
          :key="route.path"
          :item="route"
          :base-path="route.path"
        ></sidebar-item>
      </el-menu>
    </el-scrollbar>
  </div>
</template>
<script>
import { mapGetters } from "vuex";
import LogoTitle from "../LogoTitle/index.vue";
import SidebarItem from "./SidebarItem";
import variables from "@/styles/variables.module.scss";
export default {
  name: "SidebarView",
  components: {
    LogoTitle,
    SidebarItem,
  },
  computed: {
    ...mapGetters({
      sidebar: "app/sidebar",
      permissionRoutes: "permission/routes",
      settingOptions: "settings/settingOptions",
      activeMenuPath: "app/activeMenuPath",
    }),
    activeMenu() {
      const route = this.$route;
      const { meta, path } = route;
      if (meta.activeMenu) {
        return meta.activeMenu;
      }
      return path;
    },
    showLogo() {
      return this.settingOptions.sidebarLogo;
    },
    isCollapse() {
      return !this.sidebar.opened;
    },
    variables() {
      return variables;
    },
  },
  methods: {
    expandToPath(targetPath) {
      if (!this.$refs.sideMenu) return;
      const parts = targetPath.split("/").filter(Boolean);
      let currentPath = "";
      for (let i = 0; i < parts.length - 1; i++) {
        currentPath += "/" + parts[i];
        this.$refs.sideMenu.open(currentPath);
      }
    },
  },
  watch: {
    activeMenuPath(val) {
      if (val) {
        this.$nextTick(() => {
          this.expandToPath(val);
        });
      }
    },
  },
};
</script>
