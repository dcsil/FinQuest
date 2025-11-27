# FinQuest API

Backend API service for FinQuest - Financial Education Platform built with FastAPI.

## Setup

### Prerequisites

- Python 3.9+
- uv (package manager)

### Installation

1. Install dependencies:

```bash
uv sync
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Edit `.env` with your configuration

## Running the Application

### Development Mode

Run with hot reload:

```bash
uv run finquest-api
```

Or use uvicorn directly:

```bash
uv run uvicorn finquest_api.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
uv run uvicorn finquest_api.main:app --host 0.0.0.0 --port 8000
```

## API Documentation

Once the server is running, visit:

- **Interactive API docs (Swagger UI)**: http://localhost:8000/docs
- **Alternative API docs (ReDoc)**: http://localhost:8000/redoc
- **Health check**: http://localhost:8000/health

## Project Structure

```
src/finquest_api/
├── __init__.py          # Package initialization & main entry point
├── main.py              # FastAPI app instance & configuration
├── config.py            # Application settings
├── schemas.py           # Pydantic models for validation
└── routers/             # API route handlers
    ├── __init__.py
    ├── health.py        # Health check endpoints
    └── api.py           # Main API endpoints
```

## API Endpoints

### Root

- `GET /` - API root information

### Health

- `GET /health` - Health check
- `GET /ready` - Readiness check

### API v1

- `GET /api/v1/` - API v1 root

## Development

### Adding New Endpoints

1. Create a new router in `src/finquest_api/routers/`
2. Define your schemas in `src/finquest_api/schemas.py`
3. Include the router in `src/finquest_api/main.py`

### Adding Dependencies

```bash
uv add <package-name>
```

## Testing

```bash
# Install test dependencies (includes pytest-cov for coverage)
uv sync --group dev

# Run tests
uv run pytest

# Run tests with coverage report
uv run pytest --cov=src/finquest_api --cov-report=term-missing --cov-report=html

# Run tests with coverage summary only
uv run pytest --cov=src/finquest_api --cov-report=term-missing:skip-covered
```

Coverage reports:
- Terminal output: Shows coverage percentage and missing lines
- HTML report: Generated in `htmlcov/index.html` (open in browser for detailed view)

## Next Steps

- [ ] Add database integration (PostgreSQL/SQLite)
- [ ] Implement authentication & authorization
- [ ] Add user management endpoints
- [ ] Add portfolio management endpoints
- [ ] Add stock/market data endpoints
- [ ] Add gamification endpoints
- [ ] Add comprehensive error handling
- [ ] Add logging
- [ ] Add tests
- [ ] Add CI/CD pipeline
