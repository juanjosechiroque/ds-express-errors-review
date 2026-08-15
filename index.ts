import app from "./src/app.js";
import { PORT } from "./src/config.js";
import { connectDB, disconnectDB } from "./src/database.js";
import logger from "./src/utils/logger.js";
import { initGlobalHandlers, gracefulHttpClose } from "ds-express-errors";

await connectDB();

const server = app.listen(PORT, () => {
    logger.info({ port: PORT }, "Server started");
});

server.on("error", (err: Error) => {
    logger.error({ err }, "Server failed to start");
    process.exit(1);
});

initGlobalHandlers({
    closeServer: gracefulHttpClose(server),

    onShutdown: async (_signal) => {
        await disconnectDB();
    },
});
