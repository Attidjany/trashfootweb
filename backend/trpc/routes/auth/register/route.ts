import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";

export const registerProcedure = publicProcedure
  .input(
    z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      gamerHandle: z.string().min(3, "Gamer handle must be at least 3 characters").max(20, "Gamer handle must be less than 20 characters"),
      email: z.string().email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
    })
  )
  .mutation(async ({ input }) => {
    // In a real app, you would:
    // 1. Hash the password
    // 2. Check if email/gamerHandle already exists
    // 3. Save to database
    // 4. Generate JWT token
    
    // For now, simulate the registration process
    const user = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name: input.name,
      gamerHandle: input.gamerHandle,
      email: input.email,
      joinedAt: new Date().toISOString(),
      role: 'player' as const,
      status: 'active' as const,
      stats: {
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        cleanSheets: 0,
        points: 0,
        winRate: 0,
        form: [],
      },
    };

    // Generate a simple token (in production, use proper JWT)
    const token = Buffer.from(JSON.stringify({ userId: user.id, email: user.email })).toString('base64');

    return {
      user,
      token,
      message: "Account created successfully!",
    };
  });