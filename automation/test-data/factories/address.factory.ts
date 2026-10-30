import { faker } from '@faker-js/faker';

export interface AddressData {
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/*
 * Address data is synthetic and intended for disposable test scenarios.
 * Overrides allow deterministic values where a test verifies a specific rule.
 */
export function createAddressData(overrides: Partial<AddressData> = {}): AddressData {
  return {
    addressLine1: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    postalCode: faker.location.zipCode(),
    country: 'United States',
    ...overrides,
  };
}
