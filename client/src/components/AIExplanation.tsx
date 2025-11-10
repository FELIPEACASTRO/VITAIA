import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, XCircle, Lightbulb } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

interface AIExplanationProps {
  suggestionId: number;
  content: string;
  confidence?: number;
  model?: string;
  reviewed?: number;
}

export default function AIExplanation({ suggestionId, content, confidence = 75, model = "gemini", reviewed = 0 }: AIExplanationProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [clinicalRelevance, setClinicalRelevance] = useState(3);
  const [accuracy, setAccuracy] = useState(3);
  const [usefulness, setUsefulness] = useState(3);

  const { data: explanation } = trpc.explanations.get.useQuery({ suggestionId });
  const feedbackMutation = trpc.feedback.create.useMutation();
  const reviewMutation = trpc.ai.reviewSuggestion.useMutation();

  const handleApprove = async () => {
    await reviewMutation.mutateAsync({ suggestionId, approved: true });
    if (showFeedback && feedbackText) {
      await feedbackMutation.mutateAsync({
        suggestionId,
        approved: true,
        feedback: feedbackText,
        clinicalRelevance,
        accuracy,
        usefulness,
      });
    }
  };

  const handleReject = async () => {
    await reviewMutation.mutateAsync({ suggestionId, approved: false });
    if (showFeedback && feedbackText) {
      await feedbackMutation.mutateAsync({
        suggestionId,
        approved: false,
        feedback: feedbackText,
        clinicalRelevance,
        accuracy,
        usefulness,
      });
    }
  };

  const getStatusIcon = () => {
    if (reviewed === 1) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (reviewed === -1) return <XCircle className="w-5 h-5 text-red-600" />;
    return <AlertCircle className="w-5 h-5 text-yellow-600" />;
  };

  const getStatusLabel = () => {
    if (reviewed === 1) return "Aprovado";
    if (reviewed === -1) return "Rejeitado";
    return "Pendente de Revisão";
  };

  const getStatusColor = () => {
    if (reviewed === 1) return "bg-green-50 border-green-200";
    if (reviewed === -1) return "bg-red-50 border-red-200";
    return "bg-yellow-50 border-yellow-200";
  };

  return (
    <Card className={`border ${getStatusColor()}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon()}
              <CardTitle className="text-lg">Sugestão de IA</CardTitle>
              <Badge variant="outline">{getStatusLabel()}</Badge>
            </div>
            <CardDescription>
              Modelo: {model} | Confiança: {confidence}%
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Suggestion Content */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>
        </div>

        {/* Explanation Section */}
        {explanation && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-blue-600" />
              <h4 className="font-semibold text-sm">Raciocínio Detalhado</h4>
            </div>

            {explanation.reasoning && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700">{explanation.reasoning}</p>
              </div>
            )}

            {explanation.keyFactors && (
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <h5 className="font-semibold text-sm mb-2">Fatores Principais</h5>
                <p className="text-sm text-gray-700">{explanation.keyFactors}</p>
              </div>
            )}

            {explanation.alternativeOptions && (
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <h5 className="font-semibold text-sm mb-2">Opções Alternativas</h5>
                <p className="text-sm text-gray-700">{explanation.alternativeOptions}</p>
              </div>
            )}

            {explanation.evidenceLinks && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <h5 className="font-semibold text-sm mb-2">Evidências</h5>
                <p className="text-sm text-gray-700">{explanation.evidenceLinks}</p>
              </div>
            )}
          </div>
        )}

        {/* Feedback Section */}
        {reviewed === 0 && (
          <div className="space-y-3 border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFeedback(!showFeedback)}
              className="w-full"
            >
              {showFeedback ? "Ocultar Feedback" : "Adicionar Feedback"}
            </Button>

            {showFeedback && (
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="text-sm font-semibold">Relevância Clínica: {clinicalRelevance}/5</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={clinicalRelevance}
                    onChange={(e) => setClinicalRelevance(Number(e.target.value))}
                    className="w-full mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Acurácia: {accuracy}/5</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={accuracy}
                    onChange={(e) => setAccuracy(Number(e.target.value))}
                    className="w-full mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Utilidade: {usefulness}/5</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={usefulness}
                    onChange={(e) => setUsefulness(Number(e.target.value))}
                    className="w-full mt-1"
                  />
                </div>

                <Textarea
                  placeholder="Adicione seu feedback/justificativa..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="min-h-24"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleApprove}
                disabled={feedbackMutation.isPending || reviewMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                ✓ Aprovar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleReject}
                disabled={feedbackMutation.isPending || reviewMutation.isPending}
                className="flex-1"
              >
                ✗ Rejeitar
              </Button>
            </div>
          </div>
        )}

        {/* Reviewed Status */}
        {reviewed !== 0 && (
          <div className="text-sm text-gray-600 italic">
            {reviewed === 1 ? "✓ Você aprovou esta sugestão" : "✗ Você rejeitou esta sugestão"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
