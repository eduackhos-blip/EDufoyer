import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Eye, 
  EyeOff, 
  Globe, 
  Lock, 
  Mail, 
  Phone, 
  Camera, 
  Save, 
  X, 
  Check, 
  AlertCircle, 
  Info, 
  Loader2,
  Download,
  Upload,
  Trash2,
  Key,
  Database,
  Palette,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const settingsTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'data', label: 'Data', icon: Database }
  ];

  const [settings, setSettings] = useState({
    profile: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      bio: 'Passionate about mathematics and computer science.',
      location: 'New York, NY',
      website: 'https://johndoe.dev',
      phone: '+1 (555) 123-4567',
      isPublic: true
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false,
      showLocation: true,
      allowFriendRequests: true,
      allowGroupInvites: true,
      showOnlineStatus: true,
      allowMessages: 'friends'
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      friendRequests: true,
      groupInvites: true,
      postLikes: true,
      postComments: true,
      postShares: true,
      mentions: true,
      studyReminders: true,
      weeklyDigest: true
    },
    appearance: {
      theme: 'light',
      language: 'en',
      fontSize: 'medium',
      compactMode: false
    },
    security: {
      twoFactorAuth: false,
      loginAlerts: true,
      sessionTimeout: 30,
      requirePasswordChange: false
    }
  });

  const handleSaveSettings = async (category) => {
    try {
      setIsLoading(true);
      // This would be an API call to save settings
      // await settingsService.updateSettings(category, settings[category]);
      alert(`${category} settings saved successfully!`);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      // This would be an API call to change password
      // await authService.changePassword(passwordForm);
      alert('Password changed successfully!');
      setShowPasswordForm(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsLoading(true);
      // This would be an API call to delete account
      // await authService.deleteAccount();
      alert('Account deleted successfully');
      // Redirect to login
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      // This would be an API call to export user data
      alert('Data export started. You will receive an email when ready.');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={settings.profile.name}
              onChange={(e) => setSettings({
                ...settings,
                profile: { ...settings.profile, name: e.target.value }
              })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={settings.profile.email}
              onChange={(e) => setSettings({
                ...settings,
                profile: { ...settings.profile, email: e.target.value }
              })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              value={settings.profile.location}
              onChange={(e) => setSettings({
                ...settings,
                profile: { ...settings.profile, location: e.target.value }
              })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={settings.profile.phone}
              onChange={(e) => setSettings({
                ...settings,
                profile: { ...settings.profile, phone: e.target.value }
              })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
          <textarea
            value={settings.profile.bio}
            onChange={(e) => setSettings({
              ...settings,
              profile: { ...settings.profile, bio: e.target.value }
            })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
          <input
            type="url"
            value={settings.profile.website}
            onChange={(e) => setSettings({
              ...settings,
              profile: { ...settings.profile, website: e.target.value }
            })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.profile.isPublic}
              onChange={(e) => setSettings({
                ...settings,
                profile: { ...settings.profile, isPublic: e.target.checked }
              })}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Make profile public</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderPrivacySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Visibility</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Who can see your profile?</label>
            <select
              value={settings.privacy.profileVisibility}
              onChange={(e) => setSettings({
                ...settings,
                privacy: { ...settings.privacy, profileVisibility: e.target.value }
              })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="public">Everyone</option>
              <option value="friends">Friends only</option>
              <option value="private">Private</option>
            </select>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Contact Information</h4>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.privacy.showEmail}
                onChange={(e) => setSettings({
                  ...settings,
                  privacy: { ...settings.privacy, showEmail: e.target.checked }
                })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Show email address</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.privacy.showPhone}
                onChange={(e) => setSettings({
                  ...settings,
                  privacy: { ...settings.privacy, showPhone: e.target.checked }
                })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Show phone number</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.privacy.showLocation}
                onChange={(e) => setSettings({
                  ...settings,
                  privacy: { ...settings.privacy, showLocation: e.target.checked }
                })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Show location</span>
            </label>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Social Settings</h4>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.privacy.allowFriendRequests}
                onChange={(e) => setSettings({
                  ...settings,
                  privacy: { ...settings.privacy, allowFriendRequests: e.target.checked }
                })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Allow friend requests</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.privacy.allowGroupInvites}
                onChange={(e) => setSettings({
                  ...settings,
                  privacy: { ...settings.privacy, allowGroupInvites: e.target.checked }
                })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Allow study group invites</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.privacy.showOnlineStatus}
                onChange={(e) => setSettings({
                  ...settings,
                  privacy: { ...settings.privacy, showOnlineStatus: e.target.checked }
                })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Show online status</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Who can message you?</label>
            <select
              value={settings.privacy.allowMessages}
              onChange={(e) => setSettings({
                ...settings,
                privacy: { ...settings.privacy, allowMessages: e.target.value }
              })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="everyone">Everyone</option>
              <option value="friends">Friends only</option>
              <option value="none">No one</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">General Notifications</h4>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications.emailNotifications}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, emailNotifications: e.target.checked }
                })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Email notifications</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications.pushNotifications}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, pushNotifications: e.target.checked }
                })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Push notifications</span>
            </label>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Social Notifications</h4>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications.friendRequests}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, friendRequests: e.target.checked }
                })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Friend requests</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications.groupInvites}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, groupInvites: e.target.checked }
                })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Study group invites</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications.mentions}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, mentions: e.target.checked }
                })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Mentions</span>
            </label>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Post Notifications</h4>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications.postLikes}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, postLikes: e.target.checked }
                })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Post likes</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications.postComments}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, postComments: e.target.checked }
                })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Post comments</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications.postShares}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, postShares: e.target.checked }
                })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Post shares</span>
            </label>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Study Notifications</h4>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications.studyReminders}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, studyReminders: e.target.checked }
                })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Study reminders</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications.weeklyDigest}
                onChange={(e) => setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, weeklyDigest: e.target.checked }
                })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Weekly digest</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Appearance Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={settings.appearance.theme === 'light'}
                  onChange={(e) => setSettings({
                    ...settings,
                    appearance: { ...settings.appearance, theme: e.target.value }
                  })}
                  className="mr-2"
                />
                <Sun className="w-4 h-4 mr-1" />
                <span className="text-sm">Light</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={settings.appearance.theme === 'dark'}
                  onChange={(e) => setSettings({
                    ...settings,
                    appearance: { ...settings.appearance, theme: e.target.value }
                  })}
                  className="mr-2"
                />
                <Moon className="w-4 h-4 mr-1" />
                <span className="text-sm">Dark</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="theme"
                  value="auto"
                  checked={settings.appearance.theme === 'auto'}
                  onChange={(e) => setSettings({
                    ...settings,
                    appearance: { ...settings.appearance, theme: e.target.value }
                  })}
                  className="mr-2"
                />
                <Monitor className="w-4 h-4 mr-1" />
                <span className="text-sm">Auto</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select
              value={settings.appearance.language}
              onChange={(e) => setSettings({
                ...settings,
                appearance: { ...settings.appearance, language: e.target.value }
              })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
            <select
              value={settings.appearance.fontSize}
              onChange={(e) => setSettings({
                ...settings,
                appearance: { ...settings.appearance, fontSize: e.target.value }
              })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.appearance.compactMode}
                onChange={(e) => setSettings({
                  ...settings,
                  appearance: { ...settings.appearance, compactMode: e.target.checked }
                })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Compact mode</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Security Settings</h3>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-medium text-gray-800">Password</h4>
                <p className="text-sm text-gray-500">Change your password</p>
              </div>
              <button
                onClick={() => setShowPasswordForm(true)}
                className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
              >
                Change
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-medium text-gray-800">Two-Factor Authentication</h4>
                <p className="text-sm text-gray-500">Add an extra layer of security</p>
              </div>
              <button className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm">
                Enable
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.security.loginAlerts}
                onChange={(e) => setSettings({
                  ...settings,
                  security: { ...settings.security, loginAlerts: e.target.checked }
                })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Login alerts</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.security.requirePasswordChange}
                onChange={(e) => setSettings({
                  ...settings,
                  security: { ...settings.security, requirePasswordChange: e.target.checked }
                })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Require password change every 90 days</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
            <select
              value={settings.security.sessionTimeout}
              onChange={(e) => setSettings({
                ...settings,
                security: { ...settings.security, sessionTimeout: parseInt(e.target.value) }
              })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={0}>Never</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Management</h3>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-medium text-gray-800">Export Data</h4>
                <p className="text-sm text-gray-500">Download a copy of your data</p>
              </div>
              <button
                onClick={handleExportData}
                className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-medium text-gray-800">Clear Cache</h4>
                <p className="text-sm text-gray-500">Clear stored cache data</p>
              </div>
              <button className="bg-yellow-600 text-white px-3 py-1 rounded-md hover:bg-yellow-700 text-sm">
                Clear
              </button>
            </div>
          </div>

          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-medium text-red-800">Delete Account</h4>
                <p className="text-sm text-red-600">Permanently delete your account and all data</p>
              </div>
              <button
                onClick={() => setShowDeleteAccount(true)}
                className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-sm flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileSettings();
      case 'privacy':
        return renderPrivacySettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'security':
        return renderSecuritySettings();
      case 'data':
        return renderDataSettings();
      default:
        return renderProfileSettings();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-8 h-8 text-gray-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
            <p className="text-gray-600">Manage your account preferences and privacy</p>
          </div>
        </div>

        {/* Settings Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {settingsTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Settings Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {renderActiveTab()}
        
        <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => handleSaveSettings(activeTab)}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Change Password</h3>
              <button
                onClick={() => setShowPasswordForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPasswordForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold text-red-800">Delete Account</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data, posts, and connections.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">
                  <strong>Warning:</strong> This will delete:
                </p>
                <ul className="text-sm text-red-600 mt-2 list-disc list-inside">
                  <li>Your profile and personal information</li>
                  <li>All your posts and comments</li>
                  <li>Your friend connections</li>
                  <li>Your study group memberships</li>
                  <li>All associated data</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAccount(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;




