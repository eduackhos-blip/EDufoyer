import { NextResponse } from "next/server";
import { connectDb } from "@/src/server/db";
import User from "@/src/server/ported-backend/models/User.js";
import Doubt from "@/src/server/ported-backend/models/Doubt.js";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDb();

    const kiitUsers = await User.find({
      email: { $regex: /@kiit\.ac\.in$/i },
      emailVerified: true,
      isActive: true,
    })
      .select("_id email name createdAt lastLogin")
      .lean()
      .sort({ createdAt: -1 });

    const usersWithStats = await Promise.all(
      kiitUsers.map(async (user) => {
        const doubtCount = await Doubt.countDocuments({ doubter_id: user._id });
        const allDoubts = await Doubt.find({ doubter_id: user._id }).select("category").lean();

        const totalCategoryCounts = {
          small: allDoubts.filter((d) => d.category === "small").length,
          medium: allDoubts.filter((d) => d.category === "medium").length,
          large: allDoubts.filter((d) => d.category === "large").length,
        };

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const todayDoubts = await Doubt.find({
          doubter_id: user._id,
          createdAt: { $gte: todayStart, $lte: todayEnd },
        })
          .select("category")
          .lean();

        const todayCategoryCounts = {
          small: todayDoubts.filter((d) => d.category === "small").length,
          medium: todayDoubts.filter((d) => d.category === "medium").length,
          large: todayDoubts.filter((d) => d.category === "large").length,
        };

        const lastDoubt = await Doubt.findOne({ doubter_id: user._id }).select("createdAt").sort({ createdAt: -1 }).lean();
        const now = new Date();
        let lastActive = "Never";

        const getAgo = (date: Date) => {
          const diffMs = now.getTime() - date.getTime();
          const diffMinutes = Math.floor(diffMs / (1000 * 60));
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffDays = Math.floor(diffHours / 24);
          if (diffMinutes < 1) return "Just now";
          if (diffMinutes < 60) return `${diffMinutes}m ago`;
          if (diffHours < 24) return `${diffHours}h ago`;
          if (diffDays === 1) return "1d ago";
          return `${diffDays}d ago`;
        };

        if (lastDoubt?.createdAt) {
          lastActive = getAgo(new Date(lastDoubt.createdAt));
        } else if (user.lastLogin) {
          lastActive = getAgo(new Date(user.lastLogin));
        } else if (user.createdAt) {
          const createdDate = new Date(user.createdAt);
          const diffInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          if (diffInDays === 0) lastActive = "Today";
          else if (diffInDays === 1) lastActive = "1d ago";
          else if (diffInDays < 7) lastActive = `${diffInDays}d ago`;
          else if (diffInDays < 30) lastActive = `${Math.floor(diffInDays / 7)}w ago`;
          else lastActive = `${Math.floor(diffInDays / 30)}mo ago`;
        }

        return {
          id: user._id,
          email: user.email,
          name: user.name || user.email.split("@")[0],
          doubts: doubtCount,
          totalCategoryCounts,
          lastActive,
          registeredAt: user.createdAt,
          todayDoubtCounts: todayCategoryCounts,
          todayTotal: todayCategoryCounts.small + todayCategoryCounts.medium + todayCategoryCounts.large,
        };
      })
    );

    usersWithStats.sort((a, b) => b.doubts - a.doubts);

    return NextResponse.json(
      {
        success: true,
        data: {
          users: usersWithStats,
          totalUsers: usersWithStats.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get KIIT users";
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get KIIT users",
        error: message,
      },
      { status: 500 }
    );
  }
}
