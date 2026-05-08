import { forwardRef, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { AuthModule } from '../auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoUser } from './adapters/mongo/mongo-user';
import { MongoUserRepository } from './adapters/mongo/mongo-user-repository';
import { PostgreUser } from './adapters/postgre/postgre-user';
import { PostgreUserRepository } from './adapters/postgre/postgre-user-repository';
import { USER_PG_POOL } from './adapters/postgre/postgre-pool.token';
import { PrismaUserRepository } from './adapters/postgre-prisma/prisma-user-repository';

import {
  I_USER_REPOSITORY,
  IUserRepository,
} from './ports/user-repository.interface';
import { UsersController } from './controllers/users.controller';
import { AddUsername } from './commands/add-username';
import { CommonModule } from '../core/common.module';
import { variables } from '../shared/variables.config';
import { GetUserByIdQuery } from './queries/get-user-by-id';
import { InMemoryUserRepository } from './adapters/in-memory/in-memory-user-repository';

function resolveUserRepositoryClass() {
  switch (variables.database) {
    case 'MONGODB':
      return MongoUserRepository;
    case 'POSTGRESQL':
      return PostgreUserRepository;
    case 'POSTGRESQL_PRISMA':
      return PrismaUserRepository;
    case 'IN-MEMORY':
      return InMemoryUserRepository;
    default:
      return InMemoryUserRepository;
  }
}

const postgresPoolProvider =
  variables.database === 'POSTGRESQL'
    ? [
        {
          provide: USER_PG_POOL,
          useFactory: async (): Promise<Pool> => {
            const url = process.env.DATABASE_URL?.trim();
            if (!url) {
              throw new Error(
                'DATABASE_URL is required when DATABASE_NAME is POSTGRESQL',
              );
            }
            const pool = new Pool({ connectionString: url });
            await pool.query(PostgreUser.CREATE_TABLE_SQL);
            return pool;
          },
        },
      ]
    : [];

const mongoFeatureImports =
  variables.database === 'MONGODB'
    ? [
        MongooseModule.forFeature([
          {
            name: MongoUser.CollectionName,
            schema: MongoUser.Schema,
          },
        ]),
      ]
    : [];

const inMemoryAuthImports =
  variables.database === 'IN-MEMORY' ? [forwardRef(() => AuthModule)] : [];

@Module({
  imports: [
    CommonModule,
    ...mongoFeatureImports,
    ...inMemoryAuthImports,
  ],
  controllers: [UsersController],
  providers: [
    ...postgresPoolProvider,
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
  ],
  exports: [
    ...(variables.database === 'MONGODB' ? [MongooseModule] : []),
    ...(variables.database === 'POSTGRESQL' ? [USER_PG_POOL] : []),
    I_USER_REPOSITORY,
  ],
})
export class UserModule {}
