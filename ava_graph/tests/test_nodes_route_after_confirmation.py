"""Tests for route_after_confirmation node."""

import pytest
from ava_graph.graph.nodes.route_after_confirmation import route_after_confirmation
from ava_graph.graph.state import AvaState


def test_route_after_confirmation_confirms_if_patient_confirmed():
    """Verify routing to confirm_booking when patient confirms."""
    state = AvaState(
        patient_name="John Doe",
        requested_service="Physio",
        preferred_time="Tuesday",
        clinic_id="clinic_001",
        pms_type="writeupp",
        available_slots=["2026-03-16T14:00:00"],
        confirmed_slot="2026-03-16T14:00:00",
        patient_confirmed=True,
        response_message="Does Tuesday work?",
        session_id="session_abc",
        attempt_count=1,
        messages=[],
    )

    result = route_after_confirmation(state)
    assert result == "confirm_booking"


def test_route_after_confirmation_loops_if_patient_declines():
    """Verify routing back to check_availability when patient declines."""
    state = AvaState(
        patient_name="John Doe",
        requested_service="Physio",
        preferred_time="Tuesday",
        clinic_id="clinic_001",
        pms_type="writeupp",
        available_slots=["2026-03-16T14:00:00", "2026-03-16T15:00:00"],
        confirmed_slot="2026-03-16T14:00:00",
        patient_confirmed=False,
        response_message="Does Tuesday work?",
        session_id="session_abc",
        attempt_count=1,
        messages=[],
    )

    result = route_after_confirmation(state)
    assert result == "propose_slot"


def test_route_after_confirmation_cancels_if_too_many_attempts():
    """Verify cancellation if patient rejects too many slots."""
    state = AvaState(
        patient_name="John Doe",
        requested_service="Physio",
        preferred_time="Tuesday",
        clinic_id="clinic_001",
        pms_type="writeupp",
        available_slots=["2026-03-16T14:00:00"],
        confirmed_slot="2026-03-16T14:00:00",
        patient_confirmed=False,
        response_message="Does Tuesday work?",
        session_id="session_abc",
        attempt_count=5,  # Too many
        messages=[],
    )

    result = route_after_confirmation(state)
    assert result == "end"
