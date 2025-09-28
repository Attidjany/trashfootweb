// Simple in-memory storage for backend (in production, use a real database)
// Shared storage to ensure data consistency across routes
export const userDataStorage = new Map<string, any>();