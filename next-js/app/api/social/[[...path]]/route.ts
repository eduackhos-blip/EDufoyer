import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/src/lib/db";
import { getAuthenticatedUser } from "@/src/utils/server/currentUser";
import { authErrorResponse } from "@/src/utils/server/errorResponse";
import Post from "@/src/models/Post";
import Friend from "@/src/models/Friend";
import StudyGroup from "@/src/models/StudyGroup";
import Story from "@/src/models/Story";
import User from "@/src/models/User";

export const runtime = "nodejs";

type Ctx = {
  params: Promise<{ path?: string[] }> | { path?: string[] };
};

const json = (body: unknown, status = 200) => NextResponse.json(body, { status });
const getPath = async (ctx: Ctx) => (await Promise.resolve(ctx.params)).path ?? [];

const getFriendsList = async (userId: string) => {
  const friends = await Friend.find({
    $or: [
      { requester: userId, status: "accepted" },
      { recipient: userId, status: "accepted" },
    ],
  });
  return friends.map((friend) => (String(friend.requester) === String(userId) ? friend.recipient : friend.requester));
};

const FriendModel = Friend as unknown as {
  getFriends: (userId: string) => Promise<unknown>;
  getPendingRequests: (userId: string) => Promise<unknown>;
};

const run = async (req: NextRequest, ctx: Ctx) => {
  try {
    await connectDb();
    const path = await getPath(ctx);
    const key = path.join("/");
    const method = req.method.toUpperCase();

    if (method === "POST" && key === "users/find-by-email") {
      const { email } = await req.json();
      if (!email) return json({ success: false, message: "Email is required" }, 400);
      const user = await User.findOne({ email }).select("_id name email avatar");
      if (!user) return json({ success: false, message: "User not found with this email address" }, 404);
      const userData = user as unknown as { _id: unknown; name?: string; email?: string; avatar?: string };
      return json({ success: true, data: { id: userData._id, name: userData.name, email: userData.email, avatar: userData.avatar } });
    }

    if (method === "GET" && key === "search/users") {
      const name = req.nextUrl.searchParams.get("q");
      if (!name || name.trim().length < 2) return json({ success: false, message: "Name must be at least 2 characters long" }, 400);
      let currentUserId: string | null = null;
      try {
        const user = await getAuthenticatedUser(req);
        currentUserId = String(user._id);
      } catch {
        currentUserId = null;
      }
      const page = Number(req.nextUrl.searchParams.get("page") || "1");
      const limit = Number(req.nextUrl.searchParams.get("limit") || "10");
      const query: Record<string, unknown> = { name: { $regex: name, $options: "i" } };
      if (currentUserId) query._id = { $ne: currentUserId };
      const users = await User.find(query).select("_id name email avatar").skip((page - 1) * limit).limit(limit);
      return json({
        success: true,
        data: users.map((u) => {
          const userData = u as unknown as { _id: unknown; name?: string; email?: string; avatar?: string };
          return { id: userData._id, name: userData.name, email: userData.email, avatar: userData.avatar };
        }),
      });
    }

    if (method === "GET" && key === "search/posts") {
      const queryText = req.nextUrl.searchParams.get("q");
      if (!queryText || queryText.trim().length < 2) {
        return json({ success: false, message: "Search query must be at least 2 characters long" }, 400);
      }
      const page = Number(req.nextUrl.searchParams.get("page") || "1");
      const limit = Number(req.nextUrl.searchParams.get("limit") || "10");
      const skip = (page - 1) * limit;
      const normalizedQuery = queryText.trim();

      const posts = await Post.find({
        isActive: true,
        $or: [
          { content: { $regex: normalizedQuery, $options: "i" } },
          { hashtags: { $in: [normalizedQuery.toLowerCase()] } },
          { subject: { $regex: normalizedQuery, $options: "i" } },
        ],
      })
        .populate("author", "name email avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Post.countDocuments({
        isActive: true,
        $or: [
          { content: { $regex: normalizedQuery, $options: "i" } },
          { hashtags: { $in: [normalizedQuery.toLowerCase()] } },
          { subject: { $regex: normalizedQuery, $options: "i" } },
        ],
      });

      return json({
        success: true,
        data: {
          posts,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalPosts: total,
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1,
          },
        },
      });
    }

    if (method === "GET" && key === "test/stories") {
      const stories = await Story.find({ isActive: true }).populate("author", "name email avatar").sort({ createdAt: -1 });
      return json({ success: true, data: stories, message: "Test route - showing all stories" });
    }

    if (method === "GET" && path[0] === "user-stories" && path[1]) {
      const stories = await Story.find({ author: path[1], isActive: true, expiresAt: { $gt: new Date() } })
        .populate("author", "name email avatar")
        .sort({ createdAt: -1 });
      return json({ success: true, data: stories, message: `Stories for user ${path[1]}` });
    }

    const user = await getAuthenticatedUser(req);
    const userId = String(user.id);

    if (method === "POST" && key === "posts") {
      const body = await req.json();
      const post = new Post({
        author: userId,
        content: body.content,
        images: body.images || [],
        subject: body.subject,
        hashtags: body.hashtags || [],
        visibility: body.visibility || "public",
        studyGroup: body.studyGroup || null,
        difficulty: body.difficulty || "beginner",
        tags: body.tags || [],
      });
      await post.save();
      await post.populate("author", "name email avatar");
      return json({ success: true, message: "Post created successfully", data: post }, 201);
    }

    if (method === "GET" && key === "posts") {
      const page = Number(req.nextUrl.searchParams.get("page") || "1");
      const limit = Number(req.nextUrl.searchParams.get("limit") || "10");
      const subject = req.nextUrl.searchParams.get("subject");
      const hashtag = req.nextUrl.searchParams.get("hashtag");
      const skip = (page - 1) * limit;
      const friendsList = await getFriendsList(userId);
      const query: Record<string, unknown> = {
        isActive: true,
        $or: [{ author: { $in: friendsList } }, { visibility: "public" }],
      };
      if (subject) query.subject = subject;
      if (hashtag) query.hashtags = { $in: [hashtag.toLowerCase()] };
      const posts = await Post.find(query)
        .populate("author", "name email avatar")
        .populate("comments.author", "name avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      const total = await Post.countDocuments(query);
      return json({
        success: true,
        data: {
          posts,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalPosts: total,
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1,
          },
        },
      });
    }

    if (method === "POST" && path[0] === "posts" && path[1] && path[2] === "like") {
      const post = await Post.findById(path[1]);
      if (!post) return json({ success: false, message: "Post not found" }, 404);
      const existingLike = (post.likes as Array<{ user?: { toString: () => string } | null }>).find(
        (like) => like.user?.toString() === userId
      );
      if (existingLike) {
        await (post as unknown as { removeLike: (id: string) => Promise<unknown> }).removeLike(userId);
        return json({ success: true, message: "Post unliked", liked: false, likeCount: post.likes.length });
      }
      await (post as unknown as { addLike: (id: string) => Promise<unknown> }).addLike(userId);
      return json({ success: true, message: "Post liked", liked: true, likeCount: post.likes.length });
    }

    if (method === "POST" && path[0] === "posts" && path[1] && path[2] === "comment") {
      const { content } = await req.json();
      if (!content || !String(content).trim()) return json({ success: false, message: "Comment content is required" }, 400);
      const post = await Post.findById(path[1]);
      if (!post) return json({ success: false, message: "Post not found" }, 404);
      await (post as unknown as { addComment: (authorId: string, content: string) => Promise<unknown> }).addComment(userId, content);
      await post.populate("comments.author", "name avatar");
      return json({ success: true, message: "Comment added successfully", data: post.comments[post.comments.length - 1] });
    }

    if (method === "POST" && path[0] === "posts" && path[1] && path[2] === "share") {
      const post = await Post.findById(path[1]);
      if (!post) return json({ success: false, message: "Post not found" }, 404);
      await (post as unknown as { addShare: (id: string) => Promise<unknown> }).addShare(userId);
      return json({ success: true, message: "Post shared successfully", shareCount: post.shares.length });
    }

    if (method === "POST" && path[0] === "posts" && path[1] && path[2] === "save") {
      const post = await Post.findById(path[1]);
      if (!post) return json({ success: false, message: "Post not found" }, 404);
      const existingSave = (post.saves as Array<{ user?: { toString: () => string } | null }>).find(
        (s) => s.user?.toString() === userId
      );
      if (existingSave) {
        await (post as unknown as { removeSave: (id: string) => Promise<unknown> }).removeSave(userId);
        return json({ success: true, message: "Post unsaved", saved: false, saveCount: post.saves.length });
      }
      await (post as unknown as { addSave: (id: string) => Promise<unknown> }).addSave(userId);
      return json({ success: true, message: "Post saved", saved: true, saveCount: post.saves.length });
    }

    if (method === "POST" && key === "friends/request") {
      const { recipientId, message } = await req.json();
      if (recipientId === userId) return json({ success: false, message: "Cannot send friend request to yourself" }, 400);
      const existingRequest = await Friend.findOne({ $or: [{ requester: userId, recipient: recipientId }, { requester: recipientId, recipient: userId }] });
      if (existingRequest) return json({ success: false, message: "Friend request already exists" }, 400);
      const requestDoc = new Friend({ requester: userId, recipient: recipientId, message: message || "" });
      await requestDoc.save();
      await requestDoc.populate("recipient", "name email avatar");
      return json({ success: true, message: "Friend request sent successfully", data: requestDoc }, 201);
    }

    if (method === "GET" && key === "friends") {
      const friends = await FriendModel.getFriends(userId);
      return json({ success: true, data: friends });
    }

    if (method === "GET" && key === "friends/requests") {
      const requests = await FriendModel.getPendingRequests(userId);
      return json({ success: true, data: requests });
    }

    if (method === "POST" && path[0] === "friends" && path[1] && path[2] === "accept") {
      const friendRequest = await Friend.findById(path[1]);
      if (!friendRequest) return json({ success: false, message: "Friend request not found" }, 404);
      if (String(friendRequest.recipient) !== userId) return json({ success: false, message: "Not authorized to accept this request" }, 403);
      await (friendRequest as unknown as { accept: () => Promise<unknown> }).accept();
      await friendRequest.populate("requester", "name email avatar");
      return json({ success: true, message: "Friend request accepted", data: friendRequest });
    }

    if (method === "POST" && path[0] === "friends" && path[1] && path[2] === "decline") {
      const friendRequest = await Friend.findById(path[1]);
      if (!friendRequest) return json({ success: false, message: "Friend request not found" }, 404);
      if (String(friendRequest.recipient) !== userId) return json({ success: false, message: "Not authorized to decline this request" }, 403);
      await (friendRequest as unknown as { decline: () => Promise<unknown> }).decline();
      return json({ success: true, message: "Friend request declined" });
    }

    if (method === "POST" && key === "study-groups") {
      const body = await req.json();
      const group = new StudyGroup({
        name: body.name,
        description: body.description,
        subject: body.subject,
        creator: userId,
        maxMembers: body.maxMembers || 50,
        isPrivate: body.isPrivate || false,
        rules: body.rules || [],
        studySchedule: body.studySchedule || {},
      });
      await (group as unknown as { addMember: (id: string, role: string) => Promise<unknown> }).addMember(userId, "admin");
      if (body.isPrivate) {
        (group as unknown as { inviteCode?: string }).inviteCode = (
          StudyGroup as unknown as { generateInviteCode: () => string }
        ).generateInviteCode();
      }
      await group.save();
      await group.populate("creator", "name email avatar");
      return json({ success: true, message: "Study group created successfully", data: group }, 201);
    }

    if (method === "GET" && key === "study-groups") {
      const subject = req.nextUrl.searchParams.get("subject");
      const page = Number(req.nextUrl.searchParams.get("page") || "1");
      const limit = Number(req.nextUrl.searchParams.get("limit") || "10");
      const query: Record<string, unknown> = { isActive: true };
      if (subject) query.subject = subject;
      const groups = await StudyGroup.find(query)
        .populate("creator", "name email avatar")
        .populate("members.user", "name email avatar")
        .sort({ lastActivity: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      const total = await StudyGroup.countDocuments(query);
      return json({
        success: true,
        data: {
          studyGroups: groups,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalGroups: total,
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1,
          },
        },
      });
    }

    if (method === "POST" && path[0] === "study-groups" && path[1] && path[2] === "join") {
      const { inviteCode } = await req.json();
      const group = await StudyGroup.findById(path[1]);
      if (!group) return json({ success: false, message: "Study group not found" }, 404);
      if ((group as unknown as { isMember: (id: string) => boolean }).isMember(userId)) {
        return json({ success: false, message: "Already a member of this study group" }, 400);
      }
      if (group.isPrivate && group.inviteCode !== inviteCode) return json({ success: false, message: "Invalid invite code" }, 400);
      await (group as unknown as { addMember: (id: string, role: string) => Promise<unknown> }).addMember(userId, "member");
      await group.populate("members.user", "name email avatar");
      return json({ success: true, message: "Joined study group successfully", data: group });
    }

    if (method === "POST" && key === "stories") {
      const body = await req.json();
      const story = new Story({
        author: userId,
        content: body.content,
        media: body.media || [],
        mediaType: body.mediaType || "text",
        subject: body.subject,
        hashtags: body.hashtags || [],
        visibility: body.visibility || "public",
        studyGroup: body.studyGroup || null,
      });
      await story.save();
      await story.populate("author", "name email avatar");
      return json({ success: true, message: "Story created successfully", data: story }, 201);
    }

    if (method === "GET" && key === "stories") {
      const friendsList = await getFriendsList(userId);
      const stories = await Story.find({
        $or: [{ author: { $in: friendsList } }, { visibility: "public" }],
        isActive: true,
        expiresAt: { $gt: new Date() },
      })
        .populate("author", "name email avatar")
        .sort({ createdAt: -1 });
      return json({ success: true, data: stories });
    }

    if (method === "POST" && path[0] === "stories" && path[1] && path[2] === "view") {
      const story = await Story.findById(path[1]);
      if (!story) return json({ success: false, message: "Story not found" }, 404);
      await (story as unknown as { addView: (id: string) => Promise<unknown> }).addView(userId);
      return json({ success: true, message: "Story viewed", viewCount: story.views.length });
    }

    if (method === "GET" && key === "friends/suggestions") {
      const currentFriends = await Friend.find({
        $or: [
          { requester: userId, status: "accepted" },
          { recipient: userId, status: "accepted" },
        ],
      });
      const friendIds = currentFriends.map((f) => (String(f.requester) === userId ? f.recipient : f.requester));
      const suggestions = await User.find({ _id: { $nin: [userId, ...friendIds] }, email: { $ne: user.email } }).select("name email avatar").limit(10);
      return json({ success: true, data: suggestions });
    }

    if (method === "GET" && key === "posts/user") {
      const posts = await Post.find({ author: userId }).populate("author", "name email avatar").sort({ createdAt: -1 });
      return json({ success: true, data: posts });
    }

    if (method === "GET" && key === "stories/user") {
      const stories = await Story.find({ author: userId }).populate("author", "name email avatar").sort({ createdAt: -1 });
      return json({ success: true, data: stories });
    }

    return json({ success: false, message: "Not found" }, 404);
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return authRes;
    const message = error instanceof Error ? error.message : "Server error";
    return json({ success: false, message: "Server error", error: message }, 500);
  }
};

export const GET = run;
export const POST = run;
export const PUT = run;
export const PATCH = run;
export const DELETE = run;
export const OPTIONS = run;
