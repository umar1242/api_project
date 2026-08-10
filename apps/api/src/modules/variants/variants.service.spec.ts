import { Test, TestingModule } from "@nestjs/testing";
import { VariantsService } from "./variants.service";
import { PrismaService } from "../../database/prisma.service";
import { GamificationService } from "../gamification/gamification.service";
import { NotificationsService } from "../notifications/notifications.service";

describe("VariantsService", () => {
  let service: VariantsService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      variant: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
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

  it("should return variant with stringified BigInts", async () => {
    const mockVariant = {
      id: BigInt(1),
      title: "Test Variant",
      description: "Test Desc",
      courseId: BigInt(2),
      tasks: [{ id: BigInt(3), variantId: BigInt(1), type: "MULTIPLE_CHOICE" }],
    };
    (prisma.variant.findUnique as jest.Mock).mockResolvedValue(mockVariant);

    const result = await service.findOne("1");

    expect(result.id).toBe("1");
    expect(result.courseId).toBe("2");
    expect(result.tasks![0].id).toBe("3");
    expect(result.tasks![0].variantId).toBe("1");
  });
});
