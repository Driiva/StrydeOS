"""Route after confirmation conditional edge node."""

import logging
from ava_graph.graph.state import AvaState

logger = logging.getLogger(__name__)

MAX_PROPOSAL_ATTEMPTS = 4


def route_after_confirmation(state: AvaState) -> str:
    """
    Route after patient confirms or rejects proposed appointment slot.

    Logic:
    - If patient_confirmed=True → return "confirm_booking"
    - Else if attempt_count >= MAX_PROPOSAL_ATTEMPTS OR no more slots → return "end"
    - Else → return "propose_slot" (try next slot)

    Args:
        state: Current AvaState containing patient confirmation status and attempt count.

    Returns:
        str: One of "confirm_booking", "propose_slot", or "end".
    """
    logger.info(
        f"Routing after confirmation: confirmed={state['patient_confirmed']}, "
        f"attempt_count={state['attempt_count']}"
    )

    # Patient confirmed the slot
    if state["patient_confirmed"]:
        logger.info("Patient confirmed slot. Routing to confirm_booking.")
        return "confirm_booking"

    # Patient declined but we've exhausted attempts or no more slots
    has_more_slots = len(state["available_slots"]) > state["attempt_count"]
    if state["attempt_count"] >= MAX_PROPOSAL_ATTEMPTS or not has_more_slots:
        logger.warning(
            f"Max attempts reached or no more slots. "
            f"attempt_count={state['attempt_count']}, "
            f"has_more_slots={has_more_slots}. Ending call."
        )
        # Update response_message for graceful exit
        state["response_message"] = (
            "I apologize, but we weren't able to find a time that works for you today. "
            "Please contact the clinic directly and we'll find the perfect time."
        )
        return "end"

    # Patient declined but we have more slots to propose
    logger.info(
        f"Patient declined slot. Routing back to propose_slot. "
        f"attempt_count={state['attempt_count']}"
    )
    return "propose_slot"
