// Web implementation of Billing plugin (not supported on web)
export class BillingWeb {
  async initialize() {
    throw new Error('Billing is only available on native platforms');
  }

  async queryProductDetails() {
    throw new Error('Billing is only available on native platforms');
  }

  async purchaseProduct() {
    throw new Error('Billing is only available on native platforms');
  }

  async acknowledgePurchase() {
    throw new Error('Billing is only available on native platforms');
  }

  async queryPurchases() {
    throw new Error('Billing is only available on native platforms');
  }
}

