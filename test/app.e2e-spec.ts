import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";

describe("AppController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Health Check", () => {
    it("/health (GET)", () => {
      return request(app.getHttpServer())
        .get("/api/health")
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("status");
          expect(res.body).toHaveProperty("timestamp");
        });
    });

    it("/health/live (GET)", () => {
      return request(app.getHttpServer())
        .get("/api/health/live")
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("status", "ok");
        });
    });
  });

  describe("Authentication", () => {
    it("/auth/login (POST) - should reject invalid credentials", () => {
      return request(app.getHttpServer())
        .post("/api/auth/login")
        .send({ email: "invalid@test.com", password: "wrongpassword" })
        .expect(401);
    });

    it("/auth/login (POST) - should reject missing credentials", () => {
      return request(app.getHttpServer())
        .post("/api/auth/login")
        .send({})
        .expect(401);
    });
  });

  describe("Protected Routes", () => {
    it("/users (GET) - should reject unauthenticated requests", () => {
      return request(app.getHttpServer()).get("/api/users").expect(401);
    });

    it("/menu/items (GET) - should reject unauthenticated requests", () => {
      return request(app.getHttpServer()).get("/api/menu/items").expect(401);
    });

    it("/events (GET) - should reject unauthenticated requests", () => {
      return request(app.getHttpServer()).get("/api/events").expect(401);
    });
  });
});
