import { Test, TestingModule } from "@nestjs/testing";
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
      ],
    }).compile();

    controller = module.get<VariantsController>(VariantsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
