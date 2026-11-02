import type { Locator, Page } from '@playwright/test';

import { routes } from '../config/routes';
import { BasePage } from './base.page';

interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export class CheckoutPage extends BasePage {
  protected readonly path = routes.checkout;

  readonly heading: Locator;
  readonly orderSummary: Locator;
  readonly checkoutTotal: Locator;
  readonly fullNameInput: Locator;
  readonly addressLine1Input: Locator;
  readonly cityInput: Locator;
  readonly stateInput: Locator;
  readonly postalCodeInput: Locator;
  readonly countryInput: Locator;
  readonly placeOrderButton: Locator;
  readonly checkoutMessage: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.getByRole('heading', {
      name: 'Checkout',
      level: 1,
    });

    this.orderSummary = page.getByRole('region', {
      name: 'Order summary',
    });

    this.checkoutTotal = page.getByLabel('Checkout total');

    this.fullNameInput = page.getByLabel('Full name');
    this.addressLine1Input = page.getByLabel('Address line 1');
    this.cityInput = page.getByLabel('City');
    this.stateInput = page.getByLabel('State');
    this.postalCodeInput = page.getByLabel('Postal code');
    this.countryInput = page.getByLabel('Country');

    this.placeOrderButton = page.getByRole('button', {
      name: 'Place order',
    });

    this.checkoutMessage = page.getByRole('status');
  }

  async fillShippingAddress(address: ShippingAddress): Promise<void> {
    await this.fullNameInput.fill(address.fullName);
    await this.addressLine1Input.fill(address.addressLine1);
    await this.cityInput.fill(address.city);
    await this.stateInput.fill(address.state);
    await this.postalCodeInput.fill(address.postalCode);
    await this.countryInput.fill(address.country);
  }

  async placeOrder(): Promise<void> {
    await this.placeOrderButton.click();
  }
}
