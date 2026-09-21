const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);
const originalResolveRequest = config.resolver?.resolveRequest;

// react-native-maps is a native-only module with no web target. On web, swap a
// placeholder in so the customer app bundles in a browser (see
// web-stubs/react-native-maps.ts). Native builds keep the real implementation.
//
// fontfaceobserver measures test string 'BESbswy' which causes 6000ms timeout on
// icon fonts (Ionicons) on web. Swap our safe web stub in on web platform.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && moduleName === "react-native-maps") {
    return { type: "sourceFile", filePath: path.join(__dirname, "web-stubs", "react-native-maps.ts") };
  }
  if (platform === "web" && (moduleName === "fontfaceobserver" || moduleName.startsWith("fontfaceobserver/"))) {
    return { type: "sourceFile", filePath: path.join(__dirname, "web-stubs", "fontfaceobserver.ts") };
  }
  return originalResolveRequest
    ? originalResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;