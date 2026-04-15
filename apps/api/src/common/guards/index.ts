// Route guards shared across API modules.
import { Elysia } from "elysia";
import { Errors } from "../errors";

/**
 * Guard that requires a valid JWT userId to be present in the store.
 * Use `.use(authGuard)` before protected route groups.
 */
export const authGuard = new Elysia({ name: "auth-guard" }).derive(
  { as: "scoped" },
  ({ store, set }) => {
    const s = store as Record<string, unknown>;
    const userId = s["userId"] as string | undefined;
    if (!userId) {
      const err = Errors.unauthorized();
      set.status = err.statusCode;
      throw err;
    }
    return { userId };
  }
);
