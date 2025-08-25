export interface EventBody {
    text?: string;
    media?: Array<{
        cid: string;
        mime: string;
    }>;
}
export interface Event {
    id: string;
    kind: 'post' | 'repost' | 'follow' | 'like' | 'profile';
    created_at: number;
    author_did: string;
    body?: EventBody;
    refs?: Array<{
        type: string;
        id: string;
    }>;
    sig: string;
}
/**
 * Create a PVP event with the required fields
 */
export declare function createEvent(kind: Event['kind'], authorDid: string, body?: EventBody): Omit<Event, 'id' | 'sig'>;
/**
 * Sign an event with the user's private key
 */
export declare function signEvent(event: Omit<Event, 'sig'>, privateKey: string): Promise<Event>;
/**
 * Verify an event signature
 */
export declare function verifyEvent(event: Event, publicKey: string): Promise<boolean>;
