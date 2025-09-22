.PHONY: build start clean run install-tools watch help

# Default target
all: build

# Build the application
build:
	@echo "Building worker service..."
	go build -o worker .
	@echo "Build complete. Binary: ./worker"

# Start the application
start:
	@echo "Starting worker service..."
	./worker

# Build and run in one command
run: build start

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -f worker
	go clean
	@echo "Clean complete."

# Install development tools
install-tools:
	@echo "Installing development tools..."
	go install github.com/cosmtrek/air@latest
	@echo "Development tools installed."

# Watch mode for development (requires air)
watch:
	@echo "Starting worker service in watch mode..."
	@if ! command -v air > /dev/null 2>&1; then \
		echo "Air not found. Installing..."; \
		$(MAKE) install-tools; \
	fi
	air

# Display help
help:
	@echo "Available commands:"
	@echo "  make build        - Build the worker binary"
	@echo "  make start        - Start the worker service"
	@echo "  make run          - Build and start the service"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make install-tools - Install development tools (air)"
	@echo "  make watch        - Run in watch mode (auto-reload on changes)"
	@echo "  make help         - Show this help message"