<template>
  <div>
    <div class="welcome">欢迎使用资产安全管理平台</div>
    <img
      style="width: 30%; height: auto; margin: 5% 35%"
      :src="indexImageURL"
    />
  </div>
</template>
<script>
export default {
  name: "dashboardPage",
  components: {},
  data() {
    return {
      indexImageURL: require("@/assets/dashboardBg.png"),
    };
  },
};
</script>
<style lang="scss">
.welcome {
  text-align: center;
  font-size: 30px;
}
</style>
