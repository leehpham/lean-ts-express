/**
 * Tests for Express Application core functionality
 *
 * @see https://expressjs.com/en/5x/api.html#app
 */
import { describe, expect, test } from "@jest/globals";
import express from "express";
import supertest from "supertest";

describe("Express Application", () => {
  test("express(), initialized, returns valid application instance", () => {
    // Arrange & Act
    const app = express();

    // Assert
    expect(app).toBeDefined();
    expect(typeof app).toBe("function");
    expect(typeof app.listen).toBe("function");
    expect(typeof app.use).toBe("function");
    expect(typeof app.get).toBe("function");
    expect(typeof app.post).toBe("function");
  });

  test("express(), handling get request, returns expected response", async () => {
    // Arrage
    const app = express();
    app.get("/test", (_req, res) => {
      res.send("Hello World");
    });

    // Act
    const response = await supertest(app).get("/test");

    // Assert
    expect(response.status).toBe(200);
    expect(response.text).toBe("Hello World");
  });

  test("express(), handling different HTTP methods, routes to correct handler", async () => {
    // Arrange
    const app = express();
    const url = "/methods";

    const getResTxt = "GET Method";
    app.get(url, (_req, res) => {
      res.send(getResTxt);
    });

    const postResTxt = "POST Method";
    app.post(url, (_req, res) => {
      res.send(postResTxt);
    });

    const putResTxt = "PUT Method";
    app.put(url, (_req, res) => {
      res.send(putResTxt);
    });

    const deleteResTxt = "DELETE Method";
    app.delete(url, (_req, res) => {
      res.send(deleteResTxt);
    });

    // Act & Assert
    const getRes = await supertest(app).get(url);
    expect(getRes.text).toBe(getResTxt);

    const postRes = await supertest(app).post(url);
    expect(postRes.text).toBe(postResTxt);

    const putRes = await supertest(app).put(url);
    expect(putRes.text).toBe(putResTxt);

    const deleteRes = await supertest(app).delete(url);
    expect(deleteRes.text).toBe(deleteResTxt);
  });
});
