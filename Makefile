# Makefile for packaging the Thunderbird add-on into an XPI file.
#
# Targets:
#   make xpi   - Build the .xpi file (default)
#   make clean - Remove generated artifacts
#   make help  - Show this help

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Name of the add-on (used for the output file name).
ADDON_NAME := thunderbird-real-folder

# Version is read from manifest.json.
VERSION := $(shell python3 -c "import json;print(json.load(open('manifest.json'))['version'])" 2>/dev/null)

# Output file name.
XPI_FILE := $(ADDON_NAME)-$(VERSION).xpi

# Files/directories that are included in the package.
# NOTE: The manifest.json must be at the root of the archive.
PACKAGE_FILES := manifest.json background.js content icons

# ---------------------------------------------------------------------------
# Targets
# ---------------------------------------------------------------------------

.PHONY: all xpi clean help

# Default target.
all: xpi

# Build the .xpi file (a zip with .xpi extension).
xpi: $(XPI_FILE)

# Create the .xpi directly (no intermediate .zip is kept).
$(XPI_FILE): $(PACKAGE_FILES)
	@echo "Packaging files into $(XPI_FILE) ..."
	@rm -f $(XPI_FILE)
	@zip -r $(XPI_FILE) $(PACKAGE_FILES)
	@echo "Created $(XPI_FILE)"

# Remove generated artifacts.
clean:
	rm -f $(XPI_FILE)
	@echo "Removed $(XPI_FILE)"

# Show help.
help:
	@echo "Targets:"
	@echo "  make xpi   - Build the .xpi file (default)"
	@echo "  make clean - Remove generated artifacts"
	@echo "  make help  - Show this help"

