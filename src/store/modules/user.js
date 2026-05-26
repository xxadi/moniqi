import { getToken, setToken, removeToken } from "@/utils/auth";
import { resetRouter } from "@/router";

const getDefaultState = () => {
  return {
    token: getToken(),
    name: "",
    menus: [],
    elements: [], // 按钮权限
  };
};
const state = getDefaultState();
const mutations = {
  RESET_STATE: (state) => {
    Object.assign(state, getDefaultState());
  },
  SET_TOKEN: (state, token) => {
    state.token = token;
  },
  SET_NAME: (state, name) => {
    state.name = name;
  },
  SET_MENUS: (state, menus) => {
    state.menus = menus;
  },
};
const actions = {
  login({ commit }) {
    return new Promise((resolve) => {
      commit("SET_TOKEN", "token");
      setToken("token");
      resolve();
    });
  },
  getInfo({ commit }) {
    return new Promise((resolve) => {
      const data = {
        menus: [],
        name: "admin",
      };
      commit("SET_MENUS", data.menus);
      commit("SET_NAME", data.name);
      resolve(data);
    });
  },
  logout({ commit }) {
    return new Promise((resolve) => {
      removeToken(); //一定要先清除cookie中token
      commit("RESET_STATE");
      resetRouter();
      resolve();
    });
  },
  resetToken({ commit }) {
    return new Promise((resolve) => {
      removeToken(); //一定要先清除cookie中token
      commit("RESET_STATE");
      resolve();
    });
  },
};
const getters = {
  token: (state) => state.token,
  name: (state) => state.name,
  menus: (state) => state.menus,
  dictionary: (state) => state.dictionary,
};
export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
