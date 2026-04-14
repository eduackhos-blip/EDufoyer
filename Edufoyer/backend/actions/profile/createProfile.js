import { z } from 'zod';
import Profile from '../../models/Profile.js';
import Solver from '../../models/Solver.js';
import User from '../../models/User.js';

const profileSchema = z.object({
  mobileNumber: z
    .string()
    .min(10, "Mobile number must be at least 10 digits"),
  strongSubject: z.string().min(1, "Subject is required"),
  universityName: z.string().min(1, "University name is required"),
  course: z.string().min(1, "Course is required"),
});

export async function createProfile(formData, userId) {
  const validatedFields = profileSchema.safeParse({
    mobileNumber: formData.mobileNumber,
    strongSubject: formData.strongSubject,
    universityName: formData.universityName,
    course: formData.course,
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await Profile.create({
      mobileNumber: validatedFields.data.mobileNumber,
      strongSubject: validatedFields.data.strongSubject,
      universityName: validatedFields.data.universityName,
      course: validatedFields.data.course,
      userId: userId,
    });

    await User.findByIdAndUpdate(userId, { 
      onBoarding: true, 
      updatedAt: new Date() 
    });

    await Solver.create({
      user_id: userId,
      specialities: [validatedFields.data.strongSubject.toLowerCase()],
    });

    return { success: true };
  } catch (error) {
    console.log(error);
    return {
      error: { form: "Failed to save your profile. Please try again." },
    };
  }
}
