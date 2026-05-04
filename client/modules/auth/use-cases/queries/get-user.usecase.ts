import type { UserRepository } from "@modules/auth/domain/repositories/user.repository";
import type { GetUserInput, GetUserOutput } from "../dto/get-user.dto";

export class GetUserUseCase {
    constructor(private userRepo: UserRepository) {} 
  
    async execute(input: GetUserInput): Promise<GetUserOutput> {
      const user = await this.userRepo.findById(input.userId);
      return { user };
    }
  }