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
  // Extrair token do header Authorization
  const token = extractTokenFromHeader(opts.req.headers.authorization);
  
  let user: AuthUser | null = null;
  
  // Tentar autenticar o usuário se token estiver presente
  if (token) {
    try {
      user = AuthService.verifyToken(token);
    } catch (error) {
      // Token inválido - user permanece null
      console.warn('Token inválido fornecido:', error);
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user, // Usuário autenticado ou null
    token,
  };
}
