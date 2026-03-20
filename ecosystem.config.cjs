module.exports = {
  apps: [
    {
      name: "hr-portal-production",
      script: "./server/server.js",
      instances: 1, // Number of instances to run
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
