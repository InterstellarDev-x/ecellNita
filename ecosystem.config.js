const path = require("node:path");

module.exports = {
  apps: [
    {
      name: "backend",
      cwd: path.join(__dirname, "backend"),
      script: "index.js",
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      autorestart: true,
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 3000,
      exp_backoff_restart_delay: 100,
      kill_timeout: 10000,
      listen_timeout: 10000,
      max_memory_restart: "512M",
      time: true,
      merge_logs: true,
      env: {
        NODE_ENV: "production",
        PORT: 4000,
      },
    },
  ],
};
