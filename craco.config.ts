import path from "path";

module.exports = {
  webpack: {
    alias: {
      "@src": path.resolve(__dirname, "src/"),
      "@components": path.resolve(__dirname, "src/components"),
      "@pages": path.resolve(__dirname, "src/pages"),
      "@common": path.resolve(__dirname, "src/common"),
      "@recoil": path.resolve(__dirname, "src/common/recoil"),
      "@images": path.resolve(__dirname, "src/common/images"),
      "@utils": path.resolve(__dirname, "src/common/utils"),
      "@types": path.resolve(__dirname, "src/common/types"),
    },
  },
};
