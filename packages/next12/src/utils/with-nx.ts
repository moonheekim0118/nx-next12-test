import type { Configuration as WebpackConfig, RuleSetRule } from 'webpack';
import { join } from 'path';
import { workspaceRoot, workspaceLayout } from '@nrwl/devkit';

interface NextConfig {
  webpack?: (config: WebpackConfig, options: any) => WebpackConfig;
  [key: string]: any;
}

interface NextJsRuleSetRule extends RuleSetRule {
  oneOf?: NextJsRuleSetRule[];
  issuer?: {
    and?: string[];
    or?: string[];
  } & RuleSetRule['issuer'];
}

function isNextJsRuleSetRule(rule: unknown): rule is NextJsRuleSetRule {
  return typeof rule === 'object' && rule !== null && 'oneOf' in rule;
}

export default function withNx(nextConfig: NextConfig = {}) {
  const userWebpack = nextConfig.webpack || ((x) => x);

  return {
    ...nextConfig,
    webpack: (config: WebpackConfig, options: any) => {
      options.defaultLoaders.babel.options.babelrc = true;
      options.defaultLoaders.babel.options.rootMode = 'upward';

      const includes = [join(workspaceRoot, workspaceLayout().libsDir)];

      const nextCssLoaders = config.module?.rules?.find(isNextJsRuleSetRule);

      if (nextCssLoaders?.oneOf) {
        nextCssLoaders.oneOf.forEach((rule) => {
          if (
            isNextJsRuleSetRule(rule) &&
            rule.sideEffects === false &&
            rule.test &&
            ['css', 'scss', 'sass'].some((ext) =>
              String(rule.test).includes(ext)
            )
          ) {
            rule.issuer = rule.issuer || {};
            if (typeof rule.issuer === 'object' && rule.issuer !== null) {
              rule.issuer.or = rule.issuer.and
                ? (rule.issuer.and as string[]).concat(includes)
                : includes;
              delete rule.issuer.and;
            }
          }
        });
      }

      addNxEnvVariables(config);

      return userWebpack(config, options);
    },
  };
}

function getNxEnvironmentVariables() {
  return Object.keys(process.env)
    .filter((env) => /^NX_/i.test(env))
    .reduce((env, key) => {
      env[key] = process.env[key] as string;
      return env;
    }, {} as Record<string, string>);
}

function addNxEnvVariables(config: WebpackConfig) {
  const definePlugin = config.plugins?.find((plugin) => {
    return (
      typeof plugin === 'object' &&
      plugin !== null &&
      'definitions' in plugin &&
      plugin.definitions &&
      'process.env.NODE_ENV' in plugin.definitions
    );
  }) as unknown as { definitions: Record<string, string> } | undefined;

  if (definePlugin) {
    const env = getNxEnvironmentVariables();
    Object.entries(env)
      .map(([name, value]) => [`process.env.${name}`, JSON.stringify(value)])
      .filter(([name]) => !(name in definePlugin.definitions))
      .forEach(([name, value]) => (definePlugin.definitions[name] = value));
  }
}
