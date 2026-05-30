const sharedAppOptions = {
  script: 'node_modules/next/dist/bin/next',
  args: 'start',
  cwd: process.cwd(),
  instances: 1,
  exec_mode: 'fork',
  log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  merge_logs: true,
  autorestart: true,
  max_memory_restart: '1G',
  kill_timeout: 10000,
  listen_timeout: 10000,
  watch: false,
  ignore_watch: ['node_modules', '.next', 'logs'],
};

module.exports = {
  apps: [
    {
      ...sharedAppOptions,
      name: 'krimvk',
      env_file: '.env',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
    },
    {
      ...sharedAppOptions,
      name: 'krimvk-dev',
      env_file: '.env.dev',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: './logs/error-dev.log',
      out_file: './logs/out-dev.log',
    },
  ],
};
