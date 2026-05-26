<template>
  <a
    :class="[
      'cs-link',
      type ? `cs-link--${type}` : '',
      disabled && 'is-disabled',
      underline && !disabled && 'is-underline',
    ]"
    :href="disabled ? null : href"
    v-bind="$attrs"
    @click="handleClick"
  >
    <i :class="icon" v-if="icon"></i>

    <span
      v-if="$slots.default"
      :class="['cs-link--inner', underline && !disabled && 'is-underline']"
    >
      <slot></slot>
    </span>

    <template v-if="$slots.icon"
      ><slot v-if="$slots.icon" name="icon"></slot
    ></template>
  </a>
</template>

<script>
export default {
  name: "CustomLink",
  props: {
    type: {
      type: String,
      default: "default",
    },
    underline: {
      type: Boolean,
      default: true,
    },
    disabled: Boolean,
    href: String,
    icon: String,
  },

  methods: {
    handleClick(event) {
      if (!this.disabled) {
        if (!this.href) {
          this.$emit("click", event);
        }
    }
    },
  },
};
</script>
<style lang="scss" scoped>
.cs-link {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  position: relative;
  text-decoration: none;
  outline: 0;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 1;
  padding-right: 6px;
}
.cs-link + .cs-link {
  padding-left: 6px;
  border-left: 1px solid #d8d8d8;
}
.cs-link--inner {
  position: relative;
  font-size: 12px;
}
.cs-link--inner.is-underline:hover:after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  height: 0;
  bottom: -2px;
  border-bottom: 1px solid #0070cc;
}
.cs-link--default {
  color: #0070cc;
}
.cs-link.is-disabled {
  cursor: not-allowed;
  color: #c0c4cc;
}
.cs-link [class*="el-icon-"] + span {
  margin-left: 5px;
}
</style>
