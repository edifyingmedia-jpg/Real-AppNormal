import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { WebhookHandlers } from "./routes/stripe/webhookHandlers";
import { handleStripeBusinessEvent } from "./routes/stripe/eventHandlers";
import { logger } from "./lib/logger";

const app: Express = express();

// Fix TS2349: Use 'default' if available to get the callable function
const pinoMiddleware = (pinoHttp as any).default || pinoHttp;

app.use(
  pinoMiddleware({
    logger,
    serializers: {
      req: (req: any) => ({
        id: req.id,
        method: req.method,
        url: req.url?.split("?")[0],
      }),
      res: (res: any) => ({
        statusCode: res.statusCode,
      }),
    },
  }),
);

// Fix TS7006: Added Request and Response types
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      res.status(400).json({ error: "Missing stripe-signature" });
      return;
    }
    const sig = Array.isArray(signature) ? signature[0] ?? "" : signature;

    try {
      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      await handleStripeBusinessEvent(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      logger.error({ err: error.message }, "Webhook processing error");
      res.status(400).json({ error: "Webhook processing error" });
    }
  },
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  clerkMiddleware((req: Request) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.use("/api", router);

export default app;
