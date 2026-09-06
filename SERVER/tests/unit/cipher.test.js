const { encrypt } = require("../../routes/helpers/cipher");

describe("cipher.encrypt", () => {
  test("returns a string", () => {
    expect(typeof encrypt("LipaRent 2024")).toBe("string");
  });

  test("shifts printable ASCII 33-78 by +47", () => {
    // '!' = 33 -> 33 + 47 = 80 = 'P'
    expect(encrypt("!")).toBe("P");
    // 'N' = 78 -> 78 + 47 = 125 = '}'
    expect(encrypt("N")).toBe("}");
  });

  test("keeps 'O' (79) unchanged", () => {
    expect(encrypt("O")).toBe("O");
  });

  test("shifts printable ASCII 80-126 by -47", () => {
    // 'P' = 80 -> 80 - 47 = 33 = '!'
    expect(encrypt("P")).toBe("!");
    // '~' = 126 -> 126 - 47 = 79 = 'O'
    expect(encrypt("~")).toBe("O");
  });

  test("keeps spaces unchanged", () => {
    expect(encrypt("a b")).toBe(encrypt("a") + " " + encrypt("b"));
    expect(encrypt(" ")).toBe(" ");
  });

  test("is deterministic and reversible with itself", () => {
    const sample = "LipaRentBalance: 5000";
    expect(encrypt(encrypt(sample))).toBe(sample);
  });
});