





import { createEvent, signEvent, verifyEvent, generateKeyPair } from '../src';

describe('PVP Event SDK', () => {
  let testKeys: { publicKey: string; privateKey: string };

  beforeAll(() => {
    testKeys = generateKeyPair();
  });

  it('should create a basic event', async () => {
    const event = createEvent('post', 'did:key:test123', {
      text: 'Hello world!'
    });

    expect(event).toHaveProperty('kind', 'post');
    expect(event).toHaveProperty('author_did', 'did:key:test123');
    expect(event).toHaveProperty('body.text', 'Hello world!');
  });

  it('should sign and verify an event', async () => {
    const unsignedEvent = createEvent('post', testKeys.publicKey, {
      text: 'Test signing'
    });

    // Sign the event
    const signedEvent = await signEvent(unsignedEvent, testKeys.privateKey);

    expect(signedEvent).toHaveProperty('id');
    expect(signedEvent.id.length).toBeGreaterThan(0);
    expect(signedEvent).toHaveProperty('sig');
    expect(signedEvent.sig.length).toBeGreaterThan(0);

    // Verify the signature
    const isValid = await verifyEvent(signedEvent, testKeys.publicKey);

    expect(isValid).toBe(true);
  });

  it('should reject invalid signatures', async () => {
    const unsignedEvent = createEvent('post', 'did:key:wrong', {
      text: 'Test verification'
    });

    // Sign with one key but verify with another
    const signedEvent = await signEvent(unsignedEvent, testKeys.privateKey);

    const isValid = await verifyEvent(signedEvent, 'wrong-public-key');

    expect(isValid).toBe(false);
  });
});


