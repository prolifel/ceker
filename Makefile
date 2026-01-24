APP_NAME := ceker
APP_VERSION := v1.0.2
REGISTRY_URL ?=
DOCKERFILE := Dockerfile

# Build image names
ifeq ($(REGISTRY_URL),)
    IMAGE_NAME := $(APP_NAME)
else
    IMAGE_NAME := $(REGISTRY_URL)/$(APP_NAME)
endif

.PHONY: all build push build-local tag clean help

all: build push

build:
	docker build -f $(DOCKERFILE) -t $(IMAGE_NAME):$(APP_VERSION) -t $(IMAGE_NAME):latest .

push:
	docker push $(IMAGE_NAME):$(APP_VERSION)
	docker push $(IMAGE_NAME):latest

build-local:
	docker build -f $(DOCKERFILE) -t $(APP_NAME):$(APP_VERSION) -t $(APP_NAME):latest .

tag:
	@echo "Current tags:"
	@docker images | grep $(APP_NAME)

clean:
	@echo "Cleaning images..."
	-docker rmi $(IMAGE_NAME):$(APP_VERSION) 2>/dev/null || true
	-docker rmi $(IMAGE_NAME):latest 2>/dev/null || true

help:
	@echo "Available targets:"
	@echo "  make all                   - Build and push (requires REGISTRY_URL)"
	@echo "  make build                 - Build image"
	@echo "  make push                  - Push image to registry"
	@echo "  make build-local           - Build without registry prefix"
	@echo "  make tag                   - Show image tags"
	@echo "  make clean                 - Remove built images"
	@echo "  make help                  - Show this help"
	@echo ""
	@echo "Usage:"
	@echo "  REGISTRY_URL=registry.example.com make all"
	@echo "  REGISTRY_URL=registry.gitlab.com/username make build push"
