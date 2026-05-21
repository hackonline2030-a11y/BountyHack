import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { AddUsername } from '../commands/add-username';
import { DeleteUserCompletelyCommand } from '../commands/delete-user-completely.command';
import { GetUserByIdQuery } from '../queries/get-user-by-id';
import { ListUsersAdminSummariesQuery } from '../queries/list-users-admin-summaries.query';
import {
  UserAdminSummaryDto,
  UserAdminSummaryListResponseDto,
  UserProfileResponseDto,
} from '../dto/user.dto';
import { RequestWithIdentity } from '../../auth/adapters/http/request-with-identity';
import { AppRoleCode } from '../../shared/rbac/app-role.code';

describe('UsersController', () => {
  let controller: UsersController;
  let addUsername: jest.Mocked<AddUsername>;
  let getUserByIdQuery: jest.Mocked<GetUserByIdQuery>;
  let listUsersAdminSummariesQuery: jest.Mocked<ListUsersAdminSummariesQuery>;
  let deleteUserCompletely: jest.Mocked<DeleteUserCompletelyCommand>;

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
        {
          provide: ListUsersAdminSummariesQuery,
          useValue: { execute: jest.fn() },
        },
        {
          provide: DeleteUserCompletelyCommand,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    addUsername = module.get(AddUsername);
    getUserByIdQuery = module.get(GetUserByIdQuery);
    listUsersAdminSummariesQuery = module.get(ListUsersAdminSummariesQuery);
    deleteUserCompletely = module.get(DeleteUserCompletelyCommand);
  });

  it('should create user profile for authenticated user', async () => {
    const request = {
      user: { uid: 'uid-1', email: 'test@example.com' },
    } as RequestWithIdentity;

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
    } as RequestWithIdentity;

    await expect(
      controller.create(request, { username: 'test-user' })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should return current user profile', async () => {
    const fromRepo = { uid: 'uid-1', username: 'test-user' };
    getUserByIdQuery.execute.mockResolvedValue(fromRepo);

    const request = {
      user: { uid: 'uid-1', email: 'test@example.com' },
    } as RequestWithIdentity;

    const result = await controller.getCurrentUser(request);

    expect(getUserByIdQuery.execute).toHaveBeenCalledWith('uid-1');
    expect(result).toBeInstanceOf(UserProfileResponseDto);
    expect(result).toEqual(
      expect.objectContaining({
        uid: 'uid-1',
        username: 'test-user',
        roleCode: null,
      }),
    );
  });

  describe('deleteUser() — admin hard delete', () => {
    it('delegates to DeleteUserCompletelyCommand', async () => {
      const request = {
        user: {
          uid: 'admin-1',
          email: 'admin@example.com',
          roleCode: AppRoleCode.SUPER_ADMIN,
        },
      } as RequestWithIdentity;

      await expect(
        controller.deleteUser(request, 'hunter-42'),
      ).resolves.toEqual({ ok: true });

      expect(deleteUserCompletely.execute).toHaveBeenCalledWith(
        request.user,
        'hunter-42',
      );
    });
  });

  describe('list() — admin user summaries', () => {
    it('returns the items wrapped in a typed response DTO', async () => {
      listUsersAdminSummariesQuery.execute.mockResolvedValue([
        {
          uid: 'u-1',
          username: 'alice',
          email: 'alice@example.com',
          roleCode: AppRoleCode.SUPER_ADMIN,
        },
        {
          uid: 'u-2',
          username: 'bob',
          email: null,
          roleCode: AppRoleCode.HUNTER,
        },
      ]);

      const result = await controller.list();

      expect(listUsersAdminSummariesQuery.execute).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(UserAdminSummaryListResponseDto);
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toBeInstanceOf(UserAdminSummaryDto);
      expect(result.items[0]).toEqual({
        uid: 'u-1',
        username: 'alice',
        email: 'alice@example.com',
        roleCode: AppRoleCode.SUPER_ADMIN,
      });
      expect(result.items[1].email).toBeNull();
    });

    it('returns an empty items array when no users are present', async () => {
      listUsersAdminSummariesQuery.execute.mockResolvedValue([]);

      const result = await controller.list();

      expect(result.items).toEqual([]);
    });

    it('propagates errors from the use case', async () => {
      const error = new Error('boom');
      listUsersAdminSummariesQuery.execute.mockRejectedValue(error);

      await expect(controller.list()).rejects.toBe(error);
    });
  });
});
