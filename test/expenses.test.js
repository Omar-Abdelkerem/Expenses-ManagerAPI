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

// I keep these helpers small because the file repeats the same request shape many times.
// This removes noise without hiding what each test is doing.
const createCategory = async (name) => {
  const res = await request(app).post("/category").set(authHeader()).send({
    name,
  });

  return res.body.category;
};

// This helper mirrors the category helper for the expense POST request.
// It keeps the tests readable while avoiding repeated request boilerplate.
const createExpense = async ({ title, amount, category, date }) => {
  const res = await request(app).post("/expenses").set(authHeader()).send({
    title,
    amount,
    category,
    date,
  });

  return res;
};

beforeAll(async () => {
  await DbConnect();
  const res = await request(app)
    .post("/auth/register")
    .send({
      username: `expenses${Date.now()}`,
      email: `expenses${Date.now()}@gmail.com`,
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

describe("Expenses Routes", () => {
  describe("GET /expenses", () => {
    it("should get all expenses", async () => {
      const category = await createCategory(`getexpenses${Date.now()}`);

      await createExpense({
        title: `rent${Date.now()}`,
        amount: 1000,
        category: category._id,
      });

      const res = await request(app).get("/expenses").set(authHeader());

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("expenses");
      expect(res.body).toHaveProperty("count");
      expect(Array.isArray(res.body.expenses)).toBe(true);
    });

    it("should return 401 for unauthorized access", async () => {
      const res = await request(app).get("/expenses").set(invalidHeader());
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain("Invalid or expired token");
    });

    it("should return 401 for missing token", async () => {
      const res = await request(app).get("/expenses");
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain(
        "Authorization header missing or malformed",
      );
    });

    it("should return 401 for malformed token", async () => {
      const res = await request(app).get("/expenses").set(malformedHeader());
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain(
        "Authorization header missing or malformed",
      );
    });
  });

  describe("POST /expenses", () => {
    it("should create a new expense", async () => {
      const category = await createCategory(`createexpense${Date.now()}`);
      const res = await request(app)
        .post("/expenses")
        .set(authHeader())
        .send({
          title: `groceries${Date.now()}`,
          amount: 250,
          category: category._id,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("expense");
      expect(res.body).toHaveProperty("budgetStatus");
      expect(res.body.expense).toHaveProperty("title");
    });

    it("should return 400 if required fields are missing", async () => {
      const res = await request(app)
        .post("/expenses")
        .set(authHeader())
        .send({
          title: `missing${Date.now()}`,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Please provide all values");
    });

    it("should return 400 if category does not exist", async () => {
      const res = await request(app)
        .post("/expenses")
        .set(authHeader())
        .send({
          title: `invalidcategory${Date.now()}`,
          amount: 100,
          category: new mongoose.Types.ObjectId().toString(),
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Category does not exist");
    });
  });

  describe("PATCH /expenses/:id", () => {
    it("should update an expense", async () => {
      const category = await createCategory(`updateexpense${Date.now()}`);
      const createRes = await createExpense({
        title: `phone${Date.now()}`,
        amount: 300,
        category: category._id,
      });

      const updatedTitle = `updatedphone${Date.now()}`;

      const res = await request(app)
        .patch(`/expenses/${createRes.body.expense._id}`)
        .set(authHeader())
        .send({
          title: updatedTitle,
          amount: 350,
          date: createRes.body.expense.date,
          category: category._id,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("expense");
      expect(res.body.expense).toHaveProperty("title", updatedTitle);
    });

    it("should return 400 if required fields are missing on update", async () => {
      const category = await createCategory(`missingupdate${Date.now()}`);
      const createRes = await createExpense({
        title: `update${Date.now()}`,
        amount: 75,
        category: category._id,
      });

      const res = await request(app)
        .patch(`/expenses/${createRes.body.expense._id}`)
        .set(authHeader())
        .send({
          title: "",
          amount: 80,
          category: category._id,
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain("Please provide all values");
    });

    it("should return 404 if expense does not exist", async () => {
      const category = await createCategory(`notfoundupdate${Date.now()}`);

      const res = await request(app)
        .patch(`/expenses/${new mongoose.Types.ObjectId().toString()}`)
        .set(authHeader())
        .send({
          title: `ghost${Date.now()}`,
          amount: 20,
          category: category._id,
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain("Expense not found");
    });
  });

  describe("DELETE /expenses/:id", () => {
    it("should delete an expense", async () => {
      const category = await createCategory(`deleteexpense${Date.now()}`);
      const createRes = await createExpense({
        title: `coffee${Date.now()}`,
        amount: 40,
        category: category._id,
      });

      const res = await request(app)
        .delete(`/expenses/${createRes.body.expense._id}`)
        .set(authHeader());

      expect(res.statusCode).toBe(200);
      expect(res.body.msg).toContain("Expense deleted successfully");
      expect(res.body).toHaveProperty("budgetStatus");
    });

    it("should return 404 if expense does not exist", async () => {
      const res = await request(app)
        .delete(`/expenses/${new mongoose.Types.ObjectId().toString()}`)
        .set(authHeader());

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain("Expense not found");
    });
  });

  describe("GET /expenses/statistics", () => {
    it("should get expense statistics", async () => {
      const category = await createCategory(`statistics${Date.now()}`);

      await createExpense({
        title: `stat${Date.now()}`,
        amount: 120,
        category: category._id,
      });

      const res = await request(app)
        .get("/expenses/statistics")
        .set(authHeader());

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("statistics");
      expect(res.body).toHaveProperty("budgetStatus");
      expect(Array.isArray(res.body.statistics)).toBe(true);
    });
  });
});
