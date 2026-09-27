import init, { compile_to_svg } from './pkg/typst_math_wasm.js';

// Presets
const PRESETS = {
  quadratic: {
    title: 'Quadratic Formula',
    code: '$ x = (-b +- sqrt(b^2 - 4a c)) / (2a) $'
  },
  euler: {
    title: "Euler's Identity",
    code: '$ e^(i pi) + 1 = 0 $'
  },
  gaussian: {
    title: 'Gaussian Integral',
    code: '$ integral_(-oo)^oo e^(-x^2) dif x = sqrt(pi) $'
  },
  matrix: {
    title: 'Matrix Equation',
    code: '$ mat(1, 2; 3, 4) vec(x, y) = vec(5, 11) $'
  },
  summation: {
    title: 'Sum of Squares',
    code: '$ sum_(k=1)^n k^2 = (n(n+1)(2n+1)) / 6 $'
  },
  normal: {
    title: 'Normal Distribution',
    code: '$ f(x) = 1 / (sigma sqrt(2 pi)) e^(- 1/2 ((x - mu) / sigma)^2) $'
  },
  maxwell: {
    title: "Maxwell's Equations",
    code: `$
nabla dot bold(E) = rho / epsilon_0 \\
nabla dot bold(B) = 0 \\
nabla times bold(E) = - (partial bold(B)) / (partial t) \\
nabla times bold(B) = mu_0 bold(J) + mu_0 epsilon_0 (partial bold(E)) / (partial t)
$`
  },
  cases: {
    title: 'Piecewise Function',
    code: `$ f(n) = cases(
  n/2 & "if" n "is even",
  3n + 1 & "if" n "is odd"
) $`
  }
};

// State
let wasmReady = false;
let currentSvg = '';
let currentScale = 1.5;
let isRawView = false;
let debounceTimer = null;

// DOM Elements
const editor = document.getElementById('codeEditor');
const svgViewport = document.getElementById('svgViewport');
const rawCode = document.getElementById('rawCode');
const rawCodeContainer = document.getElementById('rawCodeContainer');
const errorBanner = document.getElementById('errorBanner');
const compileTimeBadge = document.getElementById('compileTimeBadge');
const dimensionsBadge = document.getElementById('dimensionsBadge');
const optTightCrop = document.getElementById('optTightCrop');
const optTransparent = document.getElementById('optTransparent');
const optAutoTextColor = document.getElementById('optAutoTextColor');
const btnToggleRaw = document.getElementById('btnToggleRaw');
const btnCopySvg = document.getElementById('btnCopySvg');
const btnDownloadSvg = document.getElementById('btnDownloadSvg');
const btnCopyTypst = document.getElementById('btnCopyTypst');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const themeToggle = document.getElementById('themeToggle');

// Show toast notification
function showToast(message) {
  toastMessage.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

// Build preamble from user options
function buildSource(userCode) {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  let preamble = '';

  const tight = optTightCrop.checked;
  const transparent = optTransparent.checked;
  const autoColor = optAutoTextColor.checked;

  if (tight || transparent) {
    let pageArgs = [];
    if (tight) {
      pageArgs.push('width: auto', 'height: auto', 'margin: (x: 0.6em, y: 0.6em)');
    }
    if (transparent) {
      pageArgs.push('fill: none');
    }
    preamble += `#set page(${pageArgs.join(', ')})\n`;
  }

  if (autoColor) {
    // If transparent and dark theme, render math in light color
    if (!isLight && transparent) {
      preamble += `#set text(fill: rgb("f0f3f6"))\n`;
    } else if (isLight && transparent) {
      preamble += `#set text(fill: rgb("0f172a"))\n`;
    }
  }

  return preamble + userCode;
}

// Compile
function compile() {
  if (!wasmReady) return;

  const rawInput = editor.value.trim();
  if (!rawInput) {
    svgViewport.innerHTML = '<span style="color: var(--text-muted); font-size: 0.85rem;">Enter a formula to render</span>';
    rawCode.textContent = '';
    errorBanner.classList.remove('visible');
    compileTimeBadge.textContent = '⚡ 0.0ms';
    dimensionsBadge.textContent = '0 × 0';
    return;
  }

  const fullSource = buildSource(rawInput);

  try {
    const startTime = performance.now();
    const svg = compile_to_svg(fullSource);
    const duration = (performance.now() - startTime).toFixed(1);

    currentSvg = svg;
    errorBanner.classList.remove('visible');
    svgViewport.style.display = isRawView ? 'none' : 'flex';
    rawCodeContainer.classList.toggle('visible', isRawView);

    svgViewport.innerHTML = svg;
    rawCode.textContent = svg;

    // Apply scale
    svgViewport.style.transform = `scale(${currentScale})`;

    // Update badges
    compileTimeBadge.textContent = `⚡ ${duration}ms`;

    // Extract viewBox dimensions
    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
    if (viewBoxMatch) {
      const parts = viewBoxMatch[1].trim().split(/\s+/);
      if (parts.length === 4) {
        const w = Math.round(parseFloat(parts[2]));
        const h = Math.round(parseFloat(parts[3]));
        dimensionsBadge.textContent = `${w} × ${h} pt`;
      }
    }
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    errorBanner.textContent = `Typst Compile Error:\n${msg}`;
    errorBanner.classList.add('visible');
    compileTimeBadge.textContent = '⚡ Error';
  }
}

// Setup Presets
function setupPresets() {
  const presetBar = document.getElementById('presetBar');
  Object.entries(PRESETS).forEach(([key, preset], idx) => {
    const btn = document.createElement('button');
    btn.className = `preset-btn ${idx === 0 ? 'active' : ''}`;
    btn.textContent = preset.title;
    btn.dataset.key = key;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      editor.value = preset.code;
      compile();
    });
    presetBar.appendChild(btn);
  });
}

