/**
 * Generate Ed25519 key pair
 */
export declare function generateKeyPair(): {
    publicKey: string;
    privateKey: string;
};
/**
 * Sign data with Ed25519 private key
 */
export declare function signData(privateKey: string, data: string): Promise<string>;
/**
 * Verify Ed25519 signature
 */
export declare function verifySignature(publicKey: string, data: string, signature: string): Promise<boolean>;
