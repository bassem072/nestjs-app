import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider } from './auth.provider';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RegisterDto } from './dtos/register.dto';

describe('Auth Provider', () => {
  let authProvider: AuthProvider;
  let usersRepository: Repository<User>;
  let mailService: MailService;
  let configService: ConfigService;
  const REPOSITORY_TOKEN = getRepositoryToken(User);
  const registerDto: RegisterDto = {
    email: 'bassem.elsayed@travolic.com',
    password: 'Bassem1598753@',
    username: 'bassem072',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthProvider,
        { provide: JwtService, useValue: {} },
        {
          provide: MailService,
          useValue: {
            sendVerifyEmail: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: REPOSITORY_TOKEN,
          useValue: {
            findOne: jest.fn(),
            create: jest.fn((dto: RegisterDto) => Promise.resolve(dto)),
            save: jest.fn((dto: RegisterDto) =>
              Promise.resolve({ id: 1, ...dto }),
            ),
          },
        },
      ],
    }).compile();

    authProvider = module.get<AuthProvider>(AuthProvider);
    usersRepository = module.get<Repository<User>>(REPOSITORY_TOKEN);
    mailService = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should auth provider be defined', () => {
    expect(authProvider).toBeDefined();
  });

  it('should users repository be defined', () => {
    expect(usersRepository).toBeDefined();
  });

  describe('Register', () => {
    it('should call findOne method in users repository', async () => {
      const spy = jest.spyOn(usersRepository, 'findOne');

      await authProvider.register(registerDto);
      expect(spy).toHaveBeenCalled();
    });

    it('should call create method in users repository', async () => {
      const spy = jest.spyOn(usersRepository, 'create');

      await authProvider.register(registerDto);
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should call save method in users repository', async () => {
      const spy = jest.spyOn(usersRepository, 'save');

      await authProvider.register(registerDto);
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should call sendVerifyEmail method in mail service', async () => {
      const spy = jest.spyOn(mailService, 'sendVerifyEmail');

      await authProvider.register(registerDto);
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should call get method in config service', async () => {
      const spy = jest.spyOn(configService, 'get');

      await authProvider.register(registerDto);
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should call save method in product repository', async () => {
      const user = await authProvider.register(registerDto);

      expect(user).toBeDefined();
    });
  });
});
