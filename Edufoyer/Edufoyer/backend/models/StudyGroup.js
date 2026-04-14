import mongoose from 'mongoose';

const studyGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
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
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxMembers: {
    type: Number,
    default: 50,
    max: 100
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  inviteCode: {
    type: String,
    unique: true,
    sparse: true
  },
  tags: [{
    type: String,
    lowercase: true
  }],
  rules: [{
    type: String,
    maxlength: 200
  }],
  studySchedule: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'bi-weekly', 'monthly'],
      default: 'weekly'
    },
    days: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    time: {
      type: String // e.g., "19:00"
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
studyGroupSchema.index({ subject: 1, isActive: 1 });
studyGroupSchema.index({ 'members.user': 1 });
studyGroupSchema.index({ creator: 1 });
studyGroupSchema.index({ inviteCode: 1 });
studyGroupSchema.index({ tags: 1 });

// Virtual for member count
studyGroupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Virtual for post count
studyGroupSchema.virtual('postCount').get(function() {
  return this.posts.length;
});

// Method to add member
studyGroupSchema.methods.addMember = function(userId, role = 'member', invitedBy = null) {
  const existingMember = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  
  if (!existingMember && this.members.length < this.maxMembers) {
    this.members.push({
      user: userId,
      role: role,
      invitedBy: invitedBy
    });
    
    if (role === 'admin') {
      this.admins.push(userId);
    } else if (role === 'moderator') {
      this.moderators.push(userId);
    }
    
    this.lastActivity = new Date();
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to remove member
studyGroupSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => 
    member.user.toString() !== userId.toString()
  );
  
  this.admins = this.admins.filter(admin => 
    admin.toString() !== userId.toString()
  );
  
  this.moderators = this.moderators.filter(moderator => 
    moderator.toString() !== userId.toString()
  );
  
  this.lastActivity = new Date();
  return this.save();
};

// Method to update member role
studyGroupSchema.methods.updateMemberRole = function(userId, newRole) {
  const member = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  
  if (member) {
    const oldRole = member.role;
    member.role = newRole;
    
    // Update role arrays
    if (oldRole === 'admin') {
      this.admins = this.admins.filter(admin => 
        admin.toString() !== userId.toString()
      );
    } else if (oldRole === 'moderator') {
      this.moderators = this.moderators.filter(moderator => 
        moderator.toString() !== userId.toString()
      );
    }
    
    if (newRole === 'admin') {
      this.admins.push(userId);
    } else if (newRole === 'moderator') {
      this.moderators.push(userId);
    }
    
    this.lastActivity = new Date();
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to check if user is member
studyGroupSchema.methods.isMember = function(userId) {
  return this.members.some(member => 
    member.user.toString() === userId.toString()
  );
};

// Method to check if user is admin
studyGroupSchema.methods.isAdmin = function(userId) {
  return this.admins.some(admin => 
    admin.toString() === userId.toString()
  );
};

// Method to check if user is moderator
studyGroupSchema.methods.isModerator = function(userId) {
  return this.moderators.some(moderator => 
    moderator.toString() === userId.toString()
  );
};

// Method to check if user can moderate
studyGroupSchema.methods.canModerate = function(userId) {
  return this.isAdmin(userId) || this.isModerator(userId);
};

// Static method to generate invite code
studyGroupSchema.statics.generateInviteCode = function() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const StudyGroup = mongoose.model('StudyGroup', studyGroupSchema);

export default StudyGroup;




