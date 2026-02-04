APP_NAME := ceker
APP_VERSION := v1.2.0
REGISTRY_URL ?=
DOCKERFILE := Dockerfile

# Teams bot configuration
TEAMS_APP_NAME := $(APP_NAME)-teams
TEAMS_DOCKERFILE := teams/Dockerfile

# Build image names
ifeq ($(REGISTRY_URL),)
    IMAGE_NAME := $(APP_NAME)
    TEAMS_IMAGE_NAME := $(TEAMS_APP_NAME)
else
    IMAGE_NAME := $(REGISTRY_URL)/$(APP_NAME)
    TEAMS_IMAGE_NAME := $(REGISTRY_URL)/$(TEAMS_APP_NAME)
endif

.PHONY: all build push build-local tag clean help \
        teams-all teams-build teams-push teams-build-local teams-clean teams-tag \
        build-all push-all

all: build-all push-all

# ---------- Main App ----------
build:
	docker build -f $(DOCKERFILE) -t $(IMAGE_NAME):$(APP_VERSION) -t $(IMAGE_NAME):latest .

push:
	docker push $(IMAGE_NAME):$(APP_VERSION)
	docker push $(IMAGE_NAME):latest

build-local:
	docker build -f $(DOCKERFILE) -t $(APP_NAME):$(APP_VERSION) -t $(APP_NAME):latest .

# ---------- Teams Bot ----------
teams-build:
	docker build -f $(TEAMS_DOCKERFILE) -t $(TEAMS_IMAGE_NAME):$(APP_VERSION) -t $(TEAMS_IMAGE_NAME):latest ./teams

teams-push:
	docker push $(TEAMS_IMAGE_NAME):$(APP_VERSION)
	docker push $(TEAMS_IMAGE_NAME):latest

teams-all: teams-build teams-push

teams-build-local:
	docker build -f $(TEAMS_DOCKERFILE) -t $(TEAMS_APP_NAME):$(APP_VERSION) -t $(TEAMS_APP_NAME):latest ./teams

teams-tag:
	@echo "Teams Bot tags:"
	@docker images | grep $(TEAMS_APP_NAME)

teams-clean:
	@echo "Cleaning teams bot images..."
	-docker rmi $(TEAMS_IMAGE_NAME):$(APP_VERSION) 2>/dev/null || true
	-docker rmi $(TEAMS_IMAGE_NAME):latest 2>/dev/null || true

# ---------- Combined ----------
build-all: build teams-build

push-all: push teams-push

# ---------- Common ----------
tag:
	@echo "Main App tags:"
	@docker images | grep $(APP_NAME)
	@echo ""
	@echo "Teams Bot tags:"
	@docker images | grep $(TEAMS_APP_NAME)

clean:
	@echo "Cleaning images..."
	-docker rmi $(IMAGE_NAME):$(APP_VERSION) 2>/dev/null || true
	-docker rmi $(IMAGE_NAME):latest 2>/dev/null || true
	-docker rmi $(TEAMS_IMAGE_NAME):$(APP_VERSION) 2>/dev/null || true
	-docker rmi $(TEAMS_IMAGE_NAME):latest 2>/dev/null || true

help:
	@echo "Available targets:"
	@echo ""
	@echo "Main App:"
	@echo "  make build                 - Build main app image"
	@echo "  make push                  - Push main app image to registry"
	@echo "  make build-local           - Build main app without registry prefix"
	@echo ""
	@echo "Teams Bot:"
	@echo "  make teams-build           - Build teams bot image"
	@echo "  make teams-push            - Push teams bot image to registry"
	@echo "  make teams-all             - Build and push teams bot"
	@echo "  make teams-build-local     - Build teams bot without registry prefix"
	@echo "  make teams-clean           - Remove teams bot images"
	@echo ""
	@echo "Combined:"
	@echo "  make all                   - Build and push both images"
	@echo "  make build-all             - Build both images"
	@echo "  make push-all              - Push both images"
	@echo ""
	@echo "Common:"
	@echo "  make tag                   - Show image tags"
	@echo "  make clean                 - Remove all built images"
	@echo "  make help                  - Show this help"
	@echo ""
	@echo "Usage:"
	@echo "  REGISTRY_URL=registry.example.com make all"
	@echo "  REGISTRY_URL=registry.gitlab.com/username make build-all push-all"
