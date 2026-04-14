const getBaseUrl = () => (process.env.SOCKET_PUBLISH_URL || "http://localhost:4001").replace(/\/+$/, "");
const getApiKey = () => process.env.SOCKET_SERVER_API_KEY || "";

const publish = async (payload) => {
  try {
    await fetch(`${getBaseUrl()}/emit`, {
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
