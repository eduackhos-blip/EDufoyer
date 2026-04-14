// User-specific dashboard service
class UserDashboardService {
  constructor() {
    this.userProfiles = {
      // Student profiles with different specializations
      'student_cs': {
        name: 'Computer Science Student',
        specialization: 'Computer Science',
        interests: ['Programming', 'AI', 'Web Development', 'Data Science'],
        color: 'blue',
        dashboard: {
          featuredSubjects: ['Programming', 'Algorithms', 'Data Structures', 'Machine Learning'],
          studyGroups: ['CS Study Group', 'Programming Club', 'AI Enthusiasts'],
          recommendedContent: ['React Tutorials', 'Python Basics', 'Algorithm Problems']
        }
      },
      'student_math': {
        name: 'Mathematics Student',
        specialization: 'Mathematics',
        interests: ['Calculus', 'Linear Algebra', 'Statistics', 'Number Theory'],
        color: 'green',
        dashboard: {
          featuredSubjects: ['Calculus', 'Linear Algebra', 'Statistics', 'Discrete Math'],
          studyGroups: ['Math Study Group', 'Statistics Club', 'Calculus Help'],
          recommendedContent: ['Calculus Problems', 'Linear Algebra', 'Statistics Tutorials']
        }
      },
      'student_physics': {
        name: 'Physics Student',
        specialization: 'Physics',
        interests: ['Quantum Physics', 'Mechanics', 'Thermodynamics', 'Electromagnetism'],
        color: 'purple',
        dashboard: {
          featuredSubjects: ['Quantum Mechanics', 'Classical Mechanics', 'Thermodynamics', 'Electromagnetism'],
          studyGroups: ['Physics Study Group', 'Quantum Club', 'Mechanics Help'],
          recommendedContent: ['Physics Problems', 'Quantum Theory', 'Mechanics Tutorials']
        }
      },
      'student_biology': {
        name: 'Biology Student',
        specialization: 'Biology',
        interests: ['Molecular Biology', 'Genetics', 'Ecology', 'Biochemistry'],
        color: 'green',
        dashboard: {
          featuredSubjects: ['Molecular Biology', 'Genetics', 'Ecology', 'Biochemistry'],
          studyGroups: ['Biology Study Group', 'Genetics Club', 'Ecology Society'],
          recommendedContent: ['Biology Notes', 'Genetics Problems', 'Ecology Studies']
        }
      },
      'student_business': {
        name: 'Business Student',
        specialization: 'Business Administration',
        interests: ['Marketing', 'Finance', 'Management', 'Entrepreneurship'],
        color: 'orange',
        dashboard: {
          featuredSubjects: ['Marketing', 'Finance', 'Management', 'Entrepreneurship'],
          studyGroups: ['Business Club', 'Finance Society', 'Entrepreneurship Group'],
          recommendedContent: ['Business Cases', 'Finance Tutorials', 'Marketing Strategies']
        }
      }
    };
  }