// Quick Snippet Insert
function setupSnippets() {
  document.querySelectorAll('.snippet-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const snippet = tag.dataset.insert || tag.textContent;
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      const val = editor.value;
      editor.value = val.substring(0, start) + snippet + val.substring(end);
      editor.focus();
      editor.selectionStart = editor.selectionEnd = start + snippet.length;
      compile();
    });
  });
}

// Zoom controls
function setupZoomControls() {
  document.querySelectorAll('.zoom-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.zoom-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentScale = parseFloat(btn.dataset.scale);
      svgViewport.style.transform = `scale(${currentScale})`;
    });
  });
}

// Setup Event Listeners
function setupEvents() {
  // Real-time debounced compile
  editor.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(compile, 40);
  });

  // Handle Tab key in editor
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.value = editor.value.substring(0, start) + '  ' + editor.value.substring(end);
      editor.selectionStart = editor.selectionEnd = start + 2;
      compile();
    }
  });

  // Options toggles
  [optTightCrop, optTransparent, optAutoTextColor].forEach(el => {
    el.addEventListener('change', compile);
  });

  // View toggle (Rendered SVG vs Raw Code)
  btnToggleRaw.addEventListener('click', () => {
    isRawView = !isRawView;
    btnToggleRaw.classList.toggle('active', isRawView);
    btnToggleRaw.querySelector('span').textContent = isRawView ? 'Preview' : 'Code';
    svgViewport.style.display = isRawView ? 'none' : 'flex';
    rawCodeContainer.classList.toggle('visible', isRawView);
  });

  // Copy SVG
  btnCopySvg.addEventListener('click', async () => {
    if (!currentSvg) return;
    try {
      await navigator.clipboard.writeText(currentSvg);
      showToast('SVG copied to clipboard!');
    } catch {
      showToast('Failed to copy to clipboard');
    }
  });

  // Download SVG
  btnDownloadSvg.addEventListener('click', () => {
    if (!currentSvg) return;
    const blob = new Blob([currentSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'typst-math.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded typst-math.svg');
  });

  // Copy Typst code
  btnCopyTypst.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(editor.value);
      showToast('Typst markup copied!');
    } catch {
      showToast('Failed to copy markup');
    }
  });

  // Theme toggle
  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const nextTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    themeToggle.textContent = nextTheme === 'light' ? '🌙 Dark' : '☀️ Light';
    compile();
  });
}

// Initialization
async function start() {
  setupPresets();
  setupSnippets();
  setupZoomControls();
  setupEvents();

  // Load default preset code
  editor.value = PRESETS.quadratic.code;

  try {
    svgViewport.innerHTML = '<span style="color: var(--text-muted); font-size: 0.85rem;">Initializing WebAssembly module (~15MB)...</span>';
    
    // Initialize WebAssembly
    await init('./pkg/typst_math_wasm_bg.wasm');
    wasmReady = true;

    // Initial compile
    compile();
  } catch (err) {
    svgViewport.innerHTML = `<span style="color: var(--error); font-size: 0.85rem;">Failed to initialize WASM: ${err.message || err}</span>`;
    console.error('WASM init error:', err);
  }
}

start();
