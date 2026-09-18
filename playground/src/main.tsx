import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, v8CssVariablesResolver } from '@mantine/core';
import { ConfirmDialogProvider } from '@hca/mantine-workbench';
import { App } from './App';
import { theme } from './theme';

import '@mantine/core/styles.css';
import '@mantine/tiptap/styles.css';
import '../../src/tokens.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        {/* Same provider setup as the portals (v8CssVariablesResolver) */}
        <MantineProvider theme={theme} cssVariablesResolver={v8CssVariablesResolver}>
            {/* FormDrawer's discard question needs this; without it the
                drawer closes silently and the demo proves nothing. */}
            <ConfirmDialogProvider>
                <App />
            </ConfirmDialogProvider>
        </MantineProvider>
    </React.StrictMode>,
);
