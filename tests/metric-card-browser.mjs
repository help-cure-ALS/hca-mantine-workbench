import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const browser = await chromium.launch({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
});
const page = await browser.newPage({ viewport: { width: 1360, height: 1000 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const root = ".mantine-MetricCard-root";
const measure = (selector) =>
    page.locator(selector).evaluateAll((cards) =>
        cards.map((card) => {
            const rect = (node) => {
                const r = node.getBoundingClientRect();
                return { top: r.top, bottom: r.bottom, height: r.height, width: r.width };
            };
            const label = card.querySelector(".mantine-MetricCard-label");
            const description = card.querySelector(".mantine-MetricCard-description");
            const value = card.querySelector(".mantine-MetricCard-value");
            const style = getComputedStyle(label);
            const cardStyle = getComputedStyle(card);
            const descriptionStyle = description ? getComputedStyle(description) : null;
            return {
                card: rect(card),
                label: rect(label),
                value: rect(value),
                valueRow: rect(card.querySelector(".mantine-MetricCard-valueRow")),
                valueSize: getComputedStyle(value).fontSize,
                valueWeight: getComputedStyle(value).fontWeight,
                description: description ? rect(description) : null,
                lineHeight: descriptionStyle ? parseFloat(descriptionStyle.lineHeight) : null,
                descriptionLines: descriptionStyle ? Number(descriptionStyle.webkitLineClamp) : 0,
                descriptionOverflow: descriptionStyle?.overflow,
                descriptionTextOverflow: descriptionStyle?.textOverflow,
                contentBottom: rect(card).bottom - parseFloat(cardStyle.paddingBottom) - parseFloat(cardStyle.borderBottomWidth),
                weight: style.fontWeight,
                labelSize: style.fontSize,
                labelLineHeight: style.lineHeight,
                labelTransform: style.textTransform,
                color: style.color,
                expectedColor: getComputedStyle(card).color,
            };
        }),
    );
const close = (a, b, message) => assert.ok(Math.abs(a - b) < 1, `${message}: ${a} vs ${b}`);
const aligned = (items, lines = items.map(() => 1)) => {
    assert.deepEqual(items.map(item => item.descriptionLines), lines);
    for (const item of items) {
        assert.equal(item.weight, "500");
        assert.equal(item.color, item.expectedColor);
        assert.equal(item.labelSize, "12px");
        assert.equal(item.labelLineHeight, "18px");
        assert.equal(item.labelTransform, "uppercase");
        assert.equal(item.valueSize, "26px");
        assert.equal(item.valueWeight, "600");
        if (item.description) {
            assert.equal(item.lineHeight, 17);
            assert.equal(item.descriptionOverflow, "hidden");
            assert.equal(item.descriptionTextOverflow, "ellipsis");
            close(item.description.height, item.lineHeight * item.descriptionLines, "description reserves configured lines");
            close(item.valueRow.bottom, item.description.top, "no gap before description");
            close(item.description.bottom, item.contentBottom, "description at card bottom");
        } else {
            close(item.value.bottom, item.contentBottom, "value at card bottom without description");
        }
        for (const peer of items.filter((peer) => Math.abs(peer.card.top - item.card.top) < 1)) {
            close(item.label.top, peer.label.top, "label top");
            if (item.descriptionLines === peer.descriptionLines) {
                close(item.value.bottom, peer.value.bottom, "value baseline");
            }
            close(item.description?.bottom ?? item.value.bottom, peer.description?.bottom ?? peer.value.bottom, "bottom alignment");
            close(item.card.height, peer.card.height, "equal card heights");
        }
    }
};
try {
    await page.goto(`${process.env.GRID_TEST_URL}/?metric-demo`);
    const cards = `[data-testid="radar-metrics"] ${root}`;
    await page.locator(cards).first().waitFor();
    assert.equal(await page.locator('[data-testid="edge-metrics"] .mantine-MetricCard-description').count(), 2,
        "the card without description renders no description span");
    await mkdir("/tmp/hope-metric-cards", { recursive: true });
    for (const theme of ["Light", "Dark"]) {
        if (await page.locator("html").getAttribute("data-mantine-color-scheme") !== theme.toLowerCase()) {
            await page.getByRole("button", { name: "Toggle theme", exact: true }).click();
        }
        assert.equal(await page.locator("html").getAttribute("data-mantine-color-scheme"), theme.toLowerCase());
        for (const [width, columns] of [[1360, 5], [1140, 5], [1120, 4], [1000, 4], [820, 3], [540, 2], [390, 1]]) {
            await page.setViewportSize({ width, height: 1000 });
            const metrics = await measure(cards);
            aligned(metrics);
            assert.equal(metrics.filter(item => Math.abs(item.card.top - metrics[0].card.top) < 1).length, columns,
                `${columns} cards fit at viewport width ${width}`);
            assert.ok(metrics.every(item => item.card.width >= 210), "cards retain their 210px minimum width");
            aligned(await measure(`[data-testid="edge-metrics"] ${root}`), [0, 1, 2]);
            assert.ok(
                await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
                "no horizontal overflow",
            );
            await page.screenshot({
                path: `/tmp/hope-metric-cards/${theme}-${width}.png`,
                fullPage: true,
            });
        }
    }
    await page.setViewportSize({ width: 1360, height: 1000 });
    const grid = page.getByTestId("radar-metrics");
    await grid.evaluate(node => { node.style.width = "440px"; });
    const constrained = await measure(cards);
    assert.equal(constrained.filter(item => Math.abs(item.card.top - constrained[0].card.top) < 1).length, 2,
        "wrapping follows the container width even on a wide viewport");
    await grid.evaluate(node => { node.style.width = "200px"; });
    const narrow = await measure(cards);
    assert.ok(narrow.every(item => item.card.width <= 200), "very narrow containers do not overflow");
    await grid.evaluate(node => { node.style.removeProperty("width"); });
    const before = await measure(cards);
    close(before[0].label.height, 18, "single-line label has no reserved second line");
    const first = page.locator(cards).first();
    await first.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    assert.notEqual(
        await first.evaluate((node) => getComputedStyle(node).outlineStyle),
        "none",
        "visible keyboard focus",
    );
    await page.keyboard.press("Space");
    assert.equal(await first.getAttribute("aria-pressed"), "true");
    assert.equal(await page.getByTestId("actions").textContent(), "1");
    const after = await measure(cards);
    close(before[0].value.top, after[0].value.top, "selection does not move value");
    close(before[0].card.height, after[0].card.height, "selection does not resize card");
    await page.keyboard.press("Enter");
    assert.equal(await first.getAttribute("aria-pressed"), "false");
    assert.equal(await page.getByTestId("actions").textContent(), "2");
    assert.equal(await page.getByRole("button", { name: /Deaktiviert/ }).isDisabled(), true);
    await page.setViewportSize({ width: 820, height: 1000 });
    const overflow = page
        .locator('[data-testid="edge-metrics"] .mantine-MetricCard-description')
        .last();
    await overflow.locator("xpath=self::*[@tabindex='0']").waitFor();
    await overflow.focus();
    await page.getByRole("tooltip").filter({ hasText: "vollständige Hinweis" }).waitFor();
    assert.deepEqual(errors, []);
    console.log(
        "PASS MetricCard: both themes, responsive alignment, empty/long descriptions, keyboard, selection and disabled state",
    );
} finally {
    await browser.close();
}
