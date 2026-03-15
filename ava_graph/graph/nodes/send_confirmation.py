"""Send booking confirmation SMS and generate final response."""

import logging
from datetime import datetime
from typing import Optional

from ava_graph.graph.state import AvaState
from ava_graph.tools import send_booking_confirmation_sms

logger = logging.getLogger(__name__)


async def send_confirmation(state: AvaState) -> AvaState:
    """
    Send SMS confirmation to patient and generate final spoken response.

    Args:
        state: Current Ava workflow state

    Returns:
        Updated state with SMS sent and final response message
    """
    try:
        # Parse ISO datetime to readable format
        slot_dt = datetime.fromisoformat(state["confirmed_slot"])
        slot_display = slot_dt.strftime("%A, %B %d at %I:%M %p").lstrip("0").replace(" 0", " ")

        # Get clinic name from clinic_id (for now, use a placeholder)
        # In production, this would be looked up from Firestore
        clinic_name = "Your Clinic"

        # Send SMS if phone number is available
        sms_id = None
        if state.get("patient_phone"):
            try:
                sms_id = await send_booking_confirmation_sms(
                    patient_phone=state["patient_phone"],
                    patient_name=state["patient_name"],
                    booking_slot=slot_display,
                    clinic_name=clinic_name,
                )
                logger.info(
                    f"SMS sent successfully. SID: {sms_id}, "
                    f"Patient: {state['patient_name']}, Slot: {slot_display}"
                )
            except Exception as e:
                logger.error(f"Failed to send SMS: {e}", exc_info=True)
                # Don't fail the entire confirmation if SMS fails
        else:
            logger.warning("No patient phone number provided, skipping SMS")

        # Generate warm, conversational final response
        response = (
            f"Perfect, {state['patient_name']}! You're all booked in for {slot_display}. "
            f"You'll get a text confirmation shortly. Thanks, and see you then!"
        )

        # Update state with final response and add to messages
        updated_state = dict(state)
        updated_state["response_message"] = response
        updated_state["messages"] = state["messages"] + [response]

        return updated_state

    except ValueError as e:
        logger.error(f"Failed to parse confirmed_slot: {e}", exc_info=True)
        fallback_response = (
            f"Your booking is confirmed, {state['patient_name']}. "
            f"You'll receive a confirmation text shortly. Thank you!"
        )
        updated_state = dict(state)
        updated_state["response_message"] = fallback_response
        updated_state["messages"] = state["messages"] + [fallback_response]
        return updated_state
    except Exception as e:
        logger.error(f"Unexpected error in send_confirmation: {e}", exc_info=True)
        fallback_response = "Your booking is confirmed. You'll receive a confirmation shortly. Thank you!"
        updated_state = dict(state)
        updated_state["response_message"] = fallback_response
        updated_state["messages"] = state["messages"] + [fallback_response]
        return updated_state
