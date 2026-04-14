import Profile from '../../models/Profile.js';
import cache from '../../utils/cache.js';

export async function getProfile(userId) {
  try {
    // Check cache first
    const cacheKey = `profile:${userId}`;
    const cachedProfile = cache.get(cacheKey);
    if (cachedProfile) {
      return cachedProfile;
    }

    const userProfile = await Profile.findOne({ userId: userId })
      .select('strongSubject')
      .lean(); // Use lean() for better performance

    if (!userProfile) {
      return {
        error: "Profile not found.",
      };
    }

    // Cache the profile for 10 minutes
    cache.set(cacheKey, userProfile, 10 * 60 * 1000);
    return userProfile;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return {
      error: "An unexpected error occurred while fetching the profile.",
    };
  }
}
