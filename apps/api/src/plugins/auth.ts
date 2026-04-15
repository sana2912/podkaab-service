// JWT auth plugin that resolves the current user from the Authorization header.
import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { appConfig } from "../config/app-config";
import { JWT_EXPIRY } from "../config/constants";

export interface JwtPayload {
  userId: string;
  email: string;
}

export const authPlugin = new Elysia({ name: "auth" })
  .use(
    jwt({
      name: "jwt",
      secret: appConfig.auth.jwtSecret,
      exp: JWT_EXPIRY,
    })
  )
  .derive({ as: "global" }, async ({ jwt, headers }) => {
    const authHeader = headers["authorization"];
    if (!authHeader?.startsWith("Bearer ")) {
      return { userId: undefined as string | undefined };
    }

    const token = authHeader.slice(7);
    const payload = await jwt.verify(token);
    if (!payload || typeof payload !== "object" || !("userId" in payload)) {
      return { userId: undefined as string | undefined };
    }

    return { userId: payload["userId"] as string };
  });
