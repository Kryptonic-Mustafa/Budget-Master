import { query } from '@/lib/db';

export async function logActivity(userId: number, action: string, details: string) {
  try {
    if (!userId) return; // Safety check
    
    await query({
      query: `INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)`,
      values: [userId, action, details]
    });
  } catch (error) {
    // Log error to console but don't crash the app
    console.error("Activity Log Error:", error);
  }
}
