
package pvp

import (
	"crypto/ed25519"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
)

// Event represents a PVP event
type Event struct {
	ID        string                 `json:"id"`
	Kind      string                 `json:"kind"`
	CreatedAt int64                  `json:"created_at"`
	AuthorDID string                 `json:"author_did"`
	Body      map[string]interface{} `json:"body,omitempty"`
	Refs      []interface{}          `json:"refs,omitempty"`
	Sig       string                 `json:"sig"`
}

// VerifySignature verifies the Ed25519 signature of a PVP event
func VerifySignature(event Event, publicKeyBase64 string) (bool, error) {
	// Decode the public key from base64
	publicKey, err := base64.StdEncoding.DecodeString(publicKeyBase64)
	if err != nil {
		return false, fmt.Errorf("failed to decode public key: %v", err)
	}

	// Decode the signature from base64
	signature, err := base64.StdEncoding.DecodeString(event.Sig)
	if err != nil {
		return false, fmt.Errorf("failed to decode signature: %v", err)
	}

	// Create the canonical JSON for verification (same as signing process)
	// We need to remove the sig and id fields for verification
	verificationData := map[string]interface{}{
		"kind":       event.Kind,
		"created_at": event.CreatedAt,
		"author_did": event.AuthorDID,
	}

	if event.Body != nil {
		verificationData["body"] = event.Body
	}
	if event.Refs != nil {
		verificationData["refs"] = event.Refs
	}

	// Convert to canonical JSON
	canonicalJSON, err := json.Marshal(verificationData)
	if err != nil {
		return false, fmt.Errorf("failed to marshal verification data: %v", err)
	}

	// Verify the signature
	isValid := ed25519.Verify(publicKey, canonicalJSON, signature)
	if !isValid {
		log.Printf("Signature verification failed for event %s", event.ID)
		log.Printf("Public key: %s", publicKeyBase64)
		log.Printf("Signature: %s", event.Sig)
		log.Printf("Canonical JSON: %s", string(canonicalJSON))
	}

	return isValid, nil
}

// ExtractPublicKeyFromDID extracts the public key from a DID:key format
// For now, we assume the DID is in format "did:key:base64publickey"
func ExtractPublicKeyFromDID(did string) (string, error) {
	if len(did) < 11 || did[:8] != "did:key:" {
		return "", fmt.Errorf("invalid DID format: %s", did)
	}
	return did[8:], nil // Return the base64 public key part
}
