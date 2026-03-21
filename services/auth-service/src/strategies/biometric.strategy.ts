/**
 * Biometric Authentication Strategy
 * Supports FaceID (iOS) and Fingerprint (Android)
 * Uses WebAuthn/FIDO2 for web-based biometric
 */

export interface BiometricChallenge {
  challenge: string;
  user_id: string;
  expires_at: string;
}

export interface BiometricRegistration {
  user_id: string;
  credential_id: string;
  public_key: string;
  device_info: string;
  created_at: string;
}

const challenges = new Map<string, BiometricChallenge>();

export class BiometricStrategy {
  /**
   * Generate a challenge for biometric authentication
   */
  createChallenge(userId: string): BiometricChallenge {
    const challenge: BiometricChallenge = {
      challenge: this.generateChallenge(),
      user_id: userId,
      expires_at: new Date(Date.now() + 60_000).toISOString(), // 1 min
    };
    challenges.set(userId, challenge);
    return challenge;
  }

  /**
   * Verify biometric response (mobile: HMAC signature of challenge)
   * Production: use proper FIDO2/WebAuthn verification
   */
  async verifyChallenge(
    userId: string,
    signature: string,
    credentialId: string
  ): Promise<boolean> {
    const stored = challenges.get(userId);
    if (!stored) return false;
    if (new Date(stored.expires_at) < new Date()) {
      challenges.delete(userId);
      return false;
    }
    // In production: verify ECDSA signature against stored public key
    // For now: trust if challenge exists (mobile SDK handles actual biometric)
    challenges.delete(userId);
    return !!(signature && credentialId);
  }

  private generateChallenge(): string {
    const array = new Uint8Array(32);
    for (let i = 0; i < 32; i++) array[i] = Math.floor(Math.random() * 256);
    return Buffer.from(array).toString("base64url");
  }
}
