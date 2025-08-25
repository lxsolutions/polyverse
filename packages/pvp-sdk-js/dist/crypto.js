"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySignature = exports.signData = exports.generateKeyPair = void 0;
const tweetnacl = __importStar(require("tweetnacl"));
/**
 * Generate Ed25519 key pair
 */
function generateKeyPair() {
    const keyPair = tweetnacl.sign.keyPair();
    return {
        publicKey: uint8ArrayToBase64(keyPair.publicKey),
        privateKey: uint8ArrayToBase64(keyPair.secretKey)
    };
}
exports.generateKeyPair = generateKeyPair;
/**
 * Sign data with Ed25519 private key
 */
function signData(privateKey, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const encoder = new TextEncoder();
        const encodedData = encoder.encode(data);
        const signature = tweetnacl.sign.detached(encodedData, base64ToUint8Array(privateKey));
        return uint8ArrayToBase64(signature);
    });
}
exports.signData = signData;
/**
 * Verify Ed25519 signature
 */
function verifySignature(publicKey, data, signature) {
    return __awaiter(this, void 0, void 0, function* () {
        const encoder = new TextEncoder();
        const encodedData = encoder.encode(data);
        return tweetnacl.sign.detached.verify(encodedData, base64ToUint8Array(signature), base64ToUint8Array(publicKey));
    });
}
exports.verifySignature = verifySignature;
// Helper functions for key format conversion
function uint8ArrayToBase64(uint8Array) {
    // Node.js compatible version
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(uint8Array).toString('base64');
    }
    else {
        let binary = '';
        const len = uint8Array.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(uint8Array[i]);
        }
        return btoa(binary);
    }
}
function base64ToUint8Array(base64) {
    // Node.js compatible version
    if (typeof Buffer !== 'undefined') {
        return new Uint8Array(Buffer.from(base64, 'base64'));
    }
    else {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }
}
function base64ToHex(base64) {
    if (typeof Buffer !== 'undefined') {
        const buffer = Buffer.from(base64, 'base64');
        let hex = '';
        for (const byte of buffer) {
            hex += ('0' + byte.toString(16)).slice(-2);
        }
        return hex;
    }
    else {
        const bytes = base64ToUint8Array(atob(base64));
        let hex = '';
        for (const byte of bytes) {
            hex += ('0' + byte.toString(16)).slice(-2);
        }
        return hex;
    }
}
function hexToUint8Array(hex) {
    const bytes = new Uint8Array(Math.ceil(hex.length / 2));
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}
