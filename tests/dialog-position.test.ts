import assert from "node:assert/strict";
import test from "node:test";
import { clampDialogPosition } from "../src/components/dialog-position.ts";

const viewport = { width: 1200, height: 800 };
const bounds = { left: 300, top: 200, width: 600, height: 400 };

test("dialog can move freely while all edges remain visible", () => {
    assert.deepEqual(clampDialogPosition({ x: 100, y: -60 }, bounds, viewport), { x: 100, y: -60 });
});

test("dragging beyond any edge keeps the complete dialog reachable", () => {
    assert.deepEqual(clampDialogPosition({ x: 5000, y: 5000 }, bounds, viewport), { x: 292, y: 192 });
    assert.deepEqual(clampDialogPosition({ x: -5000, y: -5000 }, bounds, viewport), { x: -292, y: -192 });
});

test("viewport shrink and expanding fields bring a moved dialog back into view", () => {
    assert.deepEqual(clampDialogPosition({ x: 280, y: 180 }, { left: 100, top: 50, width: 600, height: 650 }, { width: 800, height: 750 }), { x: 92, y: 42 });
});

test("oversized content keeps its title and close control at the top", () => {
    assert.deepEqual(clampDialogPosition({ x: 0, y: 0 }, { left: 0, top: -200, width: 700, height: 1000 }, { width: 400, height: 500 }), { x: 8, y: 208 });
});
