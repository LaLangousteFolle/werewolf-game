# Makefile

.PHONY: help lint format type-check install-dev

help:
	@echo "Commandes disponibles:"
	@echo "  make lint          - Linter Python (flake8, pylint)"
	@echo "  make format        - Formatter Python (black, isort)"
	@echo "  make type-check    - Vérifier les types (mypy)"
	@echo "  make lint-front    - Linter frontend (ESLint)"
	@echo "  make format-front  - Formatter frontend (Prettier)"
	@echo "  make install-dev   - Installer les dépendances de dev"

# Python Backend + Bot
lint:
	@echo "🔍 Linting backend..."
	cd backend && flake8 .
	@echo "🔍 Linting discord-bot..."
	cd discord-bot && flake8 .

format:
	@echo "✨ Formatting backend..."
	cd backend && black . && isort .
	@echo "✨ Formatting discord-bot..."
	cd discord-bot && black . && isort .

type-check:
	@echo "🔎 Type checking backend..."
	cd backend && mypy .
	@echo "🔎 Type checking discord-bot..."
	cd discord-bot && mypy .

# Frontend
lint-front:
	@echo "🔍 Linting frontend..."
	cd frontend && npm run lint

format-front:
	@echo "✨ Formatting frontend..."
	cd frontend && npm run format

# Installation
install-dev:
	@echo "📦 Installation des dépendances de dev..."
	cd backend && pip install black flake8 mypy isort pylint
	cd discord-bot && pip install black flake8 mypy isort pylint
	cd frontend && npm install -D eslint prettier

