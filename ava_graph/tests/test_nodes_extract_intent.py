import pytest
from ava_graph.graph.nodes.extract_intent import extract_intent
from ava_graph.graph.state import AvaState


@pytest.mark.asyncio
async def test_extract_intent_parses_webhook_payload():
    """Verify extract_intent preserves webhook fields and adds transcript entry."""
    state = AvaState(
        patient_name="John Doe",
        requested_service="Physiotherapy Assessment",
        preferred_time="Tuesday afternoon",
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

    result = await extract_intent(state)

    assert result["patient_name"] == "John Doe"
    assert result["requested_service"] == "Physiotherapy Assessment"
    assert result["session_id"] == "session_abc123"
    assert len(result["messages"]) > 0


@pytest.mark.asyncio
async def test_extract_intent_preserves_clinic_id_and_pms_type():
    """Verify extract_intent preserves clinic_id and pms_type from state."""
    state = AvaState(
        patient_name="Jane Smith",
        requested_service="Follow-up Assessment",
        preferred_time="Wednesday morning",
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

    result = await extract_intent(state)

    assert result["clinic_id"] == "clinic_spires"
    assert result["pms_type"] == "cliniko"


@pytest.mark.asyncio
async def test_extract_intent_adds_message_to_transcript():
    """Verify extract_intent appends entry to messages transcript."""
    state = AvaState(
        patient_name="Bob Johnson",
        requested_service="Assessment",
        preferred_time="Monday",
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

    result = await extract_intent(state)

    assert len(result["messages"]) >= 2
    assert "Bob Johnson" in result["messages"][-1]


@pytest.mark.asyncio
async def test_extract_intent_handles_missing_fields():
    """Verify extract_intent gracefully handles empty webhook fields."""
    state = AvaState(
        patient_name="Alice Wonder",
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

    result = await extract_intent(state)

    assert result["patient_name"] == "Alice Wonder"
    assert result["requested_service"] == ""  # Should remain empty
    assert result["preferred_time"] == ""  # Should remain empty
    assert len(result["messages"]) > 0
