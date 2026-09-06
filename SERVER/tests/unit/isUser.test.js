const { isUser } = require("../../routes/users/helpers/isUser");

describe("isUser middleware", () => {
  test("calls next() when the user header is present", () => {
    const req = { headers: { user: true } };
    const next = jest.fn();
    isUser(req, {}, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test("responds 500 with an error when the user header is missing", () => {
    const json = jest.fn();
    const res = { status: jest.fn(() => ({ json })) };
    const next = jest.fn();

    isUser({ headers: {} }, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: "Unauthorized action, Not a user.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("responds 500 when the user header is falsy", () => {
    const json = jest.fn();
    const res = { status: jest.fn(() => ({ json })) };
    isUser({ headers: { user: null } }, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
  });
});