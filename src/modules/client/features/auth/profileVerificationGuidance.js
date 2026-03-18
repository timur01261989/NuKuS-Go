export const profileVerificationSteps = [
  { key: "phone", title: "Phone", description: "OTP" },
  { key: "document", title: "Document", description: "Verify" },
  { key: "trust", title: "Trust", description: "Secure" }
];

export function buildProfileTrustState({ hasSelfie = false, hasDocument = false, profileScore = 0 } = {}) {
  const verifiedCount = [hasSelfie, hasDocument].filter(Boolean).length;
  return {
    verifiedCount,
    profileScore,
    level: profileScore >= 70 ? "strong" : profileScore >= 40 ? "growing" : "starter",
    headline: verifiedCount >= 2 ? "Secure access ready" : "Verification in progress"
  };
}
