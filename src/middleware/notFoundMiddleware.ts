import type { NextFunction, Request, Response } from "express";
import { Errors } from "ds-express-errors";

export function notFound(_req: Request, _res: Response, next: NextFunction) {
    next(Errors.NotFound("Route not found"));
}
