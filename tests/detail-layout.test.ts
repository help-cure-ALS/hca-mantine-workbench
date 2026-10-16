/**
 * The measurements of a detail page (UI.15).
 *
 * The components themselves render Mantine and are checked by eye in
 * the playground. What is testable here is the part that caused the
 * drift in the first place: the numbers, and the rule that there is
 * exactly one of each.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
    DETAIL_CARD_RADIUS,
    DETAIL_LABEL_TRACKING,
    DETAIL_LAYOUT,
    DETAIL_MAX_WIDTH,
    DETAIL_PADDING,
    DETAIL_SECTION_GAP,
    DETAIL_TEXT,
    detailBodyPadding,
} from "../src/components/detail-layout.ts";

describe("detail layout", () => {
    it("states one width, and it fits a readable line", () => {
        // At the theme's 15px body size, ~100 characters. Wider than
        // this and the eye loses the start of the next line.
        assert.equal(DETAIL_MAX_WIDTH, 920);
    });

    it("gives the body more room at the bottom than at the top", () => {
        // A header bar usually sits above; below there is nothing but
        // the window edge, and a last section flush against it reads
        // as a page that got cut off.
        assert.ok(DETAIL_PADDING.bottom > DETAIL_PADDING.top);
        assert.equal(DETAIL_PADDING.left, DETAIL_PADDING.right);
    });

    it("renders the padding in CSS order: top right bottom left", () => {
        assert.equal(detailBodyPadding(), "24px 32px 48px 32px");
    });

    it("lets one side be overridden without losing the others", () => {
        // A page ending in a sticky bar needs room for it, and must
        // not have to restate the other three.
        assert.equal(detailBodyPadding({ bottom: 96 }), "24px 32px 96px 32px");
    });

    it("uses Mantine keys for gap and radius, not pixels", () => {
        // Pixels here would sidestep the theme, which is the thing
        // these constants exist to stop.
        assert.equal(DETAIL_SECTION_GAP, "xl");
        assert.equal(DETAIL_CARD_RADIUS, "md");
    });

    it("has exactly one tracking for uppercase labels", () => {
        // Two values a few hundredths apart read as two different
        // kinds of label, which is how twelve variants happened.
        assert.equal(DETAIL_LABEL_TRACKING, "0.08em");
    });

    it("the bundle carries the same values as the single exports", () => {
        assert.equal(DETAIL_LAYOUT.maxWidth, DETAIL_MAX_WIDTH);
        assert.equal(DETAIL_LAYOUT.sectionGap, DETAIL_SECTION_GAP);
        assert.equal(DETAIL_LAYOUT.cardRadius, DETAIL_CARD_RADIUS);
        assert.equal(DETAIL_LAYOUT.labelTracking, DETAIL_LABEL_TRACKING);
        assert.deepEqual(DETAIL_LAYOUT.padding, DETAIL_PADDING);
    });

    it("gives a field value body size in the body colour", () => {
        // The pages this family was extracted from had the values at
        // 13 px in 72 of 86 places, so a whole detail view read as
        // fine print. A value is content: 15 px, and no colour of its
        // own, which means the body colour.
        assert.equal(DETAIL_TEXT.value.size, "md");
        assert.equal(DETAIL_TEXT.value.c, undefined);
    });

    it("never pairs body size with grey, or a small size with black", () => {
        // This is the rule, not a coincidence of the current values:
        // a role is a size and a colour together. 15 px grey and
        // 13 px black are the combinations that made four detail
        // views look like a mix rather than a hierarchy.
        //
        // `absence` is the one exception and is checked separately
        // below: it is not text, it is the mark for a missing value.
        for (const [role, { size, c }] of Object.entries(DETAIL_TEXT)) {
            if (role === "absence") continue;
            if (size === "md") {
                assert.equal(c, undefined, `${role} is body size and must be black`);
            } else {
                assert.equal(c, "dimmed", `${role} is below body size and must be grey`);
            }
        }
    });

    it("marks a missing value at the value's size in grey", () => {
        // It stands where a value stands, so it keeps the size; there
        // is nothing to read, so it takes the quiet tone.
        assert.equal(DETAIL_TEXT.absence.size, DETAIL_TEXT.value.size);
        assert.equal(DETAIL_TEXT.absence.c, "dimmed");
    });

    it("keeps exactly two text roles below body size", () => {
        // The caption of a field and the line of identifiers. If a
        // third turns up, the drift has started again.
        const belowBody = Object.entries(DETAIL_TEXT)
            .filter(([, { size }]) => size === "sm" || size === "xs")
            .map(([role]) => role)
            .sort();
        assert.deepEqual(belowBody, ["label", "meta"]);
    });

    it("is frozen, so a consumer cannot bend it for one page", () => {
        assert.throws(() => {
            // @ts-expect-error — that is the point of the test
            DETAIL_LAYOUT.maxWidth = 1200;
        });
    });
});
