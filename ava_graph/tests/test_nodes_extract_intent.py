import pytest
from ava_graph.graph.nodes.extract_intent import extract_intent
from ava_graph.graph.state import AvaState


@pytest.mark.asyncio
async def test_extract_intent_parses_webhook_payload():
    """Verify extract_intent parses ElevenLabs webhook into state."""
    state = AvaState(
        patient_name="",
        requested_service="",
        preferred_time="",
        clinic_id="clinic_001",
        pms_type="writeupp",
        available_slots=[],
        confirmed_slot="",
        patient_confirmed=False,
        response_message="",
        session_id="session_abc123",
        attempt_count=0,
        messages=[],
    )

    webhook_payload = {
        "patient_name": "John Doe",
        "requested_service": "Physiotherapy Assessment",
        "preferred_time": "Tuesday afternoon",
        "session_id": "session_abc123",
    }

    result = await extract_intent(state, webhook_payload)

    assert result["patient_name"] == "John Doe"
    assert result["requested_service"] == "Physiotherapy Assessment"
    assert result["session_id"] == "session_abc123"
    assert len(result["messages"]) > 0


@pytest.mark.asyncio
async def test_extract_intent_preserves_clinic_id_and_pms_type():
    """Verify extract_intent preserves clinic_id and pms_type from state."""
    state = AvaState(
        patient_name="",
        requested_service="",
        preferred_time="",
        clinic_id="clinic_spires",
        pms_type="cliniko",
        available_slots=[],
        confirmed_slot="",
        patient_confirmed=False,
        response_message="",
        session_id="session_xyz789",
        attempt_count=0,
        messages=[],
    )

    webhook_payload = {
        "patient_name": "Jane Smith",
        "requested_service": "Follow-up Assessment",
        "preferred_time": "Wednesday morning",
        "session_id": "session_xyz789",
    }

    result = await extract_intent(state, webhook_payload)

    assert result["clinic_id"] == "clinic_spires"
    assert result["pms_type"] == "cliniko"


@pytest.mark.asyncio
async def test_extract_intent_adds_message_to_transcript():
    """Verify extract_intent appends entry to messages transcript."""
    state = AvaState(
        patient_name="",
        requested_service="",
        preferred_time="",
        clinic_id="clinic_001",
        pms_type="writeupp",
        available_slots=[],
        confirmed_slot="",
        patient_confirmed=False,
        response_message="",
        session_id="session_test",
        attempt_count=0,
        messages=["Initial message"],
    )

    webhook_payload = {
        "patient_name": "Bob Johnson",
        "requested_service": "Assessment",
        "preferred_time": "Monday",
        "session_id": "session_test",
    }

    result = await extract_intent(state, webhook_payload)

    assert len(result["messages"]) >= 2
    assert "Bob Johnson" in result["messages"][-1]


@pytest.mark.asyncio
async def test_extract_intent_handles_missing_fields():
    """Verify extract_intent gracefully handles missing webhook fields."""
    state = AvaState(
        patient_name="",
        requested_service="",
        preferred_time="",
        clinic_id="clinic_001",
        pms_type="writeupp",
        available_slots=[],
        confirmed_slot="",
        patient_confirmed=False,
        response_message="",
        session_id="session_test",
        attempt_count=0,
        messages=[],
    )

    webhook_payload = {
        "patient_name": "Alice Wonder",
        # Missing requested_service and preferred_time
        "session_id": "session_test",
    }

    result = await extract_intent(state, webhook_payload)

    assert result["patient_name"] == "Alice Wonder"
    assert result["requested_service"] == ""  # Should remain empty
    assert result["preferred_time"] == ""  # Should remain empty
    assert len(result["messages"]) > 0
