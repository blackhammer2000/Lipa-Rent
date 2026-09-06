const { Otp } = require("../../middleware/models/Otp");

jest.mock("../../middleware/models/Otp", () => ({
  Otp: { findOne: jest.fn(), deleteOne: jest.fn() },
}));

const {
  isLoginVerified,
} = require("../../middleware/validators/isLoginVerified");

describe("isLoginVerified middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("calls next() when the OTP doc has isLoginOtpVerified truthy", async () => {
    Otp.findOne.mockResolvedValueOnce({ isLoginOtpVerified: true });
    const next = jest.fn();

    await isLoginVerified({ body: { id: "abc" } }, {}, next);

    expect(Otp.findOne).toHaveBeenCalledWith({ ownerID: "abc" });
    expect(next).toHaveBeenCalledTimes(1);
  });

  test("returns 500 when no OTP doc exists", async () => {
    Otp.findOne.mockResolvedValueOnce(null);
    const json = jest.fn();
    const res = { status: jest.fn(() => ({ json })) };

    await isLoginVerified({ body: { id: "abc" } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ error: "Something went wrong." });
  });

  test("returns 403 and deletes the OTP doc on an invalid session", async () => {
    Otp.findOne.mockResolvedValueOnce({ isLoginOtpVerified: false });
    Otp.deleteOne.mockResolvedValueOnce({ acknowledged: true, deletedCount: 1 });
    const json = jest.fn();
    const res = { status: jest.fn(() => ({ json })) };

    await isLoginVerified({ body: { id: "abc" } }, res, jest.fn());

    expect(Otp.deleteOne).toHaveBeenCalledWith({ ownerID: "abc" });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({ error: "session expired" });
  });
});