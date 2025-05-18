/**
 * Tests for Express Routing functionality.
 *
 * @see https://expressjs.com/en/5x/api.html#routing-methods
 */
import { describe, expect, test } from "@jest/globals";
import express, { NextFunction, Request, Response } from "express";
import supertest from "supertest";

describe("Express Routing", () => {
  test("routing, handling get request, returns expected response", async () => {
    // Arrange
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

  test("routing, handling different HTTP methods, routes to correct handler", async () => {
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

    const patchResTxt = "PATCH Method";
    app.patch(url, (_req, res) => {
      res.send(patchResTxt);
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

    const patchRes = await supertest(app).patch(url);
    expect(patchRes.text).toBe(patchResTxt);
  });

  test("routing, using route parameters, extracts parameters correctly", async () => {
    // Arrange
    const app = express();

    app.get("/user/:id", (req, res) => {
      res.send(`User ${req.params.id}`);
    });

    app.get("/product/:category/:id", (req, res) => {
      res.send(`Product ${req.params.id} in ${req.params.category}`);
    });

    // Act & Assert
    const userRes = await supertest(app).get("/user/123");
    expect(userRes.status).toBe(200);
    expect(userRes.text).toBe("User 123");

    const productRes = await supertest(app).get("/product/electronics/456");
    expect(productRes.status).toBe(200);
    expect(productRes.text).toBe("Product 456 in electronics");
  });

  test("routing, using regular expressions, match routes accordingly", async () => {
    // Arrange
    const app = express();

    // Route that matches paths ending with 'fly'
    app.get(/.*fly$/, (_req, res) => {
      res.send("Fly route matched");
    });

    // Route that matches paths containing a digit
    app.get(/\/route-(\d+)/, (req, res) => {
      // The first captured group is at index 0 in req.params
      const routeNumber = req.params[0];
      res.send(`Route number: ${routeNumber}`);
    });

    // Act & Assert
    const butterflyRes = await supertest(app).get("/butterfly");
    expect(butterflyRes.status).toBe(200);
    expect(butterflyRes.text).toBe("Fly route matched");

    const dragonRes = await supertest(app).get("/dragon");
    expect(dragonRes.status).toBe(404);

    const routeNumberRes = await supertest(app).get("/route-42");
    expect(routeNumberRes.status).toBe(200);
    expect(routeNumberRes.text).toBe("Route number: 42");
  });

  test("express(), setting multiple route handlers, executes them in order", async () => {
    // Arrange
    const app = express();
    const executionOrder: number[] = [];

    const cb0 = (_req: Request, _res: Response, next: NextFunction): void => {
      executionOrder.push(0);
      next();
    };

    const cb1 = (_req: Request, _res: Response, next: NextFunction): void => {
      executionOrder.push(1);
      next();
    };

    app.get(
      "/multi-handler",
      [cb0, cb1],
      (_req: Request, _res: Response, next: NextFunction): void => {
        executionOrder.push(2);
        next();
      },
      (_req: Request, res: Response): void => {
        executionOrder.push(3);
        res.json({ executionOrder });
      }
    );

    // Act
    const response = await supertest(app).get("/multi-handler");

    // Assert
    expect(response.body.executionOrder).toEqual([0, 1, 2, 3]);
  });

  test("routing, using app.route(), supports chainable route handlers", async () => {
    // Arrange
    const app = express();

    // Use app.route() to define multiple methods for the same path
    app
      .route("/resource")
      .get((_req, res) => {
        res.send("Get resource");
      })
      .post((_req, res) => {
        res.send("Create resource");
      })
      .put((_req, res) => {
        res.send("Update resource");
      });

    // Act & Assert
    const getRes = await supertest(app).get("/resource");
    expect(getRes.status).toBe(200);
    expect(getRes.text).toBe("Get resource");

    const postRes = await supertest(app).post("/resource");
    expect(postRes.status).toBe(200);
    expect(postRes.text).toBe("Create resource");

    const putRes = await supertest(app).put("/resource");
    expect(putRes.status).toBe(200);
    expect(putRes.text).toBe("Update resource");
  });

  test("routing, with case-sensitive routes, distinguishes routes by case", async () => {
    // Arrange
    const app = express();

    // Enable case sensitive routing
    app.set("case sensitive routing", true);

    app.get("/lowercase", (_req, res) => {
      res.send("lowercase route");
    });

    app.get("/UPPERCASE", (_req, res) => {
      res.send("UPPERCASE route");
    });

    // Act & Assert
    const lowercaseRes = await supertest(app).get("/lowercase");
    expect(lowercaseRes.status).toBe(200);
    expect(lowercaseRes.text).toBe("lowercase route");

    const uppercaseRes = await supertest(app).get("/UPPERCASE");
    expect(uppercaseRes.status).toBe(200);
    expect(uppercaseRes.text).toBe("UPPERCASE route");

    // This should not match because the route is case-sensitive
    const wrongCaseRes = await supertest(app).get("/Lowercase");
    expect(wrongCaseRes.status).toBe(404);
  });

  test("routing, strict mode is off (by default), does not distinguish trailing slashes", async () => {
    // Arrange
    const app = express();
    const resTxt = "path without slash";
    app.get("/path", (_req, res) => {
      res.send(resTxt);
    });
    // Act
    const noSlashRes = await supertest(app).get("/path");
    expect(noSlashRes.status).toBe(200);
    expect(noSlashRes.text).toBe(resTxt);
    const withSlashRes = await supertest(app).get("/path/");
    expect(withSlashRes.status).toBe(200);
    expect(withSlashRes.text).toBe(resTxt);
  });

  test("routing, strict mode is on, distinguishes trailing slashes", async () => {
    // Arrange
    const app = express();
    // Enable strict routing
    app.set("strict routing", true);
    app.get("/path", (_req, res) => {
      res.send("path without slash");
    });
    app.get("/path/", (_req, res) => {
      res.send("path with slash");
    });
    // Act & Assert
    const noSlashRes = await supertest(app).get("/path");
    expect(noSlashRes.status).toBe(200);
    expect(noSlashRes.text).toBe("path without slash");
    const withSlashRes = await supertest(app).get("/path/");
    expect(withSlashRes.status).toBe(200);
    expect(withSlashRes.text).toBe("path with slash");
  });

  test("routing, only optional parameters are set, correctly handles presence and absence", async () => {
    // Arrange
    const app = express();
    // The '{}' makes the route parameter optional
    app.get("/optional/:required/{:optional}", (req, res) => {
      const { required, optional } = req.params;
      const optionalValue = optional ?? "default";
      res.send(`Required: ${required}, Optional: ${optionalValue}`);
    });
    // Act & Assert
    const bothParamsRes = await supertest(app).get("/optional/foo/bar");
    expect(bothParamsRes.status).toBe(200);
    expect(bothParamsRes.text).toBe("Required: foo, Optional: bar");
    // Need to be careful with this.
    const requiredOnlyNoSlashRes = await supertest(app).get("/optional/foo");
    expect(requiredOnlyNoSlashRes.status).toBe(404);
    const requiredOnlyWithSlashRes = await supertest(app).get("/optional/foo/");
    expect(requiredOnlyWithSlashRes.status).toBe(200);
    expect(requiredOnlyWithSlashRes.text).toBe(
      "Required: foo, Optional: default"
    );
  });

  test("routing, optional parameters and prefix symbols are set, correctly handles presence and absence", async () => {
    // Arrange
    const app = express();
    // This should be the better and more popular way to use "{}"
    app.get("/optional/:required{/:optional}", (req, res) => {
      const { required, optional } = req.params;
      const optionalValue = optional ?? "default";
      res.send(`Required: ${required}, Optional: ${optionalValue}`);
    });
    // Act & Assert
    const bothParamsRes = await supertest(app).get("/optional/foo/bar");
    expect(bothParamsRes.status).toBe(200);
    expect(bothParamsRes.text).toBe("Required: foo, Optional: bar");
    const requiredOnlyNoSlashRes = await supertest(app).get("/optional/foo");
    expect(requiredOnlyNoSlashRes.status).toBe(200);
    expect(requiredOnlyNoSlashRes.text).toBe(
      "Required: foo, Optional: default"
    );
    const requiredOnlyWithSlashRes = await supertest(app).get("/optional/foo/");
    expect(requiredOnlyWithSlashRes.status).toBe(200);
    expect(requiredOnlyWithSlashRes.text).toBe(
      "Required: foo, Optional: default"
    );
  });

  test("routing, route path with special character '-', correctly handles routes", async () => {
    // Arrange
    const app = express();
    app.get("/flights/:from-:to", (req, res) => {
      const { from, to } = req.params;
      res.send(`Flights from ${from} to ${to}`);
    });
    // Act
    const res = await supertest(app).get("/flights/NYC-LAX");
    // Assert
    expect(res.status).toBe(200);
    expect(res.text).toBe("Flights from NYC to LAX");
  });

  test("routing, route path with special character '.', correctly handles routes", async () => {
    // Arrange
    const app = express();
    const renderResTxt = (filename: string, extension: string): string =>
      `File: ${filename}, Extension: ${extension}`;
    app.get("/files/:filename.:extension", (req, res) => {
      const { filename, extension } = req.params;
      res.send(renderResTxt(filename, extension));
    });
    // Act
    const filename = "report";
    const extension = "pdf";
    const res = await supertest(app).get(`/files/${filename}.${extension}`);
    // Assert
    expect(res.status).toBe(200);
    expect(res.text).toBe(renderResTxt(filename, extension));
  });
});
