"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEvent = exports.signEvent = exports.createEvent = void 0;
const crypto_1 = require("./crypto");
/**
 * Create a PVP event with the required fields
 */
function createEvent(kind, authorDid, body) {
    return Object.assign(Object.assign({ kind, created_at: Date.now(), author_did: authorDid }, (body && { body })), { refs: [] });
}
exports.createEvent = createEvent;
/**
 * Sign an event with the user's private key
 */
function signEvent(event, privateKey) {
    return __awaiter(this, void 0, void 0, function* () {
        // Create a canonical JSON string for signing (without id field if it exists)
        const { id } = event, eventWithoutId = __rest(event, ["id"]);
        const data = JSON.stringify(eventWithoutId);
        console.log('Data being signed:', data);
        // Generate ID as hash of signed content (without sig and id fields)
        const idValue = yield generateId(data);
        return Object.assign(Object.assign({}, event), { id: idValue, sig: yield (0, crypto_1.signData)(privateKey, data) });
    });
}
exports.signEvent = signEvent;
/**
 * Verify an event signature
 */
function verifyEvent(event, publicKey) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!event.id || !event.sig) {
            return false;
        }
        // Recreate the canonical JSON without sig and id fields for verification (same as signing)
        const { sig } = event, eventWithoutSig = __rest(event, ["sig"]);
        const { id } = eventWithoutSig, dataForSigning = __rest(eventWithoutSig, ["id"]);
        const data = JSON.stringify(dataForSigning);
        // Verify signature matches and ID is correct
        const validSignature = yield (0, crypto_1.verifySignature)(publicKey, data, event.sig);
        return validSignature && (yield generateId(data)) === event.id;
    });
}
exports.verifyEvent = verifyEvent;
/**
 * Generate event ID as hash of canonical content
 */
function generateId(content) {
    return __awaiter(this, void 0, void 0, function* () {
        // Use SHA-256 for consistent hashing across environments
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            // Browser environment or modern Node.js with Web Crypto API
            const encoder = new TextEncoder();
            const data = encoder.encode(content);
            const hashBuffer = yield crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return btoa(String.fromCharCode(...hashArray))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');
        }
        else if (typeof require !== 'undefined') {
            // Node.js environment
            const { createHash } = require('crypto');
            const hash = createHash('sha256').update(content).digest();
            let base64 = Buffer.from(hash).toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');
            return base64;
        }
        else {
            // Fallback for environments without crypto
            throw new Error('Crypto API not available');
        }
    });
}
