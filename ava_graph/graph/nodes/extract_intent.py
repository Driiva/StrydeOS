"""Extract intent node for Ava booking agent.

First node in the workflow that parses the inbound ElevenLabs webhook into structured state.
Extracts patient intent fields from webhook payload and updates conversation transcript.
"""

import logging
from typing import Any

from ava_graph.graph.state import AvaState

logger = logging.getLogger(__name__)


async def extract_intent(state: AvaState, webhook_payload: dict) -> AvaState:
    """Extract patient intent from ElevenLabs webhook payload.

    Parses incoming webhook data and updates state with extracted fields:
    - patient_name: Patient's name from webhook
    - requested_service: Service type requested (e.g., "Physio Assessment")
    - preferred_time: Patient's time preference (e.g., "Tuesday afternoon")
    - session_id: Unique identifier for checkpoint threading (preserved from webhook)

    Preserves existing state fields (clinic_id, pms_type) and appends message to transcript.
    Handles missing fields gracefully by leaving corresponding state fields unchanged.

    Args:
        state: Current AvaState containing clinic_id, pms_type, and messages
        webhook_payload: Dict from ElevenLabs webhook with patient intent data

    Returns:
        Updated AvaState with extracted intent fields and updated messages transcript
    """
    logger.debug(
        f"Extracting intent from webhook for session {state['session_id']}",
    )

    # Extract fields from webhook, with fallback to current state values
    patient_name = webhook_payload.get("patient_name", state["patient_name"])
    requested_service = webhook_payload.get(
        "requested_service",
        state["requested_service"],
    )
    preferred_time = webhook_payload.get("preferred_time", state["preferred_time"])

    # Session ID should come from webhook but preserve from state as fallback
    session_id = webhook_payload.get("session_id", state["session_id"])

    logger.info(
        f"Intent extracted: patient={patient_name}, service={requested_service}, "
        f"time={preferred_time}",
    )

    # Build message for transcript
    transcript_entry = (
        f"Intent received from {patient_name}: "
        f"service={requested_service}, preferred_time={preferred_time}"
    )

    # Update state with extracted fields
    updated_state: AvaState = {
        **state,
        "patient_name": patient_name,
        "requested_service": requested_service,
        "preferred_time": preferred_time,
        "session_id": session_id,
        "messages": state["messages"] + [transcript_entry],
    }

    logger.debug(f"State updated. Message count: {len(updated_state['messages'])}")

    return updated_state
