const getters = {
  sidebar: (state) => state.app.sidebar,
  size: (state) => state.app.size,
  settingOptions: (state) => state.app.settingOptions,
  systemConfig: (state) => state.app.systemConfig,
  keepTimer: (state) => state.app.keepTimer,
  visitedViews: (state) => state.tagsView.visitedViews,
  cachedViews: (state) => state.tagsView.cachedViews,
  name: (state) => state.user.name,
  userId: (state) => state.user.userId,
  elements: (state) => state.user.elements,
  dicts: (state) => state.dict.dicts,
  permission_routes: (state) => state.permission.routes,
  topbarRouters: (state) => state.permission.topbarRouters,
  defaultRoutes: (state) => state.permission.defaultRoutes,
  sidebarRouters: (state) => state.permission.sidebarRouters,
};
export default getters;
