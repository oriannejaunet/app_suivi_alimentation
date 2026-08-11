import { HttpError } from './errorHandler.js';

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join(', ');
      return next(new HttpError(400, message));
    }
    req.body = result.data;
    next();
  };
}

// Stocké dans `req.validatedQuery` plutôt que réaffecté sur `req.query` : sur Express 5,
// `req.query` est en lecture seule, et cette forme reste valable si on migre un jour.
export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const message = result.error.issues.map((i) => i.message).join(', ');
      return next(new HttpError(400, message));
    }
    req.validatedQuery = result.data;
    next();
  };
}
