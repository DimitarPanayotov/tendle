import { cruise } from "dependency-cruiser";
import extractDepcruiseOptions from "dependency-cruiser/config-utl/extract-depcruise-options";
import { describe, expect, test } from "vitest";

/**
 * The folder boundaries are checked by `pnpm run lint`. That check once read
 * zero files without failing: TypeScript 7.0 lacked the API it needs. A check
 * that reads nothing passes for the wrong reason, so this test makes sure it
 * reads every source folder and finds every boundary intact, with the same
 * rules file the lint step uses.
 */
describe("the folder boundaries", () => {
  test("are checked against every source folder and hold", async () => {
    const options = await extractDepcruiseOptions("./.dependency-cruiser.json");
    const result = await cruise(["src"], options, undefined, { tsConfig: { fileName: "tsconfig.json" } });
    if (typeof result.output === "string") {
      throw new Error(result.output);
    }
    const sources = result.output.modules.map((module) => module.source);
    for (const folder of ["src/game/", "src/server/", "src/web/"]) {
      expect(sources.some((source) => source.startsWith(folder))).toBe(true);
    }
    expect(result.output.summary.violations).toEqual([]);
  });
});
