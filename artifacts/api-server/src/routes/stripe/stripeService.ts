import { getUncachableStripeClient } from "./stripeClient";

export class StripeService {
  async createCustomer(email: string, userId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.create({
      email,
      metadata: { userId },
    });
  }

  async createCheckoutSession(params: {
    customerId: string;
    priceId: string;
    mode: "subscription" | "payment";
    successUrl: string;
    cancelUrl: string;
    userId: string;
    tier: string;
    credits: number;
  }) {
    const stripe = await getUncachableStripeClient();
    return await stripe.checkout.sessions.create({
      customer: params.customerId,
      payment_method_types: ["card"],
      line_items: [{ price: params.priceId, quantity: 1 }],
      mode: params.mode,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      client_reference_id: params.userId,
      metadata: {
        userId: params.userId,
        tier: params.tier,
        credits: String(params.credits),
      },
    });
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async getPrice(priceId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.prices.retrieve(priceId);
  }
}

export const stripeService = new StripeService();
