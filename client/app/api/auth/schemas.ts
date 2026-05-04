import { z } from "zod";

/**
 * Boundary validation schemas for auth API routes.
 * Use Zod at boundaries (API routes, form inputs) - validates before use case.
 * @see https://brandonjf.github.io/brandon-clean-architecture/type-system-validation/
 */

export const RegisterRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
});

export const LoginRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
