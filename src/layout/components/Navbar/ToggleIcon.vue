<template>
  <div @click="toggleClick">
    <!-- <svg
      :class="{ 'is-active': !isActive }"
      class="toggleIcon"
      viewBox="0 0 1024 1024"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      width="64"
      height="64"
    >
      <path
        d="M0 64h1024v128H0V64z m0 768h1024v128H0v-128z m0-384h640v128H0V448z m768-128l256 196.672L768 704V320z"
        fill="#666666"
      />
    </svg> -->
    <svg
      :class="{ 'is-active': isActive }"
      class="toggleIcon"
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g id="Group 18">
        <path
          id="Vector"
          d="M22.0441 19.6828H3.96094C3.56992 19.6828 3.25 20.0027 3.25 20.3937C3.25 20.7848 3.56992 21.1047 3.96094 21.1047H22.0416C22.4326 21.1047 22.7525 20.7848 22.7525 20.3937C22.7551 20.0027 22.4352 19.6828 22.0441 19.6828ZM22.0441 5.0832H3.96094C3.56992 5.0832 3.25 5.40312 3.25 5.79414C3.25 6.18516 3.56992 6.50508 3.96094 6.50508H22.0416C22.4326 6.50508 22.7525 6.18516 22.7525 5.79414C22.7551 5.40312 22.4352 5.0832 22.0441 5.0832ZM22.0441 14.8078H9.64844C9.25742 14.8078 8.9375 15.1277 8.9375 15.5187C8.9375 15.9098 9.25742 16.2297 9.64844 16.2297H22.0441C22.4352 16.2297 22.7551 15.9098 22.7551 15.5187C22.7551 15.1277 22.4352 14.8078 22.0441 14.8078ZM22.0441 9.92265H9.64844C9.25742 9.92265 8.9375 10.2426 8.9375 10.6336C8.9375 11.0246 9.25742 11.3445 9.64844 11.3445H22.0441C22.4352 11.3445 22.7551 11.0246 22.7551 10.6336C22.7551 10.2426 22.4352 9.92265 22.0441 9.92265ZM3.30332 12.8934L6.72852 9.73223V16.0545L3.30332 12.8934Z"
          fill="#666666"
        />
      </g>
    </svg>
  </div>
</template>
<script>
export default {
  name: "toggleIcon",
  props: {
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    toggleClick() {
      this.$emit("toggleClick");
    },
  },
};
</script>
<style lang="scss" scoped>
.toggleIcon {
  display: inline-block;
  vertical-align: middle;
  width: 100%;
  height: 100%;
  color: red;
}
.toggleIcon.is-active {
  transform: rotate(180deg);
}
</style>
