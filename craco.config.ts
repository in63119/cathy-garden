import path from "path";

module.exports = {
  webpack: {
    alias: {
      "@src": path.resolve(__dirname, "src/"),
      "@components": path.resolve(__dirname, "src/components"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@recoil": path.resolve(__dirname, "src/recoil"),
      "@images": path.resolve(__dirname, "public/images"),
    },
  },
};
