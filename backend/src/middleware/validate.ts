import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ValidationError } from "../utils/errors";

type RequestPart = "body" | "query" | "params";

/**
 * Validates and coerces `req[part]` against a Zod schema, replacing it
 * with the parsed (typed, defaulted) result. Throws a 422 ValidationError
 * with field-level detail on failure.
 */
export function validate(schema: AnyZodObject, part: RequestPart = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[part]);
      (req as unknown as Record<RequestPart, unknown>)[part] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        throw new ValidationError("Request validation failed", err.flatten().fieldErrors);
      }
      throw err;
    }
  };
}
