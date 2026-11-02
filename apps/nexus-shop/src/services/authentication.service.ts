import { customers } from '../data/customers.data';
import type { Customer } from '../models/customer.model';

export type AuthenticationFailureReason = 'INVALID_CREDENTIALS' | 'INACTIVE_ACCOUNT';

export type AuthenticationResult =
  | {
      success: true;
      customer: Omit<Customer, 'password'>;
    }
  | {
      success: false;
      reason: AuthenticationFailureReason;
    };

/*
 * AuthenticationService owns credential validation for the synthetic
 * NexusShop application.
 *
 * HTTP status codes and UI messages remain outside this service because those
 * are responsibilities of the API and presentation layers.
 */
export class AuthenticationService {
  authenticate(email: string, password: string): AuthenticationResult {
    const customer = customers.find(
      (candidate) => candidate.email === email && candidate.password === password,
    );

    if (!customer) {
      return {
        success: false,
        reason: 'INVALID_CREDENTIALS',
      };
    }

    if (!customer.isActive) {
      return {
        success: false,
        reason: 'INACTIVE_ACCOUNT',
      };
    }

    /*
     * Never return the stored password to consumers of the authentication
     * service.
     */
    const { password: _password, ...safeCustomer } = customer;

    return {
      success: true,
      customer: safeCustomer,
    };
  }
}

export const authenticationService = new AuthenticationService();
