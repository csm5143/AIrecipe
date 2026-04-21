import { Router } from 'express';
import type { RequestHandler } from 'express';

export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function createModuleRouter(): Router {
  return Router({ mergeParams: true });
}

export function validateBody(schema: any): RequestHandler {
  return async (req, res, next) => {
    next();
  };
}
