import { ConfirmDialogProvider } from "@hca/mantine-workbench";
import { MantineProvider, v8CssVariablesResolver } from "@mantine/core";
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { GridDemo } from "./GridDemo";
import { DialogDemo } from "./DialogDemo";
import { DetailDemo } from "./DetailDemo";
import { MetricCardDemo } from "./MetricCardDemo";
import { theme } from "./theme";

import "@mantine/core/styles.css";
import "@mantine/tiptap/styles.css";
import "../../src/tokens.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        {/* Same provider setup as the portals (v8CssVariablesResolver) */}
        <MantineProvider theme={theme} cssVariablesResolver={v8CssVariablesResolver}>
            {/* FormDrawer's discard question needs this; without it the
                drawer closes silently and the demo proves nothing. */}
            <ConfirmDialogProvider>
                {(() => {
                    // One demo per query flag; the plain App is the
                    // default. `?detail-demo` is UI.15.
                    const flags = new URLSearchParams(location.search);
                    if (flags.has("dialog-demo")) return <DialogDemo />;
                    if (flags.has("detail-demo")) return <DetailDemo />;
                    if (flags.has("metric-demo")) return <MetricCardDemo />;
                    if (flags.has("grid-test") || flags.has("grid-demo")) return <GridDemo />;
                    return <App />;
                })()}
            </ConfirmDialogProvider>
        </MantineProvider>
    </React.StrictMode>,
);
