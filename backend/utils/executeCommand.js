const { exec } = require('child_process');

function executeCommand(command, options = {}) {
  const timeout = options.timeout ?? 60000;
  const maxBuffer = options.maxBuffer ?? 10 * 1024 * 1024;
  const profile = options.profile ?? process.env.AWS_PROFILE ?? 'default';

  return new Promise((resolve, reject) => {
    exec(
      command,
      {
        timeout,
        maxBuffer,
        env: {
          ...process.env,
          AWS_PROFILE: profile,
          AWS_PAGER: '',
          ...options.env,
        },
      },
      (error, stdout, stderr) => {
        if (error) {
          const commandError = new Error(stderr || error.message || 'Command execution failed.');
          commandError.code = error.code;
          commandError.stdout = stdout;
          commandError.stderr = stderr;
          commandError.signal = error.signal;
          commandError.killed = error.killed;
          commandError.command = command;
          return reject(commandError);
        }

        return resolve({
          stdout,
          stderr,
        });
      }
    );
  });
}

module.exports = executeCommand;