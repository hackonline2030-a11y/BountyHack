const path = require('path');
const { composePlugins, withNx } = require('@nx/webpack');

module.exports = composePlugins(
  // Default Nx composable plugin
  withNx(),
  // Custom composable plugin
  (config) => {
    // Prisma 7 generated client uses `.js` in import paths while sources are .ts (see prisma/schema generator output).
    config.resolve = config.resolve ?? {};
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js'],
    };
    // hitlimit: bundle ESM (package is `type: module`; Node CJS cannot require export subpaths at runtime).
    config.resolve.alias = {
      ...config.resolve.alias,
      '@joint-ops/hitlimit/nest': path.resolve(
        __dirname,
        'node_modules/@joint-ops/hitlimit/dist/nest.js',
      ),
      '@joint-ops/hitlimit/stores/redis': path.resolve(
        __dirname,
        'node_modules/@joint-ops/hitlimit/dist/stores/redis.js',
      ),
    };
    config.externals = [
      nodeExternals({
        modulesDir: path.resolve(__dirname, 'node_modules'),
        allowlist: [/^@joint-ops\/hitlimit/, /^ioredis/],
      }),
    ];
    return config;
  }
);
