import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Sparkles, Copy, Download, Send, CheckCircle, AlertTriangle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { geminiGenerate, parseGeminiJSON } from '../lib/gemini';

// ── Gemini prescription generator ────────────────────────────────────────────
async function generateAIPrescription(patientName, trimester, symptoms) {
  const prompt = `You are an expert OB/GYN and prenatal care physician. Generate a detailed, medically appropriate prescription for a pregnant patient.

Patient: ${patientName}
Trimester: ${trimester} Trimester
Symptoms / Conditions: ${symptoms}

Generate a complete prescription plan. Return ONLY valid JSON with no markdown code fences:
{
  "medications": [
    {
      "name": "Medication or supplement name",
      "dosage": "Dosage amount and form",
      "frequency": "How often to take",
      "duration": "How long to take",
      "precautions": "Safety notes and important precautions for pregnancy"
    }
  ],
  "additionalNotes": "Detailed clinical notes including lifestyle advice, follow-up schedule, monitoring requirements, dietary recommendations.",
  "warnings": [
    "Specific warning relevant to this patient and trimester",
    "Another important warning or precaution"
  ],
  "followUp": "When and what to monitor at the next appointment"
}

Rules:
- Include 3-5 medications/supplements appropriate for the trimester and symptoms
- All medications must be pregnancy-safe (Category A or B where possible)
- Warnings must be specific to the symptoms and trimester provided
- Notes should be clinically detailed and actionable`;

  const text = await geminiGenerate(prompt);
  return parseGeminiJSON(text);
}

