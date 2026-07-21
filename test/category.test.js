const app = require("../app");
const request = require("supertest");
const mongoose = require("mongoose");
const DbConnect = require("../DB/connect");
const User = require("../Models/user");
const Category = require("../Models/category");
const Expense = require("../Models/expenses");

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
      username: `category${Date.now()}`,
      email: `category${Date.now()}@gmail.com`,
      password: "password123",
    });
  token = res.body.token;
});

afterAll(async () => {
  await Expense.deleteMany({});
  await Category.deleteMany({});
  await User.deleteMany({});
  await mongoose.connection.close();
});

describe("Category Routes", () => {
  describe("GET /category", () => {
    it("should get all categories", async () => {
      await request(app)
        .post("/category")
        .set(authHeader())
        .send({
          name: `food${Date.now()}`,
        });

      const res = await request(app).get("/category").set(authHeader());

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("categories");
      expect(res.body).toHaveProperty("count");
      expect(Array.isArray(res.body.categories)).toBe(true);
    });

    it("should return 401 for unauthorized access", async () => {
      const res = await request(app).get("/category").set(invalidHeader());
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain("Invalid or expired token");
    });

    it("should return 401 for missing token", async () => {
      const res = await request(app).get("/category");
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain(
        "Authorization header missing or malformed",
      );
    });

    it("should return 401 for malformed token", async () => {
      const res = await request(app).get("/category").set(malformedHeader());
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain(
        "Authorization header missing or malformed",
      );
    });
  });

  describe("POST /category", () => {
    it("should create a new category", async () => {
      const res = await request(app)
        .post("/category")
        .set(authHeader())
        .send({
          name: `transport${Date.now()}`,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("category");
      expect(res.body.category).toHaveProperty("name");
    });

    it("should return 400 if category name is missing", async () => {
      const res = await request(app)
        .post("/category")
        .set(authHeader())
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Please provide category name");
    });

    it("should return 400 for duplicate category", async () => {
      const name = `duplicate${Date.now()}`;

      await request(app).post("/category").set(authHeader()).send({ name });

      const res = await request(app)
        .post("/category")
        .set(authHeader())
        .send({ name });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Category already exists");
    });
  });

  describe("PATCH /category/:id", () => {
    it("should update a category", async () => {
      const createRes = await request(app)
        .post("/category")
        .set(authHeader())
        .send({
          name: `update${Date.now()}`,
        });

      const categoryId = createRes.body.category._id;
      const updatedName = `updated${Date.now()}`;

      const res = await request(app)
        .patch(`/category/${categoryId}`)
        .set(authHeader())
        .send({ name: updatedName });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("category");
      expect(res.body.category).toHaveProperty("name", updatedName);
    });

    it("should return 400 if category name is missing on update", async () => {
      const createRes = await request(app)
        .post("/category")
        .set(authHeader())
        .send({
          name: `missingname${Date.now()}`,
        });

      const res = await request(app)
        .patch(`/category/${createRes.body.category._id}`)
        .set(authHeader())
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Please provide category name");
    });

    it("should return 404 if category does not exist", async () => {
      const res = await request(app)
        .patch(`/category/${new mongoose.Types.ObjectId().toString()}`)
        .set(authHeader())
        .send({ name: `ghost${Date.now()}` });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain("Category not found");
    });
  });

  describe("DELETE /category/:id", () => {
    it("should delete a category", async () => {
      const createRes = await request(app)
        .post("/category")
        .set(authHeader())
        .send({
          name: `delete${Date.now()}`,
        });

      const res = await request(app)
        .delete(`/category/${createRes.body.category._id}`)
        .set(authHeader());

      expect(res.statusCode).toBe(200);
      expect(res.body.msg).toContain("Category deleted successfully");
    });

    it("should return 400 when category has associated expenses", async () => {
      const categoryRes = await request(app)
        .post("/category")
        .set(authHeader())
        .send({
          name: `blocked${Date.now()}`,
        });

      const expenseCategoryId = categoryRes.body.category._id;

      await request(app)
        .post("/expenses")
        .set(authHeader())
        .send({
          title: `expense${Date.now()}`,
          amount: 150,
          category: expenseCategoryId,
        });

      const res = await request(app)
        .delete(`/category/${expenseCategoryId}`)
        .set(authHeader());

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain(
        "Cannot delete category with associated expenses",
      );
    });

    it("should return 404 if category does not exist on delete", async () => {
      const res = await request(app)
        .delete(`/category/${new mongoose.Types.ObjectId().toString()}`)
        .set(authHeader());

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain("Category not found");
    });
  });
});
