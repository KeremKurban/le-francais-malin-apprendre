import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { EndSessionResponse, ConversationTurn } from '@/api/backendClient';

interface VoiceChatFeedbackProps {
  feedback: EndSessionResponse;
  transcript: ConversationTurn[];
  onRestart: () => void;
  onBack: () => void;
}

const ScoreCircle = ({ score }: { score: number }) => {
  const color =
    score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';
  const ring =
    score >= 80 ? 'border-green-500' : score >= 60 ? 'border-yellow-500' : 'border-red-500';
  return (
    <div
      className={`w-24 h-24 rounded-full border-4 ${ring} flex items-center justify-center mx-auto`}
    >
      <span className={`text-3xl font-bold ${color}`}>{Math.round(score)}</span>
    </div>
  );
};

const VoiceChatFeedback = ({
  feedback,
  transcript,
  onRestart,
  onBack,
}: VoiceChatFeedbackProps) => {
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-gray-900">Session terminée !</h2>
        <ScoreCircle score={feedback.score} />
        <p className="text-gray-600">{feedback.overall_feedback}</p>
      </div>

      {/* Strengths */}
      {feedback.strengths.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-800 text-base">Points forts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {feedback.strengths.map((strength, i) => (
              <div key={i} className="flex items-start gap-2 text-green-700 text-sm">
                <span className="mt-0.5">✅</span>
                <span>{strength}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Grammar Errors */}
      {feedback.grammar_errors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-800 text-base">Erreurs de grammaire</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {feedback.grammar_errors.map((err, i) => (
              <div key={i} className="bg-white rounded-lg p-3 border border-red-100 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm">❌</span>
                  <span className="text-sm text-red-700 line-through">{err.original}</span>
                  <span className="text-gray-400">→</span>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {err.correction}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 ml-5">{err.explanation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Vocabulary Suggestions */}
      {feedback.vocabulary_suggestions.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-800 text-base">Vocabulaire</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {feedback.vocabulary_suggestions.map((sug, i) => (
              <div key={i} className="bg-white rounded-lg p-3 border border-blue-100 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm">💡</span>
                  <span className="text-sm text-gray-700">"{sug.original}"</span>
                  <span className="text-gray-400">→</span>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    "{sug.better}"
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 ml-5">{sug.why}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Improvements */}
      {feedback.improvements.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-yellow-800 text-base">Axes d'amélioration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {feedback.improvements.map((imp, i) => (
              <div key={i} className="flex items-start gap-2 text-yellow-700 text-sm">
                <span className="mt-0.5">📌</span>
                <span>{imp}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Transcript (collapsible) */}
      <Card>
        <CardHeader className="pb-2">
          <button
            onClick={() => setTranscriptOpen((o) => !o)}
            className="flex items-center justify-between w-full text-left"
          >
            <CardTitle className="text-base">📝 Transcription complète</CardTitle>
            {transcriptOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </CardHeader>
        {transcriptOpen && (
          <CardContent className="space-y-2 pt-0">
            {transcript.map((turn, i) => {
              const isAgent = turn.role === 'assistant';
              return (
                <div
                  key={i}
                  className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      isAgent
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-green-100 text-green-900'
                    }`}
                  >
                    <p className="text-xs font-semibold mb-1 opacity-70">
                      {isAgent ? 'Tuteur' : 'Vous'}
                    </p>
                    {turn.content}
                  </div>
                </div>
              );
            })}
          </CardContent>
        )}
      </Card>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          onClick={onRestart}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          Nouvelle session
        </Button>
        <Button onClick={onBack} variant="outline" className="flex-1">
          Retour
        </Button>
      </div>
    </div>
  );
};

export default VoiceChatFeedback;
