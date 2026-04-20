import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/lib/db";
import { getAuthenticatedUser } from "@/src/utils/server/currentUser";
import { authErrorResponse } from "@/src/utils/server/errorResponse";
import { z } from "zod";
import Doubt from "@/src/models/Doubt";
import Solver from "@/src/models/Solver";
import Notification from "@/src/models/Notification";
import User from "@/src/models/User";
import UniversityDoubtBalance from "@/src/models/UniversityDoubtBalance";
import { sendEmail } from "@/src/utils/server/email";
import { validateSubjectRelevance } from "@/src/utils/server/openaiValidation";
import { publishSocketEvent, publishSocketEvents } from "@/src/utils/server/socketPublisher";

export const runtime = "nodejs";

const AskDoubtSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  subject: z.string().min(1, "Subject is required"),
  category: z
    .enum(["small", "medium", "large"], {
      required_error: "Doubt category is required",
    })
    .optional(),
  doubtCategory: z
    .enum(["small", "medium", "large"], {
      required_error: "Doubt category is required",
    })
    .optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters long")
    .max(5000, "Description cannot exceed 5000 characters")
    .optional(),
  doubtDescription: z
    .string()
    .min(10, "Description must be at least 10 characters long")
    .max(5000, "Description cannot exceed 5000 characters")
    .optional(),
  imagePath: z.string().nullable().optional(),
  isScheduled: z.boolean().optional(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
});

async function getUserEmail(userId: string) {
  try {
    const userResult = await User.findById(userId).select("email");
    return (userResult as any)?.email || null;
  } catch {
    return null;
  }
}

