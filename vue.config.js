const { defineConfig } = require("@vue/cli-service");
const path = require("path");
const defaultSettings = require("./src/settings.js");

function resolve(dir) {
  return path.join(__dirname, dir);
}
const name = defaultSettings.title || "Vue2+Element+Mock"; // 浏览器标题

const port = process.env.port || process.env.npm_config_port || 8888; // 端口号

module.exports = defineConfig({
  /* 默认情况下，Vue CLI 会假设你的应用是被部署在一个域名的根路径上，
  例如 https://www.my-app.com/。
  如果应用被部署在一个子路径上，你就需要用这个选项指定这个子路径。
  例如，如果你的应用被部署在 https://www.my-app.com/my-app/，
  则设置 publicPath 为 /my-app/ */
  // publicPath: "/SafeAssets/static/admin/vueAdminShenji",
  publicPath: "/",
  transpileDependencies: true,
  productionSourceMap: false,
  devServer: {
    port: port,
  },
  configureWebpack: {
    resolve: {
      fallback: {
        path: require.resolve("path-browserify"),
      },
    },
  },
  chainWebpack(config) {
    // 修复 CopyPlugin 的 ignore 规则：项目路径含括号导致 glob 匹配失败
    config.plugin("copy").tap((args) => {
      args[0].patterns[0].globOptions.ignore = ["**/.DS_Store", "**/index.html"];
      return args;
    });
    // index.html中注入标题
    config.plugin("html").tap((args) => {
      args[0].title = name;
      return args;
    });
    // 设置 svg-sprite-loader
    config.module.rule("svg").exclude.add(resolve("src/icons")).end();
    config.module
      .rule("icons")
      .test(/\.svg$/)
      .include.add(resolve("src/icons"))
      .end()
      .use("svg-sprite-loader")
      .loader("svg-sprite-loader")
      .options({
        symbolId: "icon-[name]",
      })
      .end();
  },
});
