/**
 * Login use case input/output types.
 * @see https://brandonjf.github.io/brandon-clean-architecture/type-system-validation/
 */

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface LoginUserOutput {
  userId: string;
  success: boolean;
}
