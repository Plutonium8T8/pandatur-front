const path = require("path");

module.exports = {
  webpack: {
    alias: {
      "@components": path.resolve(__dirname, "src", "Components"),
      "@utils": path.resolve(__dirname, "src", "Components", "utils"),
      "@hooks": path.resolve(__dirname, "src", "hooks"),
      "@contexts": path.resolve(__dirname, "src", "contexts"),
      "@pages": path.resolve(__dirname, "src", "pages"),
      "@layout": path.resolve(__dirname, "src", "layout"),
      "@api": path.resolve(__dirname, "src", "api"),
      "@app-constants": path.resolve(__dirname, "src", "app-constants"),
    },
  },
};
