import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
});
const context = await browser.newContext({ viewport: { width: 1440, height: 960 } }),
    page = await context.newPage();
page.setDefaultTimeout(15000);
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
        await page.getByRole("button", { name: "Sortieren", exact: true }).click();
        await page.getByRole("menuitem", { name: "Name · Absteigend", exact: true }).click();
        await page.getByRole("button", { name: "Gruppieren", exact: true }).click();
        await page.getByRole("menuitem", { name: "Status", exact: true }).click();
        assert.equal(await page.getByTestId("selected").innerText(), "Auswahl: 1");
        await page.getByRole("button", { name: "Gruppieren", exact: true }).click();
        await page.getByRole("menuitem", { name: "Keine", exact: true }).click();
    });
    await check(
        "columns toggle, reorder, resize and reset without revealing default-hidden fields",
        async () => {
            await page.getByRole("button", { name: "Spalten", exact: true }).click();
            await page
                .getByRole("button", { name: "Spalte verschieben: Status", exact: true })
                .press("Alt+ArrowUp");
            assert.deepEqual(await page.locator("thead th").allTextContents(), [
                "",
                "Status",
                "Name",
            ]);
            await page.getByRole("checkbox", { name: "Notizen", exact: true }).check();

            await page.getByRole("checkbox", { name: "Status", exact: true }).uncheck();
            await page.keyboard.press("Escape");
            assert.deepEqual(await page.locator("thead th").allTextContents(), [
                "",
                "Name",
                "Notizen",
            ]);
            let state = JSON.parse(new URL(page.url()).searchParams.get("_grid"));

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
    await check("direct header drag, resize, fit and menu actions persist", async () => {
        await page.locator(".mantine-Popover-dropdown").waitFor({ state: "hidden" });
        const status = page.locator('thead [data-column-id="status"] button').first();
        const name = page.locator('thead [data-column-id="name"] button').first();
        const source = await status.boundingBox(),
            target = await name.boundingBox();
        await page.mouse.move(source.x + 15, source.y + 8);
        await page.mouse.down();
        await page.mouse.move(target.x + 15, target.y + 8, { steps: 12 });
        await page.mouse.up();
        assert.deepEqual(await page.locator("thead th").allTextContents(), ["", "Status", "Name"]);
        const handle = page.getByRole("separator", { name: "Breite: Status", exact: true });
        await handle.press("ArrowRight");
        assert.equal(JSON.parse(new URL(page.url()).searchParams.get("_grid")).widths.status, 170);
        const bounds = await handle.boundingBox();
        await page.mouse.move(bounds.x + 3, bounds.y + 8);
        await page.mouse.down();
        await page.mouse.move(bounds.x + 73, bounds.y + 8, { steps: 10 });
        await page.mouse.up();
        assert.equal(JSON.parse(new URL(page.url()).searchParams.get("_grid")).widths.status, 240);
        await handle.dblclick();
        let state = JSON.parse(new URL(page.url()).searchParams.get("_grid"));
        assert.ok(state.widths.status >= 64 && state.widths.status < 240);
        await page.getByRole("button", { name: "Spaltenaktionen: Status", exact: true }).click();
        await page.getByRole("menuitem", { name: "Absteigend", exact: true }).click();
        assert.equal(
            await page.locator('thead [data-column-id="status"]').getAttribute("aria-sort"),
            "descending",
        );
        await page.getByRole("button", { name: "Spaltenaktionen: Status", exact: true }).click();
        await page
            .getByRole("menuitem", { name: "Alle Spalten an Inhalt anpassen", exact: true })
            .click();
        state = JSON.parse(new URL(page.url()).searchParams.get("_grid"));
        assert.ok(state.widths.name >= 150);
        await page.getByRole("button", { name: "Spaltenaktionen: Status", exact: true }).click();
        await page.getByRole("menuitem", { name: "Spalte ausblenden", exact: true }).click();
        await page.getByRole("button", { name: "Spaltenaktionen: Name", exact: true }).click();
        assert.equal(
            await page
                .getByRole("menuitem", { name: "Spalte ausblenden", exact: true })
                .isDisabled(),
            true,
        );
        await page.keyboard.press("Escape");
        await page.getByRole("button", { name: "Spalten", exact: true }).click();
        const search = page.getByRole("textbox", { name: "Spalte suchen…", exact: true });
        await search.fill("notiz");
        assert.equal(await page.getByRole("checkbox", { name: "Status", exact: true }).count(), 0);
        await page.getByRole("checkbox", { name: "Notizen", exact: true }).check();
        await search.fill("");
        await page.getByRole("button", { name: "Alle anzeigen", exact: true }).click();
        const grip = page.getByRole("button", { name: "Spalte verschieben: Notizen", exact: true });
        const other = page.getByRole("button", { name: "Spalte verschieben: Status", exact: true });
        const a = await grip.boundingBox(),
            b = await other.boundingBox();
        await page.mouse.move(a.x + 8, a.y + 8);
        await page.mouse.down();
        await page.mouse.move(b.x + 8, b.y + 8, { steps: 10 });
        await page.mouse.up();
        state = JSON.parse(new URL(page.url()).searchParams.get("_grid"));
        assert.equal(state.order[0], "notes");
        await page.getByRole("button", { name: "Spalten zurücksetzen", exact: true }).click();
        await page.keyboard.press("Escape");
        await page
            .getByRole("separator", { name: "Breite: Status", exact: true })
            .press("ArrowRight");
    });
    await check(
        "card details follow column visibility and order while titles and badges remain",
        async () => {
            for (const custom of [false, true]) {
                const cards = await browser.newPage({ viewport: { width: 1440, height: 960 } });
                cards.on("pageerror", (error) => errors.push(error.message));
                try {
                    await cards.goto(
                        `${process.env.GRID_TEST_URL ?? "http://127.0.0.1:4190"}/?grid-test=1${custom ? "&grid-custom-metadata=1" : ""}`,
                    );
                    const firstCard = cards.locator(".mantine-Card-root").filter({
                        has: cards.getByRole("checkbox", {
                            name: "Eintrag auswählen: 1",
                            exact: true,
                        }),
                    });
                    const metadataIds = () =>
                        firstCard
                            .locator("[data-column-id]")
                            .evaluateAll((fields) =>
                                fields.map((field) => field.getAttribute("data-column-id")),
                            );
                    await cards.getByRole("button", { name: "Kacheln", exact: true }).click();
                    await firstCard.waitFor();
                    assert.deepEqual(await metadataIds(), []);
                    await cards.getByRole("button", { name: "Spalten", exact: true }).click();
                    await cards.getByRole("checkbox", { name: "Notizen", exact: true }).check();
                    await cards
                        .getByRole("checkbox", { name: "Verantwortlich", exact: true })
                        .check();
                    await cards
                        .getByRole("button", {
                            name: "Spalte verschieben: Verantwortlich",
                            exact: true,
                        })
                        .press("Alt+ArrowUp");
                    await cards.getByRole("checkbox", { name: "Status", exact: true }).uncheck();
                    await cards.getByRole("checkbox", { name: "Name", exact: true }).uncheck();
                    await cards.keyboard.press("Escape");
                    assert.deepEqual(await metadataIds(), ["owner", "notes"]);
                    await cards.getByRole("button", { name: "Liste", exact: true }).click();
                    assert.deepEqual(await cards.locator("thead th").allTextContents(), [
                        "",
                        "Verantwortlich",
                        "Notizen",
                    ]);
                    for (const layout of ["Kacheln", "Kanban"]) {
                        await cards.getByRole("button", { name: layout, exact: true }).click();
                        assert.deepEqual(await metadataIds(), ["owner", "notes"]);
                        assert.equal(
                            await firstCard
                                .getByRole("button", { name: "Alpha 1", exact: true })
                                .isVisible(),
                            true,
                        );
                        assert.equal(
                            await firstCard.locator(".mantine-Badge-root").innerText(),
                            "ACTIVE",
                        );
                    }
                    await cards.reload();
                    await firstCard.waitFor();
                    assert.deepEqual(await metadataIds(), ["owner", "notes"]);
                    await cards.getByRole("button", { name: "Spalten", exact: true }).click();
                    await cards.getByRole("checkbox", { name: "Notizen", exact: true }).uncheck();
                    await cards.keyboard.press("Escape");
                    for (const layout of ["Kacheln", "Kanban"]) {
                        await cards.getByRole("button", { name: layout, exact: true }).click();
                        assert.deepEqual(await metadataIds(), ["owner"]);
                        assert.equal(
                            await firstCard
                                .getByText("Zusätzliche Metadaten", { exact: true })
                                .count(),
                            0,
                        );
                        assert.equal(
                            await firstCard.locator(".mantine-Badge-root").innerText(),
                            "ACTIVE",
                        );
                    }
                } finally {
                    await cards.close();
                }
            }
        },
    );
    await check(
        "one shared bulk bar works in all layouts and Escape respects popovers",
        async () => {
            await page.getByRole("checkbox", { name: "Eintrag auswählen: 1", exact: true }).check();
            for (const name of ["Kacheln", "Kanban", "Liste"]) {
                await page.getByRole("button", { name, exact: true }).click();
                assert.equal(
                    await page.getByRole("toolbar", { name: "Sammelaktionen" }).count(),
                    1,
                );
            }
            await page.getByRole("button", { name: "Spalten", exact: true }).click();
            await page.getByRole("textbox", { name: "Spalte suchen…", exact: true }).waitFor();
            await page.keyboard.press("Escape");
            assert.equal(await page.getByTestId("selected").innerText(), "Auswahl: 1");
            await page
                .getByRole("textbox", { name: "Spalte suchen…", exact: true })
                .waitFor({ state: "hidden" });
            await page.keyboard.press("Escape");
            assert.equal((await page.getByTestId("selected").innerText()).trim(), "Auswahl:");
            await page.getByRole("checkbox", { name: "Eintrag auswählen: 1", exact: true }).check();
            await page.getByRole("button", { name: "Aktivieren", exact: true }).click();
            assert.equal(await page.getByRole("toolbar", { name: "Sammelaktionen" }).count(), 0);
        },
    );
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
        assert.equal(await page.getByText("Leer", { exact: true }).count(), 0);
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
    await check("saved view restores layout and columns in a fresh browser context", async () => {
        await page.getByRole("button", { name: "Liste", exact: true }).click();
        await page.getByRole("button", { name: "Spalten", exact: true }).click();
        await page.getByRole("checkbox", { name: "Notizen", exact: true }).check();
        await page.getByRole("checkbox", { name: "Status", exact: true }).uncheck();
        await page
            .getByRole("button", { name: "Spalte verschieben: Notizen", exact: true })
            .press("Alt+ArrowUp");
        await page
            .getByRole("button", { name: "Spalte verschieben: Notizen", exact: true })
            .press("Alt+ArrowUp");
        await page.keyboard.press("Escape");
        await page.getByRole("button", { name: "Kanban", exact: true }).click();
        const expectedColumns = JSON.parse(new URL(page.url()).searchParams.get("_grid"));
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
        assert.deepEqual(
            JSON.parse(new URL(linked.url()).searchParams.get("_grid")),
            expectedColumns,
        );
        await linked.getByRole("button", { name: "Liste", exact: true }).click();
        assert.deepEqual(await linked.locator("thead th").allTextContents(), [
            "",
            "Notizen",
            "Name",
        ]);
        await linked.close();
    });
    await check(
        "filter panel uses facet counts, clears selection and updates its summary",
        async () => {
            await page.getByRole("checkbox", { name: "Eintrag auswählen: 1", exact: true }).check();
            await page.getByRole("checkbox", { name: "Aktiv", exact: true }).check();
            assert.equal((await page.getByTestId("selected").innerText()).trim(), "Auswahl:");
            assert.equal(new URL(page.url()).searchParams.get("status"), "active");
            await page.screenshot({ path: "/tmp/hope509-grid-filter-active.png", fullPage: true });
            assert.equal(
                await page.getByRole("checkbox", { name: /^Eintrag auswählen:/ }).count(),
                5,
            );
            await page.getByRole("button", { name: "Zurücksetzen (1)", exact: true }).click();
            assert.equal(new URL(page.url()).searchParams.get("status"), "");
            assert.equal(
                await page.getByRole("checkbox", { name: /^Eintrag auswählen:/ }).count(),
                12,
            );
        },
    );
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
        await page.getByRole("button", { name: "Liste", exact: true }).click();
        for (const width of [390, 320]) {
            await page.setViewportSize({ width, height: 844 });
            await page.getByRole("button", { name: "Spalten", exact: true }).click();
            await page.getByRole("textbox", { name: "Spalte suchen…", exact: true }).waitFor();
            const bounds = await page.locator(".mantine-Popover-dropdown").boundingBox();
            assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1);
            await page.getByRole("button", { name: "Schließen", exact: true }).click();
        }
    });
    await check("empty states remain localized in the dark theme", async () => {
        await page.evaluate(() => localStorage.setItem("mantine-color-scheme-value", "dark"));
        await page.reload();
        assert.equal(await page.locator("html").getAttribute("data-mantine-color-scheme"), "dark");
        const search = page.getByRole("textbox", { name: "Einträge suchen", exact: true });
        await search.fill("no-matching-record");
        await search.press("Enter");
        for (const name of ["Liste", "Kacheln", "Kanban"]) {
            await page.getByRole("button", { name, exact: true }).click();
            await page.getByText("Keine Einträge", { exact: true }).waitFor();
        }
        assert.equal(await page.getByRole("checkbox", { name: /^Eintrag auswählen:/ }).count(), 0);
        for (const name of ["Entwurf", "Aktiv", "Leer"])
            assert.equal(
                await page.getByTestId("grid-viewport").getByText(name, { exact: true }).count(),
                0,
            );
    });
    await check(
        "explicit groups disappear when empty and return when filters are cleared in all layouts",
        async () => {
            const grouped = await context.newPage();
            grouped.on("pageerror", (error) => errors.push(error.message));
            try {
                await grouped.goto(
                    `${process.env.GRID_TEST_URL ?? "http://127.0.0.1:4190"}/?grid-test=1&grid-sections=1`,
                );
                const search = grouped.getByRole("textbox", {
                    name: "Einträge suchen",
                    exact: true,
                });
                for (const name of ["Liste", "Kacheln", "Kanban"]) {
                    await grouped.getByRole("button", { name, exact: true }).click();
                    await grouped.getByText("Gruppe active", { exact: true }).waitFor();
                    await grouped.getByText("Gruppe draft", { exact: true }).waitFor();
                    assert.equal(
                        await grouped.getByText("Leere Gruppe", { exact: true }).count(),
                        0,
                    );
                    await search.fill("Gamma 3");
                    await search.press("Enter");
                    await grouped
                        .getByText("Gruppe draft", { exact: true })
                        .waitFor({ state: "detached" });
                    await grouped.getByText("Gruppe active", { exact: true }).waitFor();
                    await search.fill("");
                    await search.press("Enter");
                    await grouped.getByText("Gruppe draft", { exact: true }).waitFor();
                }
            } finally {
                await grouped.close();
            }
        },
    );
    await check("sticky table headers keep the existing page scroll container", async () => {
        await page.setViewportSize({ width: 1440, height: 360 });
        const search = page.getByRole("textbox", { name: "Einträge suchen", exact: true });
        await search.fill("");
        await search.press("Enter");
        await page.getByRole("button", { name: "Liste", exact: true }).click();
        const viewport = page.getByTestId("grid-viewport");
        const bounds = await viewport.boundingBox();
        await viewport.hover();
        await page.mouse.wheel(0, 350);
        await page.waitForFunction(
            () => document.querySelector('[data-testid="grid-viewport"]').scrollTop > 0,
        );
        const header = await page.locator("thead").boundingBox();
        assert.ok(header.y >= bounds.y - 1 && header.y < bounds.y + 45);
    });
    await check("regular playground entry exposes the same controls", async () => {
        const preview = await browser.newPage({ viewport: { width: 1440, height: 960 } });
        preview.on("pageerror", (error) => errors.push(error.message));
        await preview.goto(`${process.env.GRID_TEST_URL ?? "http://127.0.0.1:4190"}/?grid-demo=1`);
        await preview.getByRole("heading", { name: "DataGrid", exact: true }).waitFor();
        await preview.screenshot({
            path: "/tmp/hope509-toolbar-search-full-width.png",
            fullPage: true,
        });
        await preview.getByRole("button", { name: "Filter", exact: true }).click();
        await preview.getByRole("checkbox", { name: "Eintrag auswählen: 1", exact: true }).check();
        await preview.getByRole("button", { name: "Spalten", exact: true }).click();
        await preview.getByRole("textbox", { name: "Spalte suchen…", exact: true }).waitFor();
        await preview.waitForFunction(() => {
            const dropdown = document.querySelector(".mantine-Popover-dropdown");
            return dropdown && getComputedStyle(dropdown).opacity === "1";
        });
        await preview.screenshot({
            path: "/tmp/hope509-grid-columns-implemented.png",
            fullPage: true,
        });
        await preview.keyboard.press("Escape");
        await preview.keyboard.press("Escape");
        for (const [name, file] of [
            ["Kacheln", "cards"],
            ["Kanban", "board"],
        ]) {
            await preview.getByRole("button", { name, exact: true }).click();
            await preview.screenshot({
                path: `/tmp/hope509-grid-${file}-preview.png`,
                fullPage: true,
            });
        }
        await preview.evaluate(() => localStorage.setItem("mantine-color-scheme-value", "dark"));
        await preview.reload();
        const filterToggle = preview.getByRole("button", { name: "Filter", exact: true });
        if ((await filterToggle.getAttribute("aria-pressed")) !== "true")
            await filterToggle.click();
        await preview.getByRole("checkbox", { name: "Aktiv", exact: true }).check();
        await preview.screenshot({ path: "/tmp/hope509-grid-filter-dark.png", fullPage: true });
        await preview.close();
    });
    await check(
        "playground catalogue demonstrates fixed bookmark columns and hidden empty groups",
        async () => {
            const catalogue = await context.newPage();
            catalogue.on("pageerror", (error) => errors.push(error.message));
            try {
                await catalogue.goto(process.env.GRID_TEST_URL ?? "http://127.0.0.1:4190");
                const sample = catalogue.locator(".mantine-Paper-root").filter({
                    has: catalogue.getByRole("heading", {
                        name: "Workbench-Komponenten (Smoke-Test)",
                        exact: true,
                    }),
                });
                const bookmark = sample.locator('thead [data-column-id="bookmark"]');
                await bookmark.waitFor();
                assert.ok(Math.abs((await bookmark.boundingBox()).width - 40) < 1);
                assert.equal(await bookmark.getByRole("separator").count(), 0);
                await sample.getByRole("button", { name: "Columns", exact: true }).click();
                const option = catalogue
                    .locator("[data-column-scope]")
                    .getByRole("checkbox", { name: "Lesezeichen", exact: true });
                assert.equal(await option.isChecked(), true);
                assert.equal(await option.isDisabled(), true);
                await catalogue.keyboard.press("Escape");
                await sample
                    .getByRole("button", { name: "Lesezeichen setzen", exact: true })
                    .first()
                    .click();
                await sample
                    .getByRole("button", { name: "Lesezeichen entfernen", exact: true })
                    .waitFor();
                const grouped = catalogue.locator(".mantine-Paper-root").filter({
                    has: catalogue.getByRole("heading", {
                        name: "DataGrid — gruppiert (sections)",
                        exact: true,
                    }),
                });
                for (const name of ["List", "Cards", "Kanban"]) {
                    await grouped.getByRole("button", { name, exact: true }).click();
                    await grouped.getByText("Wartend", { exact: true }).waitFor();
                    assert.equal(
                        await grouped.getByText("Geschlossen", { exact: true }).count(),
                        0,
                    );
                }
            } finally {
                await catalogue.close();
            }
        },
    );
    assert.deepEqual(errors, []);
    console.log("ALL BROWSER CHECKS PASSED");
} catch (error) {
    await page.screenshot({ path: "/tmp/hope509-browser-failure.png", fullPage: true });
    console.log((await page.locator("body").innerText()).slice(0, 5000));
    throw error;
} finally {
    await browser.close();
}
