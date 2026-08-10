import { Test, TestingModule } from "@nestjs/testing";
import { VariantsService } from "./variants.service";
import { PrismaService } from "../../database/prisma.service";
import { GamificationService } from "../gamification/gamification.service";
import { NotificationsService } from "../notifications/notifications.service";
import { ForbiddenException } from "@nestjs/common";

describe("VariantsService", () => {
  let service: VariantsService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      variant: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VariantsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GamificationService, useValue: { addCoins: jest.fn() } },
        {
          provide: NotificationsService,
          useValue: { sendNotification: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<VariantsService>(VariantsService);
    prisma = module.get(PrismaService);
  });

  it("should return variant without correctAnswer in tasks", async () => {
    const mockVariant = {
      id: BigInt(1),
      title: "Test Variant",
      description: "Test Desc",
      courseId: BigInt(2),
      tasks: [{ id: BigInt(3), variantId: BigInt(1), type: "MULTIPLE_CHOICE", correctAnswer: "A" }],
    };
    (prisma.variant.findUnique as jest.Mock).mockResolvedValue(mockVariant);

    const result = await service.findOne("1");

    expect(result.id).toBe("1");
    expect(result.tasks![0].id).toBe("3");
    
    // Test that the serialized output doesn't contain correctAnswer
    const serialized = JSON.parse(JSON.stringify(result));
    expect(serialized.tasks[0]).not.toHaveProperty("correctAnswer");
    expect((result.tasks![0] as any).correctAnswer).toBeUndefined();
  });

  it("should reject submitAnswers if user attempts to submit for another user", async () => {
    const mockUser = {
      id: BigInt(10),
      telegramId: BigInt(12345),
    };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const submitDto = {
      userId: "11", // Trying to submit for someone else
      answers: {},
    };

    await expect(service.submitAnswers("1", submitDto, BigInt(12345))).rejects.toThrow(
      new ForbiddenException("Cannot submit answers for another user")
    );
  });
});
