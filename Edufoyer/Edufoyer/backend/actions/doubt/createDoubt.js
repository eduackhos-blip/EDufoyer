import { z } from 'zod';
import Doubt from '../../models/Doubt.js';
import Solver from '../../models/Solver.js';
import Notification from '../../models/Notification.js';
import { sendEmail } from '../../utils/email.js';
import { getIO } from '../../socket.js';
import { validateSubjectRelevance } from '../../utils/openaiValidation.js';

const AskDoubtSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  subject: z.string().min(1, "Subject is required"),
  category: z.enum(["small", "medium", "large"], {
    required_error: "Doubt category is required",
  }).optional(),
  doubtCategory: z.enum(["small", "medium", "large"], {
    required_error: "Doubt category is required",
  }).optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters long")
    .max(5000, "Description cannot exceed 5000 characters")
    .optional(),
  doubtDescription: z
    .string()
    .min(10, "Description must be at least 10 characters long")
    .max(5000, "Description cannot exceed 5000 characters")
    .optional(),
  imagePath: z.string().nullable().optional(),
  isScheduled: z.boolean().optional(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
});

async function getUserEmail(userId) {
  try {
    const User = (await import('../../models/User.js')).default;
    const userResult = await User.findById(userId).select('email');
    return userResult?.email || null;
  } catch (error) {
    console.error(`Error fetching email for user ${userId}:`, error);
    return null;
  }
}

