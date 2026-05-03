import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mic, MicOff, Square } from 'lucide-react';
import { api } from '@/api/backendClient';
import type { EndSessionResponse, ConversationTurn } from '@/api/backendClient';
import VoiceChatFeedback from './VoiceChatFeedback';
import { useToast } from '@/hooks/use-toast';

type Phase =
  | 'idle'
  | 'starting'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'feedback';

interface VoiceChatProps {
  onBack: () => void;
}

const SpeechRecognitionAPI: typeof SpeechRecognition | undefined =
  (window as unknown as Record<string, unknown>).SpeechRecognition as typeof SpeechRecognition |
  undefined ||
  (window as unknown as Record<string, unknown>).webkitSpeechRecognition as typeof SpeechRecognition |
  undefined;

const hasSpeechRecognition = typeof SpeechRecognitionAPI !== 'undefined';

const VoiceChat = ({ onBack }: VoiceChatProps) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [examType, setExamType] = useState('');
  const [level, setLevel] = useState('');
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [feedback, setFeedback] = useState<EndSessionResponse | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [turnNumber, setTurnNumber] = useState(0);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  // Auto-scroll to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, liveTranscript]);

  const speakText = useCallback(
    (text: string, onDone?: () => void) => {
      const synth = synthRef.current;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';

      const voices = synth.getVoices();
      const frVoice = voices.find((v) => v.lang.startsWith('fr'));
      if (frVoice) utterance.voice = frVoice;

      utterance.onend = () => {
        if (onDone) onDone();
      };
      synth.speak(utterance);
    },
    [],
  );

  const startRecognition = useCallback(() => {
    if (!hasSpeechRecognition || !SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          interim += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setLiveTranscript(interim);
    };

    recognition.onend = () => {
      setIsRecording(false);
      const finalTranscript = liveTranscript;
      if (finalTranscript.trim()) {
        setLiveTranscript('');
        handleSendMessage(finalTranscript.trim());
      } else {
        // No speech detected — stay in listening phase
        setPhase('speaking');
      }
    };

    recognition.onerror = () => {
      setIsRecording(false);
      setPhase('speaking');
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setPhase('listening');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveTranscript]);

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!sessionId) return;
      setPhase('processing');
      const newUserTurn: ConversationTurn = { role: 'user', content: message };
      setTurns((prev) => [...prev, newUserTurn]);

      try {
        const response = await api.sendVoiceMessage(sessionId, {
          user_message: message,
          turn_number: turnNumber,
        });
        const agentTurn: ConversationTurn = {
          role: 'assistant',
          content: response.agent_message,
        };
        setTurns((prev) => [...prev, agentTurn]);
        setTurnNumber(response.turn_number);
        setPhase('speaking');
        speakText(response.agent_message, () => {
          if (hasSpeechRecognition) {
            startRecognition();
          }
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur réseau';
        setError(msg);
        setPhase('speaking');
        toast({ title: 'Erreur', description: msg, variant: 'destructive' });
      }
    },
    [sessionId, turnNumber, speakText, startRecognition, toast],
  );

  const handleStart = async () => {
    setPhase('starting');
    setError(null);
    setTurns([]);
    setTurnNumber(0);
    try {
      const response = await api.startVoiceSession({});
      setSessionId(response.session_id);
      setTopic(response.topic);
      setExamType(response.exam_type);
      setLevel(response.level);

      const greetingTurn: ConversationTurn = {
        role: 'assistant',
        content: response.greeting,
      };
      setTurns([greetingTurn]);
      setPhase('speaking');
      speakText(response.greeting, () => {
        if (hasSpeechRecognition) {
          startRecognition();
        }
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du démarrage';
      setError(msg);
      setPhase('idle');
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    }
  };

  const handleEndSession = async () => {
    if (!sessionId) return;
    setPhase('processing');
    synthRef.current.cancel();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    try {
      const result = await api.endVoiceSession(sessionId);
      setFeedback(result);
      setPhase('feedback');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la fin de session';
      setError(msg);
      setPhase('speaking');
      toast({ title: 'Erreur', description: msg, variant: 'destructive' });
    }
  };

  const handleManualSend = () => {
    if (!textInput.trim()) return;
    const msg = textInput.trim();
    setTextInput('');
    handleSendMessage(msg);
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      startRecognition();
    }
  };

  const handleRestart = () => {
    setFeedback(null);
    setSessionId(null);
    setTurns([]);
    setTopic('');
    setPhase('idle');
  };

  const phaseLabel: Record<Phase, string> = {
    idle: '',
    starting: 'Démarrage...',
    listening: 'Écoute en cours...',
    processing: 'Traitement...',
    speaking: 'Prêt',
    feedback: 'Session terminée',
  };

  if (phase === 'feedback' && feedback) {
    return (
      <VoiceChatFeedback
        feedback={feedback}
        transcript={turns}
        onRestart={handleRestart}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Retour</span>
        </button>
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-green-600" />
          <h1 className="text-lg font-bold text-gray-900">Conversation Vocale</h1>
        </div>
        <div className="w-16" />
      </div>

      {/* Topic + Level */}
      {topic && (
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
            {topic}
          </Badge>
          <Badge variant="outline" className="text-xs border-green-300 text-green-700">
            {level}
          </Badge>
          <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
            {examType}
          </Badge>
          {phase !== 'idle' && (
            <Badge className="text-xs bg-gray-100 text-gray-600">{phaseLabel[phase]}</Badge>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {phase === 'idle' && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Mic className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Prêt à pratiquer ?</h2>
              <p className="text-gray-500 text-sm mt-1 max-w-xs">
                L'IA choisira un sujet adapté à votre niveau et conduira la conversation en français.
              </p>
            </div>
            <Button
              onClick={handleStart}
              className="bg-green-600 hover:bg-green-700 text-white px-6"
            >
              <Mic className="w-4 h-4 mr-2" />
              Commencer la conversation
            </Button>
          </div>
        )}

        {phase === 'starting' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" />
              <p className="text-sm">Démarrage de la session...</p>
            </div>
          </div>
        )}

        {phase !== 'idle' && phase !== 'starting' && (
          <>
            {turns.map((turn, i) => {
              const isAgent = turn.role === 'assistant';
              return (
                <div key={i} className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      isAgent
                        ? 'bg-blue-500 text-white rounded-tl-sm'
                        : 'bg-green-500 text-white rounded-tr-sm'
                    }`}
                  >
                    {turn.content}
                  </div>
                </div>
              );
            })}

            {/* Live transcript bubble */}
            {isRecording && liveTranscript && (
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm bg-green-200 text-green-900 rounded-tr-sm opacity-80 italic">
                  {liveTranscript}
                </div>
              </div>
            )}

            {/* Processing indicator */}
            {phase === 'processing' && (
              <div className="flex justify-start">
                <div className="bg-blue-100 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Controls */}
      {phase !== 'idle' && phase !== 'starting' && (
        <div className="border-t border-gray-200 pt-3 space-y-3">
          {/* Voice controls */}
          <div className="flex gap-2">
            {hasSpeechRecognition ? (
              <Button
                onClick={handleToggleRecording}
                disabled={phase === 'processing' || phase === 'starting'}
                className={`flex-1 ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-4 h-4 mr-2" />
                    Arrêter
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Parler
                  </>
                )}
              </Button>
            ) : (
              <div className="flex-1 flex items-center gap-2">
                <MicOff className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">Micro non supporté par ce navigateur</span>
              </div>
            )}

            <Button
              onClick={handleEndSession}
              disabled={phase === 'processing' || phase === 'starting' || turns.length < 2}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Terminer
            </Button>
          </div>

          {/* Text input fallback */}
          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-400 shrink-0">
              {hasSpeechRecognition ? 'ou tapez votre réponse' : 'Tapez votre réponse'}
            </span>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleManualSend();
              }}
              disabled={phase === 'processing'}
              placeholder="Votre réponse en français..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50"
            />
            <Button
              onClick={handleManualSend}
              disabled={!textInput.trim() || phase === 'processing'}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Envoyer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceChat;
