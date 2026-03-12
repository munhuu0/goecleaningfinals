module.exports = {
  apps: [{
    name: 'goecleaning',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3002
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Logging configuration
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Process management
    max_memory_restart: '1G',
    min_uptime: '5s',
    max_restarts: 10,
    
    // Watch for changes in development only
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads'],
    
    // Graceful shutdown
    kill_timeout: 5000,
    
    // Environment variables
    env_file: '.env'
  }]
};
