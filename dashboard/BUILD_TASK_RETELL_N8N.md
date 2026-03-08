# Build Task: Retell AI Voice Agent → n8n → StrydeOS (Firebase) Integration

## Context
StrydeOS is a clinic management system. We are integrating a Retell AI voice agent
(healthcare receptionist/check-in) with n8n for automation and StrydeOS as the
front-end/backend surface for staff to see call outcomes.

The Retell agent prompt is in `retell.md`. Two agents exist:
- Patient Screening (Conversation Flow)
- Healthcare Check-In (Single Prompt)

## Stack
- Frontend: React/Next.js
- Backend: Firebase (Firestore + Cloud Functions)
- Automation: n8n (self-hosted or cloud)
- Voice: Retell AI (agent already configured, voice = Cimo)
- Language: TypeScript

---

## Task 1: Firestore Data Model

Create a `voiceInteractions` collection in Firestore. Each document should have
the following fields. Add a helper file `/lib/firebase/voiceInteractions.ts`
with typed interfaces:

```typescript
interface VoiceInteraction {
  id: string;                  // Firestore auto-id
  patientId: string;
  callId: string;              // Retell call_id
  agentId: string;
  reasonForCall: string;
  outcome: 'booked' | 'escalated' | 'voicemail' | 'follow_up_required' | 'resolved' | null;
  urgency: 'low' | 'medium' | 'high' | 'urgent' | null;
  transcriptUrl: string | null;
  recordingUrl: string | null;
  durationSeconds: number | null;
  callStatus: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```
