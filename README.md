# typst-math-wasm

A lightweight, self-contained WebAssembly package for compiling Typst math expressions to SVG.

Built with [Typst](https://github.com/typst/typst) and [`typst-svg`](https://crates.io/crates/typst-svg), optimized specifically for fast client-side and edge math typesetting.

## Why `typst-math-wasm`?

Full Typst web toolchains (such as `@myriaddreamin/typst.ts`) are feature-rich compilers meant for full document layout, package management, and incremental compilation. However, for notes apps and document viewers that only need to typeset mathematical formulas (as an alternative to KaTeX or MathJax), the full compiler imposes heavy costs:

- **Oversized WebAssembly Binary**: Full web compilers exceed **28.3 MiB**, violating strict static asset limits (such as Cloudflare Workers Static Assets' **25 MiB** hard ceiling).
- **Asynchronous Font Management**: External compilers require asynchronous font loading via network fetches or custom IPC schemes, causing rendering delay and potential race conditions.
- **Multiple Package Dependencies**: Required separate compiler, renderer, and facade packages.

`typst-math-wasm` solves this:

| Metric | `@myriaddreamin/typst.ts` | `typst-math-wasm` | Improvement |
| :--- | :--- | :--- | :--- |
| **Compiler WASM Size** | **28.32 MiB** | **8.72 MiB** | **-69.2% (-19.60 MiB)** |
| **Renderer WASM Size** | 0.95 MiB | *None (built-in SVG)* | **Eliminated** |
| **Gzipped Transfer** | ~11.8 MiB | **4.98 MiB** | **-57.8% (-6.82 MiB)** |
| **Cloudflare Workers Asset Limit** | ❌ Exceeds 25 MiB | ✅ **Fits cleanly (< 9 MiB)** | **Deployable** |
| **Font Loading** | Asynchronous / IPC | **Zero latency (embedded)** | **Self-contained** |

### Embedded Fonts
The New Computer Modern font family (`NewCMMath-Regular`, `NewCM10-Regular`, `NewCM10-Bold`, `NewCM10-Italic`) is compiled directly into the binary. Formulas visually match KaTeX's Computer Modern layout with zero network requests or runtime font configuration.

---

## Installation

```bash
npm install @virasak/typst-math-wasm
```

Or install directly from GitHub:
```bash
npm install github:virasak/typst-math-wasm
```

---

## Usage

### Browser (Vite / Webpack / Rollup)

```ts
import init, { compile_to_svg } from '@virasak/typst-math-wasm';
import wasmUrl from '@virasak/typst-math-wasm/wasm?url';

// Initialize the WebAssembly module
await init({ module_or_path: wasmUrl });

// Compile any Typst markup / math formula to an SVG string
const svg = compile_to_svg('$ sum_(k=1)^n k = (n(n+1))/2 $');
console.log(svg);
```

### Node.js

```js
import fs from 'node:fs';
import init, { compile_to_svg } from '@virasak/typst-math-wasm';

const wasmBuffer = fs.readFileSync(new URL('./node_modules/@virasak/typst-math-wasm/pkg/typst_math_wasm_bg.wasm', import.meta.url));
await init({ module_or_path: wasmBuffer });

const svg = compile_to_svg('$ E = m c^2 $');
```

---

## API Reference

### `init(options?: { module_or_path?: InitInput }): Promise<InitOutput>`
Initializes the WebAssembly module. Must be called once before invoking `compile_to_svg`.

### `compile_to_svg(source: string): string`
Compiles a Typst source string into an SVG string.
- Throws an Error with the Typst compiler diagnostic message if compilation fails.

---

## Building from Source

Requirements:
- Rust 1.80+ (`wasm32-unknown-unknown` target)
- `wasm-pack` (`cargo install wasm-pack` or `brew install wasm-pack`)
- `binaryen` / `wasm-opt` (`brew install binaryen`)

```bash
# Build WASM and run wasm-opt -Oz
npm run build
```

---

## Staged Publishing (`npm stage publish`)

This package uses npm's [staged publishing workflow](https://docs.npmjs.com/cli/commands/npm-stage-publish) for human-in-the-loop security verification:

```bash
# 1. Stage the package for publishing (defers 2FA)
npm run stage:publish

# 2. View staged package versions
npm run stage:list

# 3. Approve and publish to the registry (requires 2FA)
npm stage approve <stage-id>
```

---

## License

[MIT](./LICENSE)
