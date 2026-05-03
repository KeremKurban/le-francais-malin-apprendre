"""
Voice chat service for French conversation practice.
Handles session management, LLM calls, and feedback generation.
"""
import json
import re
from datetime import datetime, timezone
from uuid import UUID

from openai import AsyncOpenAI
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.voice_session import VoiceSession
from app.models.skill_level import SkillLevel
from app.models.weakness import Weakness
from app.models.session import LearningSession
from app.models.user import User
from app.prompts.voice_chat_prompts import VOICE_TUTOR_SYSTEM_PROMPT, VOICE_FEEDBACK_SYSTEM_PROMPT

settings = get_settings()
client = AsyncOpenAI(
    api_key=settings.openrouter_api_key,
    base_url=settings.openrouter_base_url,
)

# Fallback topic lists when no weakness data is available
_FALLBACK_TOPICS: dict[str, dict[str, list[str]]] = {
    "FIDE": {
        "A1": [
            "Se présenter et présenter sa famille",
            "Parler de son logement",
            "Les courses au supermarché",
            "Demander son chemin en ville",
            "Les horaires et rendez-vous",
        ],
        "A2": [
            "La santé et les visites chez le médecin",
            "Trouver un emploi en Suisse",
            "Les transports publics",
            "Faire des démarches administratives",
            "La vie quotidienne au travail",
        ],
        "B1": [
            "Négocier des conditions de travail",
            "Comprendre et expliquer des règlements",
            "Résoudre un problème avec un voisin",
            "Parler de l'intégration en Suisse",
            "Les droits et devoirs des résidents",
        ],
        "B2": [
            "Débattre des politiques d'immigration",
            "Analyser le système de santé suisse",
            "Discuter des enjeux de l'emploi en Suisse",
            "La démocratie directe et les votations",
            "Comparer les systèmes éducatifs",
        ],
    },
    "DELF": {
        "A1": [
            "Se présenter et parler de ses goûts",
            "Décrire sa routine quotidienne",
            "Commander au restaurant",
            "Parler de la météo",
            "Les loisirs et le temps libre",
        ],
        "A2": [
            "Parler de ses vacances et voyages",
            "Décrire son quartier et sa ville",
            "Les projets d'avenir",
            "La famille et les relations",
            "Les habitudes alimentaires",
        ],
        "B1": [
            "Donner son opinion sur un sujet d'actualité",
            "Parler de l'environnement et de l'écologie",
            "Décrire une expérience marquante",
            "Les médias et les réseaux sociaux",
            "Le travail et les études",
        ],
        "B2": [
            "Défendre un point de vue sur l'éducation",
            "Analyser des questions de société",
            "La mondialisation et ses effets",
            "Culture et identité",
            "Les nouvelles technologies et la société",
        ],
    },
}


def _extract_json(text: str) -> dict:
    """Try several strategies to pull a JSON object out of a model response."""
    text = text.strip()
    # 1. Direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # 2. Fenced code block
    fence = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.DOTALL)
    if fence:
        try:
            return json.loads(fence.group(1))
        except json.JSONDecodeError:
            pass
    # 3. First { ... last }
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end > start:
        try:
            return json.loads(text[start: end + 1])
        except json.JSONDecodeError:
            pass
    # 4. Fallback minimal response
    score_m = re.search(r'"score"\s*:\s*(\d+)', text)
    fb_m = re.search(r'"overall_feedback"\s*:\s*"((?:[^"\\]|\\.)+)"', text)
    return {
        "score": int(score_m.group(1)) if score_m else 50,
        "overall_feedback": fb_m.group(1).replace('\\"', '"') if fb_m else "Évaluation partielle reçue.",
        "grammar_errors": [],
        "vocabulary_suggestions": [],
        "strengths": [],
        "improvements": [],
        "session_summary": "Session complétée.",
    }


async def start_voice_session(
    user: User,
    db: AsyncSession,
    exam_type: str | None = None,
    level: str | None = None,
) -> VoiceSession:
    """Create a new voice session, picking topic based on user weaknesses."""
    # Resolve exam_type and level from user profile if not provided
    resolved_exam = exam_type or user.target_exam
    if resolved_exam == "BOTH":
        resolved_exam = "DELF"
    resolved_level = level or user.target_level

    # Try to find the weakest skill (speaking/communication)
    skill_result = await db.execute(
        select(SkillLevel)
        .where(
            SkillLevel.user_id == user.id,
            SkillLevel.skill.in_(["speaking", "communication"]),
        )
        .order_by(SkillLevel.score_history)
    )
    # (used to inform topic selection, not directly needed below)

    # Pick topic: use weakness with highest error_count if available
    weakness_result = await db.execute(
        select(Weakness)
        .where(Weakness.user_id == user.id)
        .order_by(desc(Weakness.error_count))
        .limit(1)
    )
    top_weakness = weakness_result.scalar_one_or_none()

    topic: str
    if top_weakness is not None:
        # Use the topic relationship — load topic name
        from app.models.topic import Topic as TopicModel  # avoid circular at module level
        topic_result = await db.execute(
            select(TopicModel).where(TopicModel.id == top_weakness.topic_id)
        )
        topic_model = topic_result.scalar_one_or_none()
        topic = topic_model.name if topic_model else _pick_fallback_topic(resolved_exam, resolved_level)
    else:
        topic = _pick_fallback_topic(resolved_exam, resolved_level)

    # Get past 3 session summaries for memory context
    past_result = await db.execute(
        select(VoiceSession)
        .where(
            VoiceSession.user_id == user.id,
            VoiceSession.status == "completed",
            VoiceSession.summary.isnot(None),
        )
        .order_by(desc(VoiceSession.created_at))
        .limit(3)
    )
    past_sessions = past_result.scalars().all()
    past_context = (
        "\n".join(f"- {s.summary}" for s in past_sessions)
        if past_sessions
        else "Aucune session précédente."
    )

    session = VoiceSession(
        user_id=user.id,
        status="active",
        exam_type=resolved_exam,
        level=resolved_level,
        topic_chosen=topic,
        turns=[],
    )
    # Store past_context as a transient attribute for use during the same request
    session._past_context = past_context  # type: ignore[attr-defined]
    db.add(session)
    await db.flush()
    return session


