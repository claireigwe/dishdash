import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function runTests() {
  console.log("=========================================");
  console.log(" DishDash Phase 7 PWA & Offline Tests    ");
  console.log("=========================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Manifest exists
  const manifestPath = path.join(rootDir, "public", "manifest.json");
  assert(fs.existsSync(manifestPath), "1. public/manifest.json exists");

  // 2. Manifest is valid JSON with required fields
  let manifest = {};
  let validJson = false;
  try {
    const raw = fs.readFileSync(manifestPath, "utf-8");
    manifest = JSON.parse(raw);
    validJson = true;
  } catch (e) {
    validJson = false;
  }
  assert(validJson, "2. public/manifest.json is valid JSON");

  // 3. Manifest core fields
  assert(
    manifest.name &&
      manifest.short_name &&
      manifest.start_url === "/" &&
      manifest.display === "standalone" &&
      manifest.theme_color === "#D95328" &&
      manifest.background_color === "#F9F7F4",
    "3. Manifest contains name, short_name, start_url='/', display='standalone', theme_color and background_color"
  );

  // 4. Manifest icons array
  assert(
    Array.isArray(manifest.icons) && manifest.icons.length >= 2,
    "4. Manifest contains icons array with at least 2 icon specifications"
  );

  // 5. Physical icon files exist
  for (const icon of manifest.icons || []) {
    const iconRelative = icon.src.replace(/^\//, "");
    const iconFull = path.join(rootDir, "public", iconRelative);
    const exists = fs.existsSync(iconFull);
    const size = exists ? fs.statSync(iconFull).size : 0;
    assert(
      exists && size > 0,
      `5. Icon ${icon.src} (${icon.sizes}) physically exists and is non-empty (${size} bytes)`
    );
  }

  // 6. Service worker file exists
  const swPath = path.join(rootDir, "public", "sw.js");
  assert(fs.existsSync(swPath), "6. public/sw.js exists");

  // 7. Service worker content structure
  const swContent = fs.readFileSync(swPath, "utf-8");
  assert(
    swContent.includes("CACHE_NAME") &&
      swContent.includes("PRECACHE_ASSETS") &&
      swContent.includes("install") &&
      swContent.includes("activate") &&
      swContent.includes("fetch"),
    "7. Service worker handles install, activate, and fetch lifecycle events"
  );

  // 8. Service worker precache includes core shell routes
  assert(
    swContent.includes('"/"') &&
      swContent.includes('"/planner"') &&
      swContent.includes('"/groceries"') &&
      swContent.includes('"/recommendations"') &&
      swContent.includes('"/manifest.json"'),
    "8. Service worker precache covers core app shell routes ('/', '/planner', '/groceries', etc.)"
  );

  // 9. Cache version cleanup in activate
  assert(
    swContent.includes("caches.delete") && swContent.includes("clients.claim"),
    "9. Service worker cleans up outdated cache versions on activation"
  );

  // 10. Service worker client registration component
  const registerCompPath = path.join(
    rootDir,
    "src",
    "components",
    "common",
    "ServiceWorkerRegister.tsx"
  );
  assert(
    fs.existsSync(registerCompPath),
    "10. src/components/common/ServiceWorkerRegister.tsx exists"
  );

  const regContent = fs.readFileSync(registerCompPath, "utf-8");
  assert(
    regContent.includes("serviceWorker") &&
      regContent.includes("register") &&
      regContent.includes('"use client"'),
    "11. ServiceWorkerRegister safely registers service worker on client side"
  );

  // 12. Layout integrates manifest and ServiceWorkerRegister
  const layoutPath = path.join(rootDir, "src", "app", "layout.tsx");
  const layoutContent = fs.readFileSync(layoutPath, "utf-8");
  assert(
    layoutContent.includes("ServiceWorkerRegister") &&
      layoutContent.includes("manifest: \"/manifest.json\""),
    "12. Root layout mounts ServiceWorkerRegister and declares manifest metadata"
  );

  // 13. Offline fallback page exists
  const offlinePath = path.join(rootDir, "src", "app", "offline", "page.tsx");
  assert(
    fs.existsSync(offlinePath),
    "13. Offline fallback page src/app/offline/page.tsx exists"
  );

  console.log("-----------------------------------------");
  console.log(`Phase 7 Tests Summary: ${passed} Passed, ${failed} Failed.`);
  console.log("=========================================");
  return failed === 0;
}

const allPassed = runTests();
if (!allPassed) {
  process.exit(1);
}
