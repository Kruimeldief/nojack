import { Nojack } from "../src/nojack";

describe("Constructor options", () =>
{
  it("No options", () =>
  {
    const nojack = new Nojack();
    expect(nojack["_placeholder"]).toBe("*");
  });

  it("Valid placeholder option", () =>
  {
    const nojack = new Nojack({
      placeholder: "#"
    });
    expect(nojack["_placeholder"]).toBe("#");
  });

  it("Invalid placeholder option", () =>
  {
    const nojack = new Nojack({
      placeholder: 2
    });
    expect(nojack["_placeholder"]).toBe("*");
  });
});

describe("Build lists", () =>
{
  const nojack = new Nojack<number>();

  it("Add to blacklist", () =>
  {
    nojack.blacklist(0, "black", "black2");
    expect(nojack.blacklistValues).toEqual([{ category: 0, list: ["black", "black2"] }]);
  });

  it("Remove from blacklist", () =>
  {
    nojack.blacklistRemove("black");
    expect(nojack.blacklistValues).toHaveLength(1);
    expect(nojack.blacklistValues[0].category).toBe(0);
    expect(nojack.blacklistValues[0].list).toEqual(["black2"]);
  });

  it("Add to whitelist", () =>
  {
    nojack.whitelist("white");
    expect(nojack.whitelistValues).toEqual(["white"]);
  });

  it("Remove from whitelist", () =>
  {
    nojack.whitelistRemove("white");
    expect(nojack.whitelistValues).toHaveLength(0);
  });
});