import { test } from "node:test";
import assert from "node:assert/strict";
import {
    arrangeGridColumns,
    moveGridColumn,
    setGridColumnVisible,
    defaultGridPresentation,
    readGridPresentation,
    writeGridPresentation,
    gridViewUrlParams,
    gridSelectionScope,
    toggleGridPage,
} from "../src/data-grid/grid-state.ts";

test("legacy links, missing and malformed state keep a usable layout", () => {
    for (const raw of ["", "_grid=garbage", "_grid=%7B%22version%22:99%7D"]) {
        assert.deepEqual(readGridPresentation(new URLSearchParams(raw)), defaultGridPresentation());
    }
    assert.equal(readGridPresentation(new URLSearchParams("layout=board")).layout, "board");
    assert.equal(readGridPresentation(new URLSearchParams("layout=missing")).layout, "grid");
});

test("complete view roundtrip preserves repeated domain filters and never includes selection", () => {
    const state = {
        ...defaultGridPresentation(),
        layout: "cards" as const,
        order: ["status", "title"],
        hidden: ["date"],
        shown: ["owner"],
        widths: { title: 430 },
    };
    const params = new URLSearchParams(
        "status=draft&status=active&q=ALS&sort=date_desc&group_by=status",
    );
    const encoded = gridViewUrlParams("virt-example", writeGridPresentation(params, state));
    assert.deepEqual(readGridPresentation(encoded), state);
    assert.deepEqual(encoded.getAll("status"), ["draft", "active"]);
    assert.equal(encoded.get("q"), "ALS");
    assert.equal(encoded.get("view"), "virt-example");
    assert.equal(encoded.has("selection"), false);
    assert.equal(params.has("_grid"), false);
});

test("stale columns, newly added fields and fixed columns resolve predictably", () => {
    const columns = [
        { id: "action", reorderable: false, hideable: false, width: 40 },
        { id: "title" },
        { id: "date" },
        { id: "owner", hidden: true },
        { id: "new" },
    ];
    const state = {
        ...defaultGridPresentation(),
        order: ["removed", "date", "title", "owner"],
        hidden: ["action"],
        widths: { title: 2000, date: 1, removed: 123 },
    };
    const result = arrangeGridColumns(columns, state);
    assert.deepEqual(
        result.map((c) => c.id),
        ["action", "date", "title", "new"],
    );
    assert.equal(result[1].width, 64);
    assert.equal(result[2].width, 1200);
    assert.deepEqual(
        arrangeGridColumns(columns, { ...state, shown: ["owner"] }).map((c) => c.id),
        ["action", "date", "title", "owner", "new"],
    );
    assert.equal(columns[1].width, undefined);
});

test("invalid widths cannot escape bounds, override non-resizable columns or mutate prototypes", () => {
    const state = readGridPresentation(
        new URLSearchParams({
            _grid: '{"version":1,"widths":{"title":-1,"date":"500","__proto__":100,"fixed":900,"bounded":500},"hidden":["x",2,"x"]}',
        }),
    );
    assert.deepEqual(state.hidden, ["x"]);
    assert.equal(state.widths.title, undefined);
    assert.equal(state.widths.date, undefined);
    assert.equal(Object.getPrototypeOf(state.widths), Object.prototype);
    const result = arrangeGridColumns(
        [
            { id: "fixed", width: 40, resizable: false },
            { id: "bounded", minWidth: 100, maxWidth: 200 },
        ],
        state,
    );
    assert.equal(result[0].width, 40);
    assert.equal(result[1].width, 200);
});

test("at least one data column stays accessible in an entirely hidden saved view", () => {
    const result = arrangeGridColumns([{ id: "a" }, { id: "b" }], {
        ...defaultGridPresentation(),
        hidden: ["a", "b"],
    });
    assert.deepEqual(
        result.map((c) => c.id),
        ["a"],
    );
});

test("loaded-page selection preserves other pages and does not mutate the caller", () => {
    const selected = new Set(["off-page", "a"]);
    assert.deepEqual([...toggleGridPage(selected, ["a", "b"])], ["off-page", "a", "b"]);
    assert.deepEqual(
        [...toggleGridPage(new Set(["off-page", "a", "b"]), ["a", "b"])],
        ["off-page"],
    );
    assert.deepEqual([...selected], ["off-page", "a"]);
    assert.deepEqual([...toggleGridPage(selected, [])], [...selected]);
});

test("selection scope ignores presentation, sorting and pagination but changes with the result filters", () => {
    const params = new URLSearchParams("q=ALS&status=active&status=draft");
    const next = gridViewUrlParams(
        "another",
        writeGridPresentation(params, { ...defaultGridPresentation(), layout: "board" }),
    );
    next.set("group_by", "status");
    next.set("direction", "desc");
    next.set("sort", "name");
    next.set("offset", "100");
    assert.equal(gridSelectionScope(params), gridSelectionScope(next));
    next.set("q", "SOD1");
    assert.notEqual(gridSelectionScope(params), gridSelectionScope(next));
});

test("moving visible columns preserves hidden columns and fixed positions", () => {
    const columns = [
        { id: "fixed", reorderable: false },
        { id: "title" },
        { id: "private", hidden: true },
        { id: "status" },
    ];
    const initial = defaultGridPresentation();
    const next = moveGridColumn(columns, initial, "status", "title");
    assert.deepEqual(next.order, ["fixed", "status", "title", "private"]);
    assert.deepEqual(
        arrangeGridColumns(columns, next).map((c) => c.id),
        ["fixed", "status", "title"],
    );
    assert.equal(moveGridColumn(columns, next, "fixed", "status"), next);
    assert.equal(moveGridColumn(columns, next, "status", "missing"), next);
    const revealed = setGridColumnVisible(next, "private", true);
    assert.deepEqual(
        arrangeGridColumns(columns, revealed).map((c) => c.id),
        ["fixed", "status", "title", "private"],
    );
    assert.equal(
        arrangeGridColumns(columns, setGridColumnVisible(revealed, "private", false)).length,
        3,
    );
    assert.deepEqual(initial.order, []);
});
