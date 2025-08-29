

/**
 * PolyVerse Event Types
 */

export interface EventBody {
  text?: string;
  media?: Array<{
    cid: string;
    mime: string;
  }>;
}

export interface EventReference {
  type: string;
  id: string;
}

export interface EventV1 {
  id: string;
  kind: 'post' | 'repost' | 'follow' | 'like' | 'profile';
  created_at: number;
  author_did: string;
  body?: EventBody;
  refs?: EventReference[];
  sig: string;
}

export interface CanonicalEventData {
  kind: string;
  created_at: number;
  author_did: string;
  body?: EventBody;
  refs: EventReference[];
}

