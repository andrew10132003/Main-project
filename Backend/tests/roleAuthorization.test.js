const assert = require("node:assert/strict");
const test = require("node:test");

const allowRoles = require("../middleware/roleMiddleware");
const { canMessageRoles } = require("../middleware/messageAuthorization");
const { isEmail, isObjectBody, isPhone, isText } = require("../utils/validation");

const createResponse = () => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("role middleware rejects unauthenticated requests", () => {
  const response = createResponse();
  let nextCalled = false;

  allowRoles("adopter")({}, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 401);
  assert.equal(nextCalled, false);
});

test("role middleware rejects roles outside the allowlist", () => {
  const response = createResponse();
  let nextCalled = false;

  allowRoles("shelter")({ user: { role: "adopter" } }, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 403);
  assert.equal(nextCalled, false);
});

test("role middleware allows an authorized role", () => {
  const response = createResponse();
  let nextCalled = false;

  allowRoles("adopter", "shelter")(
    { user: { role: "shelter" } },
    response,
    () => {
      nextCalled = true;
    }
  );

  assert.equal(nextCalled, true);
});

test("messaging is restricted to shelter-adopter or shelter-foster pairs", () => {
  assert.equal(canMessageRoles("adopter", "shelter"), true);
  assert.equal(canMessageRoles("foster", "shelter"), true);
  assert.equal(canMessageRoles("shelter", "adopter"), true);
  assert.equal(canMessageRoles("shelter", "foster"), true);
  assert.equal(canMessageRoles("adopter", "foster"), false);
  assert.equal(canMessageRoles("admin", "shelter"), false);
});

test("request validation rejects malformed objects and field types", () => {
  assert.equal(isObjectBody({ email: "person@example.org" }), true);
  assert.equal(isObjectBody(null), false);
  assert.equal(isObjectBody([]), false);
  assert.equal(isEmail("person@example.org"), true);
  assert.equal(isEmail("not-an-email"), false);
  assert.equal(isPhone("+1 (415) 555-0134"), true);
  assert.equal(isPhone("1234567"), true);
  assert.equal(isPhone("123456789012345"), true);
  assert.equal(isPhone("1234567890123456"), false);
  assert.equal(isPhone("abc12345"), false);
  assert.equal(isText("  valid  ", { min: 3, max: 10 }), true);
  assert.equal(isText(42, { min: 1, max: 10 }), false);
});
