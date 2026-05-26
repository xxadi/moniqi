<template>
  <div class="app-wrapper" :class="classObj">
    <!-- <div style="background-color: red; z-index: 1002; position: absolute; width: 100%; height: 5%; top: -6%;"></div> -->
    <div v-if="hasHeader" :class="{ 'fixed-header': fixedHeader }">
      <Navbar></Navbar>
    </div>
    <!-- 左侧菜单栏 -->
    <sidebar v-if="sidebarMenu" class="sidebar-container"></sidebar>
    <!-- 内容区 -->
    <div class="main-container" :class="{ 'sidebar-menu-hide': !sidebarMenu }">
      <app-main></app-main>
      <setting v-if="showSettings"></setting>
    </div>
  </div>
</template>
<script>
import { mapGetters } from "vuex";
import AppMain from "./components/AppMain.vue";
import Sidebar from "./components/Sidebar/index.vue";
import Navbar from "./components/NavbarCopy/index.vue";
import Setting from "./components/Setting/index.vue";
import { FALSE } from "sass";
export default {
  name: "LayoutView",
  components: {
    AppMain,
    Sidebar,
    Navbar,
    Setting,
  },
  data() {
    return {};
  },
  computed: {
    ...mapGetters({
      sidebar: "app/sidebar",
      settingOptions: "settings/settingOptions",
    }),
    classObj() {
      return {
        hideSidebar: !this.sidebar.opened,
        openSidebar: this.sidebar.opened,
      };
    },
    showSettings() {
      return this.settingOptions.showSettings;
    },
    sidebarMenu() {
      return this.settingOptions.sidebarMenu;
    },
    hasHeader() {
      return this.settingOptions.hasHeader;
    },
    fullHeader() {
      return this.settingOptions.fullHeader;
    },
    fixedHeader() {
      return this.settingOptions.fixedHeader;
    },
  },
};
</script>
<style lang="scss" scoped>
@import "~@/styles/mixin.scss";
@import "~@/styles/variables.module.scss";

.app-wrapper {
  @include clearfix;
  width: 100%;
  height: 100%;
  position: relative;
}

.sidebar-menu-hide {
  margin-left: 0 !important;
}

.fixed-header {
  z-index: 1002;
  position: flex;
  width: 100%;
  height: 50px;
  top: -6%;
  transition: width 0.28s;
}

.full-header {
  width: 100% !important;
  padding: 0;
  z-index: 1004;
}

.hideSidebar .fixed-header {
  width: calc(100% - 64px);
}
</style>
