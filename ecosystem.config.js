module.exports = {
  apps: [{
    name: 'botlabs-notify',
    script: 'src/index.js',
    instances: 1,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
    env: {
      NODE_ENV: 'production'
    }
  }]
};
