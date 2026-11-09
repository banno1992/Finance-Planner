import { defineConfig, minimal2023Preset } from "@vite-pwa/assets-generator/config";

// Regenerate icons after editing client/public/icon.svg:  npm run icons
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0.1, resizeOptions: { background: "#119c74" } },
    apple: { ...minimal2023Preset.apple, padding: 0.1, resizeOptions: { background: "#119c74" } },
  },
  images: ["client/public/icon.svg"],
});
