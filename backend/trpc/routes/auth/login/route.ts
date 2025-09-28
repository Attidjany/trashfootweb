import { z } from "zod";
import { publicProcedure } from "@/backend/trpc/create-context";
import { createDummyData } from "@/mocks/dummy-data";
import { Player, Group } from "@/types/game";

// Import shared storage
import { userDataStorage } from "@/backend/trpc/shared/storage";

export const loginProcedure = publicProcedure
  .input(
    z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(1, "Password is required"),
    })
  )
  .mutation(async ({ input }) => {
    try {
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', input.email);
    console.log('Password:', input.password);
    
    // Demo login credentials - using dummy data players
    const demoCredentials = [
      { email: 'alex@trashfoot.com', password: 'striker123' },
      { email: 'marcus@trashfoot.com', password: 'wall123' },
      { email: 'jamie@trashfoot.com', password: 'speed123' },
      { email: 'david@trashfoot.com', password: 'maestro123' },
      { email: 'sarah@trashfoot.com', password: 'rocket123' },
      { email: 'mike@trashfoot.com', password: 'clutch123' },
      { email: 'admin@trashfoot.com', password: 'admin123' }, // Super admin
    ];

    const credentials = demoCredentials.find(c => c.email === input.email && c.password === input.password);
    
    if (!credentials) {
      console.log('Invalid credentials for:', input.email);
      throw new Error(`Invalid email or password. Available demo accounts:\n\n• alex@trashfoot.com / striker123\n• marcus@trashfoot.com / wall123\n• jamie@trashfoot.com / speed123\n• david@trashfoot.com / maestro123\n• sarah@trashfoot.com / rocket123\n• mike@trashfoot.com / clutch123\n• admin@trashfoot.com / admin123`);
    }

    console.log('Valid credentials found for:', input.email);

    let gameData: any = null;
    let user: Player | null = null;
    
    if (input.email === 'admin@trashfoot.com') {
      // Super admin user
      user = {
        id: 'super_admin',
        name: 'Super Admin',
        gamerHandle: 'super_admin',
        email: 'admin@trashfoot.com',
        role: 'super_admin' as const,
        status: 'active' as const,
        joinedAt: new Date().toISOString(),
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
      gameData = null; // Super admin doesn't need game data
      console.log('Super admin login successful');
    } else {
      // Regular user login
      console.log('Processing regular user login...');
      
      // For demo purposes, always create fresh dummy data to ensure users see matches
      // This ensures the demo experience is consistent and shows all the features
      console.log('Creating fresh dummy data for demo login');
      const dummyData = createDummyData();
      const allPlayers = dummyData.groups.flatMap(g => g.members);
      
      user = allPlayers.find(p => p.email === input.email) || null;
      
      if (!user) {
        console.log('User not found in dummy data');
        throw new Error("User not found in dummy data. This should not happen.");
      }
      
      gameData = {
        currentUser: user,
        groups: dummyData.groups,
        activeGroupId: dummyData.groups.length > 0 ? dummyData.groups[0].id : '',
        messages: dummyData.messages || [],
      };
      
      // Save the fresh data to storage immediately
      const dataToSave = {
        user,
        gameData,
        lastUpdated: new Date().toISOString(),
      };
      userDataStorage.set(input.email, dataToSave);
      console.log('Saved fresh data for user:', input.email);
      console.log('Data includes:', {
        groupsCount: gameData.groups.length,
        matchesCount: gameData.groups.flatMap((g: Group) => g.competitions.flatMap(c => c.matches)).length,
        messagesCount: gameData.messages.length
      });
    }
    
    if (!user) {
      console.error('User is null after processing');
      throw new Error("Failed to load user data");
    }

    // Generate a simple token (in production, use proper JWT)
    const token = Buffer.from(JSON.stringify({ 
      userId: user.id, 
      email: user.email, 
      role: user.role,
      timestamp: Date.now()
    })).toString('base64');

    console.log('=== LOGIN SUCCESS ===');
    console.log('User:', user.name, '(' + user.email + ')');
    console.log('Role:', user.role);
    console.log('Has game data:', !!gameData);
    console.log('Groups count:', gameData?.groups?.length || 0);
    
    return {
      user,
      token,
      gameData,
      message: "Login successful!",
    };
    } catch (error) {
      console.error('Login procedure error:', error);
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  });