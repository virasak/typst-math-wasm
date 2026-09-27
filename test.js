import fs from "node:fs";
import init, { compile_to_svg } from "./pkg/typst_math_wasm.js";

const wasm = fs.readFileSync("./pkg/typst_math_wasm_bg.wasm");
await init({ module_or_path: wasm });

const tests = [
  "$ E = m c^2 $",
  "$ sum_(k=1)^n k = (n(n+1))/2 $",
  "$ mat(1, 2; 3, 4) $",
  "$ sqrt(x^2 + y^2) $",
  "$ bold(A) vec(x, y) = vec(0, 0) $",
  "$ alpha + beta = gamma $",
  "$ integral_0^infinity e^(-x^2) dif x = sqrt(pi)/2 $",
  "$ cases(1 \"if\" x > 0, 0 \"otherwise\") $"
];

for (const expr of tests) {
  const svg = compile_to_svg(expr);
  if (!svg.includes("<svg") || !svg.includes("</svg>")) {
    throw new Error(`Invalid SVG generated for: ${expr}`);
  }
}

console.log(`All ${tests.length} math smoke tests passed successfully!`);
