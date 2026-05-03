import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Square, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { chatWithFrenchTutor, ChatMessage } from '@/api/openrouter';

// ─── Types ────────────────────────────────────────────────────────────────────

type ConversationStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

interface Turn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;
type Level = (typeof LEVELS)[number];

const TOPICS = [
  'Vie quotidienne',
  'Travail',
  'Voyages',
  'Shopping',
  'Nourriture',
  'Culture française',
  'Famille',
  'Loisirs',
] as const;
type Topic = (typeof TOPICS)[number];

// ─── Waveform bars (animated CSS) ─────────────────────────────────────────────

function WaveformBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-end justify-center gap-1 h-8">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-full transition-all ${
            active ? 'bg-red-400' : 'bg-blue-300'
          }`}
          style={{
            height: active ? `${20 + Math.sin(i * 0.9) * 14}px` : '6px',
            animation: active
              ? `waveBar 0.8s ease-in-out ${i * 0.1}s infinite alternate`
              : 'none',
          }}
        />
      ))}
      <style>{`
        @keyframes waveBar {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1.6); }
        }
      `}</style>
    </div>
  );
}

// ─── Status label ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ConversationStatus,
  { label: string; color: string }
> = {
  idle: { label: 'Prêt', color: 'text-gray-500' },
  listening: { label: 'Écoute...', color: 'text-red-500' },
  thinking: { label: 'Réflexion...', color: 'text-yellow-500' },
  speaking: { label: 'Parle...', color: 'text-blue-500' },
};

// ─── Main Component ────────────────────────────────────────────────────────────

export default function VoiceModeInterface() {
  const navigate = useNavigate();

  const [status, setStatus] = useState<ConversationStatus>('idle');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [level, setLevel] = useState<Level>('A2');
  const [topic, setTopic] = useState<Topic>('Vie quotidienne');
  const [apiError, setApiError] = useState<string | null>(null);
  const [conversationStarted, setConversationStarted] = useState(false);

  const transcriptBottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  const recognition = useSpeechRecognition();
  const synthesis = useSpeechSynthesis();

  const apiKeyMissing = !import.meta.env.VITE_OPENROUTER_API_KEY;

  // Auto-scroll transcript
  useEffect(() => {
    transcriptBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns]);

  // Track synthesis speaking state in status
  useEffect(() => {
    if (synthesis.isSpeaking) {
      setStatus('speaking');
    }
  }, [synthesis.isSpeaking]);

  // When synthesis finishes speaking, auto-start listening again (if conversation is active)
  const prevIsSpeaking = useRef(false);
  useEffect(() => {
    if (prevIsSpeaking.current && !synthesis.isSpeaking && conversationStarted) {
      // Brief pause then listen again
      const timer = setTimeout(() => {
        setStatus('idle');
      }, 400);
      return () => clearTimeout(timer);
    }
    prevIsSpeaking.current = synthesis.isSpeaking;
  }, [synthesis.isSpeaking, conversationStarted]);

  // Handle final transcript from speech recognition
  const handleUserSpeech = useCallback(
    async (userText: string) => {
      if (!userText.trim()) {
        setStatus('idle');
        return;
      }

      // Add user turn
      const userTurn: Turn = {
        id: crypto.randomUUID(),
        role: 'user',
        text: userText,
      };
      setTurns((prev) => [...prev, userTurn]);

      // Build message history
      messagesRef.current = [
        ...messagesRef.current,
        { role: 'user', content: userText },
      ];

      // Call OpenRouter
      setStatus('thinking');
      setApiError(null);

      try {
        const aiText = await chatWithFrenchTutor(
          messagesRef.current,
          level,
          topic
        );

        const aiTurn: Turn = {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: aiText,
        };
        setTurns((prev) => [...prev, aiTurn]);
        messagesRef.current = [
          ...messagesRef.current,
          { role: 'assistant', content: aiText },
        ];

        // Speak the response
        setStatus('speaking');
        synthesis.speak(aiText, 'fr-FR');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur inconnue';
        setApiError(msg);
        setStatus('idle');
      }
    },
    [level, topic, synthesis]
  );

  // React to finalised transcript
  const prevTranscript = useRef('');
  useEffect(() => {
    if (
      recognition.transcript &&
      recognition.transcript !== prevTranscript.current &&
      !recognition.isListening
    ) {
      prevTranscript.current = recognition.transcript;
      handleUserSpeech(recognition.transcript);
    }
  }, [recognition.transcript, recognition.isListening, handleUserSpeech]);

  // ── Controls ────────────────────────────────────────────────────────────────

  const startListening = useCallback(() => {
    if (!recognition.isSupported) return;
    synthesis.stop();
    setStatus('listening');
    recognition.start();
    if (!conversationStarted) setConversationStarted(true);
  }, [recognition, synthesis, conversationStarted]);

  const stopListening = useCallback(() => {
    recognition.stop();
    setStatus('idle');
  }, [recognition]);

  const endConversation = useCallback(() => {
    recognition.stop();
    synthesis.stop();
    setTurns([]);
    messagesRef.current = [];
    prevTranscript.current = '';
    setConversationStarted(false);
    setStatus('idle');
    setApiError(null);
  }, [recognition, synthesis]);

  const handleMicClick = () => {
    if (status === 'listening') {
      stopListening();
    } else if (status === 'idle' || status === 'speaking') {
      startListening();
    }
  };

  // ── Unsupported Browser ──────────────────────────────────────────────────────

  if (!recognition.isSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md text-center bg-white rounded-2xl shadow-xl p-8 space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">
            Navigateur non supporté
          </h2>
          <p className="text-gray-600">
            Le mode vocal nécessite l'API Web Speech, disponible dans{' '}
            <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong>.
            Veuillez utiliser l'un de ces navigateurs pour accéder à cette
            fonctionnalité.
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  // ── Missing API Key ──────────────────────────────────────────────────────────

  if (apiKeyMissing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-md text-center bg-white rounded-2xl shadow-xl p-8 space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">
            Clé API manquante
          </h2>
          <p className="text-gray-600">
            Veuillez définir{' '}
            <code className="bg-gray-100 px-1 rounded text-sm">
              VITE_OPENROUTER_API_KEY
            </code>{' '}
            dans votre fichier <code className="bg-gray-100 px-1 rounded text-sm">.env</code> pour activer le mode vocal.
          </p>
          <p className="text-sm text-gray-400">
            Obtenez une clé gratuite sur{' '}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline"
            >
              openrouter.ai/keys
            </a>
          </p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  // ── Main UI ─────────────────────────────────────────────────────────────────

  const statusCfg = STATUS_CONFIG[status];
  const isActive = status === 'listening' || status === 'thinking' || status === 'speaking';

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 space-y-6">
      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="text-gray-600"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Accueil
        </Button>
        <h1 className="text-xl font-bold text-gray-800">Mode Vocal</h1>
        {conversationStarted ? (
          <Button
            variant="outline"
            size="sm"
            onClick={endConversation}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <Square className="w-3 h-3 mr-1" />
            Terminer
          </Button>
        ) : (
          <div className="w-24" />
        )}
      </div>

      {/* Settings row */}
      {!conversationStarted && (
        <div className="w-full max-w-2xl bg-white/70 backdrop-blur rounded-2xl shadow-md p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Paramètres de la conversation
          </h2>
          <div className="flex flex-wrap gap-4">
            {/* Level */}
            <div className="space-y-1 flex-1 min-w-[120px]">
              <label className="text-xs font-medium text-gray-600">
                Niveau
              </label>
              <div className="flex gap-1">
                {LEVELS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      level === l
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic */}
            <div className="space-y-1 flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-gray-600">
                Thème
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value as Topic)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Conversation transcript */}
      {turns.length > 0 && (
        <div className="w-full max-w-2xl bg-white/70 backdrop-blur rounded-2xl shadow-md flex flex-col overflow-hidden max-h-72">
          <div className="p-3 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Conversation — {topic} · Niveau {level}
          </div>
          <div className="overflow-y-auto flex-1 p-4 space-y-3">
            {turns.map((turn) => (
              <div
                key={turn.id}
                className={`flex ${
                  turn.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    turn.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {turn.text}
                </div>
              </div>
            ))}
            <div ref={transcriptBottomRef} />
          </div>
        </div>
      )}

      {/* Interim transcript preview */}
      {recognition.interimTranscript && (
        <div className="w-full max-w-2xl">
          <p className="text-center text-sm text-gray-400 italic">
            {recognition.interimTranscript}
          </p>
        </div>
      )}

      {/* API error */}
      {apiError && (
        <div className="w-full max-w-2xl bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{apiError}</p>
        </div>
      )}

      {/* Recognition error */}
      {recognition.error && (
        <div className="w-full max-w-2xl bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700">
            Erreur de reconnaissance vocale : {recognition.error}
          </p>
        </div>
      )}

      {/* Central mic button area */}
      <div className="flex flex-col items-center gap-5 mt-4">
        {/* Waveform */}
        <WaveformBars active={isActive} />

        {/* Mic button */}
        <button
          onClick={handleMicClick}
          disabled={status === 'thinking'}
          aria-label={
            status === 'listening' ? 'Arrêter l'écoute' : 'Commencer à parler'
          }
          className={
            status === 'listening'
              ? 'relative rounded-full bg-red-500 p-8 shadow-2xl animate-pulse ring-4 ring-red-300 ring-offset-4 cursor-pointer'
              : status === 'thinking'
              ? 'relative rounded-full bg-yellow-400 p-8 shadow-xl cursor-not-allowed opacity-80'
              : 'relative rounded-full bg-blue-600 hover:bg-blue-500 p-8 shadow-xl transition-all cursor-pointer active:scale-95'
          }
        >
          {status === 'thinking' ? (
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          ) : status === 'listening' ? (
            <MicOff className="w-10 h-10 text-white" />
          ) : (
            <Mic className="w-10 h-10 text-white" />
          )}
        </button>

        {/* Status label */}
        <p className={`text-sm font-semibold ${statusCfg.color}`}>
          {statusCfg.label}
        </p>

        {/* Hint */}
        {status === 'idle' && !conversationStarted && (
          <p className="text-xs text-gray-400 text-center max-w-xs">
            Appuyez sur le micro et parlez en français. L'IA vous répondra et
            corrigera vos erreurs.
          </p>
        )}
      </div>
    </div>
  );
}
