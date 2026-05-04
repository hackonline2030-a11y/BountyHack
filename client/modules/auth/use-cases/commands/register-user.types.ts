/**
 * Register use case input/output types.
 * @see https://brandonjf.github.io/brandon-clean-architecture/type-system-validation/
 */

export interface RegisterUserInput {
  email: string;
  password: string;
  name: string;
}

export interface RegisterUserOutput {
  userId: string;
  success: boolean;
}
