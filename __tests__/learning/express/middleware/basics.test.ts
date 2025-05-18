/**
 * Tests for Express Middleware functionality
 *
 * @see https://expressjs.com/en/5x/api.html#middleware-callback-function-examples
 */
import { describe, expect, test } from "@jest/globals";
import express, { NextFunction, Request, Response } from "express";
import supertest from "supertest";

describe("Express Middleware basics", () => {
  test("writing middleware, logics are executed as mentioned in the docs", async () => {
    const app = express();
    const executionOrder: string[] = [];

    const myLogger = (
      _req: Request,
      _res: Response,
      next: NextFunction
    ): void => {
      executionOrder.push("LOGGED");
      next();
    };

    const requestTime = (
      req: Request,
      _res: Response,
      next: NextFunction
    ): void => {
      // @ts-expect-error - too laze to extend the global `Request` interface.
      req.requestTime = Date.now();
      executionOrder.push("Request Time Set");
      next();
    };

    app.use(requestTime);
    app.use(myLogger);

    app.get("/", (req, res) => {
      executionOrder.push("Hello World");
      // @ts-expect-error - meh
      res.json({ executionOrder, requestTime: req.requestTime });
    });

    const response = await supertest(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body.executionOrder).toEqual([
      "Request Time Set",
      "LOGGED",
      "Hello World",
    ]);
    expect(response.body.requestTime).toBeDefined();
  });

  test("middleware, application-level, executes on all routes", async () => {
    // Arrange
    const app = express();
    const executionOrder: string[] = [];

    // Application-level middleware
    const myMiddleware = (
      _req: Request,
      _res: Response,
      next: NextFunction
    ): void => {
      executionOrder.push("app-middleware");
      next();
    };
    app.use(myMiddleware);

    app.get("/test", (_req, res) => {
      executionOrder.push("route-handler");
      res.json({ executionOrder });
    });

    // Act
    const response = await supertest(app).get("/test");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.executionOrder).toEqual([
      "app-middleware",
      "route-handler",
    ]);
  });

  test("middleware, path-specific, executes only for matching paths", async () => {
    // Arrange
    const app = express();
    const executionOrder: string[] = [];

    // Path-specific middleware
    app.use("/api", (_req, _res, next) => {
      executionOrder.push("api-middleware");
      next();
    });

    app.get("/api/data", (_req, res) => {
      executionOrder.push("api-route-handler");
      res.json({ executionOrder });
    });

    app.get("/public", (_req, res) => {
      executionOrder.push("public-route-handler");
      res.json({ executionOrder });
    });

    // Act & Assert
    // This should execute the path-specific middleware
    const apiResponse = await supertest(app).get("/api/data");
    expect(apiResponse.status).toBe(200);
    expect(apiResponse.body.executionOrder).toEqual([
      "api-middleware",
      "api-route-handler",
    ]);

    // Reset `executionOrder` for the next request
    executionOrder.length = 0;

    // This should not execute the path-spefific middleware
    const publicResponse = await supertest(app).get("/public");
    expect(publicResponse.status).toBe(200);
    expect(publicResponse.body.executionOrder).toEqual([
      "public-route-handler",
    ]);
  });

  test("middleware, multiple in sequence, executes in order", async () => {
    // Arrange
    const app = express();
    const executionOrder: string[] = [];

    // Multiple middleware functions in sequence
    const runFirst = (
      _req: Request,
      _res: Response,
      next: NextFunction
    ): void => {
      executionOrder.push("first");
      next();
    };
    const runSecond = (
      _req: Request,
      _res: Response,
      next: NextFunction
    ): void => {
      executionOrder.push("second");
      next();
    };
    const runThird = (
      _req: Request,
      _res: Response,
      next: NextFunction
    ): void => {
      executionOrder.push("third");
      next();
    };

    app.use(runFirst);
    app.use(runSecond);

    app.use(runThird);
    app.get("/test", (_req, res) => {
      executionOrder.push("route-handler");
      res.json({ executionOrder });
    });

    // Act
    const response = await supertest(app).get("/test");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.executionOrder).toEqual([
      "first",
      "second",
      "third",
      "route-handler",
    ]);
  });
});