async function createDoubt(formData: unknown, userId: string) {
  const validatedFields = AskDoubtSchema.safeParse(formData);

  if (!validatedFields.success) {
    return {
      success: false,
      error: "Invalid input data.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized: You must be logged in to ask a doubt.",
    };
  }

  const {
    subject,
    category,
    doubtCategory,
    description,
    doubtDescription,
    imagePath,
    isScheduled,
    scheduledDate,
    scheduledTime,
  } = validatedFields.data;

  const finalSubject = subject;
  const finalDescription = description || doubtDescription;
  const finalCategory = category || doubtCategory;

  // daily quota checks (fail-open)
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayDoubts = await Doubt.find({
      doubter_id: userId,
      createdAt: { $gte: todayStart, $lte: todayEnd },
    }).select("category");

    const categoryCounts: Record<string, number> = {
      small: todayDoubts.filter((d: any) => d.category === "small").length,
      medium: todayDoubts.filter((d: any) => d.category === "medium").length,
      large: todayDoubts.filter((d: any) => d.category === "large").length,
    };

    const limits: Record<string, number> = { small: 2, medium: 2, large: 1 };

    const totalToday = todayDoubts.length;
    if (totalToday >= 5) {
      return {
        success: false,
        error:
          "You've reached your daily limit of 5 doubts (2 Small, 2 Medium, 1 Large). Your quota will reset after 12 AM. Please try again tomorrow!",
        quotaDetails: {
          total: totalToday,
          limit: 5,
          categoryCounts,
          limits,
        },
      };
    }

    if (finalCategory && categoryCounts[finalCategory] >= limits[finalCategory]) {
      const categoryNames: Record<string, string> = { small: "Small", medium: "Medium", large: "Large" };
      const categoryName = categoryNames[finalCategory] || finalCategory;
      const used = categoryCounts[finalCategory];
      const limit = limits[finalCategory];
      return {
        success: false,
        error: `You've used all your ${categoryName} doubt slots for today (${used}/${limit}). You can still ask doubts from other categories. Your quota will reset after 12 AM. Please try again tomorrow!`,
        quotaDetails: {
          exhaustedCategory: finalCategory,
          categoryCounts,
          limits,
          total: totalToday,
        },
      };
    }
  } catch {
    // ignore
  }

  if (isScheduled) {
    if (!scheduledDate || !scheduledTime) {
      return { success: false, error: "Scheduled date and time are required when scheduling a doubt." };
    }
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    if (scheduledDateTime <= new Date()) {
      return { success: false, error: "Scheduled date and time must be in the future." };
    }
  }

  // async OpenAI validation (fail-open)
  void (async () => {
    if (finalDescription && finalSubject) {
      try {
        await validateSubjectRelevance(finalSubject, finalDescription);
      } catch {
        // ignore
      }
    }
  })();

  try {
    const newDoubt = new (Doubt as any)({
      subject: finalSubject,
      description: finalDescription,
      image: imagePath,
      category: finalCategory || "medium",
      doubter_id: userId,
      status: "open",
      is_scheduled: isScheduled || false,
      scheduled_date: isScheduled && scheduledDate ? new Date(`${scheduledDate}T${scheduledTime}`) : undefined,
      scheduled_time: isScheduled ? scheduledTime : undefined,
    });

    const savedDoubt = await newDoubt.save();

    // KIIT balance decrement (async)
    setImmediate(async () => {
      try {
        const userEmail = await getUserEmail(userId);
        if (userEmail && userEmail.toLowerCase().endsWith("@kiit.ac.in")) {
          const category = finalCategory || "medium";
          const currentBalance = await UniversityDoubtBalance.findOne({ university_email: "admin@kiit.ac.in" });
          if (!currentBalance) return;
          const currentCategoryBalance = (currentBalance as any).doubtBuckets?.[category] || 0;
          if (currentCategoryBalance <= 0) return;

          const balanceUpdate = await UniversityDoubtBalance.findOneAndUpdate(
            { university_email: "admin@kiit.ac.in", [`doubtBuckets.${category}`]: { $gt: 0 } },
            { $inc: { [`doubtBuckets.${category}`]: -1 } },
            { new: true }
          );

          if (balanceUpdate) {
            void publishSocketEvents([
              {
                event: "doubt:balance:updated",
                payload: {
                  university_email: "admin@kiit.ac.in",
                  doubtBuckets: (balanceUpdate as any).doubtBuckets,
                  totalAvailable: (balanceUpdate as any).totalAvailable,
                },
              },
              {
                event: "university:balance-updated",
                payload: {
                  university_email: "admin@kiit.ac.in",
                  doubtBuckets: (balanceUpdate as any).doubtBuckets,
                  totalAvailable: (balanceUpdate as any).totalAvailable,
                },
              },
              {
                event: "doubt:created",
                payload: { university_email: "admin@kiit.ac.in", category },
              },
            ]);
          }
        }
      } catch {
        // ignore
      }
    });

    // user notification (async)
    setImmediate(async () => {
      try {
        let notificationContent = `Your doubt "${(savedDoubt as any).subject}" has been submitted successfully and is awaiting a solver.`;
        if ((savedDoubt as any).is_scheduled && (savedDoubt as any).scheduled_date) {
          const sd = new Date((savedDoubt as any).scheduled_date);
          const formattedDate = sd.toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          const formattedTime =
            (savedDoubt as any).scheduled_time ||
            sd.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
          notificationContent = `Your doubt "${(savedDoubt as any).subject}" has been scheduled for ${formattedDate} at ${formattedTime} and is awaiting a solver.`;
        }
        await Notification.create({
          user_id: userId,
          doubt_id: (savedDoubt as any)._id,
          message_type: "DOUBT_SUBMITTED",
          content: notificationContent,
        });
      } catch {
        // ignore
      }
    });

    const responseData = {
      success: true,
      message: "Doubt submitted successfully! Potential solvers have been notified.",
      doubtId: (savedDoubt as any)._id,
      is_scheduled: (savedDoubt as any).is_scheduled || false,
      scheduled_date: (savedDoubt as any).scheduled_date,
      scheduled_time: (savedDoubt as any).scheduled_time,
    };

    // solver notifications (async)
    setImmediate(async () => {
      try {
        const potentialSolvers = await Solver.find({
          specialities: { $in: [String((savedDoubt as any).subject).toLowerCase()] },
        })
          .select("user_id")
          .lean()
          .limit(20);

        void publishSocketEvent({
          event: "doubt:available",
          room: `subject:${String((savedDoubt as any).subject).toLowerCase()}`,
          payload: {
            doubtId: String((savedDoubt as any)._id),
            subject: (savedDoubt as any).subject,
            description: (savedDoubt as any).description,
            createdAt: (savedDoubt as any).createdAt,
            status: (savedDoubt as any).status,
          },
        });

        const userEmail = await getUserEmail(userId);
        if (userEmail && userEmail.toLowerCase().endsWith("@kiit.ac.in")) {
          void publishSocketEvent({
            event: "doubt:created",
            payload: { university_email: "admin@kiit.ac.in", category: finalCategory || "medium", doubtId: (savedDoubt as any)._id },
          });
        }

        if (potentialSolvers.length > 0) {
          const frontendBase = (process.env.FRONTEND_URL || "").trim();
          const base = frontendBase || "";
          const acceptUrl = `${base}/dashboard/solve/${(savedDoubt as any)._id}`;

          const batchSize = 10;
          for (let i = 0; i < potentialSolvers.length; i += batchSize) {
            const batch = potentialSolvers.slice(i, i + batchSize);
            await Promise.allSettled(
              batch.map(async (potentialSolver: any) => {
                try {
                  const solverEmail = await getUserEmail(String(potentialSolver.user_id));
                  if (solverEmail) {
                    await sendEmail({
                      to: solverEmail,
                      subject: `New Doubt Available: ${(savedDoubt as any).subject}`,
                      text: `A new doubt matching your specialities has been submitted.\n\nSubject: ${(savedDoubt as any).subject}\nDescription: ${(savedDoubt as any).description?.substring(
                        0,
                        100
                      )}...\n\nYou can view and accept this doubt here: ${acceptUrl}\n\nIf you accept it, it will be assigned to you. Please solve it promptly.`,
                      html: `<p>Hello,</p>
<p>A new doubt matching your specialities has been submitted and is available for you to solve:</p>
<hr>
<p><strong>Subject:</strong> ${(savedDoubt as any).subject}</p>
<p><strong>Description:</strong> ${(savedDoubt as any).description?.substring(0, 200)}...</p>
<hr>
<p>You can view the full details and accept this doubt by clicking the button below:</p>
<p style="text-align: center; margin: 20px 0;">
  <a href="${acceptUrl}" style="background-color: #104be3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">View and Accept Doubt</a>
</p>`,
                    });

                    let notificationContent = `A new doubt is available for you: "${(savedDoubt as any).subject}". Click to view.`;
                    if ((savedDoubt as any).is_scheduled && (savedDoubt as any).scheduled_date) {
                      const sd = new Date((savedDoubt as any).scheduled_date);
                      const formattedDate = sd.toLocaleDateString("en-IN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      });
                      const formattedTime =
                        (savedDoubt as any).scheduled_time ||
                        sd.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
                      notificationContent = `A new scheduled doubt is available for you: "${(savedDoubt as any).subject}" scheduled for ${formattedDate} at ${formattedTime}. Click to view.`;
                    }

                    await Notification.create({
                      user_id: potentialSolver.user_id,
                      doubt_id: (savedDoubt as any)._id,
                      message_type: "DOUBT_AVAILABLE",
                      content: notificationContent,
                    });

                    void publishSocketEvent({
                      event: "doubt:available",
                      room: `solver:${String(potentialSolver.user_id)}`,
                      payload: {
                        doubtId: String((savedDoubt as any)._id),
                        subject: (savedDoubt as any).subject,
                        description: (savedDoubt as any).description,
                        createdAt: (savedDoubt as any).createdAt,
                        status: (savedDoubt as any).status,
                        is_scheduled: (savedDoubt as any).is_scheduled || false,
                        scheduled_date: (savedDoubt as any).scheduled_date,
                        scheduled_time: (savedDoubt as any).scheduled_time,
                      },
                    });
                  }
                } catch {
                  // ignore per-solver
                }
              })
            );
          }
        }
      } catch {
        // ignore
      }
    });

    return responseData;
  } catch {
    return {
      success: false,
      error: "Database Error: Failed to submit doubt or notify solvers. Please try again later.",
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const user = await getAuthenticatedUser(req);
    const body = await req.json();
    const result = (await createDoubt(body, user.id)) as Record<string, unknown>;

    if (result.success) {
      return NextResponse.json({ success: true, data: result }, { status: 201 });
    }

    const response: Record<string, unknown> = {
      success: false,
      error: result.error,
      message: result.message || result.error,
    };
    if (result.fieldErrors) response.fieldErrors = result.fieldErrors;
    if (result.validationDetails) response.validationDetails = result.validationDetails;
    if (result.quotaDetails) response.quotaDetails = result.quotaDetails;
    return NextResponse.json(response, { status: 400 });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ success: false, message: "Server error", error: message }, { status: 500 });
  }
}
