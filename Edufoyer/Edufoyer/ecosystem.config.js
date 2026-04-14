module.exports = {
  apps: [{
    name: 'edufoyer-backend',
    script: './backend/server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      MONGODB_URI: 'mongodb+srv://shubham18031975_db_user:BYLhEzNit6q4xR3Y@cluster0.graepni.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
      JWT_SECRET: 'edufoyer-super-secret-jwt-key-2024-production-secure-random-string-12345',
      FRONTEND_URL: 'https://edufoyer.com',
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: 587,
      SMTP_USER: 'edufoyer2025@gmail.com',
      SMTP_PASS: 'xwpq dtev kihd nklx',
      LIVEKIT_URL: 'wss://remote-opgy8hh4.livekit.cloud',
      LIVEKIT_API_KEY: 'API5oP2DQKAEx6q',
      LIVEKIT_API_SECRET: 'Y5Du8RkZ9d7efUwEPLxuvf08rssktCvqfFG5p0Beee7R'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
