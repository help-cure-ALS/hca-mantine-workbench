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
                return { top: r.top, bottom: r.bottom, height: r.height };
            };
            const label = card.querySelector(".mantine-MetricCard-label");
            const description = card.querySelector(".mantine-MetricCard-description");
            const style = getComputedStyle(label);
            return {
                card: rect(card),
                label: rect(label),
                value: rect(card.querySelector(".mantine-MetricCard-value")),
                description: rect(description),
                lineHeight: parseFloat(getComputedStyle(description).lineHeight),
                weight: style.fontWeight,
                color: style.color,
                expectedColor: getComputedStyle(card).color,
            };
        }),
    );
const close = (a, b, message) => assert.ok(Math.abs(a - b) < 1, `${message}: ${a} vs ${b}`);
const aligned = (items) => {
    for (const item of items) {
        assert.equal(item.weight, "500");
        assert.equal(item.color, item.expectedColor);
        close(item.description.height, item.lineHeight * 2, "description reserves two lines");
        for (const peer of items.filter((peer) => Math.abs(peer.card.top - item.card.top) < 1)) {
            close(item.label.top, peer.label.top, "label top");
            close(item.value.bottom, peer.value.bottom, "value baseline");
            close(item.description.bottom, peer.description.bottom, "description bottom");
            close(item.card.height, peer.card.height, "equal card heights");
        }
    }
};
try {
    await page.goto(`${process.env.GRID_TEST_URL}/?metric-demo`);
    const cards = `[data-testid="radar-metrics"] ${root}`;
    await page.locator(cards).first().waitFor();
    await mkdir("/tmp/hope-metric-cards", { recursive: true });
    for (const theme of ["Light", "Dark"]) {
        await page.getByRole("button", { name: theme, exact: true }).click();
        for (const width of [1360, 820, 390]) {
            await page.setViewportSize({ width, height: 1000 });
            aligned(await measure(cards));
            aligned(await measure(`[data-testid="edge-metrics"] ${root}`));
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
    const before = await measure(cards);
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
