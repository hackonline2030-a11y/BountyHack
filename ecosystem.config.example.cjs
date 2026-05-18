/**
 * PM2 example for VPS (Debian, nginx → 127.0.0.1:3000 / :3001).
 *
 *   cp ecosystem.config.example.cjs ecosystem.config.cjs
 *   # edit paths/user if needed
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 */
module.exports = {
  apps: [
    {
      name: "api",
      cwd: "/home/deploy/bugbountyapp/server",
      script: "dist/main.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
    {
      name: "next-app",
      cwd: "/home/deploy/bugbountyapp/client",
      script: ".next/standalone/server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "3001",
        HOSTNAME: "127.0.0.1",
      },
    },
  ],
};
