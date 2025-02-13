import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: "ScamMinder - AI-Powered Shield of Trust",
    description: "Get alerted when visiting unsafe websites.",
    permissions: [
      "tabs",
      "activeTab",
      "storage",
      "unlimitedStorage",
      "webNavigation",
      "scripting",
    ],
    host_permissions: ["https://scamminder.com/"],
    action: {},
  },
  extensionApi: "chrome",
  modules: ["@wxt-dev/module-react"],
});
