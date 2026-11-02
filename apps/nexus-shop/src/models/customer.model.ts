/*
 * Represents a synthetic NexusShop customer.
 *
 * The initial application uses deterministic local customers so authentication
 * scenarios remain repeatable across local and CI test executions.
 */
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isActive: boolean;
}
