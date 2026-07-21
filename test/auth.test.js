const app = require("../app");
const request = require("supertest");
const DbConnect = require("../DB/connect");
const mongoose = require("mongoose");
const User = require("../Models/user");

beforeAll(async () => {
  await DbConnect();
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
});

describe("Auth Routes", () => {
  describe("POST /auth/register", () => {
    it("should register a new user", async () => {
      const username = `testuser${Date.now()}`;
      const res = await request(app)
        .post("/auth/register")
        .send({
          username,
          email: `test${Date.now()}@gmail.com`,
          password: "password123",
        });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toHaveProperty("username", username);
      expect(res.body).toHaveProperty("token");
    });

    it("should return 400 if required fields are missing", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send({
          username: `testuser${Date.now()}`,
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Please provide email");
      expect(res.body.message).toContain("Please provide password");
    });

    it("should return 400 for duplicate email", async () => {
      const email = `duplicate${Date.now()}@gmail.com`;
      await request(app)
        .post("/auth/register")
        .send({
          username: `testuser${Date.now()}`,
          email,
          password: "password123",
        });
      const res = await request(app)
        .post("/auth/register")
        .send({
          username: `testuser${Date.now()}`,
          email,
          password: "password123",
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Duplicate value");
      expect(res.body.message).toContain("email");
    });

    it("should return 400 for duplicate username", async () => {
      const username = `duplicateuser${Date.now()}`;
      await request(app)
        .post("/auth/register")
        .send({
          username,
          email: `unique${Date.now()}@gmail.com`,
          password: "password123",
        });
      const res = await request(app)
        .post("/auth/register")
        .send({
          username,
          email: `another${Date.now()}@gmail.com`,
          password: "password123",
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Duplicate value");
      expect(res.body.message).toContain("username");
    });

    it("should return 400 for invalid email format", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send({
          username: `testuser${Date.now()}`,
          email: "invalidemail",
          password: "password123",
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Please provide a valid email");
    });
    it("should return 400 for password less than 6 characters", async () => {
      const id = `testuser${Date.now()}`;
      const res = await request(app)
        .post("/auth/register")
        .send({
          username: `testuser${id}`,
          email: `test${id}@gmail.com`,
          password: "pass",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain(
        "Password must be at least 6 characters long",
      );
    });
  });

  describe("POST /auth/login", () => {
    const email = `testuser${Date.now()}@gmail.com`;
    const password = "password123";

    beforeAll(async () => {
      await request(app)
        .post("/auth/register")
        .send({
          username: `testuser${Date.now()}`,
          email,
          password,
        });
    });

    it("should login an existing user", async () => {
      const res = await request(app).post("/auth/login").send({
        email,
        password,
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("token");
    });
    it("should return 400 if email or password is missing", async () => {
      const res = await request(app).post("/auth/login").send({
        email,
        password: "",
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Please provide email and password");
    });
    it("should return 401 for wrong password", async () => {
      const res = await request(app).post("/auth/login").send({
        email,
        password: "wrongpassword",
      });
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain("Invalid credentials");
    });
    it("should return 401 for non-existing user", async () => {
      const res = await request(app).post("/auth/login").send({
        email: "nonexistent@gmail.com",
        password: "password123",
      });
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain("Invalid credentials");
    });
  });
});
