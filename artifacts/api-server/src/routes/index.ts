import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import anthropicRouter from "./anthropic";
import publishedRouter from "./published";
import scrapeRouter from "./scrape";
import stripeRouter from "./stripe";
import usersRouter from "./users";
import aiProxyRouter from "./ai-proxy";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(anthropicRouter);
router.use(publishedRouter);
router.use(scrapeRouter);
router.use(stripeRouter);
router.use(usersRouter);
router.use(aiProxyRouter);

export default router;
