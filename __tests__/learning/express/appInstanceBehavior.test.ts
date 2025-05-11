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
});
