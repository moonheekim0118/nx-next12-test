import { ExecutorContext } from '@nx/devkit';
import { spawn } from 'child_process';
import * as path from 'path';

export interface NextServeExecutorOptions {
  port: number;
  hostname: string;
  dev?: boolean;
}

export default async function runExecutor(
  options: NextServeExecutorOptions,
  context: ExecutorContext
) {
  const projectRoot = context.workspace.projects[context.projectName].root;
  const projectPath = path.join(context.root, projectRoot);

  const port = options.port || 3000;
  const hostname = options.hostname || 'localhost';
  const dev = options.dev !== false;

  try {
    console.log(
      `Starting Next.js ${dev ? 'development' : 'production'} server...`
    );

    const nextCommand = dev ? 'next dev' : 'next start';
    const nextProcess = spawn(
      'npx',
      [...nextCommand.split(' '), '-p', port.toString(), '-H', hostname],
      {
        stdio: 'inherit',
        cwd: projectPath,
        env: {
          ...process.env,
          NODE_ENV: dev ? 'development' : 'production',
        },
      }
    );

    return new Promise<{ success: boolean }>((resolve) => {
      nextProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true });
        } else {
          console.error(`Next.js server exited with code ${code}`);
          resolve({ success: false });
        }
      });
    });
  } catch (error) {
    console.error('Failed to start Next.js server:', error);
    return { success: false };
  }
}
