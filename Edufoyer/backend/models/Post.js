import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  images: [{
    type: String, // URL to uploaded image
    required: false
  }],
  subject: {
    type: String,
    required: true,
    enum: [
      'Mathematics', 'Physics', 'Chemistry', 'Biology', 
      'Computer Science', 'Engineering', 'Literature', 'History',
      'Computer Science', 'Data Science', 'Artificial Intelligence',
      'Business', 'Economics', 'Psychology', 'Sociology'
    ]
  },
  hashtags: [{
    type: String,
    lowercase: true
  }],
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  shares: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  saves: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    savedAt: {
      type: Date,
      default: Date.now
    }
  }],
  visibility: {
    type: String,
    enum: ['public', 'friends', 'study_group'],
    default: 'public'
  },
  studyGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: false
  },
  isEducational: {
    type: Boolean,
    default: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  tags: [{
    type: String,
    lowercase: true
  }],
  views: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ subject: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ 'likes.user': 1 });
postSchema.index({ visibility: 1, createdAt: -1 });

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for share count
postSchema.virtual('shareCount').get(function() {
  return this.shares.length;
});

// Virtual for save count
postSchema.virtual('saveCount').get(function() {
  return this.saves.length;
});

// Method to add like
postSchema.methods.addLike = function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());
  if (!existingLike) {
    this.likes.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove like
postSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  return this.save();
};

// Method to add comment
postSchema.methods.addComment = function(authorId, content) {
  this.comments.push({ author: authorId, content });
  return this.save();
};

// Method to add share
postSchema.methods.addShare = function(userId) {
  this.shares.push({ user: userId });
  return this.save();
};

// Method to add save
postSchema.methods.addSave = function(userId) {
  const existingSave = this.saves.find(save => save.user.toString() === userId.toString());
  if (!existingSave) {
    this.saves.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove save
postSchema.methods.removeSave = function(userId) {
  this.saves = this.saves.filter(save => save.user.toString() !== userId.toString());
  return this.save();
};

const Post = mongoose.model('Post', postSchema);

export default Post;




