const state = {
  sidebar: {
    opened: window.sessionStorage.getItem("sidebarStatus")
      ? !!+window.sessionStorage.getItem("sidebarStatus")
      : true,
  },
  size: window.sessionStorage.getItem("size") || "small",
  activeMenuPath: "",
};
const mutations = {
  TOGGLE_SIDEBAR: (state) => {
    state.sidebar.opened = !state.sidebar.opened;
    if (state.sidebar.opened) {
      window.sessionStorage.setItem("sidebarStatus", 1);
    } else {
      window.sessionStorage.setItem("sidebarStatus", 0);
    }
  },
  SET_SIZE: (state, size) => {
    state.size = size;
    window.sessionStorage.setItem("size", size);
  },
  SET_ACTIVE_MENU_PATH: (state, path) => {
    state.activeMenuPath = path;
  },
};
const actions = {
  toggleSideBar({ commit }) {
    commit("TOGGLE_SIDEBAR");
  },
  setSize({ commit }, size) {
    commit("SET_SIZE", size);
  },
  setActiveMenuPath({ commit }, path) {
    commit("SET_ACTIVE_MENU_PATH", path);
  },
};
const getters = {
  sidebar: (state) => state.sidebar,
  size: (state) => state.size,
  activeMenuPath: (state) => state.activeMenuPath,
};
export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
