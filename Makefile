










# OpenGrid Makefile

.PHONY: all dev demo clean build test lint help deploy

# Environment variables
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

all: help

help:
	@echo "Usage:"
	@echo "  make dev        - Start local development environment"
	@echo "  make demo       - Run example job through the system"
	@echo "  make clean      - Clean up generated files"
	@echo "  make build      - Build all components"
	@echo "  make test       - Run tests for all components"
	@echo "  make lint       - Lint codebase"
	@echo "  make deploy     - Deploy smart contracts to Base Sepolia"

# Local development environment
dev:
	@echo "Starting local development environment..."
	docker-compose -f docker-compose.dev.yml up --build --remove-orphans

# Demo mode (runs example jobs)
demo: dev
	@sleep 5 && \
	echo "Running demo..." && \
	opengrid/cli/og submit examples/sdxl-generate/job.yaml

# Clean up all containers and volumes
clean:
	docker-compose down -v --remove-orphans
	rm -rf ./daemon/target
	rm -rf ./coordinator/dist
	rm -rf ./verifier/bin
	rm -rf ./ui/.next
	rm -rf .tmp

# Build all components
build:
	@echo "Building daemon (Rust)..."
	(cd daemon && cargo build --release)
	@echo "Building coordinator (TypeScript)..."
	(cd coordinator && npm install && npm run build)
	@echo "Building verifier (Go)..."
	(cd verifier && go build -o bin/verifier)
	@echo "Building UI..."
	(cd ui && npm install && npm run build)

# Lint codebase
lint:
	@echo "Linting codebase..."
	find . -name "*.py" -exec pylint {} \;
	find . -name "*.rs" -exec rustfmt --check {} \;
	find . -name "*.ts" -exec eslint {} \;

# Run tests
test: lint
	@echo "Running tests..."
	pytest opengrid/cli/tests/
	cargo test --manifest-path daemon/Cargo.toml

# Deploy contracts to Base Sepolia
deploy:
	cd contracts && forge script Scripts/Deploy.s.sol --rpc-url $(BASE_SEPOLIA_RPC_URL) --private-key $(DEPLOYER_PRIVATE_KEY)





