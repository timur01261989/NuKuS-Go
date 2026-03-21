import test from "node:test";
import assert from "node:assert/strict";
import { getBearerToken } from "../server/_shared/http-auth.js";

test("getBearerToken extracts bearer token", () => {
  const token = getBearerToken({ headers: { authorization: "Bearer abc.def" } });
  assert.equal(token, "abc.def");
});

test("getBearerToken returns empty string for invalid header", () => {
  const token = getBearerToken({ headers: { authorization: "Basic abc" } });
  assert.equal(token, "");
});
