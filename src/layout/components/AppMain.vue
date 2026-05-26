<template>
  <section class="app-main">
    <div class="routerView-content">
      <transition name="fade-transform" mode="out-in">
        <keep-alive :include="cachedViews">
          <router-view :key="key" />
        </keep-alive>
      </transition>
    </div>
  </section>
</template>
<script>
import { mapGetters } from "vuex";
export default {
  name: "AppMain",
  components: {},
  computed: {
    ...mapGetters({
      settingOptions: "settings/settingOptions",
    }),
    key() {
      return this.$route.path;
    },
    cachedViews() {
      return this.$store.state.tagsView.cachedViews;
    },
    needTagsView() {
      return this.settingOptions.tagsView;
    },
    fixedHeader() {
      return this.settingOptions.fixedHeader;
    },
  },
};
</script>
<style lang="scss" scoped>
.app-main {
  width: 100%;
  height: calc(100vh);
  position: relative;
  overflow: auto;
  background-color: #fff;
  padding-bottom: 30px;
}
.fixed-header + .app-main {
  padding-top: 3%;
}
.fixed-tags {
  width: 100%;
  position: fixed;
  z-index: 1001;
}
.routerView-content {
  padding: 10px;
}
.fixed-tags + .routerView-content {
  padding: 69px 10px 10px;
}
</style>
