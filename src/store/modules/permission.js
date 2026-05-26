/**
 * 路由访问权限
 */
import { constantRoutes } from "@/router";

const state = {
  routes: [],
  addRoutes: [],
};
const mutations = {
  SET_ROUTES: (state, routes) => {
    state.addRoutes = routes;
    state.routes = constantRoutes.concat(routes);
  },
};
const actions = {
  generateRoutes({ commit }) {
    return new Promise((resolve) => {
      const accessedRoutes = [];
      commit("SET_ROUTES", accessedRoutes);
      resolve(accessedRoutes);
    });
  },
};
const getters = {
  routes: (state) => {
    return state.routes;
  },
};
export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
