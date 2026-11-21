// @vitest-environment happy-dom
import { render, screen } from "@testing-library/preact";
import { describe, expect, test } from "vitest";
import { App } from "./App";

describe("the page", () => {
  test("names the game", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Tendle" })).toBeTruthy();
  });
});
