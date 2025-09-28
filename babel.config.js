module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Keep your alias here
      ['module-resolver', { alias: { '@': '.' } }],
    ],
  };
};
