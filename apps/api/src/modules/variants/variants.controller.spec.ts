import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../database/prisma.service";
import { VariantsController } from "./variants.controller";
import { VariantsService } from "./variants.service";
import { AuditService } from "../audit/audit.service";
import { ServiceTokenGuard } from "../../common/guards/service-token.guard";
import { RolesGuard } from "../../common/guards/roles.guard";

describe("VariantsController (e2e-like)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Provide a real-ish environment for the controller to test guards
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [VariantsController],
      providers: [
        {
          provide: VariantsService,
          useValue: {
            findOne: jest.fn().mockResolvedValue({ id: "1" }),
          },
        },
        {
          provide: AuditService,
          useValue: { logAction: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { 
            get: jest.fn((key) => {
              if (key === "auth.serviceToken") return "test-secret";
              if (key === "TELEGRAM_BOT_TOKEN") return "bot-token";
              return null;
            })
          },
        },
        {
          provide: PrismaService,
          useValue: {},
        }
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should return 401 when accessing GET /variants/:id without auth", () => {
    return request(app.getHttpServer())
      .get("/variants/1")
      .expect(401);
  });

  it("should return 200 when accessing GET /variants/:id with valid X-Service-Token", () => {
    return request(app.getHttpServer())
      .get("/variants/1")
      .set("X-Service-Token", "test-secret")
      .expect(200);
  });
});
