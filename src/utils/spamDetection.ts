// List of known spam domains
const spamDomains = ['tempmail.com', 'mailinator.com'];

// Function to check if an email domain is in the spam list
export function isSpamDomain(email: string): boolean {
  const domain = email.split('@')[1];
  return spamDomains.includes(domain);
}

// Function to limit email sending
export function canSendEmail(user: any): boolean {
  const emailsSent = getEmailsSentInLastHour(user);
  const maxEmailsPerHour = 100; // Set your limit

  return emailsSent < maxEmailsPerHour;
}

// Mock function to get the number of emails sent in the last hour
function getEmailsSentInLastHour(user: any): number {
  // Replace with actual logic to retrieve email count
  return 0;
} 