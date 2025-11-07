process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import fs from "fs";
import axios from "axios";
import { execSync } from "child_process";
import dotenv from "dotenv";

dotenv.config(); // Loads .env automatically

// Load environment variables
const {
  LLM_API_KEY,
  LLM_BASE_URL,
  LLM_MODEL,
  BASE_URL,
  TEST_DIR,
} = process.env;

if (!LLM_API_KEY) {
  console.error(" Missing LLM_API_KEY in .env");
  process.exit(1);
}

// --- Load prompts dynamically ---
const systemPromptPath = "./prompt_template.txt";
const testPromptPath = "./test_prompt.txt";

if (!fs.existsSync(systemPromptPath)) {
  console.error(` Missing ${systemPromptPath}`);
  process.exit(1);
}

if (!fs.existsSync(testPromptPath)) {
  console.error(` Missing ${testPromptPath}`);
  process.exit(1);
}

const systemPrompt = fs.readFileSync(systemPromptPath, "utf-8").trim();
const testPrompt = fs.readFileSync(testPromptPath, "utf-8").trim();

// --- Generate test using the LLM ---
async function generateTest() {
  console.log(" Generating test via OpenRouter...");

  const response = await axios.post(
    `${LLM_BASE_URL}/chat/completions`,
    {
      model: LLM_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: testPrompt },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${LLM_API_KEY}`,
        "HTTP-Referer": "https://openrouter.ai",
        "X-Title": "SauceDemo AI Test Generator",
      },
    }
  );

  const code = response.data.choices?.[0]?.message?.content?.trim();

  if (!code) throw new Error("No code returned by model.");

  if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR, { recursive: true });

  const testFile = `${TEST_DIR}/sauce_login.spec.js`;
  fs.writeFileSync(testFile, code);
  console.log(` Test generated and saved to ${testFile}`);

  return testFile;
}

// --- Run generated test ---
function runTest(filePath) {
  console.log(" Running generated test...");
  try {
    execSync(`npx playwright test ${filePath} --headed`, { stdio: "inherit" });
  } catch (err) {
    console.error(" Test run failed:", err.message);
  }
}

// --- Commit and push changes to GitHub ---
function pushToGitHub() {
  try {
    console.log(" Committing and pushing changes to GitHub...");
    execSync("git add .", { stdio: "inherit" });
    execSync(`git commit -m " Auto-generated test on ${new Date().toISOString()}"`, { stdio: "inherit" });
    execSync("git push origin main", { stdio: "inherit" });
    console.log(" Changes pushed successfully!");
  } catch (err) {
    console.error(" Git push failed:", err.message);
  }
}

// --- Main flow ---
(async () => {
  try {
    const testFile = await generateTest();
    runTest(testFile);
    pushToGitHub();
  } catch (err) {
    console.error(" Error:", err);
  }
})();
