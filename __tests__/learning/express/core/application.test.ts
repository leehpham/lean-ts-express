/**
 * Tests for Express Application core functionality
 *
 * @see https://expressjs.com/en/5x/api.html#app
 */
import http from "node:http";

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

  test("express(), configuring settings, correctly applies configuration", () => {
    // Arrange
    const app = express();
    const caseSensitiveRoutingSetting = "case sensitive routing";
    const strictRoutingSetting = "strict routing";
    const jsonSpacesSetting = "json spaces";

    // Act
    app.set(caseSensitiveRoutingSetting, true);
    app.set(strictRoutingSetting, true);
    app.set(jsonSpacesSetting, 4);

    // Assert
    expect(app.get(caseSensitiveRoutingSetting)).toBe(true);
    expect(app.get(strictRoutingSetting)).toBe(true);
    expect(app.get(jsonSpacesSetting)).toBe(4);
  });

  test("express(), creating HTTP server, listens on specified port", async () => {
    // Arrange
    const app = express();
    app.get("/", (_req, res) => {
      res.send("Server is running");
    });

    // Act
    // Create server but don't actually listen to avoid port conflicts in tests
    const server = http.createServer(app);

    // Assert
    expect(server).toBeInstanceOf(http.Server);

    // Cleanup
    server.close();
  });

  test("express(), path not found, returns 404 status", async () => {
    // Arrange
    const app = express();
    app.get("/exists", (_req, res) => {
      res.send("This path exists");
    });

    // Act
    const response = await supertest(app).get("/not-found");

    // Assert
    expect(response.status).toBe(404);
  });

  test("catching errors, synchronous code throws an error, Express catches and processes it", async () => {
    // Arrange
    const app = express();
    app.get("/error", () => {
      throw new Error("Test error");
    });

    // Act
    const response = await supertest(app).get("/error");

    // Assert
    expect(response.status).toBe(500);
    // `toContain` is used because `response.text` contains HTML in development mode.
    expect(response.text).toContain("Test error");

    // TODO: Add another test similar to this one but
    // with a custom error handling middleware to
    // format errors consistently.
    // Check core-application-tests.md for more details.
  });
});
