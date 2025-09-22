.PHONY: build start clean run install-tools watch help

# Default target
all: build

# Build the application
build:
	@echo "Building gateway service..."
	go build -o gateway .
	@echo "Build complete. Binary: ./gateway"

# Start the application
start:
	@echo "Starting gateway service..."
	./gateway

# Build and run in one command
run: build start

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -f gateway
	go clean
	@echo "Clean complete."

# Install development tools
install-tools:
	@echo "Installing development tools..."
	go install github.com/cosmtrek/air@latest
	@echo "Development tools installed."

# Watch mode for development (requires air)
watch:
	@echo "Starting gateway service in watch mode..."
	@if ! command -v air > /dev/null 2>&1; then \
		echo "Air not found. Installing..."; \
		$(MAKE) install-tools; \
	fi
	air

# Display help
help:
	@echo "Available commands:"
	@echo "  make build        - Build the gateway binary"
	@echo "  make start        - Start the gateway service"
	@echo "  make run          - Build and start the service"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make install-tools - Install development tools (air)"
	@echo "  make watch        - Run in watch mode (auto-reload on changes)"
	@echo "  make help         - Show this help message"