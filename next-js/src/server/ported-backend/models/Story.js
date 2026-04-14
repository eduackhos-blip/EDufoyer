import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    maxlength: 1000
  },
  media: [{
    type: String, // URL to uploaded media (image/video)
    required: false
  }],
  mediaType: {
    type: String,
    enum: ['image', 'video', 'text'],
    default: 'text'
  },
  subject: {
    type: String,
    required: true,
    enum: [
      'Mathematics', 'Physics', 'Chemistry', 'Biology', 
      'Computer Science', 'Engineering', 'Literature', 'History',
      'Data Science', 'Artificial Intelligence', 'Business', 
      'Economics', 'Psychology', 'Sociology'
    ]
  },
  hashtags: [{
    type: String,
    lowercase: true
  }],
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['like', 'love', 'wow', 'haha', 'sad', 'angry'],
      default: 'like'
    },
    reactedAt: {
      type: Date,
      default: Date.now
    }
  }],
  replies: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 200
    },
    createdAt: {
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
  isHighlight: {
    type: Boolean,
    default: false
  },
  highlightTitle: {
    type: String,
    maxlength: 50
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
storySchema.index({ author: 1, createdAt: -1 });
storySchema.index({ subject: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
storySchema.index({ 'views.user': 1 });
storySchema.index({ hashtags: 1 });

// Virtual for view count
storySchema.virtual('viewCount').get(function() {
  return this.views.length;
});

// Virtual for reaction count
storySchema.virtual('reactionCount').get(function() {
  return this.reactions.length;
});

// Virtual for reply count
storySchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

// Method to add view
storySchema.methods.addView = function(userId) {
  const existingView = this.views.find(view => 
    view.user.toString() === userId.toString()
  );
  
  if (!existingView) {
    this.views.push({ user: userId });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to add reaction
storySchema.methods.addReaction = function(userId, reactionType = 'like') {
  const existingReaction = this.reactions.find(reaction => 
    reaction.user.toString() === userId.toString()
  );
  
  if (existingReaction) {
    existingReaction.type = reactionType;
  } else {
    this.reactions.push({ user: userId, type: reactionType });
  }
  
  return this.save();
};

// Method to remove reaction
storySchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(reaction => 
    reaction.user.toString() !== userId.toString()
  );
  return this.save();
};

// Method to add reply
storySchema.methods.addReply = function(authorId, content) {
  this.replies.push({ author: authorId, content });
  return this.save();
};

// Method to highlight story
storySchema.methods.highlight = function(title) {
  this.isHighlight = true;
  this.highlightTitle = title;
  return this.save();
};

// Method to remove highlight
storySchema.methods.removeHighlight = function() {
  this.isHighlight = false;
  this.highlightTitle = undefined;
  return this.save();
};

// Static method to get active stories
storySchema.statics.getActiveStories = function() {
  return this.find({
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).populate('author', 'name email avatar');
};

// Static method to get user's highlights
storySchema.statics.getUserHighlights = function(userId) {
  return this.find({
    author: userId,
    isHighlight: true,
    isActive: true
  }).populate('author', 'name email avatar');
};

const Story = mongoose.model('Story', storySchema);

export default Story;




