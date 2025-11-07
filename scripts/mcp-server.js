import http from "http";
import { exec } from "child_process";
import fs from "fs/promises";
import xlsx from "xlsx";

const PORT = 8080;

// Utility: run shell commands (Playwright, Git, etc.)
function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(stderr || error.message);
      else resolve(stdout);
    });
  });
}

// Utility: read Excel data
async function readExcel(filePath, sheetName) {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[sheetName || workbook.SheetNames[0]];
  return xlsx.utils.sheet_to_json(sheet);
}

// Utility: write to Excel
async function writeExcel(filePath, sheetName, cellRef, value) {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[sheetName || workbook.SheetNames[0]];
  sheet[cellRef] = { t: "s", v: value };
  xlsx.writeFile(filePath, workbook);
  return `✅ Updated ${cellRef} in ${filePath}`;
}

// Create simple MCP-like JSON server
const server = http.createServer(async (req, res) => {
  if (req.method === "POST") {
    let body = "";
    req.on("data", chunk => (body += chunk.toString()));
    req.on("end", async () => {
      try {
        const { command, args = [] } = JSON.parse(body || "{}");
        let result = "";

        switch (command) {
          case "fs.readFile":
            result = await fs.readFile(args[0], "utf-8");
            break;

          case "playwright.run":
            if (!args[0]) throw new Error("Missing test file path");
            result = await runCommand(`npx playwright test ${args[0]} --headed`);
            break;

          case "git.commitAndPush":
            const message = args[0] || "Auto commit from MCP server";
            await runCommand("git add .");
            await runCommand(`git commit -m "${message}" || echo 'Nothing to commit'`);
            result = await runCommand("git push origin main");
            break;

          case "excel.read":
            result = await readExcel(args[0], args[1]);
            break;

          case "excel.write":
            result = await writeExcel(args[0], args[1], args[2], args[3]);
            break;

          default:
            throw new Error(`Unknown command: ${command}`);
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, result }));
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: false, message: "Not Found" }));
  }
});

server.listen(PORT, () =>
  console.log(`✅ MCP-like server with Excel support running on http://localhost:${PORT}`)
);
