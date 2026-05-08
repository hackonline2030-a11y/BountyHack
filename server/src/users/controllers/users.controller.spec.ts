import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { AddUsername } from '../commands/add-username';
import { GetUserByIdQuery } from '../queries/get-user-by-id';
import { UserProfileResponseDto } from '../dto/user.dto';
import { RequestWithUser } from '../../auth/model/request-with-user';

describe('UsersController', () => {
  let controller: UsersController;
  let addUsername: jest.Mocked<AddUsername>;
  let getUserByIdQuery: jest.Mocked<GetUserByIdQuery>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: AddUsername,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetUserByIdQuery,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    addUsername = module.get(AddUsername);
    getUserByIdQuery = module.get(GetUserByIdQuery);
  });

  it('should create user profile for authenticated user', async () => {
    const request = {
      user: { uid: 'uid-1', email: 'test@example.com' },
    } as RequestWithUser;

    await expect(
      controller.create(request, { username: 'test-user' })
    ).resolves.toBeNull();

    expect(addUsername.execute).toHaveBeenCalledWith({
      uid: 'uid-1',
      username: 'test-user',
    });
  });

  it('should throw unauthorized when request user has no uid', async () => {
    const request = {
      user: { uid: '', email: 'test@example.com' },
    } as RequestWithUser;

    await expect(
      controller.create(request, { username: 'test-user' })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should return current user profile', async () => {
    const fromRepo = { uid: 'uid-1', username: 'test-user' };
    getUserByIdQuery.execute.mockResolvedValue(fromRepo);

    const request = {
      user: { uid: 'uid-1', email: 'test@example.com' },
    } as RequestWithUser;

    const result = await controller.getCurrentUser(request);

    expect(getUserByIdQuery.execute).toHaveBeenCalledWith('uid-1');
    expect(result).toBeInstanceOf(UserProfileResponseDto);
    expect(result).toEqual(
      expect.objectContaining({ uid: 'uid-1', username: 'test-user' })
    );
  });
});
