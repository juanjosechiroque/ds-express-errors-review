import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";

export function validate(schema: ZodType): RequestHandler {
    return (req: Request, _res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body ?? {});
        if (!result.success) return next(result.error);
        req.body = result.data;
        next();
    };
}

export function validateParams(schema: ZodType): RequestHandler {
    return (req: Request, _res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.params ?? {});
        if (!result.success) return next(result.error);
        req.params = result.data as Record<string, string>;
        next();
    };
}

export function validateQuery(schema: ZodType): RequestHandler {
    return (req: Request, _res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.query ?? {});
        if (!result.success) return next(result.error);
        req.validatedQuery = result.data;
        next();
    };
}
