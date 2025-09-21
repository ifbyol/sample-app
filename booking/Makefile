.PHONY: build start watch clean install-tools

# Build the application
build:
	@echo "Building Booking service..."
	@go build -o bin/booking .

# Start the application
start: build
	@echo "Starting Booking service..."
	@./bin/booking

# Watch for changes and restart automatically using devl
watch:
	@echo "Starting development server with file watching..."
	@devl

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf bin/

# Install development tools
install-tools:
	@echo "Installing development tools..."
	@go install github.com/marwan-at-work/devl@latest

# Default target
help:
	@echo "Available targets:"
	@echo "  build        - Build the application"
	@echo "  start        - Build and start the application"
	@echo "  watch        - Start development server with auto-reload"
	@echo "  clean        - Clean build artifacts"
	@echo "  install-tools - Install development tools (devl)"
	@echo "  help         - Show this help message"