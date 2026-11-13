const { loginValidator } = require("../../middleware/validators/login");
const { landlordValidator } = require("../../middleware/validators/landlord");
const { tenantValidator } = require("../../middleware/validators/tenant");
const { roomValidator } = require("../../middleware/validators/room");

async function runValidator(validator, body, res) {
  let nextCalled = false;
  const next = () => (nextCalled = true);
  await validator({ body }, res, next);
  return nextCalled;
}

describe("Joi validators", () => {
  let res;
  beforeEach(() => {
    res = {
      status: jest.fn(() => res),
      json: jest.fn(),
    };
  });

  describe("loginValidator", () => {
    test("accepts valid login data", async () => {
      const ok = await runValidator(
        loginValidator,
        { email: "john@example.com", nationalID: "abc123", password: "password123" },
        res,
      );
      expect(ok).toBe(true);
      expect(res.status).not.toHaveBeenCalled();
    });

    test("rejects an invalid email", async () => {
      const ok = await runValidator(
        loginValidator,
        { email: "not-an-email", nationalID: "abc123", password: "password123" },
        res,
      );
      expect(ok).toBe(false);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ response_status: "danger" }),
      );
    });

    test("rejects a short password", async () => {
      const ok = await runValidator(
        loginValidator,
        { email: "john@example.com", nationalID: "abc123", password: "short" },
        res,
      );
      expect(ok).toBe(false);
    });

    test("rejects missing fields", async () => {
      const ok = await runValidator(loginValidator, {}, res);
      expect(ok).toBe(false);
    });
  });

  describe("landlordValidator", () => {
    const valid = {
      name: "John Doe",
      nationalID: "abc123",
      email: "john@example.com",
      phone: "254700000000",
      password: "password123",
      confirmPassword: "password123",
    };

    test("accepts valid landlord signup data", async () => {
      const ok = await runValidator(landlordValidator, valid, res);
      expect(ok).toBe(true);
    });

    test("rejects a missing field", async () => {
      const { email, ...rest } = valid;
      const ok = await runValidator(landlordValidator, rest, res);
      expect(ok).toBe(false);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test("rejects a phone shorter than 12 chars", async () => {
      const ok = await runValidator(
        landlordValidator,
        { ...valid, phone: "12345" },
        res,
      );
      expect(ok).toBe(false);
    });
  });

  describe("tenantValidator", () => {
    const validTenant = {
      tenantName: "Jane Doe",
      tenantNationalID: "99999",
      tenantPhone: "254700000000",
      tenantMoveIn: "2024-01-01",
    };

    // tenantValidator reads req.body.newTenant (nested)
    test("accepts a valid tenant", async () => {
      const ok = await runValidator(
        tenantValidator,
        { newTenant: validTenant },
        res,
      );
      expect(ok).toBe(true);
    });

    test("rejects a tenant missing required fields", async () => {
      const ok = await runValidator(tenantValidator, { newTenant: {} }, res);
      expect(ok).toBe(false);
    });
  });

  describe("roomValidator", () => {
    const validRoom = {
      roomNumber: "PK1",
      roomRatePerMonth: "6000",
      roomType: "SingleRoom",
      roomArea: "2500sqFT",
    };

    // roomValidator reads req.body.newRoom (nested)
    test("accepts a valid room", async () => {
      const ok = await runValidator(
        roomValidator,
        { newRoom: validRoom },
        res,
      );
      expect(ok).toBe(true);
    });

    test("rejects an invalid room number", async () => {
      const ok = await runValidator(
        roomValidator,
        { newRoom: { ...validRoom, roomNumber: "" } },
        res,
      );
      expect(ok).toBe(false);
    });
  });
});