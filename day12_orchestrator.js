
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        console.log(`[EXEC] ${command} ${args.join(' ')}`);
        const proc = spawn(command, args, {
            ...options,
            shell: true
        });

        proc.stdout.on('data', d => console.log(d.toString().trim()));
        proc.stderr.on('data', d => console.error(d.toString().trim()));

        proc.on('close', code => {
            if (code === 0) resolve();
            else reject(new Error(`${command} failed with code ${code}`));
        });
    });
}

function waitForServer(port, timeout = 60000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const check = () => {
            const req = http.get(`http://localhost:${port}`, (res) => {
                res.on('data', () => {});
                res.on('end', () => resolve());
            });
            req.on('error', () => {
                if (Date.now() - start > timeout) {
                    reject(new Error(`Server timed out on port ${port}`));
                } else {
                    setTimeout(check, 1000);
                }
            });
        };
        check();
    });
}

async function orchestrate() {
    console.log("🌟 Starting Day 12 Automation Pipeline...");

    try {
        // 1. Generate Topic explicitly first
        console.log("\n--- STEP 1: Generating Topic ---");
        await runCommand('node', ['scripts/generate_topic.js']);

        // 2. Start Dev Server
        console.log("\n--- STEP 2: Starting Dev Server ---");
        // Use 'vite' directly if possible, or 'npm run dev' but we want to be able to kill it.
        const serverProc = spawn('npx', ['vite', '--port', '3012', '--host'], { shell: true });
        
        serverProc.stdout.on('data', (data) => {
            console.log(`[SERVER] ${data.toString().trim()}`);
        });
        serverProc.stderr.on('data', (data) => {
            console.error(`[SERVER-ERROR] ${data.toString().trim()}`);
        });

        try {
            await waitForServer(3012);
            console.log("✅ Server is ready!");

            // 3. Capture Video
            console.log("\n--- STEP 3: Capturing Video ---");
            await runCommand('node', ['capture_demo.js']);

        } finally {
            // Always kill the server
            console.log("🛑 Shutting down server...");
            if (process.platform === 'win32') {
                try { execSync('taskkill /F /T /PID ' + serverProc.pid); } catch(e) {}
            } else {
                // On Linux, kill the process group
                try { process.kill(-serverProc.pid); } catch(e) {
                    try { serverProc.kill(); } catch(e2) {}
                }
            }
            await new Promise(r => setTimeout(r, 2000)); // wait for port to clear
        }

        // 4. Publish
        console.log("\n--- STEP 4: Publishing to Social Media ---");
        const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
        await runCommand(pythonCmd, ['publish_day12.py']);

        console.log("\n✅ Day 12 Automation Complete!");

    } catch (error) {
        console.error("\n❌ Pipeline failed:", error.message);
        process.exit(1);
    }
}

orchestrate();
