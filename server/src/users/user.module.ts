import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoUser } from './adapters/mongo/mongo-user';
import { MongoUserRepository } from './adapters/mongo/mongo-user-repository';
import { PrismaUserRepository } from './adapters/postgre-prisma/prisma-user-repository';

import {
  I_USER_REPOSITORY,
  IUserRepository,
} from './ports/user-repository.interface';
import { UsersController } from './controllers/users.controller';
import { AddUsername } from './commands/add-username';
import { CommonModule } from '../core/common.module';
import { DATABASE_MODES } from '../shared/database-mode';
import { variables } from '../shared/variables.config';
import { GetUserByIdQuery } from './queries/get-user-by-id';
import { ListUsersAdminSummariesQuery } from './queries/list-users-admin-summaries.query';
import { DeleteUserCompletelyCommand } from './commands/delete-user-completely.command';
import { DeleteOwnAccountCommand } from './commands/delete-own-account.command';
import { VerifyProfilePasswordCommand } from './commands/verify-profile-password.command';
import { UpdateOwnProfileCommand } from './commands/update-own-profile.command';
import { InMemoryUserRepository } from './adapters/in-memory/in-memory-user-repository';

function resolveUserRepositoryClass() {
  switch (variables.database) {
    case DATABASE_MODES.MONGODB:
      return MongoUserRepository;
    case DATABASE_MODES.POSTGRESQL_PRISMA:
    case DATABASE_MODES.MYSQL_PRISMA:
      return PrismaUserRepository;
    case DATABASE_MODES.IN_MEMORY:
      return InMemoryUserRepository;
    default:
      return InMemoryUserRepository;
  }
}

const mongoFeatureImports =
  variables.database === DATABASE_MODES.MONGODB
    ? [
        MongooseModule.forFeature([
          {
            name: MongoUser.CollectionName,
            schema: MongoUser.Schema,
          },
        ]),
      ]
    : [];

@Module({
  imports: [
    CommonModule,
    forwardRef(() => AuthModule),
    ...mongoFeatureImports,
  ],
  controllers: [UsersController],
  providers: [
    {
      provide: I_USER_REPOSITORY,
      useClass: resolveUserRepositoryClass(),
    },
    {
      provide: AddUsername,
      inject: [I_USER_REPOSITORY],
      useFactory: (repository: IUserRepository) => {
        return new AddUsername(repository);
      },
    },
    {
      provide: GetUserByIdQuery,
      inject: [I_USER_REPOSITORY],
      useFactory: (repository) => {
        return new GetUserByIdQuery(repository);
      },
    },
    {
      provide: ListUsersAdminSummariesQuery,
      inject: [I_USER_REPOSITORY],
      useFactory: (repository: IUserRepository) => {
        return new ListUsersAdminSummariesQuery(repository);
      },
    },
    {
      provide: DeleteUserCompletelyCommand,
      inject: [I_USER_REPOSITORY],
      useFactory: (repository: IUserRepository) => {
        return new DeleteUserCompletelyCommand(repository);
      },
    },
    DeleteOwnAccountCommand,
    VerifyProfilePasswordCommand,
    UpdateOwnProfileCommand,
  ],
  exports: [
    ...(variables.database === 'MONGODB' ? [MongooseModule] : []),
    I_USER_REPOSITORY,
  ],
})
export class UserModule {}
