import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";
import { VariantsController } from "./variants.controller";
import { VariantsService } from "./variants.service";
import { AuditService } from "../audit/audit.service";

describe("VariantsController", () => {
  let controller: VariantsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VariantsController],
      providers: [
        {
          provide: VariantsService,
          useValue: {},
        },
        {
          provide: AuditService,
          useValue: { logAction: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: PrismaService,
          useValue: {},
        }
      ],
    }).compile();

    controller = module.get<VariantsController>(VariantsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
