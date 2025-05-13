import { describe, expect, test } from "@jest/globals";
import express from "express";

describe("express:appInstanceBehavior", () => {
  test("calling express() multiple times should create different instances, passed", () => {
    const app1 = express();
    const app2 = express();
    expect(app1).not.toBe(app2);
  });

  test("calling express() returns a function, passed", () => {
    const app = express();
    expect(typeof app).toBe("function");
  });

  test("application instances have standard HTTP methods, passed", () => {
    const app = express();
    expect(typeof app.get).toBe("function");
  });

  // Integration tests???
  // test("should respond to defined GET route", async () => {
  //   const app = express();
  //   app.get("/hello", (req, res) => {
  //     res.status(200).json({ message: "Hello" });
  //   });

  //   const res = await request(app).get("/hello");
  //   expect(res.status).toBe(200);
  //   expect(res.body).toEqual({ message: "Hello" });
  // });
});
