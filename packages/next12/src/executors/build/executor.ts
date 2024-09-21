import { ExecutorContext } from '@nx/devkit';
import { execSync } from 'child_process';
import * as path from 'path';

export interface NextBuildExecutorOptions {
  outputPath: string;
  fileReplacements: { replace: string; with: string }[];
  nextConfig?: string;
  buildLibsFroSource?: boolean;
}

export default async function runExecutor(
  options: NextBuildExecutorOptions,
  context: ExecutorContext
) {
  const projectRoot = context.workspace?.projects[context.projectName as string]
    .root as string;
  const projectPath = path.join(context.root, projectRoot);

  process.env.NODE_ENV = process.env.NODE_ENV || 'production';

  try {
    execSync('npx next build', {
      stdio: 'inherit',
      cwd: projectPath,
      env: {
        ...process.env,
        NODE_ENV: 'production',
      },
    });
    console.log('Next.js build completed successfully.');
    return { success: true };
  } catch (error) {
    console.error('Build failed:', error);
    return { success: false };
  }
}
