<template>
  <div class="menu-search" ref="searchContainer">
    <el-input
      ref="searchInput"
      v-model="searchQuery"
      placeholder="搜索菜单"
      prefix-icon="el-icon-search"
      clearable
      size="small"
      class="search-input"
      @input="handleInput"
      @focus="handleFocus"
      @clear="handleClear"
      @keydown.enter.prevent="handleEnter"
      @keydown.esc="handleClear"
    />
    <div v-show="showResults" class="search-results" :style="dropdownStyle">
      <template v-if="filteredItems.length > 0">
        <div
          v-for="(item, index) in filteredItems"
          :key="index"
          class="search-result-item"
          @click="handleSelect(item)"
          @mouseenter="hoverIndex = index"
          @mouseleave="hoverIndex = -1"
          :class="{ 'is-hovered': hoverIndex === index }"
        >
          <div class="item-title">{{ item.title }}</div>
          <div class="item-breadcrumb">{{ item.breadcrumb.join(' > ') }}</div>
        </div>
      </template>
      <div v-else-if="searchQuery" class="search-no-result">
        未找到匹配的菜单
      </div>
    </div>
  </div>
</template>

<script>
import { constantRoutes } from "@/router";

function joinPath(base, child) {
  if (!base) return child;
  if (!child) return base;
  return base.replace(/\/+$/, "") + "/" + child.replace(/^\/+/, "");
}

function flattenRoutes(routes, basePath, breadcrumb) {
  var result = [];
  for (var i = 0; i < routes.length; i++) {
    var route = routes[i];
    if (route.hidden) continue;
    var currentPath = joinPath(basePath, route.path);
    var meta = route.meta || {};
    var currentBreadcrumb = breadcrumb.concat(meta.title ? [meta.title] : []);
    if (route.children && route.children.length > 0) {
      result = result.concat(
        flattenRoutes(route.children, currentPath, currentBreadcrumb)
      );
    } else if (meta.title) {
      result.push({
        title: meta.title,
        routePath: currentPath,
        breadcrumb: currentBreadcrumb,
      });
    }
  }
  return result;
}

export default {
  name: "MenuSearch",
  data: function () {
    return {
      searchQuery: "",
      showResults: false,
      hoverIndex: -1,
      flatMenuItems: [],
      dropdownPos: { top: 0, left: 0, width: 320 },
    };
  },
  computed: {
    filteredItems: function () {
      if (!this.searchQuery) return [];
      var query = this.searchQuery.toLowerCase();
      return this.flatMenuItems.filter(function (item) {
        if (item.title.toLowerCase().indexOf(query) !== -1) return true;
        for (var i = 0; i < item.breadcrumb.length; i++) {
          if (item.breadcrumb[i].toLowerCase().indexOf(query) !== -1) return true;
        }
        return false;
      });
    },
    dropdownStyle: function () {
      return {
        position: "fixed",
        top: this.dropdownPos.top + "px",
        left: this.dropdownPos.left + "px",
        width: this.dropdownPos.width + "px",
      };
    },
  },
  methods: {
    loadRoutes: function () {
      try {
        var items = flattenRoutes(constantRoutes, "", []);
        this.flatMenuItems = items;
        window.__menuSearchItems = items;
        console.log("[MenuSearch] loaded items:", items.length);
      } catch (e) {
        console.error("[MenuSearch] loadRoutes error:", e);
      }
    },
    updateDropdownPosition: function () {
      var self = this;
      this.$nextTick(function () {
        if (!self.$refs.searchInput) return;
        var el = self.$refs.searchInput.$el;
        var rect = el.getBoundingClientRect();
        self.dropdownPos = {
          top: rect.bottom + 4,
          left: rect.left,
          width: Math.max(rect.width, 320),
        };
      });
    },
    handleInput: function () {
      this.showResults = true;
      this.hoverIndex = -1;
      this.updateDropdownPosition();
    },
    handleFocus: function () {
      this.showResults = true;
      this.updateDropdownPosition();
    },
    handleClear: function () {
      this.searchQuery = "";
      this.showResults = false;
      this.hoverIndex = -1;
    },
    handleEnter: function () {
      if (this.filteredItems.length > 0) {
        var index = this.hoverIndex >= 0 ? this.hoverIndex : 0;
        this.handleSelect(this.filteredItems[index]);
      }
    },
    handleSelect: function (item) {
      this.$store.dispatch("app/setActiveMenuPath", item.routePath);
      this.$router.push(item.routePath);
      if (!this.$store.getters["app/sidebar"].opened) {
        this.$store.dispatch("app/toggleSideBar");
      }
      this.handleClear();
    },
    handleClickOutside: function (e) {
      if (
        this.$refs.searchContainer &&
        !this.$refs.searchContainer.contains(e.target)
      ) {
        this.showResults = false;
      }
    },
  },
  mounted: function () {
    console.log("[MenuSearch] mounted, constantRoutes:", typeof constantRoutes);
    this.loadRoutes();
    document.addEventListener("click", this.handleClickOutside);
  },
  beforeDestroy: function () {
    document.removeEventListener("click", this.handleClickOutside);
  },
};
</script>

<style lang="scss" scoped>
.menu-search {
  position: relative;
  margin-right: 20px;

  .search-input {
    width: 220px;
    ::v-deep .el-input__inner {
      border-radius: 20px;
      background-color: #f5f7fa;
      border: 1px solid #e4e7ed;

      &:focus {
        border-color: #409eff;
        background-color: #fff;
      }
    }
  }

  .search-results {
    max-height: 400px;
    overflow-y: auto;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    z-index: 9999;
  }

  .search-result-item {
    padding: 10px 16px;
    cursor: pointer;
    border-bottom: 1px solid #f5f5f5;
    transition: background-color 0.2s;

    &:last-child {
      border-bottom: none;
    }

    &.is-hovered {
      background-color: #ecf5ff;
    }

    .item-title {
      font-size: 14px;
      color: #303133;
      line-height: 1.4;
    }

    .item-breadcrumb {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
      line-height: 1.4;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .search-no-result {
    padding: 16px;
    text-align: center;
    color: #909399;
    font-size: 14px;
  }
}
</style>
