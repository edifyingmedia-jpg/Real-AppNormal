import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import anthropicRouter from "./anthropic";
import publishedRouter from "./published";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(anthropicRouter);
router.use(publishedRouter);

export default router;
