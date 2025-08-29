




package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/lxsolutions/polyverse/services/relay/internal/nats"
	"github.com/lxsolutions/polyverse/services/relay/internal/pvp"
	"github.com/lxsolutions/polyverse/services/relay/internal/redis"
)

type App struct {
	natsClient  *nats.Client
	redisClient *redis.Client
}

func main() {
	// Initialize NATS client
	natsCfg := nats.Config{
		URL:    getEnv("NATS_URL", "nats://localhost:4222"),
		Stream: getEnv("NATS_STREAM", "polyverse_events"),
		Topic:  getEnv("NATS_TOPIC", "events.>"),
	}
	
	natsClient, err := nats.NewClient(natsCfg)
	if err != nil {
		log.Fatalf("Failed to initialize NATS client: %v", err)
	}
	defer natsClient.Close()

	// Initialize Redis client
	redisCfg := redis.Config{
		URL: getEnv("REDIS_URL", "redis://localhost:6379"),
	}
	
	redisClient, err := redis.NewClient(redisCfg)
	if err != nil {
		log.Fatalf("Failed to initialize Redis client: %v", err)
	}
	defer redisClient.Close()

	app := &App{
		natsClient:  natsClient,
		redisClient: redisClient,
	}

	r := gin.Default()

	// Health check endpoint
	r.GET("/healthz", app.healthCheck)

	// PVP event endpoints
	r.POST("/pvp/event", app.handleEvent)
	r.GET("/pvp/event/:id", getEvent)
	r.GET("/pvp/feed", getFeed)

	port := getEnv("PORT", ":8080")
	log.Printf("Starting relay service on port %s\n", port)
	if err := http.ListenAndServe(port, r); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func (app *App) healthCheck(c *gin.Context) {
	// Check NATS connection
	if err := app.natsClient.HealthCheck(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "unhealthy",
			"error":  fmt.Sprintf("NATS: %v", err),
		})
		return
	}

	// Check Redis connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := app.redisClient.HealthCheck(ctx); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "unhealthy",
			"error":  fmt.Sprintf("Redis: %v", err),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "healthy",
		"services": map[string]string{
			"nats":  "connected",
			"redis": "connected",
		},
	})
}

func (app *App) handleEvent(c *gin.Context) {
	// Rate limiting by IP address
	clientIP := c.ClientIP()
	rateLimitKey := fmt.Sprintf("rate_limit:%s", clientIP)
	
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	// Get rate limit configuration from environment
	rateLimit := getEnvAsInt("RATE_LIMIT_REQUESTS_PER_MINUTE", 60)
	rateLimitWindow := time.Minute
	
	allowed, err := app.redisClient.RateLimit(ctx, rateLimitKey, rateLimit, rateLimitWindow)
	if err != nil {
		log.Printf("Rate limiting error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Rate limiting service unavailable"})
		return
	}
	
	if !allowed {
		remaining, _ := app.redisClient.GetRemainingRequests(ctx, rateLimitKey, rateLimit)
		c.JSON(http.StatusTooManyRequests, gin.H{
			"error":     "Rate limit exceeded",
			"limit":     rateLimit,
			"window":    rateLimitWindow.String(),
			"remaining": remaining,
			"reset_in":  "60 seconds",
		})
		return
	}

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

	// Publish event to NATS instead of forwarding directly to indexer
	natsSubject := fmt.Sprintf("events.%s", event.Kind)
	if err := app.natsClient.PublishEvent(ctx, natsSubject, event); err != nil {
		log.Printf("Failed to publish event to NATS: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to queue event"})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{
		"status":   "Event accepted and queued",
		"event_id": event.ID,
		"kind":     event.Kind,
		"queued":   true,
	})
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

