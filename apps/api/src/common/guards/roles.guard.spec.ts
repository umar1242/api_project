import { RolesGuard } from "./roles.guard";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../database/prisma.service";
import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { UserRole } from "@prisma/client";

describe("RolesGuard", () => {
  let rolesGuard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;
  let prismaService: any;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;

    prismaService = {
      user: {
        findUnique: jest.fn(),
      },
    };

    rolesGuard = new RolesGuard(reflector, prismaService);
  });

  const createMockContext = (requestOptions: any): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => requestOptions,
      }),
    }) as any;

  it("should return true if no roles are required", async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({});
    await expect(rolesGuard.canActivate(context)).resolves.toBe(true);
  });

  describe("when telegramUser is present (Mini App scenario)", () => {
    it("should throw ForbiddenException if user not found in db", async () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const context = createMockContext({
        telegramUser: { id: "123" },
      });
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(rolesGuard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should throw ForbiddenException if user lacks required role", async () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const context = createMockContext({
        telegramUser: { id: "123" },
      });
      prismaService.user.findUnique.mockResolvedValue({
        role: UserRole.STUDENT,
      });

      await expect(rolesGuard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should return true if user has required role", async () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const context = createMockContext({
        telegramUser: { id: "123" },
      });
      prismaService.user.findUnique.mockResolvedValue({ role: UserRole.ADMIN });

      await expect(rolesGuard.canActivate(context)).resolves.toBe(true);
    });
  });

  describe("when telegramUser is missing (Service Token scenario)", () => {
    it("should throw ForbiddenException if adminTelegramId is missing", async () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const context = createMockContext({}); // No telegramUser, no adminTelegramId

      await expect(rolesGuard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should throw ForbiddenException if admin user not found in db", async () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const context = createMockContext({
        adminTelegramId: "456",
      });
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(rolesGuard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { telegramId: BigInt(456) },
      });
    });

    it("should throw ForbiddenException if admin lacks required role", async () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const context = createMockContext({
        adminTelegramId: "456",
      });
      prismaService.user.findUnique.mockResolvedValue({
        role: UserRole.CURATOR,
      });

      await expect(rolesGuard.canActivate(context)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should return true if admin has required role", async () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const context = createMockContext({
        adminTelegramId: "456",
      });
      prismaService.user.findUnique.mockResolvedValue({ role: UserRole.ADMIN });

      await expect(rolesGuard.canActivate(context)).resolves.toBe(true);
    });
  });
});
