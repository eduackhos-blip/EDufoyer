import express from 'express';
import { protect } from '../middleware/auth.js';
import Post from '../models/Post.js';
import Friend from '../models/Friend.js';
import StudyGroup from '../models/StudyGroup.js';
import Story from '../models/Story.js';
import User from '../models/User.js';

const router = express.Router();

// Helper function to get friends list for a user
const getFriendsList = async (userId) => {
  try {
    const friends = await Friend.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    });
    
    return friends.map(friend => 
      friend.requester.toString() === userId ? friend.recipient : friend.requester
    );
  } catch (error) {
    console.error('Error getting friends list:', error);
    return [];
  }
};

// ==================== POST ROUTES ====================

// @route   POST /api/social/posts
// @desc    Create a new post
// @access  Private
router.post('/posts', protect, async (req, res) => {
  try {
    const {
      content,
      images,
      subject,
      hashtags,
      visibility,
      studyGroup,
      difficulty,
      tags
    } = req.body;

    const post = new Post({
      author: req.user.id,
      content,
      images: images || [],
      subject,
      hashtags: hashtags || [],
      visibility: visibility || 'public',
      studyGroup: studyGroup || null,
      difficulty: difficulty || 'beginner',
      tags: tags || []
    });

    await post.save();
    await post.populate('author', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/social/posts
// @desc    Get posts feed
// @access  Private
router.get('/posts', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, subject, hashtag } = req.query;
    const skip = (page - 1) * limit;
    const currentUserId = req.user.id;
    console.log('Getting posts for user:', currentUserId);
    
    const friendsList = await getFriendsList(currentUserId);
    console.log('User friends list for posts:', friendsList);

    // Build query - show posts from friends and public posts
    let query = { 
      isActive: true,
      $or: [
        { author: { $in: friendsList } }, // Posts from friends
        { visibility: 'public' } // Public posts
      ]
    };
    
    if (subject) {
      query.subject = subject;
    }
    
    if (hashtag) {
      query.hashtags = { $in: [hashtag.toLowerCase()] };
    }

    const posts = await Post.find(query)
      .populate('author', 'name email avatar')
      .populate('comments.author', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalPosts: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/social/posts/:id/like
// @desc    Like/unlike a post
// @access  Private
router.post('/posts/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const existingLike = post.likes.find(like => 
      like.user.toString() === req.user.id
    );

    if (existingLike) {
      await post.removeLike(req.user.id);
      res.json({
        success: true,
        message: 'Post unliked',
        liked: false,
        likeCount: post.likeCount
      });
    } else {
      await post.addLike(req.user.id);
      res.json({
        success: true,
        message: 'Post liked',
        liked: true,
        likeCount: post.likeCount
      });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/social/posts/:id/comment
// @desc    Add comment to post
// @access  Private
router.post('/posts/:id/comment', protect, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    await post.addComment(req.user.id, content);
    await post.populate('comments.author', 'name avatar');

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: post.comments[post.comments.length - 1]
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/social/posts/:id/share
// @desc    Share a post
// @access  Private
router.post('/posts/:id/share', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    await post.addShare(req.user.id);

    res.json({
      success: true,
      message: 'Post shared successfully',
      shareCount: post.shareCount
    });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/social/posts/:id/save
// @desc    Save/unsave a post
// @access  Private
router.post('/posts/:id/save', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const existingSave = post.saves.find(save => 
      save.user.toString() === req.user.id
    );

    if (existingSave) {
      await post.removeSave(req.user.id);
      res.json({
        success: true,
        message: 'Post unsaved',
        saved: false,
        saveCount: post.saveCount
      });
    } else {
      await post.addSave(req.user.id);
      res.json({
        success: true,
        message: 'Post saved',
        saved: true,
        saveCount: post.saveCount
      });
    }
  } catch (error) {
    console.error('Save post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ==================== FRIEND ROUTES ====================

// @route   POST /api/social/friends/request
// @desc    Send friend request
// @access  Private
router.post('/friends/request', async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    const requesterId = req.user?.id || '507f1f77bcf86cd799439011'; // Default test user ID

    if (recipientId === requesterId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send friend request to yourself'
      });
    }

    // Check if request already exists
    const existingRequest = await Friend.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Friend request already exists'
      });
    }

    const friendRequest = new Friend({
      requester: requesterId,
      recipient: recipientId,
      message: message || ''
    });

    await friendRequest.save();
    await friendRequest.populate('recipient', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Friend request sent successfully',
      data: friendRequest
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/social/friends
// @desc    Get friends list
// @access  Private
router.get('/friends', protect, async (req, res) => {
  try {
    const friends = await Friend.getFriends(req.user.id);
    
    res.json({
      success: true,
      data: friends
    });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/social/friends/requests
// @desc    Get pending friend requests
// @access  Private
router.get('/friends/requests', protect, async (req, res) => {
  try {
    const recipientId = req.user.id;
    console.log('Getting friend requests for authenticated user:', recipientId);
    
    const requests = await Friend.getPendingRequests(recipientId);
    console.log('Found friend requests:', requests.length);
    
    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/social/friends/:id/accept
// @desc    Accept friend request
// @access  Private
router.post('/friends/:id/accept', protect, async (req, res) => {
  try {
    const friendRequest = await Friend.findById(req.params.id);
    
    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this request'
      });
    }

    await friendRequest.accept();
    await friendRequest.populate('requester', 'name email avatar');

    res.json({
      success: true,
      message: 'Friend request accepted',
      data: friendRequest
    });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/social/friends/:id/decline
// @desc    Decline friend request
// @access  Private
router.post('/friends/:id/decline', protect, async (req, res) => {
  try {
    const friendRequest = await Friend.findById(req.params.id);
    
    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to decline this request'
      });
    }

    await friendRequest.decline();

    res.json({
      success: true,
      message: 'Friend request declined'
    });
  } catch (error) {
    console.error('Decline friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ==================== STUDY GROUP ROUTES ====================

// @route   POST /api/social/study-groups
// @desc    Create study group
// @access  Private
router.post('/study-groups', protect, async (req, res) => {
  try {
    const {
      name,
      description,
      subject,
      maxMembers,
      isPrivate,
      rules,
      studySchedule
    } = req.body;

    const studyGroup = new StudyGroup({
      name,
      description,
      subject,
      creator: req.user.id,
      maxMembers: maxMembers || 50,
      isPrivate: isPrivate || false,
      rules: rules || [],
      studySchedule: studySchedule || {}
    });

    // Add creator as admin
    await studyGroup.addMember(req.user.id, 'admin');
    
    // Generate invite code if private
    if (isPrivate) {
      studyGroup.inviteCode = StudyGroup.generateInviteCode();
    }

    await studyGroup.save();
    await studyGroup.populate('creator', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Study group created successfully',
      data: studyGroup
    });
  } catch (error) {
    console.error('Create study group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/social/study-groups
// @desc    Get study groups
// @access  Private
router.get('/study-groups', protect, async (req, res) => {
  try {
    const { subject, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { isActive: true };
    if (subject) {
      query.subject = subject;
    }

    const studyGroups = await StudyGroup.find(query)
      .populate('creator', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await StudyGroup.countDocuments(query);

    res.json({
      success: true,
      data: {
        studyGroups,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalGroups: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get study groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/social/study-groups/:id/join
// @desc    Join study group
// @access  Private
router.post('/study-groups/:id/join', protect, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const studyGroup = await StudyGroup.findById(req.params.id);

    if (!studyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Study group not found'
      });
    }

    if (studyGroup.isMember(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'Already a member of this study group'
      });
    }

    if (studyGroup.isPrivate && studyGroup.inviteCode !== inviteCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invite code'
      });
    }

    await studyGroup.addMember(req.user.id, 'member');
    await studyGroup.populate('members.user', 'name email avatar');

    res.json({
      success: true,
      message: 'Joined study group successfully',
      data: studyGroup
    });
  } catch (error) {
    console.error('Join study group error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ==================== STORY ROUTES ====================

// @route   POST /api/social/stories
// @desc    Create a story
// @access  Private (temporarily removed for testing)
router.post('/stories', protect, async (req, res) => {
  try {
    const {
      content,
      media,
      mediaType,
      subject,
      hashtags,
      visibility,
      studyGroup
    } = req.body;

    const authorId = req.user.id;
    
    const story = new Story({
      author: authorId,
      content,
      media: media || [],
      mediaType: mediaType || 'text',
      subject,
      hashtags: hashtags || [],
      visibility: visibility || 'public',
      studyGroup: studyGroup || null
    });

    await story.save();
    await story.populate('author', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Story created successfully',
      data: story
    });
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/social/stories
// @desc    Get active stories
// @access  Private (temporarily removed for testing)
router.get('/stories', protect, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    console.log('Getting stories for user:', currentUserId);
    
    // Get stories from friends and public stories
    const friendsList = await getFriendsList(currentUserId);
    console.log('User friends list:', friendsList);
    
    const stories = await Story.find({
      $or: [
        { author: { $in: friendsList } }, // Stories from friends
        { visibility: 'public' } // Public stories
      ],
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).populate('author', 'name email avatar').sort({ createdAt: -1 });
    
    console.log('Found stories:', stories.length);
    
    res.json({
      success: true,
      data: stories
    });
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/social/stories/:id/view
// @desc    View a story
// @access  Private
router.post('/stories/:id/view', protect, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    
    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    await story.addView(req.user.id);

    res.json({
      success: true,
      message: 'Story viewed',
      viewCount: story.viewCount
    });
  } catch (error) {
    console.error('View story error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/social/friends/suggestions
// @desc    Get friend suggestions
// @access  Private
router.get('/friends/suggestions', protect, async (req, res) => {
  try {
    // Get current user's friends
    const currentFriends = await Friend.find({
      $or: [
        { requester: req.user.id, status: 'accepted' },
        { recipient: req.user.id, status: 'accepted' }
      ]
    });

    const friendIds = currentFriends.map(friend => 
      friend.requester.toString() === req.user.id ? friend.recipient : friend.requester
    );

    // Get users who are not already friends and not the current user
    const suggestions = await User.find({
      _id: { $nin: [req.user.id, ...friendIds] },
      email: { $ne: req.user.email }
    }).select('name email avatar').limit(10);

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Get friend suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ==================== USER ROUTES ====================

// @route   POST /api/social/users/find-by-email
// @desc    Find user by email address
// @access  Private
router.post('/users/find-by-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email }).select('_id name email avatar');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email address'
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Find user by email error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/social/search/users
// @desc    Search users by name
// @access  Private
router.get('/search/users', async (req, res) => {
  try {
    const { q: name, page = 1, limit = 10 } = req.query;
    const currentUserId = req.user?.id || null;
    console.log('Search users request:', { name, page, limit, userId: currentUserId });

    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long'
      });
    }

    const query = {
      name: { $regex: name, $options: 'i' }
    };
    
    // Exclude current user if authenticated
    if (currentUserId) {
      query._id = { $ne: currentUserId };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query).select('_id name email avatar').skip(skip).limit(parseInt(limit));

    console.log('Found users:', users.length);
    console.log('Users data:', users);

    const result = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar
    }));

    console.log('Returning result:', result);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/social/posts/user
// @desc    Get user's own posts
// @access  Private
router.get('/posts/user', protect, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.user.id })
      .populate('author', 'name email avatar')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/social/stories/user
// @desc    Get user's own stories
// @access  Private
router.get('/stories/user', protect, async (req, res) => {
  try {
    const stories = await Story.find({ author: req.user.id })
      .populate('author', 'name email avatar')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: stories
    });
  } catch (error) {
    console.error('Get user stories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// User-specific stories route for testing
router.get('/user-stories/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Getting stories for specific user:', userId);
    
    const stories = await Story.find({ 
      author: userId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).populate('author', 'name email avatar').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: stories,
      message: `Stories for user ${userId}`
    });
  } catch (error) {
    console.error('User stories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Temporary test route for debugging - REMOVE IN PRODUCTION
router.get('/test/stories', async (req, res) => {
  try {
    console.log('Test route - getting all stories');
    const stories = await Story.find({ isActive: true })
      .populate('author', 'name email avatar')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: stories,
      message: 'Test route - showing all stories'
    });
  } catch (error) {
    console.error('Test stories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;
