# @hca/mantine-workbench

Generic Mantine v9 UI components — no domain logic, no app-specific
assumptions. Built by [help cure ALS e.V.](https://help-cure-als.org/)
for shared use across the TENOS/HCA ecosystem, usable by anyone.

## What's in the box

- **`theme`** — `baseTheme` (font scale + line heights + default
  radius) plus `extendTheme(...overrides)` for composing project-
  specific tokens on top.
- **`layout`** — `ResizableGroup` / `ResizablePanel` / `ResizableHandle`
  (Mantine-tuned wrappers around `react-resizable-panels`), `MainNav`
  with collapsible rail mode, `MainNavHeaderButton`,
  `useMainNavCollapsed` hook.
- **`data-grid`** — `DataGrid` with optional virtualization (own ~80
  LoC virtualizer, no TanStack), `Column<T>`, `useGridSort`,
  `useRowSelection`, `FilterPanel`, `DataGridLayout` (three-slot
  resizable layout shell).
- **`components`** — `ConfirmDialog` + `useConfirm`, `PageHeader`,
  `ExpandableText`, `SearchInput`, `ThemeToggle`, `BulkActionBar` +
  `BulkPill` + `BulkSeparator`.
- **`tokens.css`** — central CSS custom properties with light + dark
  variants under `[data-mantine-color-scheme="dark"]`.

## Repository layout

This library is a standalone repository. Consumers reference it as a
**GitHub dependency pinned to a release tag** — see
[How to consume](#how-to-consume) below.

For developing the library itself against a consumer, checkouts sit
as siblings and the consumer temporarily resolves the library from
the local path — see [Local development](#local-development-against-a-consumer):

```
hca/
├─ hca-mantine-workbench/    ← this repo
├─ moonshot/                  ← consumer (Next.js)
├─ hca-medical-care/          ← consumer (Vite)
└─ <future consumers>
```

## Peer dependencies

Consumers must install these themselves:

- `@mantine/core ^9`
- `@mantine/hooks ^9`
- `react ^18 || ^19`
- `react-dom ^18 || ^19`
- `react-resizable-panels ^4` (used by the `layout` module)
- `lucide-react ^1` (icons used by `MainNav`, `ResizableHandle`,
  `SearchInput`, `ThemeToggle`, `DataGrid` headers)

The library itself has no runtime dependencies.

## How to consume

### 1. Declare the GitHub dependency

In the consumer's `package.json`, pin a release tag:

```json
{
  "dependencies": {
    "@hca/mantine-workbench": "github:help-cure-ALS/hca-mantine-workbench#v0.1.0"
  }
}
```

Always pin a tag (`#v0.1.0`), never a branch — untagged refs make
builds non-reproducible. Available versions are the git tags of this
repository.

### 2. Install

```bash
npm install     # or bun install
```

The package ships its TypeScript source (`exports` points at
`src/index.ts`), so the consumer's bundler transpiles it — see
[Frameworks: extra config](#5-frameworks-extra-config).

### 3. Make sure peer dependencies are present

Check that the consumer has `@mantine/core`, `@mantine/hooks`,
`react-resizable-panels`, `lucide-react`, `react`, `react-dom`
declared as its own dependencies.

### 4. Set up the theme + tokens

```tsx
// App root
import { MantineProvider } from "@mantine/core";
import { baseTheme, extendTheme } from "@hca/mantine-workbench";

const theme = extendTheme(baseTheme, {
  primaryColor: "grape",
  // your project-specific colors / component defaults
});

export function App() {
  return (
    <MantineProvider theme={theme}>
      {/* ... */}
    </MantineProvider>
  );
}
```

```css
/* In your global stylesheet (e.g. app/globals.css or src/index.css) */
@import "@hca/mantine-workbench/tokens.css";
```

> **Heads-up when consuming via a local `file:` dev setup** (see
> [Local development](#local-development-against-a-consumer)): PostCSS /
> Tailwind don't see npm's package-name resolution before bundling
> the stylesheet, so the bare-import form above may not resolve.
> Use a relative path instead, e.g.:
>
> ```css
> @import "../../../hca-mantine-workbench/src/tokens.css";
> ```
>
> The bare-import form starts to work once your bundler runs the
> stylesheet through the JS resolver (Vite does this when stylesheets
> are imported from a JS module).

### 5. Frameworks: extra config

- **Next.js**: list the library in `next.config.ts`'s
  `transpilePackages`:
  ```ts
  transpilePackages: ["@hca/mantine-workbench"],
  ```
- **Vite**: nothing special — Vite transpiles TypeScript source from
  `node_modules` symlinks out of the box.

## Local development (against a consumer)

To develop the library with live feedback in a consumer, resolve it
from a local sibling checkout instead of GitHub. In the consumer's
`package.json`, temporarily switch the dependency to a `file:` path:

```json
{
  "dependencies": {
    "@hca/mantine-workbench": "file:../hca-mantine-workbench"
  }
}
```

The relative path is computed from the consumer's `package.json`
location — for Moonshot's frontend (`hca/moonshot/app/frontend/`)
it's `file:../../../hca-mantine-workbench`. `npm install` then
creates a symlink under `node_modules/@hca/mantine-workbench`, and
edits in `src/` are visible immediately without a rebuild step.
Don't commit the `file:` variant — releases go through tags (see
[Releasing](#releasing)).

Some consumers avoid the package.json switch entirely:
`hca-medical-care` strips the dependency in its dev Dockerfile and
symlinks a volume-mounted checkout instead — see its
`docker-compose.override.yml` for the pattern.

### Docker setup

If your consumer runs inside Docker (Moonshot, hca-medical-care, …),
the relative `file:` path must resolve to the same location both on
the host and inside the container. The cleanest pattern:

1. **Host**: create a symlink inside the consumer that points at the
   library's real location, so the consumer's directory tree looks
   "self-contained":
   ```bash
   cd <consumer-repo>
   ln -s ../../hca-mantine-workbench .    # adjust relative path
   ```
   The symlink is `.gitignore`d.
2. **Container**: mount the same source-of-truth into the container at
   a path that mirrors the host layout. In `docker-compose.override.yml`:
   ```yaml
   services:
     web:
       volumes:
         - ../hca-mantine-workbench:/app/hca-mantine-workbench
   ```

With those two steps, the `file:`-dep `file:../hca-mantine-workbench`
(or whatever your relative path is) resolves to the same physical
directory on both sides.

## Development

### One-time setup

The library has no `node_modules` of its own. It resolves `react`,
`@mantine/*`, `react-resizable-panels`, and `lucide-react` through
the consumer's `node_modules` via Node's parent-directory module
resolution. That avoids the duplicate-`@types/react` TypeScript
conflict you'd get if both the consumer and the library installed
their own copy.

If you want to type-check the library in isolation, the easiest
shortcut is to run the consumer's `tsc --noEmit` — it covers the
library transparently via the `file:`-dep resolution.

### Formatting

Source formatting is enforced by Prettier (`.prettierrc`: 4-space
indent, 100 print width). Before committing:

```bash
npm run format
```

### Production build (optional)

```bash
npm install
npm run build      # tsup → dist/ with ESM + .d.ts
```

Note: the `exports` field currently points at the TypeScript source
(`src/index.ts`) for all conditions — consumers transpile the library
themselves (Vite out of the box, Next.js via `transpilePackages`).
The `dist/` build is not wired into `exports` yet; it only becomes
relevant if the package is ever published to a registry for consumers
that can't transpile TS from `node_modules`.

## Releasing

Consumers pin git tags, so "deploying" this library means publishing
a new tag. Full walkthrough (example: releasing `v0.2.0`):

### 1. Pre-flight checks

```bash
# Formatting must be clean
npm run format:check

# Type-check via a consumer (covers the library through its
# node_modules resolution — see Development above)
cd ../hca-medical-care/web && npx tsc --noEmit && cd -

# Optional: verify the isolated dist build still compiles
npm install && npm run build
```

If a consumer sits next to this checkout with a local `file:`/symlink
dev setup, also click through the affected screens once.

### 2. Bump the version

Set `version` in `package.json` following semver:

- **patch** (`0.1.1`) — bugfix, no API change
- **minor** (`0.2.0`) — new component/prop, backwards compatible
- **major** (`1.0.0`) — breaking change to props, exports, or tokens

### 3. Commit and tag

```bash
git add package.json
git commit -m "release: v0.2.0"

# Tag must match package.json version, v-prefixed:
git tag v0.2.0
git push origin main --tags
```

Treat tags as immutable — never move or delete a published tag. If a
release is broken, publish a fixed follow-up version instead.

### 4. Update consumers

In each consumer (e.g. `hca-medical-care/web`):

1. Bump the ref in `package.json`:
   ```json
   "@hca/mantine-workbench": "github:help-cure-ALS/hca-mantine-workbench#v0.2.0"
   ```
2. Refresh the lockfile so frozen-lockfile Docker builds pick up the
   new tag:
   ```bash
   bun install     # or npm install
   ```
3. Commit `package.json` + lockfile together, run the consumer's
   typecheck/build, deploy the consumer as usual.

Consumers on older tags keep working unchanged — they only move when
their ref is bumped.

## Theming

The library publishes a single CSS file with all of its custom
properties. Import it once near the top of your consumer's global
stylesheet — see the consumer-setup steps above.

Every component reads its colors and dimensions from these tokens with
hard-coded hex/rgba fallbacks — so the library still works even if the
file is not imported, you just lose the ability to theme centrally.

### Token surface

All tokens live in [`src/tokens.css`](./src/tokens.css). Override any
of them on `:root` (global) or any DOM ancestor (locally scoped):

| Token | Default | Used by |
|-------|---------|---------|
| `--mantine-workbench-header-h` | `54px` | `<PageHeader>` |
| `--mantine-workbench-info-bubble-bg` | `var(--mantine-color-dark-6)` | `<PageHeader>` (info "i") |
| `--mantine-workbench-info-bubble-color` | `#ffffff` | `<PageHeader>` (info "i") |
| `--mantine-workbench-filter-panel-bg` | `var(--mantine-color-gray-0)` | `<FilterPanel>` |
| `--mantine-workbench-filter-row-hover-bg` | `var(--mantine-color-gray-1)` | `<FilterPanel>` |
| `--mantine-workbench-row-selected-bg` | `#f3e8fb` (light) / `var(--mantine-color-grape-8)` (dark) | `<DataGrid>` |
| `--mantine-workbench-grid-header-bg` | `var(--mantine-color-gray-0)` (light) / `var(--mantine-color-dark-6)` (dark) | `<DataGrid>` |
| `--mantine-workbench-grid-header-color` | `var(--mantine-color-gray-7)` (light) / `var(--mantine-color-dark-1)` (dark) | `<DataGrid>` |
| `--mantine-workbench-resizable-hover-color` | Mantine primary | `<ResizableHandle>` |
| `--mantine-workbench-nav-bg` | `#28272d` | `<MainNav>` |
| `--mantine-workbench-nav-text` | `rgba(255, 255, 255, 0.92)` | `<MainNav>` |
| `--mantine-workbench-nav-text-dimmed` | `rgba(255, 255, 255, 0.56)` | `<MainNav>` |
| `--mantine-workbench-nav-hover-bg` | `rgba(255, 255, 255, 0.08)` | `<MainNav>` |
| `--mantine-workbench-nav-active-bg` | `rgba(255, 255, 255, 0.12)` | `<MainNav>` |
| `--mantine-workbench-nav-border` | `rgba(255, 255, 255, 0.08)` | `<MainNav>` |
| `--background` | _(consumer-defined, typically `var(--mantine-color-body)`)_ | `<BulkActionBar>`, `<BulkPill>` — used as the "inverted" foreground on the dark bar background |

> **`--background` is a hard requirement for `<BulkActionBar>`** — the bar
> renders a dark layer (`var(--mantine-color-text)`) with text in
> `var(--background)`. If you don't set it on `:root`, the pills + label
> render invisibly (color resolves to nothing). Add this once in your
> global stylesheet:
>
> ```css
> :root {
>   --background: var(--mantine-color-body);
> }
> ```

### Dark mode

Dark-mode variants are pre-defined under the
`[data-mantine-color-scheme="dark"]` selector — the same attribute
Mantine's `ColorSchemeScript` sets on `<html>` synchronously, before
hydration. You don't have to configure anything; turning on dark mode
in Mantine flips the right tokens automatically.

If you want a token to stay identical across both schemes (the
`<MainNav>` palette does this by default — it reads as a brand layer
above the app body, scheme-independent), just don't redeclare it in
your dark block.

### Override example

```css
/* In your globals.css */
:root {
  /* Use your own brand color for selected rows */
  --mantine-workbench-row-selected-bg: var(--your-accent-soft);

  /* A flatter, lighter nav bar */
  --mantine-workbench-nav-bg: #ffffff;
  --mantine-workbench-nav-text: var(--mantine-color-dark-9);
  --mantine-workbench-nav-text-dimmed: var(--mantine-color-dark-3);
  --mantine-workbench-nav-hover-bg: var(--mantine-color-gray-1);
  --mantine-workbench-nav-active-bg: var(--mantine-color-gray-2);
  --mantine-workbench-nav-border: var(--mantine-color-gray-3);
}
```

For one-off overrides on a single subtree, set the same variables on
any container element — they cascade through children only.

## License

[MIT](./LICENSE) © [help cure ALS e.V.](https://help-cure-als.org/)
