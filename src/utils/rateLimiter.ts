const actionLimits = {
  emailSend: 100, // Max emails per hour
};

const userActions = new Map(); // Store user actions in memory or a database

export function canPerformAction(userId: string, action: string): boolean {
  const now = Date.now();
  const userAction = userActions.get(userId) || {};
  const actionTimestamps = userAction[action] || [];

  // Remove timestamps older than 1 hour
  const recentTimestamps = actionTimestamps.filter(
    (timestamp: number) => now - timestamp < 3600000
  );

  if (recentTimestamps.length >= actionLimits[action]) {
    return false; // Limit reached
  }

  // Update timestamps and store
  recentTimestamps.push(now);
  userActions.set(userId, { ...userAction, [action]: recentTimestamps });

  return true;
} 