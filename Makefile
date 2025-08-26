

# OpenGrid Development Makefile

.PHONY: dev demo clean lint test deploy

# Environment variables
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

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
	rm -rf .tmp

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

