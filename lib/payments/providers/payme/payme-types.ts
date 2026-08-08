export type PayMeEnvironment = {
  apiBaseUrl: string
  apiKey: string
  sellerId: string
  webhookSecret: string
}

// The official response and webhook contracts must be added from PayMe's
// API & Integration documentation. Until then all provider payloads remain
// unknown and cannot cross the adapter boundary.
export type PayMeApiPayload = unknown
export type PayMeWebhookPayload = unknown
