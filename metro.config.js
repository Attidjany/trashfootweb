// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Map "@/..." to the project root, so "@/hooks/..." -> "hooks/..."
config.resolver = config.resolver || {};
config.resolver.alias = { ...(config.resolver.alias || {}), '@': __dirname };

module.exports = config;