// ── Component ─────────────────────────────────────────────────────────────────
export function MedicationSuggestion() {
  const [patientName,    setPatientName]    = useState('');
  const [trimester,      setTrimester]      = useState('');
  const [symptoms,       setSymptoms]       = useState('');
  const [isGenerating,   setIsGenerating]   = useState(false);
  const [generatedScript,setGeneratedScript]= useState(null);
  const [aiError,        setAiError]        = useState('');

  const commonConditions = [
    { name: 'Morning Sickness',    keywords: 'nausea, vomiting' },
    { name: 'Iron Deficiency',     keywords: 'anemia, fatigue' },
    { name: 'Gestational Diabetes',keywords: 'high blood sugar, glucose intolerance' },
    { name: 'Hypertension',        keywords: 'high blood pressure, preeclampsia risk' },
    { name: 'Back Pain',           keywords: 'lower back pain, musculoskeletal discomfort' },
    { name: 'Heartburn',           keywords: 'acid reflux, indigestion, GERD' },
  ];

  // ── Generate ───────────────────────────────────────────────────────────────
  const generateScript = async () => {
    if (!patientName.trim() || !trimester || !symptoms.trim()) {
      toast.error('Please fill patient name, trimester and symptoms first.');
      return;
    }

    setIsGenerating(true);
    setGeneratedScript(null);
    setAiError('');

    try {
      const result = await generateAIPrescription(patientName, trimester, symptoms);
      setGeneratedScript(result);
      toast.success('AI prescription generated successfully!');
    } catch (err) {
      console.error('Prescription generation error:', err);
      const msg = err.message?.includes('VITE_GEMINI_API_KEY')
        ? 'Gemini API key not found. Please add VITE_GEMINI_API_KEY to your .env file and restart the dev server.'
        : `Failed to generate prescription: ${err.message}`;
      setAiError(msg);
      toast.error('Could not generate prescription. See error below.');
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Copy to clipboard ──────────────────────────────────────────────────────
  const copyToClipboard = async () => {
    if (!generatedScript) return;

    const scriptText = `
PRESCRIPTION — ${patientName}
Trimester: ${trimester} Trimester
Symptoms: ${symptoms}

MEDICATIONS:
${generatedScript.medications.map((med, i) => `
${i + 1}. ${med.name}
   Dosage:      ${med.dosage}
   Frequency:   ${med.frequency}
   Duration:    ${med.duration}
   Precautions: ${med.precautions}
`).join('\n')}

ADDITIONAL NOTES:
${generatedScript.additionalNotes}

${generatedScript.followUp ? `FOLLOW-UP:\n${generatedScript.followUp}\n` : ''}
WARNINGS & PRECAUTIONS:
${generatedScript.warnings.map((w, i) => `${i + 1}. ${w}`).join('\n')}
    `.trim();

    const fallbackCopy = () => {
      const el = document.createElement('textarea');
      el.value = scriptText;
      el.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
      document.body.appendChild(el);
      el.select();
      try { const ok = document.execCommand('copy'); document.body.removeChild(el); return ok; }
      catch { document.body.removeChild(el); return false; }
    };

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(scriptText);
      } else {
        if (!fallbackCopy()) throw new Error('Fallback failed');
      }
      toast.success('Prescription copied to clipboard!');
    } catch {
      toast.error('Copy failed. Please select and copy manually.');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Input card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#FF69B4]" />
            <div>
              <CardTitle>AI-Powered Medication Suggestion</CardTitle>
              <CardDescription>
                Generate personalised prescriptions powered by Gemini AI
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Name + Trimester */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patient-name">Patient Name</Label>
                <Input
                  id="patient-name"
                  placeholder="Enter patient name"
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trimester">Trimester</Label>
                <Select value={trimester} onValueChange={setTrimester}>
                  <SelectTrigger id="trimester">
                    <SelectValue placeholder="Select trimester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st">1st Trimester (1–12 weeks)</SelectItem>
                    <SelectItem value="2nd">2nd Trimester (13–26 weeks)</SelectItem>
                    <SelectItem value="3rd">3rd Trimester (27–40 weeks)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Symptoms */}
            <div className="space-y-2">
              <Label htmlFor="symptoms">Symptoms & Conditions</Label>
              <Textarea
                id="symptoms"
                placeholder="Describe patient symptoms, conditions, and concerns..."
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            {/* Quick add */}
            <div className="space-y-2">
              <Label>Quick Add Common Conditions</Label>
              <div className="flex flex-wrap gap-2">
                {commonConditions.map((c, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="cursor-pointer hover:bg-[#E8EFFF] transition-colors"
                    onClick={() => setSymptoms(p => p && p.trim() ? `${p}, ${c.keywords}` : c.keywords)}
                  >
                    + {c.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Error message */}
            {aiError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                {aiError}
              </div>
            )}

            {/* Generate button */}
            <Button
              type="button"
              onClick={generateScript}
              disabled={!patientName.trim() || !trimester || !symptoms.trim() || isGenerating}
              className="w-full bg-[#FF69B4] hover:bg-[#E558A3]"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Gemini AI is writing prescription…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate AI Prescription
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Generated prescription ────────────────────────────────────────── */}
      {generatedScript && (
        <Card className="border-2" style={{ borderColor: '#FF69B4' }}>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 font-bold">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  AI-Generated Prescription
                </CardTitle>
                <CardDescription>
                  For {patientName} · {trimester} Trimester · Powered by Gemini AI
                </CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="w-4 h-4 mr-2" />Copy
                </Button>
                <Button variant="outline" size="sm" onClick={() => toast('PDF download coming soon')}>
                  <Download className="w-4 h-4 mr-2" />Download
                </Button>
                <Button size="sm" className="bg-[#5B7FDB]" onClick={() => toast('Send to patient coming soon')}>
                  <Send className="w-4 h-4 mr-2" />Send to Patient
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="medications">
              <TabsList>
                <TabsTrigger value="medications">Medications</TabsTrigger>
                <TabsTrigger value="notes">Clinical Notes</TabsTrigger>
                <TabsTrigger value="warnings">Warnings</TabsTrigger>
                {generatedScript.followUp && <TabsTrigger value="followup">Follow-Up</TabsTrigger>}
              </TabsList>

              {/* Medications */}
              <TabsContent value="medications" className="space-y-4 mt-4">
                {generatedScript.medications?.map((med, i) => (
                  <Card key={i} className="border-l-4" style={{ borderLeftColor: i % 2 === 0 ? '#5B7FDB' : '#FF69B4' }}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-bold">{i + 1}. {med.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground text-xs uppercase tracking-wide">Dosage</span>
                          <p className="font-semibold mt-0.5">{med.dosage}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs uppercase tracking-wide">Frequency</span>
                          <p className="font-semibold mt-0.5">{med.frequency}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground text-xs uppercase tracking-wide">Duration</span>
                          <p className="font-semibold mt-0.5">{med.duration}</p>
                        </div>
                      </div>
                      <div className="p-3 bg-[#E8EFFF] rounded-lg">
                        <p className="text-sm">
                          <span className="font-medium">Precautions: </span>{med.precautions}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Clinical notes */}
              <TabsContent value="notes" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{generatedScript.additionalNotes}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Warnings */}
              <TabsContent value="warnings" className="mt-4">
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="pt-6 space-y-3">
                    {generatedScript.warnings?.map((w, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm">{w}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Follow-up */}
              {generatedScript.followUp && (
                <TabsContent value="followup" className="mt-4">
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                      <p className="text-sm leading-relaxed">{generatedScript.followUp}</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Recent prescriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="font-bold">Recent AI Prescriptions</CardTitle>
          <CardDescription>Previously generated prescriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { patient: 'Sarah Johnson', date: 'Oct 30, 2025', condition: 'Prenatal care',   status: 'Sent' },
              { patient: 'Emily Chen',    date: 'Oct 29, 2025', condition: 'Morning sickness', status: 'Sent' },
              { patient: 'Maria Garcia',  date: 'Oct 28, 2025', condition: 'Iron deficiency',  status: 'Draft' },
            ].map((rx, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-lg border hover:border-[#FF69B4] transition-colors cursor-pointer">
                <div>
                  <h4 className="font-semibold">{rx.patient}</h4>
                  <p className="text-sm text-muted-foreground">{rx.condition} · {rx.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={rx.status === 'Sent' ? 'default' : 'secondary'}>{rx.status}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => toast('View coming soon')}>
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="bg-[#E8DBFF]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-bold">
            <Sparkles className="w-5 h-5 text-[#5B7FDB]" />
            AI Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 bg-white rounded-lg">
            <h4 className="mb-2 font-bold">Trending Conditions This Week</h4>
            <p className="text-sm text-muted-foreground">
              Morning sickness cases up 15%. Consider recommending vitamin B6 supplementation and small frequent meals.
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg">
            <h4 className="mb-2 font-bold">Medication Safety Alert</h4>
            <p className="text-sm text-muted-foreground">
              New guidelines for iron supplementation in 2nd trimester. Review current protocols for optimal dosing.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MedicationSuggestion;
