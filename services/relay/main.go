




package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
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
	var event map[string]interface{}
	if err := c.ShouldBindJSON(&event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid event format"})
		return
	}

	// Basic validation - in production we'd validate the full schema
	if _, ok := event["id"]; !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing event ID"})
		return
	}
	if _, ok := event["kind"]; !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing event kind"})
		return
	}
	if _, ok := event["sig"]; !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing signature"})
		return
	}

	// TODO: Add proper signature validation here

	log.Printf("Received valid event: %v", event)

	// Forward to indexer for processing
	indexerURL := "http://localhost:3010/pvp/event"
	resp, err := http.Post(indexerURL, "application/json", c.Request.Body)
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
		c.JSON(http.StatusOK, gin.H{"status": "Event received"})
	}
}

func getEvent(c *gin.Context) {
	eventID := c.Param("id")

	// Forward to indexer for event retrieval
	indexerURL := "http://localhost:3010/pvp/event/" + eventID
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
	indexerURL := "http://localhost:3010/pvp/feed"
	queryParams := ""
	if algo != "" {
		queryParams += "&algo=" + algo
	}
	if cursor != "" {
		queryParams += "&cursor=" + cursor
	}

	fullURL := indexerURL + queryParams
	resp, err := http.Get(fullURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch feed"})
		return
	}
	defer resp.Body.Close()

	// Return the indexer's response
	var responseBody map[string]interface{}
	if err := c.ShouldBindJSON(&responseBody); err == nil {
		c.JSON(resp.StatusCode, responseBody)
	} else {
		c.JSON(http.StatusOK, gin.H{"algorithm": algo, "cursor": cursor})
	}
}

