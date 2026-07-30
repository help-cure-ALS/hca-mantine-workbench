import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// The playground consumes the workbench SOURCE directly (no build, no tag):
// every change in ../src is hot-reloaded. This is the pre-release check —
// what you see here is exactly what the portals get after tagging.
//
// dedupe is essential: the workbench sources live OUTSIDE the playground
// root, so their imports (react, lucide-react, @mantine/*) would otherwise
// resolve to a different node_modules — resulting in two React copies and
// "Invalid hook call" at runtime.
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@hca/mantine-workbench/rich-text': fileURLToPath(new URL('../src/rich-text/index.ts', import.meta.url)),
            '@hca/mantine-workbench': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
        },
        dedupe: [
            'react',
            'react-dom',
            '@mantine/core',
            '@mantine/hooks',
            '@mantine/tiptap',
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-link',
            'lucide-react',
            'react-resizable-panels',
        ],
    },
});
