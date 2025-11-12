import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { ENV } from "./env";
import * as db from "../db";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  crm?: string;
  specialty?: string;
};

// Validation schemas
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  crm: z.string().optional(),
  specialty: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export class AuthService {
  private static readonly JWT_SECRET = ENV.cookieSecret || "vitaia-secret-key";
  private static readonly JWT_EXPIRES_IN = "7d";
  private static readonly SALT_ROUNDS = 12;

  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  // Verify password
  static async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Generate JWT token
  static generateToken(user: AuthUser): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );
  }

  // Verify JWT token
  static verifyToken(token: string): AuthUser {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      return {
        id: decoded.id,
        name: decoded.name || "",
        email: decoded.email,
        role: decoded.role || "user",
        crm: decoded.crm,
        specialty: decoded.specialty,
      };
    } catch (error) {
      throw new Error("Token inválido");
    }
  }

  // Login user
  static async login(
    email: string,
    password: string
  ): Promise<{
    user: AuthUser;
    token: string;
  }> {
    try {
      // Get user by email
      const users = await db.getUsersByEmail(email);
      if (users.length === 0) {
        throw new Error("Credenciais inválidas");
      }

      const user = users[0];

      // Verify password
      if (!user.password) {
        throw new Error("Credenciais inválidas");
      }

      const isValidPassword = await this.verifyPassword(
        password,
        user.password
      );
      if (!isValidPassword) {
        throw new Error("Credenciais inválidas");
      }

      // Create auth user object
      const authUser: AuthUser = {
        id: user.id,
        name: user.name || "",
        email: user.email || "",
        role: user.role || "user",
        crm: user.crm || undefined,
        specialty: user.specialty || undefined,
      };

      // Generate token
      const token = this.generateToken(authUser);

      // Update last signed in
      await db.updateUserLastSignIn(user.id);

      return { user: authUser, token };
    } catch (error) {
      throw new Error(
        "Falha no login: " +
          (error instanceof Error ? error.message : "Erro desconhecido")
      );
    }
  }

  // Register user
  static async register(input: RegisterInput): Promise<{
    user: AuthUser;
    token: string;
  }> {
    try {
      // Check if user already exists
      const existingUsers = await db.getUsersByEmail(input.email);
      if (existingUsers.length > 0) {
        throw new Error("Usuário já existe com este email");
      }

      // Hash password
      const hashedPassword = await this.hashPassword(input.password);

      // Create user
      const userId = await db.createUser({
        openId: `email_${Date.now()}`, // Generate unique openId
        name: input.name,
        email: input.email,
        password: hashedPassword,
        loginMethod: "email",
        role: "user",
        crm: input.crm,
        specialty: input.specialty,
        isActive: true,
        emailVerified: false,
        twoFactorEnabled: false,
        failedLoginAttempts: 0,
      });

      // Get created user
      const user = await db.getUserById(userId);
      if (!user) {
        throw new Error("Erro ao criar usuário");
      }

      // Create auth user object
      const authUser: AuthUser = {
        id: user.id,
        name: user.name || "",
        email: user.email || "",
        role: user.role || "user",
        crm: user.crm || undefined,
        specialty: user.specialty || undefined,
      };

      // Generate token
      const token = this.generateToken(authUser);

      return { user: authUser, token };
    } catch (error) {
      throw new Error(
        "Falha no registro: " +
          (error instanceof Error ? error.message : "Erro desconhecido")
      );
    }
  }

  // Change password
  static async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      // Get user
      const user = await db.getUserById(userId);
      if (!user) {
        throw new Error("Usuário não encontrado");
      }

      // Verify current password
      if (user.password) {
        const isValidPassword = await this.verifyPassword(
          currentPassword,
          user.password
        );
        if (!isValidPassword) {
          throw new Error("Senha atual incorreta");
        }
      }

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update password
      await db.updateUserPassword(userId, hashedPassword);
    } catch (error) {
      throw new Error(
        "Falha ao alterar senha: " +
          (error instanceof Error ? error.message : "Erro desconhecido")
      );
    }
  }
}

// Extract token from Authorization header
export function extractTokenFromHeader(
  authHeader?: string
): string | undefined {
  if (!authHeader) return undefined;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return undefined;
  }

  return parts[1];
}