def _pick_fallback_topic(exam_type: str, level: str) -> str:
    """Pick a topic from the hardcoded fallback list."""
    import random
    topics = _FALLBACK_TOPICS.get(exam_type, _FALLBACK_TOPICS["DELF"])
    level_topics = topics.get(level, topics.get("B1", ["Se présenter"]))
    return random.choice(level_topics)


async def chat_turn(session_id: UUID, user_message: str, db: AsyncSession) -> str:
    """Process one turn of conversation and return the agent response."""
    session_result = await db.execute(
        select(VoiceSession).where(VoiceSession.id == session_id)
    )
    session = session_result.scalar_one_or_none()
    if not session:
        raise ValueError(f"VoiceSession {session_id} not found")
    if session.status != "active":
        raise ValueError(f"VoiceSession {session_id} is not active")

    # Get past context (try attribute first, then reconstruct from DB)
    past_context: str
    if hasattr(session, "_past_context") and session._past_context:  # type: ignore[attr-defined]
        past_context = session._past_context  # type: ignore[attr-defined]
    else:
        past_result = await db.execute(
            select(VoiceSession)
            .where(
                VoiceSession.user_id == session.user_id,
                VoiceSession.status == "completed",
                VoiceSession.summary.isnot(None),
                VoiceSession.id != session.id,
            )
            .order_by(desc(VoiceSession.created_at))
            .limit(3)
        )
        past_sessions = past_result.scalars().all()
        past_context = (
            "\n".join(f"- {s.summary}" for s in past_sessions)
            if past_sessions
            else "Aucune session précédente."
        )

    # Current turns list (mutable copy)
    turns: list = list(session.turns or [])

    is_greeting = user_message == "__GREET__"

    if not is_greeting:
        # Append user turn
        turns.append({
            "role": "user",
            "content": user_message,
            "ts": datetime.now(timezone.utc).isoformat(),
        })

    # Build messages for LLM
    system_prompt = VOICE_TUTOR_SYSTEM_PROMPT.format(
        topic=session.topic_chosen or "Conversation générale",
        level=session.level,
        exam_type=session.exam_type,
        past_context=past_context,
    )

    messages: list[dict] = [{"role": "system", "content": system_prompt}]
    for turn in turns:
        messages.append({"role": turn["role"], "content": turn["content"]})

    if is_greeting:
        messages.append({
            "role": "user",
            "content": "Bonjour, je suis prêt à commencer la conversation.",
        })

    api_response = await client.chat.completions.create(
        model=settings.openrouter_model,
        max_tokens=512,
        messages=messages,  # type: ignore[arg-type]
    )

    agent_text = api_response.choices[0].message.content or ""

    # Append agent turn (only if not greeting trigger — we don't add the fake user message)
    turns.append({
        "role": "assistant",
        "content": agent_text,
        "ts": datetime.now(timezone.utc).isoformat(),
    })

    session.turns = turns
    await db.flush()
    return agent_text


async def end_voice_session(session_id: UUID, db: AsyncSession) -> dict:
    """End the session, generate feedback, and store it."""
    session_result = await db.execute(
        select(VoiceSession).where(VoiceSession.id == session_id)
    )
    session = session_result.scalar_one_or_none()
    if not session:
        raise ValueError(f"VoiceSession {session_id} not found")

    session.status = "completed"
    session.ended_at = datetime.now(timezone.utc)

    # Build transcript string
    turns: list = list(session.turns or [])
    transcript_lines = []
    for turn in turns:
        role_label = "Apprenant" if turn["role"] == "user" else "Tuteur"
        transcript_lines.append(f"{role_label}: {turn['content']}")
    transcript_text = "\n".join(transcript_lines)

    # Build feedback prompt
    feedback_user_message = f"""\
Voici la transcription complète d'une session de conversation française.
Niveau: {session.level} | Examen: {session.exam_type} | Sujet: {session.topic_chosen}

TRANSCRIPTION:
{transcript_text}

Analyse uniquement les interventions de l'apprenant (lignes "Apprenant:").
Retourne uniquement le JSON demandé, sans texte autour.
"""

    api_response = await client.chat.completions.create(
        model=settings.openrouter_model,
        max_tokens=2048,
        messages=[
            {"role": "system", "content": VOICE_FEEDBACK_SYSTEM_PROMPT},
            {"role": "user", "content": feedback_user_message},
        ],
    )

    raw_content = api_response.choices[0].message.content or ""
    feedback = _extract_json(raw_content)

    session.feedback = feedback
    session.score = float(feedback.get("score", 0))
    session.summary = feedback.get("session_summary", "")

    await db.flush()
    return feedback


async def get_user_sessions(user_id: UUID, db: AsyncSession) -> list[VoiceSession]:
    """Return all voice sessions for user, newest first, limit 20."""
    result = await db.execute(
        select(VoiceSession)
        .where(VoiceSession.user_id == user_id)
        .order_by(desc(VoiceSession.created_at))
        .limit(20)
    )
    return list(result.scalars().all())
