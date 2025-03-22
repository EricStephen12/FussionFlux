// Utility functions for API key validation and management

/**
 * Validates if the provided API key matches the expected key
 * @param providedKey The API key to validate
 * @param expectedKey The expected API key value
 * @returns boolean indicating if the key is valid
 */
export function validateApiKey(providedKey: string | undefined, expectedKey: string | undefined): boolean {
    if (!providedKey || !expectedKey) {
        return false;
    }
    return providedKey === expectedKey;
}

/**
 * Checks if the API key is configured in environment variables
 * @param keyName The name of the environment variable containing the API key
 * @returns boolean indicating if the key is configured
 */
export function isApiKeyConfigured(keyName: string): boolean {
    const key = process.env[keyName];
    return !!key && key.length > 0;
}

/**
 * Gets an API key from environment variables
 * @param keyName The name of the environment variable containing the API key
 * @returns The API key value or undefined if not found
 */
export function getApiKey(keyName: string): string | undefined {
    return process.env[keyName];
} 