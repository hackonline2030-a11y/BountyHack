import { Module } from '@nestjs/common';
import { PingController } from './ping.controller';
import { GetVersionCommand} from './version-repository.command';
import { I_PING_REPOSITORY, IPingRepository } from './ping-repository.interface';
import { DATABASE_MODES } from '../shared/database-mode';
import { variables } from '../shared/variables.config';
import { MongoPingRepository } from './adapters/mongo-ping-repository';
import { InMemoryPingRepository } from './adapters/in-memory-ping-repository';
import { PostgrePrismaPingRepository } from './adapters/postgre-prisma-ping.repository';

@Module({
  imports: [],
  controllers: [PingController],

  providers: [
    {
      provide: I_PING_REPOSITORY,
      useClass: (() => {
        switch (variables.database) {
          case DATABASE_MODES.MONGODB:
            return MongoPingRepository;
          case DATABASE_MODES.POSTGRESQL_PRISMA:
          case DATABASE_MODES.MYSQL_PRISMA:
            return PostgrePrismaPingRepository;
          case DATABASE_MODES.IN_MEMORY:
            return InMemoryPingRepository;
          default:
            throw new Error(`Unsupported database: ${variables.database} - Please add it in module providers and shared variables`);
        }
      })(),
    },
    {
      provide: GetVersionCommand,
      inject: [
        I_PING_REPOSITORY,
      ],
      useFactory: (repository: IPingRepository) => {
        return new GetVersionCommand(repository);
      }
    },

  ],

})
export class PingModule {}
