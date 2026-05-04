import { User, UserId } from "../../domain/entities/user.entity";

export interface GetUserInput {
    userId: UserId;
  }

export interface GetUserOutput {
    user: User | null;
  } 