  // Get user-specific dashboard data
  getUserDashboard(userId, userRole = 'student') {
    // Generate a consistent profile based on user ID
    const profileKeys = Object.keys(this.userProfiles);
    const profileIndex = userId.length % profileKeys.length;
    const selectedProfile = this.userProfiles[profileKeys[profileIndex]];
    
    return {
      user: {
        id: userId,
        name: selectedProfile.name,
        specialization: selectedProfile.specialization,
        interests: selectedProfile.interests,
        color: selectedProfile.color,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProfile.name)}&background=${selectedProfile.color}500&color=fff&size=120`
      },
      dashboard: selectedProfile.dashboard,
      personalizedContent: this.getPersonalizedContent(selectedProfile),
      studyRecommendations: this.getStudyRecommendations(selectedProfile),
      friendSuggestions: this.getFriendSuggestions(selectedProfile)
    };
  }

  // Get personalized content based on user profile
  getPersonalizedContent(profile) {
    const contentTemplates = {
      'Computer Science': [
        { type: 'post', title: 'React Hooks Tutorial', author: 'Tech Mentor', likes: 45, subject: 'Programming' },
        { type: 'post', title: 'Python Data Structures', author: 'Code Master', likes: 32, subject: 'Programming' },
        { type: 'story', title: 'Algorithm Problem Solving', author: 'Algo Expert', views: 128, subject: 'Algorithms' }
      ],
      'Mathematics': [
        { type: 'post', title: 'Calculus Integration Techniques', author: 'Math Professor', likes: 67, subject: 'Calculus' },
        { type: 'post', title: 'Linear Algebra Applications', author: 'Math Tutor', likes: 43, subject: 'Linear Algebra' },
        { type: 'story', title: 'Statistics Problem Walkthrough', author: 'Stats Expert', views: 89, subject: 'Statistics' }
      ],
      'Physics': [
        { type: 'post', title: 'Quantum Mechanics Basics', author: 'Physics Prof', likes: 78, subject: 'Quantum Physics' },
        { type: 'post', title: 'Classical Mechanics Problems', author: 'Physics Tutor', likes: 56, subject: 'Mechanics' },
        { type: 'story', title: 'Thermodynamics Experiments', author: 'Lab Assistant', views: 156, subject: 'Thermodynamics' }
      ],
      'Biology': [
        { type: 'post', title: 'Molecular Biology Techniques', author: 'Bio Researcher', likes: 89, subject: 'Molecular Biology' },
        { type: 'post', title: 'Genetics Problem Solving', author: 'Genetics Expert', likes: 54, subject: 'Genetics' },
        { type: 'story', title: 'Ecology Field Study', author: 'Ecology Student', views: 134, subject: 'Ecology' }
      ],
      'Business Administration': [
        { type: 'post', title: 'Marketing Strategies 2024', author: 'Marketing Pro', likes: 92, subject: 'Marketing' },
        { type: 'post', title: 'Financial Analysis Methods', author: 'Finance Expert', likes: 67, subject: 'Finance' },
        { type: 'story', title: 'Entrepreneurship Success Stories', author: 'Business Mentor', views: 203, subject: 'Entrepreneurship' }
      ]
    };

    return contentTemplates[profile.specialization] || contentTemplates['Computer Science'];
  }

  // Get study recommendations
  getStudyRecommendations(profile) {
    return [
      { title: `Advanced ${profile.specialization} Course`, difficulty: 'Intermediate', duration: '8 weeks' },
      { title: `${profile.specialization} Study Group`, difficulty: 'Beginner', duration: 'Ongoing' },
      { title: `${profile.specialization} Certification`, difficulty: 'Advanced', duration: '12 weeks' }
    ];
  }

  // Get friend suggestions based on interests
  getFriendSuggestions(profile) {
    const suggestions = [
      { name: `${profile.specialization} Study Buddy`, avatar: 'https://ui-avatars.com/api/?name=Study+Buddy&background=blue500&color=fff', mutual: 5 },
      { name: `${profile.specialization} Mentor`, avatar: 'https://ui-avatars.com/api/?name=Mentor&background=green500&color=fff', mutual: 3 },
      { name: `${profile.specialization} Classmate`, avatar: 'https://ui-avatars.com/api/?name=Classmate&background=purple500&color=fff', mutual: 8 }
    ];
    return suggestions;
  }

  // Get user-specific study groups
  getUserStudyGroups(profile) {
    return [
      { name: `${profile.specialization} Study Group`, members: 24, active: true, subject: profile.specialization },
      { name: `${profile.specialization} Problem Solving`, members: 18, active: true, subject: 'Problem Solving' },
      { name: `${profile.specialization} Exam Prep`, members: 31, active: false, subject: 'Exam Preparation' }
    ];
  }

  // Get user-specific notifications
  getUserNotifications(profile) {
    return [
      { type: 'study_reminder', message: `Don't forget your ${profile.specialization} study session!`, time: '2 hours ago' },
      { type: 'group_invite', message: `You've been invited to join ${profile.specialization} Study Group`, time: '1 day ago' },
      { type: 'achievement', message: `Congratulations! You've completed ${profile.specialization} Module 3`, time: '3 days ago' }
    ];
  }
}

export default new UserDashboardService();




