import { useSocket as useAppSocket } from "@/src/contexts/SocketContext";

export const useSocket = () => {
  const { socket, connectSocket } = useAppSocket();
  const activeSocket = socket ?? connectSocket();
  return { socket: activeSocket };
};
