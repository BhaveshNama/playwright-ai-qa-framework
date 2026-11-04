import type {
  ExecutionRunScope,
  ExecutionRunSource,
  ExecutionRunType,
} from '../models/execution-history.model';

export interface ExecutionRunContext {
  runType: ExecutionRunType;
  source: ExecutionRunSource;
  scope: ExecutionRunScope;
}

const runTypes: ExecutionRunType[] = [
  'framework',
  'api',
  'full-regression',
  'targeted',
  'browser',
  'unknown',
];

const runSources: ExecutionRunSource[] = ['local', 'ci'];

const runScopes: ExecutionRunScope[] = [
  'framework',
  'api',
  'chromium',
  'firefox',
  'webkit',
  'mixed',
  'unknown',
];

function validateValue<T extends string>(
  name: string,
  value: string,
  allowedValues: readonly T[],
): T {
  if (!allowedValues.includes(value as T)) {
    throw new Error(`Invalid ${name}: ${value}. Supported values: ${allowedValues.join(', ')}`);
  }

  return value as T;
}

export function getExecutionRunContext(): ExecutionRunContext {
  const runTypeValue = process.env.INTELLIGENCE_RUN_TYPE ?? 'unknown';

  const sourceValue =
    process.env.INTELLIGENCE_RUN_SOURCE ?? (process.env.CI === 'true' ? 'ci' : 'local');

  const scopeValue = process.env.INTELLIGENCE_RUN_SCOPE ?? 'unknown';

  return {
    runType: validateValue('INTELLIGENCE_RUN_TYPE', runTypeValue, runTypes),

    source: validateValue('INTELLIGENCE_RUN_SOURCE', sourceValue, runSources),

    scope: validateValue('INTELLIGENCE_RUN_SCOPE', scopeValue, runScopes),
  };
}
