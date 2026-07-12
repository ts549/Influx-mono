import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer";
import type { GeneratedAoi, Logger, RenderedAoi } from "./types";

const DEFAULT_VIEWPORT = { width: 1280, height: 800 };

export async function renderAllVariants(
  aois: GeneratedAoi[],
  logger: Logger,
): Promise<RenderedAoi[]> {
  const rendered: RenderedAoi[] = [];
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });

  try {
    for (let ai = 0; ai < aois.length; ai++) {
      const a = aois[ai];
      const renderedVariants = [];
      for (let vi = 0; vi < a.variants.length; vi++) {
        const v = a.variants[vi];
        const pngBuffer = await renderHtmlToPngBuffer(browser, v.html);
        const screenshotBase64 = `data:image/png;base64,${pngBuffer.toString("base64")}`;
        logger.log(`  AOI ${ai + 1} / Variant ${vi + 1} -> screenshot ${pngBuffer.length} bytes`);
        renderedVariants.push({ rationale: v.rationale, screenshotBase64 });
      }

      rendered.push({
        issue: a.issue,
        solution: a.solution,
        featureSpecs: a.featureSpecs,
        frameIndex: a.frameIndex,
        variants: renderedVariants,
      });
    }
  } finally {
    await browser.close();
  }

  return rendered;
}

async function renderHtmlToPngBuffer(
  browser: import("puppeteer").Browser,
  html: string,
): Promise<Buffer> {
  const workDir = await mkdtemp(path.join(tmpdir(), "influx-render-"));
  const htmlPath = path.join(workDir, "index.html");
  await writeFile(htmlPath, html, "utf8");

  try {
    const page = await browser.newPage();
    await page.setViewport(DEFAULT_VIEWPORT);
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load", timeout: 30_000 });
    const screenshot = await page.screenshot({ fullPage: true, type: "png" });
    await page.close();
    return Buffer.from(screenshot);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