export async function createDoubt(formData, userId) {
  const validatedFields = AskDoubtSchema.safeParse(formData);

  if (!validatedFields.success) {
    console.error("Validation Errors:", validatedFields.error.flatten());
    return {
      success: false,
      error: "Invalid input data.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  if (!userId) {
    return {
      success: false,
      error: "Unauthorized: You must be logged in to ask a doubt.",
    };
  }

  const { title, subject, category, doubtCategory, description, doubtDescription, imagePath, isScheduled, scheduledDate, scheduledTime } = validatedFields.data;
  
  // Use the appropriate fields based on what's provided
  const finalSubject = subject;
  const finalDescription = description || doubtDescription;
  const finalCategory = category || doubtCategory;

  // Check daily doubt quota limits (2 small, 2 medium, 1 large)
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayDoubts = await Doubt.find({
      doubter_id: userId,
      createdAt: {
        $gte: todayStart,
        $lte: todayEnd
      }
    }).select('category');

    // Count doubts by category
    const categoryCounts = {
      small: todayDoubts.filter(d => d.category === 'small').length,
      medium: todayDoubts.filter(d => d.category === 'medium').length,
      large: todayDoubts.filter(d => d.category === 'large').length
    };

    // Define limits
    const limits = {
      small: 2,
      medium: 2,
      large: 1
    };

    // Check total daily limit (5 doubts max) first
    const totalToday = todayDoubts.length;
    if (totalToday >= 5) {
      const categoryNames = {
        small: 'Small',
        medium: 'Medium',
        large: 'Large'
      };
      return {
        success: false,
        error: `You've reached your daily limit of 5 doubts (2 Small, 2 Medium, 1 Large). Your quota will reset after 12 AM. Please try again tomorrow!`,
        quotaDetails: {
          total: totalToday,
          limit: 5,
          categoryCounts: categoryCounts,
          limits: limits
        }
      };
    }

    // Check if limit exceeded for the current category
    if (categoryCounts[finalCategory] >= limits[finalCategory]) {
      const categoryNames = {
        small: 'Small',
        medium: 'Medium',
        large: 'Large'
      };
      const categoryName = categoryNames[finalCategory] || finalCategory;
      const used = categoryCounts[finalCategory];
      const limit = limits[finalCategory];
      
      return {
        success: false,
        error: `You've used all your ${categoryName} doubt slots for today (${used}/${limit}). You can still ask doubts from other categories. Your quota will reset after 12 AM. Please try again tomorrow!`,
        quotaDetails: {
          exhaustedCategory: finalCategory,
          categoryCounts: categoryCounts,
          limits: limits,
          total: totalToday
        }
      };
    }
  } catch (quotaError) {
    console.error('Error checking daily quota:', quotaError);
    // Continue if quota check fails (fail-open approach for availability)
  }
  
  // Validate scheduled fields if isScheduled is true
  if (isScheduled) {
    if (!scheduledDate || !scheduledTime) {
      return {
        success: false,
        error: "Scheduled date and time are required when scheduling a doubt.",
      };
    }
    
    // Validate that scheduled date is in the future
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    if (scheduledDateTime <= new Date()) {
      return {
        success: false,
        error: "Scheduled date and time must be in the future.",
      };
    }
  }

  // OPTIMIZATION: Move OpenAI validation to async (non-blocking)
  // Validate subject-description relevance using OpenAI (async, non-blocking)
  const validationPromise = (async () => {
    if (finalDescription && finalSubject) {
      console.log(`🔐 Validating doubt (async): Subject="${finalSubject}", Description length=${finalDescription.length}`);
      
      try {
        const validationResult = await validateSubjectRelevance(finalSubject, finalDescription);
        
        if (!validationResult.isRelated) {
          console.log(`❌ Validation failed: ${validationResult.reason}`);
          // Log but don't block - validation happens after submission
          // In future, could add a flag to mark doubts that failed validation
          console.warn('⚠️ Doubt submitted but validation failed - consider reviewing');
        } else {
          console.log(`✅ Subject validation passed for subject: ${finalSubject}, confidence: ${validationResult.confidence}`);
        }
      } catch (validationError) {
        // Log error but allow submission (fail-open approach)
        console.error('❌ OpenAI validation error:', validationError);
        console.warn('⚠️ Allowing submission despite validation error (fail-open approach)');
      }
    } else {
      console.warn('⚠️ Skipping validation: missing subject or description');
    }
  })();

  try {
    // Save doubt immediately (fast operation)
    const newDoubt = new Doubt({
      subject: finalSubject,
      description: finalDescription,
      image: imagePath,
      category: finalCategory || 'medium', // Set the category from form data
      doubter_id: userId,
      status: "open",
      is_scheduled: isScheduled || false,
      scheduled_date: isScheduled && scheduledDate ? new Date(`${scheduledDate}T${scheduledTime}`) : undefined,
      scheduled_time: isScheduled ? scheduledTime : undefined,
    });

    const savedDoubt = await newDoubt.save();

    // Decrement university doubt balance if user is from KIIT
    setImmediate(async () => {
      try {
        const userEmail = await getUserEmail(userId);
        if (userEmail && userEmail.toLowerCase().endsWith('@kiit.ac.in')) {
          const UniversityDoubtBalance = (await import('../../models/UniversityDoubtBalance.js')).default;
          const category = finalCategory || 'medium';
          
          // First check current balance
          const currentBalance = await UniversityDoubtBalance.findOne({ 
            university_email: 'admin@kiit.ac.in' 
          });
          
          if (currentBalance) {
            const currentCategoryBalance = currentBalance.doubtBuckets[category] || 0;
            
            // Only decrement if balance > 0
            if (currentCategoryBalance > 0) {
              const balanceUpdate = await UniversityDoubtBalance.findOneAndUpdate(
                { 
                  university_email: 'admin@kiit.ac.in',
                  [`doubtBuckets.${category}`]: { $gt: 0 } // Only update if > 0
                },
                {
                  $inc: {
                    [`doubtBuckets.${category}`]: -1
                  }
                },
                { new: true }
              );

              if (balanceUpdate) {
                // Emit socket event to refresh balance in admin panel
                try {
                  const io = getIO();
                  if (io) {
                    // Emit to all clients (broadcast)
                    io.emit('doubt:balance:updated', {
                      university_email: 'admin@kiit.ac.in',
                      doubtBuckets: balanceUpdate.doubtBuckets,
                      totalAvailable: balanceUpdate.totalAvailable
                    });
                    // Also emit a general doubt:created event for admin panels
                    io.emit('doubt:created', {
                      university_email: 'admin@kiit.ac.in',
                      category: category
                    });
                    console.log('📡 Emitted doubt:balance:updated and doubt:created events');
                  }
                } catch (emitErr) {
                  console.error('Socket emit error (doubt:balance:updated):', emitErr);
                }
                console.log(`✅ Decremented ${category} doubt from KIIT balance. New balance: ${balanceUpdate.doubtBuckets[category]}`);
              } else {
                console.log(`⚠️ Could not decrement ${category} doubt - balance may already be 0`);
              }
            } else {
              console.log(`⚠️ Cannot decrement ${category} doubt - balance is already 0`);
            }
          } else {
            console.log('⚠️ University balance record not found for KIIT');
          }
        }
      } catch (balanceError) {
        console.error('Error decrementing university doubt balance:', balanceError);
        // Don't fail the doubt creation if balance update fails
      }
    });

    // OPTIMIZATION: Move user notification to async (non-blocking)
    // Create notification for the user (async, don't wait)
    setImmediate(async () => {
      try {
        let notificationContent = `Your doubt "${savedDoubt.subject}" has been submitted successfully and is awaiting a solver.`;
        if (savedDoubt.is_scheduled && savedDoubt.scheduled_date) {
          const scheduledDate = new Date(savedDoubt.scheduled_date);
          const formattedDate = scheduledDate.toLocaleDateString('en-IN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          const formattedTime = savedDoubt.scheduled_time || scheduledDate.toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          notificationContent = `Your doubt "${savedDoubt.subject}" has been scheduled for ${formattedDate} at ${formattedTime} and is awaiting a solver.`;
        }
        await Notification.create({
          user_id: userId,
          doubt_id: savedDoubt._id,
          message_type: "DOUBT_SUBMITTED",
          content: notificationContent,
        });
      } catch (notifError) {
        console.error('Error creating user notification:', notifError);
      }
    });

    // OPTIMIZATION: Return response immediately, process solver notifications async
    // Return success response immediately (fast response)
    const responseData = {
      success: true,
      message: "Doubt submitted successfully! Potential solvers have been notified.",
      doubtId: savedDoubt._id,
      is_scheduled: savedDoubt.is_scheduled || false,
      scheduled_date: savedDoubt.scheduled_date,
      scheduled_time: savedDoubt.scheduled_time,
    };

    // Process solver notifications asynchronously (don't block response)
    setImmediate(async () => {
      try {
        // Optimize: Use lean() for faster queries and limit results
        const potentialSolvers = await Solver.find({
          specialities: { $in: [savedDoubt.subject.toLowerCase()] }
        }).select('user_id').lean().limit(20); // Limit to 20 solvers max for performance

        console.log(`Found ${potentialSolvers.length} potential solvers for subject "${savedDoubt.subject}".`);

        // Realtime: notify solvers subscribed to this subject
        try {
          const io = getIO();
          if (io) {
            io.to(`subject:${savedDoubt.subject.toLowerCase()}`).emit('doubt:available', {
              doubtId: String(savedDoubt._id),
              subject: savedDoubt.subject,
              description: savedDoubt.description,
              createdAt: savedDoubt.createdAt,
              status: savedDoubt.status,
            });
          }
        } catch (emitErr) {
          console.error('Socket emit error (doubt:available):', emitErr);
        }

        // Emit general doubt:created event for admin panels (KIIT users)
        try {
          const userEmail = await getUserEmail(userId);
          if (userEmail && userEmail.toLowerCase().endsWith('@kiit.ac.in')) {
            const io = getIO();
            if (io) {
              io.emit('doubt:created', {
                university_email: 'admin@kiit.ac.in',
                category: finalCategory || 'medium',
                doubtId: savedDoubt._id
              });
              console.log('📡 Emitted doubt:created event for KIIT user');
            }
          }
        } catch (emitErr) {
          console.error('Socket emit error (doubt:created):', emitErr);
        }

        // Process solver notifications
        if (potentialSolvers.length > 0) {
          const frontendBase = (process.env.FRONTEND_URL || '').trim();
          if (!frontendBase) {
            console.warn('FRONTEND_URL is not set; email links will be relative.');
          }
          const base = frontendBase || '';
          const acceptUrl = `${base}/dashboard/solve/${savedDoubt._id}`;
          
          // Batch process notifications (max 10 at a time)
          const batchSize = 10;
          for (let i = 0; i < potentialSolvers.length; i += batchSize) {
            const batch = potentialSolvers.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (potentialSolver) => {
              try {
                const solverEmail = await getUserEmail(potentialSolver.user_id);
                if (solverEmail) {
                  // Send email notification
                  await sendEmail({
                    to: solverEmail,
                    subject: `New Doubt Available: ${savedDoubt.subject}`,
                    text: `A new doubt matching your specialities has been submitted.\n\nSubject: ${savedDoubt.subject}\nDescription: ${savedDoubt.description?.substring(0, 100)}...\n\nYou can view and accept this doubt here: ${acceptUrl}\n\nIf you accept it, it will be assigned to you. Please solve it promptly.`,
                    html: `
                      <p>Hello,</p>
                      <p>A new doubt matching your specialities has been submitted and is available for you to solve:</p>
                      <hr>
                      <p><strong>Subject:</strong> ${savedDoubt.subject}</p>
                      <p><strong>Description:</strong> ${savedDoubt.description?.substring(0, 200)}...</p>
                      <hr>
                      <p>You can view the full details and accept this doubt by clicking the button below:</p>
                      <p style="text-align: center; margin: 20px 0;">
                        <a href="${acceptUrl}" style="background-color: #104be3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">View and Accept Doubt</a>
                      </p>
                      <p>Accepting the doubt will assign it exclusively to you. Please ensure you can provide a solution promptly.</p>
                      <p>You can also see this and other available doubts in your <a href="${base}/dashboard/solve">Assigned Doubts</a> dashboard.</p>
                      <br>
                      <p>Thank you,<br>Your App Name Team</p>
                    `,
                  });

                  // Create notification
                  let notificationContent = `A new doubt is available for you: "${savedDoubt.subject}". Click to view.`;
                  if (savedDoubt.is_scheduled && savedDoubt.scheduled_date) {
                    const scheduledDate = new Date(savedDoubt.scheduled_date);
                    const formattedDate = scheduledDate.toLocaleDateString('en-IN', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    });
                    const formattedTime = savedDoubt.scheduled_time || scheduledDate.toLocaleTimeString('en-IN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    });
                    notificationContent = `A new scheduled doubt is available for you: "${savedDoubt.subject}" scheduled for ${formattedDate} at ${formattedTime}. Click to view.`;
                  }
                  await Notification.create({
                    user_id: potentialSolver.user_id,
                    doubt_id: savedDoubt._id,
                    message_type: "DOUBT_AVAILABLE",
                    content: notificationContent,
                  });

                  // Realtime notification
                  try {
                    const io = getIO();
                    if (io) {
                      io.to(`solver:${potentialSolver.user_id}`).emit('doubt:available', {
                        doubtId: String(savedDoubt._id),
                        subject: savedDoubt.subject,
                        description: savedDoubt.description,
                        createdAt: savedDoubt.createdAt,
                        status: savedDoubt.status,
                        is_scheduled: savedDoubt.is_scheduled || false,
                        scheduled_date: savedDoubt.scheduled_date,
                        scheduled_time: savedDoubt.scheduled_time,
                      });
                    }
                  } catch (sockErr) {
                    console.error('Socket emit error (solver room doubt:available):', sockErr);
                  }

                  console.log(`Notification sent to solver ${potentialSolver.user_id} for doubt ${savedDoubt._id}`);
                }
              } catch (error) {
                console.error(`Failed to notify solver ${potentialSolver.user_id}:`, error);
              }
            });

            // Wait for batch to complete before processing next batch
            await Promise.allSettled(batchPromises);
          }
        }
      } catch (asyncError) {
        console.error('Error in async solver notification processing:', asyncError);
      }
    });

    // Return response immediately (fast response)
    return responseData;
  } catch (error) {
    console.error("Database Error creating doubt or notifying solvers:", error);
    return {
      success: false,
      error: "Database Error: Failed to submit doubt or notify solvers. Please try again later.",
    };
  }
}
