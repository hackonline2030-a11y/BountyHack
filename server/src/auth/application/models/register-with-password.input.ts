/** Credential payload for registering a user (application / port boundary). */
export interface RegisterWithPasswordInput {
  email: string;
  username: string;
  password: string;
}
