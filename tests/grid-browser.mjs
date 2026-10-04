import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
});
const context = await browser.newContext({ viewport: { width: 1440, height: 960 } }),
    page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const check = async (text, operation) => {
    await operation();
    console.log("PASS", text);
};
try {
    await page.goto(`${process.env.GRID_TEST_URL ?? "http://127.0.0.1:4190"}/?grid-test=1`);
    await page.getByRole("button", { name: "Kacheln", exact: true }).waitFor();
    await check("checkbox selection does not open a row", async () => {
        await page.getByRole("checkbox", { name: "Eintrag auswählen: 1", exact: true }).check();
        assert.equal(await page.getByTestId("opened").innerText(), "Geöffnet: 0");
        assert.equal(await page.getByTestId("selected").innerText(), "Auswahl: 1");
    });
    await check("selection survives all layouts; disabled rows stay disabled", async () => {
        for (const name of ["Kacheln", "Kanban", "Liste"]) {
            await page.getByRole("button", { name, exact: true }).click();
            assert.equal(
                await page
                    .getByRole("checkbox", { name: "Eintrag auswählen: 1", exact: true })
                    .isChecked(),
                true,
            );
            assert.equal(
                await page
                    .getByRole("checkbox", { name: "Eintrag auswählen: 3", exact: true })
                    .isDisabled(),
                true,
            );
        }
    });
    await check("sorting and grouping preserve the selected IDs", async () => {
        await page.getByRole("combobox", { name: "Sortieren", exact: true }).click();
        await page.getByRole("option", { name: "Name · Absteigend", exact: true }).click();
        await page.getByRole("combobox", { name: "Gruppieren", exact: true }).click();
        await page.getByRole("option", { name: "Status", exact: true }).click();
        assert.equal(await page.getByTestId("selected").innerText(), "Auswahl: 1");
        await page.getByRole("combobox", { name: "Gruppieren", exact: true }).click();
        await page.getByRole("option", { name: "Keine", exact: true }).click();
    });
    await check(
        "columns toggle, reorder, resize and reset without revealing default-hidden fields",
        async () => {
            await page.getByRole("button", { name: "Spalten", exact: true }).click();
            await page.getByRole("button", { name: "Nach links: Status", exact: true }).click();
            assert.deepEqual(await page.locator("thead th").allTextContents(), [
                "",
                "Status",
                "Name",
            ]);
            await page.getByRole("checkbox", { name: "Notizen", exact: true }).check();
            await page.getByRole("textbox", { name: "Breite: Notizen", exact: true }).fill("300");
            await page.getByRole("checkbox", { name: "Status", exact: true }).uncheck();
            await page.keyboard.press("Escape");
            assert.deepEqual(await page.locator("thead th").allTextContents(), [
                "",
                "Name",
                "Notizen",
            ]);
            let state = JSON.parse(new URL(page.url()).searchParams.get("_grid"));
            assert.equal(state.widths.notes, 300);
            assert.equal(state.hidden.includes("status"), true);
            await page.reload();
            await page.getByRole("button", { name: "Spalten", exact: true }).click();
            await page.getByRole("button", { name: "Spalten zurücksetzen", exact: true }).click();
            await page.keyboard.press("Escape");
            assert.deepEqual(await page.locator("thead th").allTextContents(), [
                "",
                "Name",
                "Status",
            ]);
        },
    );
    await check("keyboard resize persists", async () => {
        const handle = page.getByRole("separator", { name: "Breite: Status", exact: true });
        await handle.focus();
        await handle.press("ArrowRight");
        assert.equal(JSON.parse(new URL(page.url()).searchParams.get("_grid")).widths.status, 170);
    });
    await check(
        "filter changes reset selection and browser Back restores the previous query",
        async () => {
            await page.getByRole("checkbox", { name: "Eintrag auswählen: 1", exact: true }).check();
            const search = page.getByRole("textbox", { name: "Einträge suchen", exact: true });
            await search.fill("Beta");
            await search.press("Enter");
            await page.waitForFunction(
                () =>
                    document.querySelector('[data-testid="selected"]').textContent === "Auswahl: ",
            );
            assert.equal(await page.getByRole("row").count(), 5);
            await page.goBack();
            await page
                .getByRole("checkbox", { name: "Eintrag auswählen: 1", exact: true })
                .waitFor();
        },
    );
    await check("late all-results response cannot select records from old filters", async () => {
        await page.getByRole("button", { name: "Auswahl verzögern", exact: true }).click();
        await page.getByRole("button", { name: "Alle Treffer auswählen", exact: true }).click();
        const search = page.getByRole("textbox", { name: "Einträge suchen", exact: true });
        await search.fill("Gamma");
        await search.press("Enter");
        await page.waitForTimeout(650);
        assert.equal(await page.getByTestId("selected").innerText(), "Auswahl:");
        await search.fill("");
        await search.press("Enter");
    });
    await check("context changes discard selection", async () => {
        await page.getByRole("checkbox", { name: "Eintrag auswählen: 1", exact: true }).check();
        await page.getByRole("button", { name: "Kontext wechseln", exact: true }).click();
        assert.equal(await page.getByTestId("selected").innerText(), "Auswahl:");
    });
    await check("cards use keyboard-open and shared actions", async () => {
        await page.getByRole("button", { name: "Kacheln", exact: true }).click();
        await page.getByRole("button", { name: "Alpha 1", exact: true }).focus();
        await page.keyboard.press("Enter");
        assert.equal(await page.getByTestId("opened").innerText(), "Geöffnet: 1");
        await page.screenshot({ path: "/tmp/hope509-grid-cards.png", fullPage: true });
    });
    await check("board move errors are visible; forbidden transitions absent", async () => {
        await page.getByRole("button", { name: "Kanban", exact: true }).click();
        await page
            .getByRole("button", { name: "Verschiebefehler umschalten", exact: true })
            .click();
        const move = page.getByLabel("Verschieben nach", { exact: true }).first();
        await move.click();
        assert.equal(await page.getByRole("option", { name: "Leer", exact: true }).count(), 0);
        await page
            .getByRole("option", { name: /Aktiv|Entwurf/ })
            .first()
            .click();
        await page.getByText("Schreibzugriff fehlgeschlagen", { exact: true }).waitFor();
        await page.screenshot({ path: "/tmp/hope509-grid-board.png", fullPage: true });
    });
    await check("an allowed board transition moves only its own card", async () => {
        await page
            .getByRole("button", { name: "Verschiebefehler umschalten", exact: true })
            .click();
        const card = page.locator(".mantine-Card-root").filter({
            has: page.getByRole("checkbox", { name: "Eintrag auswählen: 1", exact: true }),
        });
        await card.getByRole("combobox", { name: "Verschieben nach", exact: true }).click();
        await page.getByRole("option", { name: "Entwurf", exact: true }).click();
        const groupText = await card
            .locator("..")
            .locator(":scope > .mantine-Group-root")
            .first()
            .innerText();
        assert.equal(groupText.replace(/\s+/g, " "), "Entwurf 7");
        assert.equal(
            await page.getByText("Schreibzugriff fehlgeschlagen", { exact: true }).count(),
            0,
        );
    });
    await check("saved view restores layout and widths in a fresh browser context", async () => {
        await page.getByRole("button", { name: "Filter", exact: true }).click();
        await page
            .getByRole("button", { name: "Aktuelle Sicht speichern", exact: true })
            .last()
            .click();
        await page.getByRole("textbox", { name: "Name", exact: true }).fill("Meine Sicht");
        await page.getByRole("button", { name: "Als neue Sicht speichern", exact: true }).click();
        await page.getByText("Meine Sicht", { exact: true }).click();
        const linked = await browser.newPage();
        await linked.goto(page.url());
        assert.equal(
            await linked
                .getByRole("button", { name: "Kanban", exact: true })
                .getAttribute("aria-pressed"),
            "true",
        );
        await linked.close();
    });
    await check("mobile layouts and filter drawer fit the viewport", async () => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForFunction(
            () =>
                document.querySelector("button[aria-pressed]")?.getAttribute("aria-pressed") ===
                "false",
        );
        await page.getByRole("button", { name: "Filter", exact: true }).click();
        await page.getByRole("dialog").waitFor();
        await page.getByRole("button", { name: "Schließen", exact: true }).click();
        await page.getByRole("button", { name: "Kacheln", exact: true }).click();
        const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
        );
        assert.equal(overflow, false);
        await page.screenshot({ path: "/tmp/hope509-grid-mobile.png", fullPage: true });
    });
    await check("empty states remain localized in the dark theme", async () => {
        await page.evaluate(() => localStorage.setItem("mantine-color-scheme-value", "dark"));
        await page.reload();
        assert.equal(await page.locator("html").getAttribute("data-mantine-color-scheme"), "dark");
        const search = page.getByRole("textbox", { name: "Einträge suchen", exact: true });
        await search.fill("no-matching-record");
        await search.press("Enter");
        for (const name of ["Liste", "Kacheln"]) {
            await page.getByRole("button", { name, exact: true }).click();
            await page.getByText("Keine Einträge", { exact: true }).waitFor();
        }
        await page.getByRole("button", { name: "Kanban", exact: true }).click();
        assert.equal(await page.getByRole("checkbox", { name: /^Eintrag auswählen:/ }).count(), 0);
        for (const name of ["Entwurf", "Aktiv", "Leer"])
            await page.getByText(name, { exact: true }).waitFor();
    });
    assert.deepEqual(errors, []);
    console.log("ALL BROWSER CHECKS PASSED");
} catch (error) {
    await page.screenshot({ path: "/tmp/hope509-browser-failure.png", fullPage: true });
    console.log((await page.locator("body").innerText()).slice(0, 5000));
    throw error;
} finally {
    await browser.close();
}
