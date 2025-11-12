import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { AuthService, extractTokenFromHeader, type AuthUser } from "./auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: AuthUser | null;
  token: string | undefined;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // Extract token from Authorization header
  const token = extractTokenFromHeader(opts.req.headers.authorization);

  let user: AuthUser | null = null;

  // Try to authenticate user if token is present
  if (token) {
    try {
      user = AuthService.verifyToken(token);
    } catch (error) {
      // Invalid token - user remains null
      console.warn("Invalid token provided:", error);
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user, // Authenticated user or null
    token,
  };
}
