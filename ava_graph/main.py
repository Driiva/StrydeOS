"""FastAPI application for Ava webhook handler."""

import logging

from fastapi import FastAPI

from ava_graph.api.routes import router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Ava Webhook Handler",
    description="FastAPI webhook endpoint for Ava booking workflow",
    version="1.0.0",
)

# Include routes
app.include_router(router)

logger.info("Ava FastAPI application initialized")
