import type { Socket } from "socket.io";
import { Solver } from "../../models/Solver";

type RegisterSolverPayload = {
  userId?: string;
  subjects?: string[];
};

export const registerEdufoyerSocketHandlers = (socket: Socket) => {
  socket.on("join:admin", ({ university_email }: { university_email?: string } = {}) => {
    const normalizedEmail = String(university_email || "").trim().toLowerCase();
    if (!normalizedEmail) {
      socket.emit("registrationError", { message: "university_email is required" });
      return;
    }

    socket.join(`admin:${normalizedEmail}`);
    socket.emit("registrationSuccess", {
      message: "Successfully joined admin room",
      room: `admin:${normalizedEmail}`,
    });
  });

  socket.on("registerSolver", async ({ userId, subjects = [] }: RegisterSolverPayload = {}) => {
    try {
      const authenticatedUserId = socket.user.userId;
      if (userId != null && String(userId) !== authenticatedUserId) {
        socket.emit("registrationError", {
          message: "userId does not match authenticated user",
        });
        return;
      }

      socket.join(`solver:${authenticatedUserId}`);

      let subjectList: string[] = Array.isArray(subjects) ? subjects : [];

      if (subjectList.length === 0) {
        const solverDoc = await Solver.findOne({ user_id: authenticatedUserId })
          .select("specialities")
          .lean();
        if (solverDoc?.specialities?.length) {
          subjectList = solverDoc.specialities;
        }
      }

      const rooms = subjectList.map((subject) => `subject:${String(subject).toLowerCase()}`);
      rooms.forEach((room) => socket.join(room));

      socket.emit("registrationSuccess", {
        message: "Successfully registered as solver",
        subjects: subjectList,
      });
    } catch (error) {
      console.error("[socket] registerSolver failed:", error);
      socket.emit("registrationError", {
        message: "Failed to register as solver",
      });
    }
  });
};
