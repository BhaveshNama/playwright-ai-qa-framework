/*
 * Invalid data remains deterministic because these values represent known
 * validation conditions rather than data where uniqueness is useful.
 */
export const invalidEmailScenarios = [
  {
    caseId: 'REG-NEG-001',
    description: 'rejects an email without an at-sign',
    input: 'invalid-email.example.test',
  },
  {
    caseId: 'REG-NEG-002',
    description: 'requires an email address',
    input: '',
  },
  {
    caseId: 'REG-NEG-003',
    description: 'rejects an email without a local part',
    input: '@example.test',
  },
] as const;
