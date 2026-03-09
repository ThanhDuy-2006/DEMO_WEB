import { spawn } from "child_process";
import path from "path";
import { getIO, emitToUser } from "../../utils/socket.js";
import logger from "../../core/logger.js";
import fs from "fs";

// Using a singleton for the current process to avoid multiple bots running simultaneously
let currentProcess = null;
let currentStatus = "idle";
let recentLogs = [];
let currentLogLimit = 500; // Store last 500 logs

const getPythonCommand = () => {
    return process.platform === "win32" ? "python" : "python3"; 
};

const getPythonArgs = (scriptPath) => {
    return ["-u", scriptPath]; // -u for unbuffered stdout
};

export const startAutoForm = (req, res) => {
    if (currentProcess) {
        return res.status(400).json({ error: "Một chiến dịch Auto-Form đang chạy. Vui lòng dừng nó trước." });
    }

    const { url, count, mood, aiProvider, apiKey, rpm, useProxy, headless } = req.body;

    if (!url) {
        return res.status(400).json({ error: "URL không được trống" });
    }

    // Prepare config for CLI script
    const botConfig = {
        FORM_URL: url,
        TOTAL_SUBMISSIONS: parseInt(count) || 1,
        TARGET_MOOD: mood || "MIXED",
        AI_PROVIDER: aiProvider || "GEMINI",
        AI_API_KEY: apiKey || "",
        RPM: parseInt(rpm) || 0,
        USE_PROXY: !!useProxy,
        HEADLESS: !!headless,
        USE_AI: !!apiKey
    };

    const scriptDir = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([a-zA-Z]:)/, '$1');
    // For Windows ESM, we need to handle the leading slash
    const absoluteScriptPath = path.join(path.resolve(), "src", "modules", "admin-tools", "scripts", "cli.py");
    
    const cliConfigJson = JSON.stringify(botConfig);

    recentLogs = [{ time: new Date(), message: "🔄 Đang kết nối tới hệ thống Python..." }];
    currentStatus = "running";

    // Immediate emission for UI feedback
    emitToUser(req.user.id, "autoFormLog", { 
        message: "🔄 Đang khởi tạo hệ thống...", 
        status: "running" 
    });

    console.log(`[Admin] Starting AutoForm: ${getPythonCommand()} ${getPythonArgs(absoluteScriptPath).join(' ')}`);
    console.log(`[Admin] Starting Bot | Script: ${absoluteScriptPath}`);
    console.log(`[Admin] Config Payload Ready (Length: ${cliConfigJson.length})`);

    try {
        // More robust argument handling for Windows shell
        const pythonCmd = getPythonCommand();
        const pythonArgs = getPythonArgs(absoluteScriptPath);
        
        currentProcess = spawn(pythonCmd, pythonArgs, {
            cwd: path.resolve(), 
            shell: process.platform === 'win32' // Explicitly only shell on Windows
        });

        // Write config via stdin
        if (currentProcess.stdin) {
            currentProcess.stdin.write(cliConfigJson + "\n");
            currentProcess.stdin.end();
            console.log(`[Admin] Config written to stdin.`);
        } else {
            console.error(`[Admin] CRITICAL: currentProcess.stdin is null!`);
        }

        currentProcess.on("spawn", () => {
            const msg = "🚀 Hệ thống Python đã được kích hoạt thành công (Process PID: " + currentProcess.pid + ")";
            console.log(`[Admin] ${msg}`);
            recentLogs.push({ time: new Date(), message: msg });
            emitToUser(req.user.id, "autoFormLog", { message: msg });
        });
        
        currentProcess.on("error", (err) => {
            logger.error(`[AdminTool] Failed to start process: ${err.message}`);
            recentLogs.push({ time: new Date(), message: `❌ [SYSTEM ERROR] Failed to start Python: ${err.message}` });
            emitToUser(req.user.id, "autoFormLog", { message: `❌ [SYSTEM ERROR]: ${err.message}`, status: "error" });
            currentStatus = "idle";
            currentProcess = null;
        });
    } catch (err) {
        return res.status(500).json({ error: "Lỗi khi khởi chạy tiến trình: " + err.message });
    }

    // Handle Output
    currentProcess.stdout.on("data", (data) => {
        const message = data.toString().trim();
        if (!message) return;
        
        // Add to buffer
        recentLogs.push({ time: new Date(), message });
        if (recentLogs.length > currentLogLimit) recentLogs.shift();

        // Stream via Socket.IO
        emitToUser(req.user.id, "autoFormLog", { 
            message,
            status: "running"
        });
    });

    currentProcess.stderr.on("data", (data) => {
        const errorMsg = data.toString().trim();
        if (!errorMsg) return;

        logger.error(`[AdminTool] Bot Error: ${errorMsg}`);
        recentLogs.push({ time: new Date(), message: `[ERROR] ${errorMsg}` });
        
        emitToUser(req.user.id, "autoFormLog", { 
            message: `[ERROR] ${errorMsg}`,
            status: "error"
        });
    });

    currentProcess.on("close", (code) => {
        logger.info(`[AdminTool] Bot Process Exited with Code: ${code}`);
        currentStatus = "idle";
        currentProcess = null;

        emitToUser(req.user.id, "autoFormFinished", { 
            code,
            message: code === 0 ? "Chiến dịch hoàn thành thành công!" : `Chiến dịch bị ngắt quãng với mã: ${code}`
        });
    });

    res.json({ 
        message: "Hệ thống Bot đang được khởi chạy...", 
        status: "running",
        logs: recentLogs // Send initial logs back to frontend immediately
    });
};

export const stopAutoForm = (req, res) => {
    if (currentProcess) {
        // Send signal to stop
        currentProcess.kill("SIGTERM");
        currentProcess = null;
        currentStatus = "idle";
        
        logger.warn(`[AdminTool] Bot Force Stopped by User: ${req.user.id}`);
        
        return res.json({ message: "Đã ngắt kết nối hệ thống Bot." });
    }
    res.status(400).json({ error: "Không có quy trình nào đang chạy." });
};

export const getStatus = (req, res) => {
    res.json({
        status: currentStatus,
        logs: recentLogs,
        isBusy: !!currentProcess
    });
};
