import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from '@/modules/users/users.service';
import { UsersRepository } from '@/modules/users/users.repository';
import { CreateUserDto } from '@/modules/users/dto/create-user.dto';
import { UpdateUserDto } from '@/modules/users/dto/update-user.dto';
import { PG_CONNECTION } from '@/database/database.constants';

describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;

  const mockPool = {
    query: vi.fn(),
  };

  const mockRepository = {
    findAll: vi.fn(),
    count: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockRepository,
        },
        {
          provide: PG_CONNECTION,
          useValue: mockPool,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<UsersRepository>(UsersRepository);

    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const users = [
        { id: '1', email: 'test@example.com', name: 'Test', role: 'user' },
      ];
      mockRepository.findAll.mockResolvedValue(users);
      mockRepository.count.mockResolvedValue(1);

      const result = await service.findAll({ page: '1', limit: '10' });

      expect(result.data).toEqual(users);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test', role: 'user' };
      mockRepository.findById.mockResolvedValue(user);

      const result = await service.findById('1');
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findById('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };
      const createdUser = { id: '1', ...dto, role: 'user' };

      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(createdUser);

      const result = await service.create(dto);
      expect(result.email).toBe(dto.email);
    });

    it('should throw ConflictException if email exists', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      mockRepository.findByEmail.mockResolvedValue({ id: '1' });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const dto: UpdateUserDto = { name: 'Updated' };
      const user = { id: '1', email: 'test@example.com', name: 'Test', role: 'user' };
      const updated = { ...user, name: 'Updated' };

      mockRepository.findById.mockResolvedValue(user);
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('1', dto);
      expect(result.name).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should soft delete user', async () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test', role: 'user' };
      mockRepository.findById.mockResolvedValue(user);
      mockRepository.softDelete.mockResolvedValue(true);

      await service.remove('1');
      expect(mockRepository.softDelete).toHaveBeenCalledWith('1');
    });
  });
});
