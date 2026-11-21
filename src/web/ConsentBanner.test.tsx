// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/preact";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { ConsentBanner } from "./ConsentBanner";

beforeEach(() => {
  localStorage.clear();
});
afterEach(cleanup);

describe("the consent banner", () => {
  test("on a first visit it asks for agreement and sets no cookie", () => {
    render(<ConsentBanner />);
    expect(screen.getByText("May Tendle use cookies for ads?")).toBeTruthy();
    expect(document.cookie).toBe("");
  });

  test("agreeing is remembered in the browser and sets no cookie", () => {
    const first = render(<ConsentBanner />);
    fireEvent.click(screen.getByRole("button", { name: "Agree" }));
    expect(localStorage.getItem("tendle-ad-consent")).toBe("agreed");
    expect(screen.queryByText("May Tendle use cookies for ads?")).toBeNull();
    expect(document.cookie).toBe("");
    first.unmount();
    render(<ConsentBanner />);
    expect(screen.queryByText("May Tendle use cookies for ads?")).toBeNull();
  });

  test("refusing is remembered and hides the question", () => {
    render(<ConsentBanner />);
    fireEvent.click(screen.getByRole("button", { name: "Refuse" }));
    expect(localStorage.getItem("tendle-ad-consent")).toBe("refused");
    expect(screen.queryByText("May Tendle use cookies for ads?")).toBeNull();
    expect(document.cookie).toBe("");
  });

  test("the answer can be changed later", () => {
    render(<ConsentBanner />);
    fireEvent.click(screen.getByRole("button", { name: "Refuse" }));
    fireEvent.click(screen.getByRole("button", { name: "Ad cookie settings" }));
    expect(screen.getByText("May Tendle use cookies for ads?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Agree" }));
    expect(localStorage.getItem("tendle-ad-consent")).toBe("agreed");
  });

  test("an unreadable stored value counts as no answer", () => {
    localStorage.setItem("tendle-ad-consent", "maybe");
    render(<ConsentBanner />);
    expect(screen.getByText("May Tendle use cookies for ads?")).toBeTruthy();
  });
});
