import express from "express";
import { pinoHttp } from "pino-http";
import router from "./router.js";
import { errorHandler } from "ds-express-errors";
import { notFound } from "./middleware/notFoundMiddleware.js";
import { requestIdMiddleware } from "./middleware/requestIdMiddleware.js";
import { NODE_ENV } from "./config.js";
import logger from "./utils/logger.js";
import type { Request } from "express";

const app = express();

app.use(requestIdMiddleware);

if (NODE_ENV !== "test") {
    app.use(
        pinoHttp({
            logger,
            genReqId: (req: Request) => req.id,
            customSuccessMessage: () => "request completed",
            customErrorMessage: () => "request failed",
            serializers: {
                req: (req: Record<string, unknown>) => ({
                    id: req["id"],
                    method: req["method"],
                    url: req["url"],
                }),
                res: (res: Record<string, unknown>) => ({ statusCode: res["statusCode"] }),
            },
        })
    );
}

app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
    res.json({ status: "running" });
});

app.use("/v1", router);
app.use(notFound);
app.use(errorHandler);

export default app;
