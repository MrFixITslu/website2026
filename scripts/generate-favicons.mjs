import fs from "fs";
import path from "path";
import sharp from "sharp";

async function main() {
  const publicDir = path.join(process.cwd(), "public");
  const possiblePaths = [
    path.join(process.cwd(), "src", "assets", "v79-ribbon-master.png"),
    path.join(publicDir, "v79-mark.png"),
    path.join(publicDir, "v79-official-logo.png"),
    path.join(process.cwd(), "src", "assets", "images", "v79_official_logo_1789330442063.jpg"),
    path.join(publicDir, "v79-official-logo.svg"),
  ];

  let masterRibbonPath = possiblePaths.find(p => fs.existsSync(p));

  if (!masterRibbonPath) {
    throw new Error(`Master ribbon asset not found in: ${possiblePaths.join(", ")}`);
  }

  console.log("Loading authentic V79 ribbon master asset...");
  const masterBuffer = fs.readFileSync(masterRibbonPath);
  const masterMeta = await sharp(masterBuffer).metadata();
  console.log(`Master ribbon dimensions: ${masterMeta.width}x${masterMeta.height}`);

  // Create an anti-aliased softened master ribbon
  const rawMaster = await sharp(masterBuffer).raw().toBuffer({ resolveWithObject: true });
  const smoothedData = Buffer.from(rawMaster.data);
  const w = rawMaster.info.width;
  const h = rawMaster.info.height;

  // Subtle 1-pixel subpixel anti-aliasing on hard alpha boundaries
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      if (rawMaster.data[idx + 3] === 255) {
        let zeroCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nIdx = ((y + dy) * w + (x + dx)) * 4 + 3;
            if (rawMaster.data[nIdx] === 0) zeroCount++;
          }
        }
        if (zeroCount >= 3) {
          smoothedData[idx + 3] = Math.round(255 * (8 - zeroCount) / 9);
        }
      }
    }
  }

  const softenedMasterBuffer = await sharp(smoothedData, {
    raw: { width: w, height: h, channels: 4 }
  })
  .png()
  .toBuffer();

  // 1. Create a pristine 800x800 square transparent master mark
  // Optical centering: ribbon is 674 x 398.
  const canvasSize = 800;
  const targetRibbonWidth = 700;
  const targetRibbonHeight = Math.round((h / w) * targetRibbonWidth);

  const resizedRibbon = await sharp(softenedMasterBuffer)
    .resize(targetRibbonWidth, targetRibbonHeight, { kernel: sharp.kernel.lanczos3 })
    .toBuffer();

  const squareMaster800 = await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([{
    input: resizedRibbon,
    left: Math.round((canvasSize - targetRibbonWidth) / 2),
    top: Math.round((canvasSize - targetRibbonHeight) / 2)
  }])
  .png({ compressionLevel: 9 })
  .toBuffer();

  // Save master v79-mark.png and v79-official-logo.png
  fs.writeFileSync(path.join(publicDir, "v79-mark.png"), squareMaster800);
  console.log("✓ public/v79-mark.png (800x800 high-res)");

  fs.writeFileSync(path.join(publicDir, "v79-official-logo.png"), squareMaster800);
  console.log("✓ public/v79-official-logo.png (800x800 high-res)");

  // 2. Favicon 16x16
  await sharp(squareMaster800)
    .resize(16, 16, { kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, "favicon-16x16.png"));
  console.log("✓ public/favicon-16x16.png");

  // 3. Favicon 32x32
  await sharp(squareMaster800)
    .resize(32, 32, { kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, "favicon-32x32.png"));
  console.log("✓ public/favicon-32x32.png");

  // 4. Favicon 64x64 / standard favicon.png
  await sharp(squareMaster800)
    .resize(64, 64, { kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, "favicon.png"));
  console.log("✓ public/favicon.png");

  // 5. Apple Touch Icon 180x180
  await sharp(squareMaster800)
    .resize(180, 180, { kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, "apple-touch-icon.png"));
  console.log("✓ public/apple-touch-icon.png");

  // 6. ICO file (32x32)
  const ico32 = await sharp(squareMaster800)
    .resize(32, 32, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, "favicon.ico"), ico32);
  console.log("✓ public/favicon.ico");

  // 7. Generate SVG favicon embedding the 512x512 high-resolution raster
  const svgRaster512 = await sharp(squareMaster800)
    .resize(512, 512, { kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const base64Raster = svgRaster512.toString("base64");

  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,${base64Raster}" width="512" height="512" preserveAspectRatio="xMidYMid meet" />
</svg>`;

  fs.writeFileSync(path.join(publicDir, "favicon.svg"), faviconSvg);
  console.log("✓ public/favicon.svg (high-fidelity vector-embedded)");

  fs.writeFileSync(path.join(publicDir, "v79-digital-logo.svg"), faviconSvg);
  console.log("✓ public/v79-digital-logo.svg (high-fidelity vector-embedded)");

  // 8. Social Sharing OG Image (1200x630)
  const ogMarkSize = 280;
  const ogMarkBuffer = await sharp(squareMaster800)
    .resize(ogMarkSize, ogMarkSize, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();

  const ogBase64 = ogMarkBuffer.toString("base64");

  const ogSvg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#071426" />
          <stop offset="50%" stop-color="#0b1b30" />
          <stop offset="100%" stop-color="#020914" />
        </linearGradient>
        <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="24" flood-color="#00e5ff" flood-opacity="0.35" />
        </filter>
      </defs>
      <rect width="1200" height="630" fill="url(#bgGrad)" />
      
      <!-- Ambient decorative glow -->
      <circle cx="600" cy="220" r="280" fill="#00d4d8" opacity="0.08" filter="blur(60px)" />
      <circle cx="750" cy="280" r="200" fill="#0066cc" opacity="0.10" filter="blur(50px)" />

      <!-- Official Logo Mark -->
      <g filter="url(#cyanGlow)">
        <image x="460" y="70" width="${ogMarkSize}" height="${ogMarkSize}" href="data:image/png;base64,${ogBase64}" />
      </g>

      <!-- Brand Typography -->
      <text x="600" y="420" font-family="'Sora', system-ui, sans-serif" font-weight="800" font-size="44" letter-spacing="1" fill="#ffffff" text-anchor="middle">
        VISION 79 <tspan fill="#00e5ff">DIGITAL</tspan>
      </text>

      <!-- Tagline -->
      <text x="600" y="465" font-family="'JetBrains Mono', monospace" font-weight="700" font-size="15" letter-spacing="6" fill="#7dd3fc" text-anchor="middle">
        ICT SOLUTIONS &#8226; FROM IDEA TO ADVANTAGE
      </text>

      <!-- Services summary -->
      <text x="600" y="540" font-family="'Inter', system-ui, sans-serif" font-weight="500" font-size="18" letter-spacing="1" fill="#94a3b8" text-anchor="middle">
        Managed IT Services &#8226; Cybersecurity &#8226; Cloud Infrastructure &#8226; Custom Software
      </text>
      <text x="600" y="580" font-family="'Inter', system-ui, sans-serif" font-weight="600" font-size="14" letter-spacing="3" fill="#38bdf8" text-anchor="middle">
        SAINT LUCIA &#8226; EASTERN CARIBBEAN
      </text>
    </svg>
  `;

  await sharp(Buffer.from(ogSvg))
    .png({ compressionLevel: 9 })
    .toFile(path.join(publicDir, "og-image.png"));
  console.log("✓ public/og-image.png (1200x630 social share card)");

  console.log("All official brand assets successfully generated!");
}

main().catch(err => {
  console.error("Error generating brand assets:", err);
  process.exit(1);
});

