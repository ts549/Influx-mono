import path from "node:path";
import { config } from "dotenv";

// Load .env.local from the repo root. Import this module at the TOP of any
// standalone script (eval runners, one-off tools) that needs GEMINI_API_KEY
// or ANTHROPIC_API_KEY. Next.js already loads .env.local for the API route,
// so nothing inside app/api/redesign/route.ts needs this.
config({ path: path.join(process.cwd(), ".env.local") });
