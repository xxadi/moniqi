<template>
  <div class="sidebar-logo-container">
    <transition name="sidebarLogoFade">
      <router-link
        v-if="fullHeader || !collapse"
        key="collapse"
        class="sidebar-logo-link"
        to="/"
      >
        <el-image
          class="sidebar-logo"
          :src="logoSrc"
          v-if="logoIcon"
        ></el-image>
        <div class="title">电信诈骗管控系统</div>
      </router-link>
      <router-link v-else key="expand" class="sidebar-logo-link" to="/">
        <el-image
          class="sidebar-logo"
          :src="logoSrc"
          v-if="logoIcon"
        ></el-image>
      </router-link>
    </transition>
  </div>
</template>
<script>
import { mapGetters } from "vuex";
export default {
  name: "LogoTitle",
  props: {
    collapse: {
      type: Boolean,
      required: true,
    },
  },
  computed: {
    ...mapGetters({
      settingOptions: "settings/settingOptions",
    }),
    fullHeader() {
      return this.settingOptions.fullHeader;
    },
    logoIcon() {
      return this.settingOptions.logoIcon;
    },
  },
  data() {
    return {
      logoSrc: require("@/assets/logo.png"),
    };
  },
};
</script>
<style lang="scss" scoped>
.sidebarLogoFade-enter-active {
  transition: opacity 1s;
}
.sidebarLogoFade-enter,
.sidebarLogoFade-leave-to {
  opacity: 0;
}
.sidebar-logo-container {
  height: 50px;
  display: flex;
  align-items: center;
  .sidebar-logo-link {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    & .sidebar-logo {
      width: 20px;
    }
    & .title {
      margin-left: 12px;
      font-size: 18px;
      font-weight: bold;
      color: #fff;
    }
    }
}
</style>
