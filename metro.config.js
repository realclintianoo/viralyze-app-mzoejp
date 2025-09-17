
const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Use turborepo to restore the cache when possible
config.cacheStores = [
  new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
];

// Add support for .cjs files (needed for some OpenAI dependencies)
config.resolver.sourceExts.push('cjs');

// Ensure proper handling of node modules
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

// Add node modules that need special handling
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

module.exports = config;
