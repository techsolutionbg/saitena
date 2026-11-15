import test from "node:test";
import assert from "node:assert/strict";
test("planned CI failure rehearsal blocks subsequent release checks", () => {
  assert.fail("Intentional private-PR CI failure rehearsal; production remains disabled");
});
