const app = require("../app");
const request = require("supertest");
const mongoose = require("mongoose");
const DbConnect = require("../DB/connect");
const User = require("../Models/user");

let token;
const authHeader = () => ({
  Authorization: `Bearer ${token}`,
});

const invalidHeader = () => ({
  Authorization: "Bearer invalidtoken",
});

const malformedHeader = () => ({
  Authorization: "Token abcd1234",
});
beforeAll(async () => {
  await DbConnect();
  const res = await request(app)
    .post("/auth/register")
    .send({
      username: `profile${Date.now()}`,
      email: `profile${Date.now()}@gmail.com`,
      password: "password123",
    });
  token = res.body.token;
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
});

//--------------------------------------------------------------------------------------------
describe("Profile Routes", () => {
  describe("GET /profile", () => {
    it("should get user profile", async () => {
      const res = await request(app).get("/profile").set(authHeader());
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toHaveProperty("username");
      expect(res.body.user).toHaveProperty("email");
      expect(res.body.user).toHaveProperty("budget");
      expect(res.body.user).not.toHaveProperty("password");
    });
    it("should return 401 for unauthorized access in get user", async () => {
      const res = await request(app).get("/profile").set(invalidHeader());
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain("Invalid or expired token");
    });
    it("should return 401 for missing token in get user", async () => {
      const res = await request(app).get("/profile");
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain(
        "Authorization header missing or malformed",
      );
    });
    it("should return 401 for malformed token in get user", async () => {
      const res = await request(app).get("/profile").set(malformedHeader());
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain(
        "Authorization header missing or malformed",
      );
    });
    it("should return 404 if user doesn't exist", async () => {
      const email = `temp${Date.now()}@gmail.com`;
      const register = await request(app)
        .post("/auth/register")
        .send({
          username: `temp${Date.now()}`,
          email,
          password: "password123",
        });

      const tempToken = register.body.token;

      const tempUser = await User.findOne({
        email,
      });

      await User.findByIdAndDelete(tempUser._id);

      const res = await request(app)
        .get("/profile")
        .set({ Authorization: `Bearer ${tempToken}` });

      expect(res.statusCode).toBe(404);
    });
  });

  //--------------------------------------------------------------------------------------------
  describe("GET /profile/summary", () => {
    it("should get user summary", async () => {
      const res = await request(app).get("/profile/summary").set(authHeader());
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("budget");
      expect(res.body).toHaveProperty("remainingMoney");
      expect(res.body).toHaveProperty("totalExpenses");
    });
    it("should return 401 for unauthorized access in summary", async () => {
      const res = await request(app)
        .get("/profile/summary")
        .set(invalidHeader());
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain("Invalid or expired token");
    });
    it("should return 401 for missing token in summary", async () => {
      const res = await request(app).get("/profile/summary");
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain(
        "Authorization header missing or malformed",
      );
    });
    it("should return 401 for malformed token in summary", async () => {
      const res = await request(app)
        .get("/profile/summary")
        .set(malformedHeader());
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain(
        "Authorization header missing or malformed",
      );
    });
  });
  //--------------------------------------------------------------------------------------------

  //--------------------------------------------------------------------------------------------
  describe("PATCH /profile", () => {
    it("should update user profile", async () => {
      const newUsername = `updated${Date.now()}`;
      const res = await request(app)
        .patch("/profile/update")
        .set(authHeader())
        .send({ username: newUsername });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toHaveProperty("username", newUsername);
    });
    it("should return 401 for unauthorized access", async () => {
      const res = await request(app).patch("/profile").set(invalidHeader());
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain("Invalid or expired token");
    });
    it("should return 401 for missing token", async () => {
      const res = await request(app).patch("/profile");
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain(
        "Authorization header missing or malformed",
      );
    });
    it("should return 401 for malformed token on update", async () => {
      const res = await request(app).patch("/profile").set(malformedHeader());
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain(
        "Authorization header missing or malformed",
      );
    });
    it("should return 404 if user doesn't exist on update", async () => {
      const email = `temp${Date.now()}@gmail.com`;
      const register = await request(app)
        .post("/auth/register")
        .send({
          username: `temp${Date.now()}`,
          email,
          password: "password123",
        });

      const tempToken = register.body.token;

      const tempUser = await User.findOne({
        email,
      });

      await User.findByIdAndDelete(tempUser._id);

      const res = await request(app)
        .patch("/profile")
        .set({ Authorization: `Bearer ${tempToken}` })
        .send({ username: "newusername" });

      expect(res.statusCode).toBe(404);
    });
  });
  //--------------------------------------------------------------------------------------------
});
