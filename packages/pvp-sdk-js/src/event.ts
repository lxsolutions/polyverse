











import { generateKeyPair, signData, verifySignature } from './crypto';

export interface EventBody {
  text?: string;
  media?: Array<{ cid: string; mime: string }>;
}

export interface Event {
  id: string;
  kind: 'post' | 'repost' | 'follow' | 'like' | 'profile';
  created_at: number;
  author_did: string;
  body?: EventBody;
  refs?: Array<{ type: string; id: string }>;
  sig: string;
}

/**
 * Create a PVP event with the required fields
 */
export function createEvent(
  kind: Event['kind'],
  authorDid: string,
  body?: EventBody
): Omit<Event, 'id' | 'sig'> {
  return {
    kind,
    created_at: Date.now(),
    author_did: authorDid,
    ...(body && { body }),
    refs: []
  };
}

/**
 * Sign an event with the user's private key
 */
export async function signEvent(
  event: Omit<Event, 'sig'>,
  privateKey: string
): Promise<Event> {
  // Create a canonical JSON string for signing (without id field if it exists)
  const { id, ...eventWithoutId } = event;
  const data = JSON.stringify(eventWithoutId);
  console.log('Data being signed:', data);

  // Generate ID as hash of signed content (without sig and id fields)
  const idValue = await generateId(data);

  return {
    ...event,
    id: idValue,
    sig: await signData(privateKey, data)
  };
}

/**
 * Verify an event signature
 */
export async function verifyEvent(
  event: Event,
  publicKey: string
): Promise<boolean> {
  if (!event.id || !event.sig) {
    return false;
  }

  // Recreate the canonical JSON without sig and id fields for verification (same as signing)
  const { sig, ...eventWithoutSig } = event;
  const { id, ...dataForSigning } = eventWithoutSig;
  const data = JSON.stringify(dataForSigning);

  // Verify signature matches and ID is correct
  const validSignature = await verifySignature(publicKey, data, event.sig);
  return validSignature && (await generateId(data)) === event.id;
}

/**
 * Generate event ID as hash of canonical content
 */
async function generateId(content: string): Promise<string> {
  // Use SHA-256 for consistent hashing across environments

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    // Browser environment or modern Node.js with Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return btoa(String.fromCharCode(...hashArray))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } else if (typeof require !== 'undefined') {
    // Node.js environment
    const { createHash } = require('crypto');
    const hash = createHash('sha256').update(content).digest();
    let base64 = Buffer.from(hash).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return base64;
  } else {
    // Fallback for environments without crypto
    throw new Error('Crypto API not available');
  }
}







