import { getUncachableStripeClient } from "./stripeClient";

const PRODUCTS = [
  {
    name: "Creator Plan",
    description: "100 AI credits per month. Perfect for indie builders and freelancers.",
    prices: [
      {
        label: "Monthly",
        unit_amount: 1499,
        currency: "usd",
        interval: "month" as const,
        metadata: { tier: "creator", credits: "100", billing: "monthly" },
      },
      {
        label: "Yearly",
        unit_amount: 14390,
        currency: "usd",
        interval: "year" as const,
        metadata: { tier: "creator", credits: "1440", billing: "yearly" },
      },
    ],
  },
  {
    name: "Studio Plan",
    description: "300 AI credits per month. For teams and power users shipping at scale.",
    prices: [
      {
        label: "Monthly",
        unit_amount: 2999,
        currency: "usd",
        interval: "month" as const,
        metadata: { tier: "studio", credits: "300", billing: "monthly" },
      },
      {
        label: "Yearly",
        unit_amount: 28790,
        currency: "usd",
        interval: "year" as const,
        metadata: { tier: "studio", credits: "4320", billing: "yearly" },
      },
    ],
  },
  {
    name: "Credit Bundle",
    description: "200 bonus AI credits added instantly. Never runs out mid-project.",
    isOneTime: true,
    prices: [
      {
        label: "One-time",
        unit_amount: 1499,
        currency: "usd",
        metadata: { tier: "bundle", credits: "200", billing: "one_time" },
      },
    ],
  },
];

async function seedProducts() {
  const stripe = await getUncachableStripeClient();
  console.log("Seeding Stripe products and prices for AppNormal...\n");

  for (const product of PRODUCTS) {
    const existingProducts = await stripe.products.search({
      query: `name:'${product.name}' AND active:'true'`,
    });

    let productId: string;

    if (existingProducts.data.length > 0) {
      productId = existingProducts.data[0].id;
      console.log(`✓ Product already exists: ${product.name} (${productId})`);
    } else {
      const created = await stripe.products.create({
        name: product.name,
        description: product.description,
      });
      productId = created.id;
      console.log(`+ Created product: ${product.name} (${productId})`);
    }

    for (const price of product.prices) {
      const priceConfig: any = {
        product: productId,
        unit_amount: price.unit_amount,
        currency: price.currency,
        metadata: price.metadata,
      };

      if (!product.isOneTime && "interval" in price) {
        priceConfig.recurring = { interval: price.interval };
      }

      const existingPrices = await stripe.prices.list({
        product: productId,
        active: true,
      });

      const alreadyExists = existingPrices.data.some(
        (p) =>
          p.unit_amount === price.unit_amount &&
          (product.isOneTime ? !p.recurring : p.recurring?.interval === (price as any).interval),
      );

      if (alreadyExists) {
        console.log(`  ✓ Price already exists: ${price.label} (${price.unit_amount / 100} ${price.currency.toUpperCase()})`);
      } else {
        const created = await stripe.prices.create(priceConfig);
        console.log(`  + Created price: ${price.label} — ${price.unit_amount / 100} ${price.currency.toUpperCase()} (${created.id})`);
        console.log(`    Metadata: ${JSON.stringify(price.metadata)}`);
      }
    }

    console.log();
  }

  console.log("✓ Seeding complete! Webhooks will sync this data to your database automatically.");
  console.log(
    "\nIMPORTANT: Make sure each price has correct metadata (tier, credits, billing) so",
    "the webhook handler can grant the right credits on checkout completion.",
  );
}

seedProducts().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
