"""Tests for send_confirmation node."""

import pytest
from unittest.mock import patch, AsyncMock
from ava_graph.graph.nodes.send_confirmation import send_confirmation
from ava_graph.graph.state import AvaState


@pytest.mark.asyncio
async def test_send_confirmation_sends_sms_and_returns_response():
    """Verify send_confirmation sends SMS and generates final response."""
    state = AvaState(
        patient_name="John Doe",
        patient_phone="07700000000",
        requested_service="Physio",
        preferred_time="Tuesday",
        clinic_id="clinic_001",
        pms_type="writeupp",
        available_slots=[],
        confirmed_slot="2026-03-16T14:00:00",
        patient_confirmed=True,
        response_message="Great!",
        session_id="session_abc",
        attempt_count=1,
        messages=[],
        booking_id="booking_123",
    )

    with patch("ava_graph.graph.nodes.send_confirmation.send_booking_confirmation_sms") as mock_sms:
        mock_sms.return_value = "sms_id_123"

        result = await send_confirmation(state)

        assert "Perfect" in result["response_message"] or "confirmed" in result["response_message"].lower()
        mock_sms.assert_called_once()
