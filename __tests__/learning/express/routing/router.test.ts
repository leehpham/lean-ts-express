/**
 * Tests for Express Router functionality
 *
 * @see https://expressjs.com/en/5x/api.html#router
 */
import { describe, expect, test } from "@jest/globals";
import express, { NextFunction, Request, Response } from "express";
import supertest from "supertest";

describe("Express Router", () => {
  test("router, initialized, creates valid router instance", () => {
    // Arrange & Act
    const router = express.Router();

    // Assert
    expect(router).toBeDefined();
    expect(typeof router).toBe("function");
    expect(typeof router.all).toBe("function");
    expect(typeof router.use).toBe("function");
    expect(typeof router.get).toBe("function");
    expect(typeof router.post).toBe("function");
  });

  test("router, mounted on app with prefix, handles prefixed routes", async () => {
    // Arrange
    const app = express();
    const router = express.Router();
    const resTxt = "Hello World";

    router.get("/hello", (_req, res) => {
      res.send(resTxt);
    });

    app.use("/api", router);

    // Act
    const response = await supertest(app).get("/api/hello");

    // Assert
    expect(response.status).toBe(200);
    expect(response.text).toBe(resTxt);
  });

  test("router, with router-level middleware, executes middleware properly", async () => {
    // Arrange
    const app = express();
    const router = express.Router();
    const executionOrder: string[] = [];

    // Middleware that is specific to this router
    const doThing = (
      _req: Request,
      _res: Response,
      next: NextFunction
    ): void => {
      executionOrder.push("router-middleware");
      next();
    };
    router.use(doThing);

    router.get("/test", (_req, res) => {
      executionOrder.push("router-handler");
      res.json({ executionOrder });
    });

    app.use("/router", router);

    // Act
    const response = await supertest(app).get("/router/test");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.executionOrder).toEqual([
      "router-middleware",
      "router-handler",
    ]);
  });

  test("router, with router.route(), supports chainable route definitions", async () => {
    // Similar to app.route()

    // Arrange
    const app = express();
    const router = express.Router();

    router
      .route("/resource")
      .get((_req, res) => {
        res.send("Get resource");
      })
      .post((_req, res) => {
        res.send("Create resource");
      });

    app.use("/api", router);

    // Act & Assert
    const getRes = await supertest(app).get("/api/resource");
    expect(getRes.status).toBe(200);
    expect(getRes.text).toBe("Get resource");

    const postRes = await supertest(app).post("/api/resource");
    expect(postRes.status).toBe(200);
    expect(postRes.text).toBe("Create resource");
  });

  test("router, with param method, preprocesses parameters", async () => {
    // Arrange
    const app = express();
    const router = express.Router();

    // Define a param preprocessor for "userId"
    router.param("userId", (req, _res, next, userId: string) => {
      // In a real app, this might fetch user data from a database
      // @ts-expect-error - too lazy to extend `Request`.
      req.user = { id: userId, name: `User ${userId}` };
      next();
    });

    router.get("/users/:userId", (req, res) => {
      // @ts-expect-error - `req.user` is added by the param middleware
      res.json(req.user);
    });

    app.use(router);

    // Act
    const response = await supertest(app).get("/users/123");

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: "123", name: "User 123" });
  });

  test("router, with multiple routers, routes to correct handler", async () => {
    // Arrange
    const app = express();
    const usersRouter = express.Router();
    const productsRouter = express.Router();

    usersRouter.get("/", (_req, res) => {
      res.send("Users list");
    });

    productsRouter.get("/", (_req, res) => {
      res.send("Products list");
    });

    app.use("/users", usersRouter);
    app.use("/products", productsRouter);

    // Act & Assert
    const usersRes = await supertest(app).get("/users");
    expect(usersRes.status).toBe(200);
    expect(usersRes.text).toBe("Users list");

    const productsRes = await supertest(app).get("/products");
    expect(productsRes.status).toBe(200);
    expect(productsRes.text).toBe("Products list");
  });

  test("router, with case-sensitive routes, distinguishes routes by case", async () => {
    // Arrange
    const app = express();
    const router = express.Router({ caseSensitive: true });

    router.get("/lowercase", (_req, res) => {
      res.send("lowercase route");
    });

    router.get("/UPPERCASE", (_req, res) => {
      res.send("UPPERCASE route");
    });

    app.use("/test", router);

    // Act & Assert
    const lowercaseRes = await supertest(app).get("/test/lowercase");
    expect(lowercaseRes.status).toBe(200);
    expect(lowercaseRes.text).toBe("lowercase route");

    const uppercaseRes = await supertest(app).get("/test/UPPERCASE");
    expect(uppercaseRes.status).toBe(200);
    expect(uppercaseRes.text).toBe("UPPERCASE route");

    // This should not match because the route is case-sensitive
    const wrongCaseRes = await supertest(app).get("/test/Lowercase");
    expect(wrongCaseRes.status).toBe(404);
  });

  test("router, strict mode is off (by default), does not distinguish trailing slashes", async () => {
    // Arrange
    const app = express();
    const router = express.Router();
    const resTxt = "path without slash";
    router.get("/path", (_req, res) => {
      res.send(resTxt);
    });
    app.use("/test", router);
    // Act
    const noSlashRes = await supertest(app).get("/test/path");
    expect(noSlashRes.status).toBe(200);
    expect(noSlashRes.text).toBe(resTxt);
    const withSlashRes = await supertest(app).get("/test/path/");
    expect(withSlashRes.status).toBe(200);
    expect(withSlashRes.text).toBe(resTxt);
  });

  test("router, strict mode is on, distinguishes trailing slashes", async () => {
    // Arrange
    const app = express();
    const router = express.Router({ strict: true });

    router.get("/path", (_req, res) => {
      res.send("path without slash");
    });
    router.get("/path/", (_req, res) => {
      res.send("path with slash");
    });
    app.use("/test", router);

    // Act & Assert
    const noSlashRes = await supertest(app).get("/test/path");
    expect(noSlashRes.status).toBe(200);
    expect(noSlashRes.text).toBe("path without slash");

    const withSlashRes = await supertest(app).get("/test/path/");
    expect(withSlashRes.status).toBe(200);
    expect(withSlashRes.text).toBe("path with slash");
  });

  test("router, mergeParams option is on, merges parent router params", async () => {
    // Arrange
    const app = express();
    // Parent router
    const usersRouter = express.Router();
    // Child router
    const ordersRouter = express.Router({ mergeParams: true });

    // Set up nested routers with params
    usersRouter.get("/:userId", (req, res) => {
      res.send(`User ID: ${req.params.userId}`);
    });

    // `ordersRouter` will have access to `userId` param from `usersRouter`
    ordersRouter.get("/:orderId", (req, res) => {
      res.send(
        // @ts-expect-error - `userId` is from parent router
        `User ID: ${req.params.userId}, Order ID: ${req.params.orderId}`
      );
    });

    // Mount `ordersRouter` under `usersRouter` with userId` in path
    usersRouter.use("/:userId/orders", ordersRouter);
    app.use("/users", usersRouter);

    // Act & Assert
    const usersRes = await supertest(app).get("/users/123");
    expect(usersRes.status).toBe(200);
    expect(usersRes.text).toBe("User ID: 123");

    const ordersRes = await supertest(app).get("/users/123/orders/456");
    expect(ordersRes.status).toBe(200);
    expect(ordersRes.text).toBe("User ID: 123, Order ID: 456");
  });
});
