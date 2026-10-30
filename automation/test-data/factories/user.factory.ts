import { faker } from '@faker-js/faker';

/*
 * Represents customer data used by registration and account scenarios.
 *
 * Password is deliberately part of the generated test-data contract rather
 * than being read from environment configuration because these are synthetic
 * disposable users, not shared automation credentials.
 */
export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/*
 * Generates unique synthetic user data while allowing individual scenarios
 * to override only the values relevant to the behaviour under test.
 */
export function createUserData(overrides: Partial<UserData> = {}): UserData {
  const uniqueReference = faker.string.alphanumeric({
    length: 8,
    casing: 'lower',
  });

  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: `qa.${uniqueReference}@example.test`,
    password: `Qa!${faker.string.alphanumeric(12)}`,
    ...overrides,
  };
}
