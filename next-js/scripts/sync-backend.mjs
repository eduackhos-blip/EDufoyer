import fs from "fs/promises";
import path from "path";

const root = process.cwd();
const sourceRoot = path.resolve(root, "..", "Edufoyer", "backend");
const targetRoot = path.resolve(root, "src", "server", "ported-backend");

const copyItems = ["routes", "controllers", "models", "middleware", "utils", "config.js"];

const removeIfExists = async (targetPath) => {
  try {
    await fs.rm(targetPath, { recursive: true, force: true });
  } catch {
    // ignore
  }
};

const ensureDir = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const copySource = async () => {
  await removeIfExists(targetRoot);
  await ensureDir(targetRoot);

  for (const item of copyItems) {
    const src = path.join(sourceRoot, item);
    const dest = path.join(targetRoot, item);
    await fs.cp(src, dest, { recursive: true });
  }

  // Ensure this copied backend subtree is treated as ESM.
  await fs.writeFile(
    path.join(targetRoot, "package.json"),
    JSON.stringify({ type: "module" }, null, 2),
    "utf8"
  );

  // Provide socket shim for controllers that call getIO().emit(...)
  const socketDir = path.join(targetRoot, "socket");
  await ensureDir(socketDir);
  await fs.writeFile(
    path.join(socketDir, "socket.js"),
    `const getBaseUrl = () => (process.env.SOCKET_PUBLISH_URL || "http://localhost:4001").replace(/\\/+$/, "");
const getApiKey = () => process.env.SOCKET_SERVER_API_KEY || "";

const publish = async (payload) => {
  try {
    await fetch(\`\${getBaseUrl()}/emit\`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(getApiKey() ? { "x-socket-api-key": getApiKey() } : {}),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch (error) {
    console.error("[ported-backend/socket] publish failed:", error);
  }
};

export const getIO = () => ({
  emit: (event, payload) => {
    void publish({ event, payload });
  },
  to: (room) => ({
    emit: (event, payload) => {
      void publish({ event, payload, room });
    },
  }),
});

export const initSocket = () => null;
`,
    "utf8"
  );
};

await copySource();
console.log("Backend synced to:", targetRoot);
