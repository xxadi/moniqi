<template>
  <div class="navbar">
    <div class="left-container">
      <LogoTitle
        v-if="fullHeader"
        class="navBar-logo-title"
        :collapse="isCollapse"
      />
      <ToggleIcon
        :is-active="isCollapse"
        class="toggleIcon-container"
        @toggleClick="toggleSideBar"
      ></ToggleIcon>
      <Breadcrumb v-if="breadcrumb" class="breadcrumb-container"></Breadcrumb>
      <TopNav v-if="topNav" class="topNav-container"></TopNav>
    </div>
    <div class="right-container">
      <el-tooltip content="全屏" effect="dark" placement="bottom">
        <ScreenFull v-if="screenFull" class="screenFull" />
      </el-tooltip>
      <el-tooltip
        v-if="selectSize"
        content="Global Size"
        effect="dark"
        placement="bottom"
      >
        <SizeSelect class="sizeSelect" />
      </el-tooltip>
      <el-dropdown class="avatar-container" trigger="click">
        <el-dropdown-menu slot="dropdown">
          <router-link to="/">
            <el-dropdown-item> 主页 </el-dropdown-item>
          </router-link>
          <router-link to="/personal">
            <el-dropdown-item divided> 个人中心 </el-dropdown-item>
          </router-link>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>
<script>
import { mapGetters } from "vuex";
import LogoTitle from "../LogoTitle/index.vue";
import ToggleIcon from "./ToggleIcon.vue";
import Breadcrumb from "./Breadcrumb.vue";
import ScreenFull from "./Screenfull";
import SizeSelect from "./SizeSelect";
import TopNav from "./TopNav";

export default {
  name: "navBar",
  components: {
    LogoTitle,
    ToggleIcon,
    ScreenFull,
    SizeSelect,
    Breadcrumb,
    TopNav,
  },
  data() {
    return {};
  },
  computed: {
    ...mapGetters({
      sidebar: "sidebar",
      settingOptions: "settingOptions",
      name: "name",
    }),
    isCollapse() {
      return false;
    },
    fullHeader() {
      return false;
    },
    breadcrumb() {
      return this.settingOptions.breadcrumb;
    },
    topNav() {
      return this.settingOptions.topNav || true;
    },
    screenFull() {
      return this.settingOptions.screenFull;
    },
    selectSize() {
      return this.settingOptions.selectSize;
    },
  },
  methods: {
    toggleSideBar() {
      this.$store.dispatch("app/toggleSideBar");
    },
  },
};
</script>
<style lang="scss" scoped>
@import "~@/styles/variables.module.scss";
.navbar {
  display: flex;
  justify-content: space-between;
  height: 50px;
  overflow: hidden;
  position: relative;
  background-color: #fff;
  border: 10px solid #db0c0c;
  // border-bottom: 1px solid #ececec;
  // background-image: linear-gradient(to right, #1a2f5a, #148ec3, #1a2f5a);
  color: #000;
}
.navBar-logo-title {
  width: $sideBarWidth;
}
.left-container {
  display: flex;
  align-items: center;
  .toggleIcon-container {
    width: 26px;
    height: 26px;
    margin-left: 15px;
    cursor: pointer;
  }
  .breadcrumb-container,
  .topNav-container {
    margin-left: 15px;
  }
    }
.right-container {
  display: flex;
  align-items: center;
  .screenFull,
  .sizeSelect {
    color: #000;
    margin-right: 10px;
  }
  .avatar-container {
    margin-right: 15px;
    color: #000;

    .avatar-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      .user-name {
        cursor: pointer;
        padding-left: 5px;
      }
      .user-avatar {
        cursor: pointer;
        width: 32px;
        height: 32px;
        margin-left: 14px;
        // border-radius: 10px;
      }

      // .el-icon-caret-bottom {
      // cursor: pointer;
      // position: absolute;
      // right: -20px;
      // top: 20px;
      // font-size: 12px;
      // }
    }
  }
    }
</style>
