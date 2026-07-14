import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer";
import type { GeneratedAoi, Logger, RenderedAoi, RenderedSolution } from "./types";

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
      const renderedSolutions: RenderedSolution[] = [];
      for (let si = 0; si < a.solutions.length; si++) {
        const s = a.solutions[si];
        const pngBuffer = await renderHtmlToPngBuffer(browser, s.mockup.html);
        const screenshotBase64 = `data:image/png;base64,${pngBuffer.toString("base64")}`;
        logger.log(`  AOI ${ai + 1} / Solution ${si + 1} -> screenshot ${pngBuffer.length} bytes`);
        renderedSolutions.push({
          solution: s.solution,
          featureSpecs: s.featureSpecs,
          mockup: { rationale: s.mockup.rationale, screenshotBase64 },
        });
      }

      rendered.push({
        issue: a.issue,
        summarizedEvidence: a.summarizedEvidence,
        evidence: a.evidence,
        frameIndex: a.evidence[a.evidence.length - 1].frameIndex,
        solutions: renderedSolutions,
        breadthRecurrence: a.breadthRecurrence,
        depthRecurrence: a.depthRecurrence,
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
