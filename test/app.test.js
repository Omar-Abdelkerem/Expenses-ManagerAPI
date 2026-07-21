const app = require("../app");
const request = require("supertest");
const mongoose = require("mongoose");

describe("Application", () => {
  it("should return 404 for unknown route", async () => {
    const res = await request(app).get("/auth/unknown");

    expect(res.statusCode).toBe(404);
  });
});
