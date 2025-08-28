




package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lxsolutions/polyverse/services/relay/internal/pvp"
)

func main() {
	r := gin.Default()

	// PVP event endpoints
	r.POST("/pvp/event", handleEvent)
	r.GET("/pvp/event/:id", getEvent)
	r.GET("/pvp/feed", getFeed)

	port := ":8080"
	log.Printf("Starting relay service on port %s\n", port)
	if err := http.ListenAndServe(port, r); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func handleEvent(c *gin.Context) {
	// Read the request body first before it gets consumed
	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body"})
		return
	}
	
	// Parse the event for validation
	var event pvp.Event
	if err := json.Unmarshal(bodyBytes, &event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event format"})
		return
	}

	// Basic validation
	if event.ID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing event ID"})
		return
	}
	if event.Kind == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing event kind"})
		return
	}
	if event.Sig == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing signature"})
		return
	}
	if event.AuthorDID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing author DID"})
		return
	}

	// Extract public key from DID and verify signature
	publicKeyBase64, err := pvp.ExtractPublicKeyFromDID(event.AuthorDID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid author DID format"})
		return
	}

	isValid, err := pvp.VerifySignature(event, publicKeyBase64)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Signature verification failed"})
		return
	}

	if !isValid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid signature"})
		return
	}

	log.Printf("Received valid signed event: %s from %s", event.ID, event.AuthorDID)

	// Forward to indexer for processing
	indexerURL := "http://localhost:3002/pvp/event"
	resp, err := http.Post(indexerURL, "application/json", bytes.NewReader(bodyBytes))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to forward event"})
		return
	}
	defer resp.Body.Close()

	// Return the indexer's response
	var responseBody map[string]interface{}
	if err := c.ShouldBindJSON(&responseBody); err == nil {
		c.JSON(resp.StatusCode, responseBody)
	} else {
		c.JSON(http.StatusOK, gin.H{"status": "Event received and verified"})
	}
}

func getEvent(c *gin.Context) {
	eventID := c.Param("id")

	// Forward to indexer for event retrieval
	indexerURL := "http://localhost:3002/pvp/event/" + eventID
	resp, err := http.Get(indexerURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch event"})
		return
	}
	defer resp.Body.Close()

	// Return the indexer's response
	var responseBody map[string]interface{}
	if err := c.ShouldBindJSON(&responseBody); err == nil {
		c.JSON(resp.StatusCode, responseBody)
	} else {
		c.JSON(http.StatusOK, gin.H{"event_id": eventID})
	}
}

func getFeed(c *gin.Context) {
	algo := c.Query("algo")
	cursor := c.Query("cursor")

	// Forward to indexer for feed generation
	indexerURL := "http://localhost:3002/pvp/feed"
	queryParams := ""
	if algo != "" {
		queryParams += "algo=" + algo
	}
	if cursor != "" {
		if queryParams != "" {
			queryParams += "&"
		}
		queryParams += "cursor=" + cursor
	}

	fullURL := indexerURL
	if queryParams != "" {
		fullURL += "?" + queryParams
	}
	resp, err := http.Get(fullURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch feed"})
		return
	}
	defer resp.Body.Close()

	// Return the indexer's response
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read response body"})
		return
	}

	// Try to parse as array first, then as object
	var responseArray []interface{}
	if err := json.Unmarshal(bodyBytes, &responseArray); err == nil {
		c.JSON(resp.StatusCode, responseArray)
		return
	}

	var responseObject map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &responseObject); err == nil {
		c.JSON(resp.StatusCode, responseObject)
		return
	}

	// If neither works, return the raw body
	c.Data(resp.StatusCode, "application/json", bodyBytes)
}

