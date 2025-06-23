const { getDefaultConfig } = require('@expo/metro-config');

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);

  return {
    ...config,
    resolver: {
      ...config.resolver,
      blockList: [
        /.*\.js\.flow/, // Игнорировать все flow-файлы
      ],
    },
  };
})();
