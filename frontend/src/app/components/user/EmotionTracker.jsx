import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  Camera, Smile, Frown, Meh, Heart, AlertCircle,
  RefreshCw, ShieldAlert, CheckCircle2,
  Utensils, Users, ExternalLink, Sparkles, ChevronRight
} from 'lucide-react';
import { COMMUNITY_POSTS } from './Community';
import { geminiGenerate, parseGeminiJSON } from '../lib/gemini';

// ── Constants ────────────────────────────────────────────────────────────────
const CAPTURE_DURATION_SEC = 10;
const CAPTURE_INTERVAL_MS  = 1000;
const FER_API_URL = import.meta.env.VITE_FER_API_URL
  ? `${import.meta.env.VITE_FER_API_URL}/analyze`
  : '/api/fer/analyze';

// API key is read from .env → VITE_GEMINI_API_KEY (set by Vite at build time)
// No key needed here — gemini.js reads it internally.

// Map FER labels → display config
const EMOTION_META = {
  happy:    { label: 'Happy',    icon: Smile,        color: '#F59E0B', bg: '#FFF9E0', recommendation: 'Great! Keep up the positive energy. Consider some light exercise or a gentle walk.' },
  neutral:  { label: 'Calm',    icon: Heart,        color: '#38BDF8', bg: '#EAF6FF', recommendation: 'You seem relaxed. This is perfect for meditation, reading, or light stretching.' },
  fear:     { label: 'Anxious', icon: AlertCircle,  color: '#FB923C', bg: '#FFF4E0', recommendation: "Try deep breathing exercises or talk to your support group. It's okay to ask for help." },
  sad:      { label: 'Sad',     icon: Frown,        color: '#A78BFA', bg: '#F5F0FF', recommendation: 'Be gentle with yourself today. Consider journaling or calling a loved one.' },
  angry:    { label: 'Stressed',icon: AlertCircle,  color: '#F87171', bg: '#FFF0F0', recommendation: 'Please reach out to your healthcare provider. Practice relaxation techniques.' },
  disgust:  { label: 'Uneasy', icon: Meh,          color: '#94A3B8', bg: '#F4F4F4', recommendation: 'Take a short break from your environment. Fresh air and hydration can help.' },
  surprise: { label: 'Surprised',icon: Smile,       color: '#60A5FA', bg: '#E8EFFF', recommendation: 'Something caught you off guard! Take a moment to breathe and centre yourself.' },
};

const EMOTION_LABELS = {
  happy: 'Happy 😊', sad: 'Sad 😢', fear: 'Anxious 😟',
  angry: 'Stressed 😤', neutral: 'Calm 😐', surprise: 'Surprised 😮', disgust: 'Uneasy 😣',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function captureFrame(videoEl) {
  const w = videoEl.videoWidth  || 640;
  const h = videoEl.videoHeight || 480;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.translate(w, 0); ctx.scale(-1, 1);
  ctx.drawImage(videoEl, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.9);
}

function averageEmotions(list) {
  if (!list.length) return null;
  const keys = Object.keys(list[0]);
  const avg  = {};
  keys.forEach(k => { avg[k] = list.reduce((s, e) => s + (e[k] ?? 0), 0) / list.length; });
  return avg;
}

// ── Gemini meal recommendation ────────────────────────────────────────────────
async function fetchMealRecommendations(emotionLabel) {
  try {
    const prompt = `You are a prenatal nutrition expert. A pregnant woman's emotion check detected she is feeling "${emotionLabel}".

Generate exactly 4 meal recommendations that:
1. Are specifically suitable for pregnant women
2. Address the emotional state (${emotionLabel}) — comfort foods for sad, energising for anxious, calming for stressed, etc.
3. Are nutritionally appropriate for pregnancy (rich in folate, iron, calcium, omega-3)

Return ONLY valid JSON, no markdown code fences:
{
  "meals": [
    {
      "name": "Meal name",
      "emoji": "single food emoji",
      "why": "One sentence why this helps with the emotion during pregnancy",
      "nutrients": "Key nutrients e.g. Iron, Folate, Omega-3"
    }
  ],
  "tip": "One overall eating tip for this emotional state during pregnancy (1-2 sentences)"
}`;

    const text = await geminiGenerate(prompt);
    const data = parseGeminiJSON(text);
    return { data, error: null };
  } catch (err) {
    console.error('Gemini meal fetch error:', err);
    return { data: null, error: err.message };
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export function EmotionTracker({ onNavigate }) {
  const [phase,         setPhase]       = useState('idle');
  const [countdown,     setCountdown]   = useState(CAPTURE_DURATION_SEC);
  const [liveEmotion,   setLiveEmotion] = useState(null);
  const [result,        setResult]      = useState(null);
  const [errorMsg,      setErrorMsg]    = useState('');
  const [meals,         setMeals]       = useState(null);
  const [mealError,     setMealError]   = useState('');
  const [mealsLoading,  setMealsLoading]= useState(false);
  const [history,       setHistory]     = useState([
    { date: 'Today, 10:30 AM',    emotion: 'Happy',   confidence: 92 },
    { date: 'Yesterday, 2:15 PM', emotion: 'Calm',    confidence: 88 },
    { date: 'Apr 24, 9:00 AM',    emotion: 'Anxious', confidence: 75 },
    { date: 'Apr 23, 11:45 AM',   emotion: 'Happy',   confidence: 90 },
  ]);

  const videoRef        = useRef(null);
  const canvasRef       = useRef(null);
  const streamRef       = useRef(null);
  const intervalRef     = useRef(null);
  const countdownRef    = useRef(null);
  const rafRef          = useRef(null);
  const collectedScores = useRef([]);
  const liveBoxRef      = useRef(null);

  // ── Stop stream ──────────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    clearInterval(intervalRef.current);
    clearInterval(countdownRef.current);
    cancelAnimationFrame(rafRef.current);
    if (canvasRef.current) {
      canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, []);
  useEffect(() => () => stopStream(), [stopStream]);

  // ── rAF overlay loop ─────────────────────────────────────────────────────
  const drawLoop = useCallback(() => {
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas) { rafRef.current = requestAnimationFrame(drawLoop); return; }
    const { clientWidth: dw, clientHeight: dh } = video;
    if (canvas.width !== dw || canvas.height !== dh) { canvas.width = dw; canvas.height = dh; }
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, dw, dh);
    const box = liveBoxRef.current;
    if (box) {
      const [bx, by, bw, bh] = box;
      const rx = (1 - (bx + bw) / video.videoWidth)  * dw;
      const ry = (by / video.videoHeight) * dh;
      const rw = (bw / video.videoWidth)  * dw;
      const rh = (bh / video.videoHeight) * dh;
      ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 3;
      ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 6;
      ctx.strokeRect(rx, ry, rw, rh);
      ctx.shadowBlur = 0;
    }
    rafRef.current = requestAnimationFrame(drawLoop);
  }, []);

  // ── Send frame to API ────────────────────────────────────────────────────
  const analyzeFrame = useCallback(async (b64) => {
    try {
      const res  = await fetch(FER_API_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: b64 }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.face_detected && data.emotions) {
        setLiveEmotion(data.emotions);
        liveBoxRef.current = data.box ?? null;
        return data.emotions;
      }
    } catch { /* skip */ }
    liveBoxRef.current = null;
    return null;
  }, []);

  // ── Finalise ─────────────────────────────────────────────────────────────
  const finalise = useCallback(async () => {
    stopStream();
    setLiveEmotion(null);
    setPhase('processing');

    const scores = collectedScores.current;
    if (!scores.length) {
      setErrorMsg('No faces were detected. Please ensure good lighting and that your face is clearly visible.');
      setPhase('api_error'); return;
    }

    const avg        = averageEmotions(scores);
    const topKey     = Object.entries(avg).sort((a, b) => b[1] - a[1])[0][0];
    const meta       = EMOTION_META[topKey] ?? EMOTION_META.neutral;
    const confidence = Math.round(avg[topKey] * 100);

    setResult({ emotion: meta.label, emotionKey: topKey, confidence, color: meta.color, bg: meta.bg,
                recommendation: meta.recommendation, IconComp: meta.icon, rawScores: avg });

    const now = new Date().toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    setHistory(prev => [{ date: `Today, ${now}`, emotion: meta.label, confidence }, ...prev.slice(0, 9)]);
    setPhase('result');

    // Fetch Gemini meal recommendations in background
    setMealsLoading(true);
    setMeals(null);
    setMealError('');
    const { data: mealData, error: mealErr } = await fetchMealRecommendations(meta.label);
    setMeals(mealData);
    setMealError(mealErr || '');
    setMealsLoading(false);
  }, [stopStream]);

  // ── Start camera ─────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    collectedScores.current = [];
    liveBoxRef.current = null;
    setCountdown(CAPTURE_DURATION_SEC);
    setResult(null); setErrorMsg(''); setLiveEmotion(null); setMeals(null);

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: false,
      });
    } catch { setPhase('permission_denied'); return; }

    streamRef.current = stream;
    setPhase('capturing');

    setTimeout(() => {
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(console.error); }
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(drawLoop);
    }, 0);

    let elapsed = 0;
    countdownRef.current = setInterval(() => setCountdown(p => Math.max(0, p - 1)), CAPTURE_INTERVAL_MS);
    intervalRef.current  = setInterval(async () => {
      elapsed += 1;
      if (videoRef.current?.readyState >= 2) {
        const frame = captureFrame(videoRef.current);
        const emo   = await analyzeFrame(frame);
        if (emo) collectedScores.current.push(emo);
      }
      if (elapsed >= CAPTURE_DURATION_SEC) {
        clearInterval(intervalRef.current); clearInterval(countdownRef.current);
        finalise();
      }
    }, CAPTURE_INTERVAL_MS);
  }, [analyzeFrame, drawLoop, finalise]);

  // ── Reset ────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setPhase('idle'); setResult(null); setCountdown(CAPTURE_DURATION_SEC);
    setErrorMsg(''); setLiveEmotion(null); setMeals(null); setMealError('');
  }, [stopStream]);

  // ── Community posts matching this emotion ─────────────────────────────────
  const relatedPosts = result
    ? COMMUNITY_POSTS.filter(p => p.emotion === result.emotionKey).slice(0, 2)
    : [];

  // ── Live top emotion ─────────────────────────────────────────────────────
  const liveTopKey = liveEmotion ? Object.entries(liveEmotion).sort((a,b) => b[1]-a[1])[0][0] : null;
  const liveMeta   = liveTopKey ? (EMOTION_META[liveTopKey] ?? null) : null;
  const liveConf   = liveTopKey ? Math.round(liveEmotion[liveTopKey] * 100) : 0;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-bold flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#5B7FDB]" />
            Emotion Check with AI
          </CardTitle>
          <CardDescription>
            Our ML model analyses your facial expressions over {CAPTURE_DURATION_SEC} seconds
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* ── Camera box ─────────────────────────────────────────────────── */}
          <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-inner" style={{ aspectRatio: '16/9' }}>
            <video ref={videoRef} autoPlay playsInline muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)', opacity: phase === 'capturing' ? 1 : 0 }}
            />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ opacity: phase === 'capturing' ? 1 : 0 }} />

            {phase === 'idle' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-400">
                <Camera className="w-16 h-16 text-[#5B7FDB] opacity-70" />
                <p className="text-sm">Click below to start emotion detection</p>
              </div>
            )}
            {phase === 'permission_denied' && (
              <div className="absolute inset-0 bg-orange-50 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <ShieldAlert className="w-12 h-12 text-orange-500" />
                <p className="font-semibold text-orange-700">Camera permission required</p>
                <p className="text-sm text-orange-600">
                  Click the camera icon in your browser's address bar and allow access, then try again.
                </p>
              </div>
            )}
            {phase === 'capturing' && (
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1.5 z-10">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white text-sm font-semibold">{countdown}s</span>
              </div>
            )}
            {phase === 'capturing' && liveMeta && (
              <div className="absolute bottom-3 left-3 right-3 mx-auto z-10 flex items-center justify-between gap-2 rounded-xl px-4 py-2 shadow-lg"
                style={{ backgroundColor: `${liveMeta.color}CC` }}>
                <div className="flex items-center gap-2">
                  <liveMeta.icon className="w-5 h-5 text-white" />
                  <span className="text-white font-bold text-sm">{liveMeta.label}</span>
                </div>
                <span className="text-white font-semibold text-sm">{liveConf}%</span>
              </div>
            )}
            {phase === 'processing' && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#5B7FDB] border-t-transparent" />
                <p className="text-white font-semibold text-sm">Calculating your emotion…</p>
              </div>
            )}
            {phase === 'api_error' && (
              <div className="absolute inset-0 bg-red-50 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-400" />
                <p className="font-semibold text-red-700">Analysis failed</p>
                <p className="text-sm text-red-600">{errorMsg}</p>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {phase === 'capturing' && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Analysing…</span>
                <span>{CAPTURE_DURATION_SEC - countdown} / {CAPTURE_DURATION_SEC}s</span>
              </div>
              <Progress value={((CAPTURE_DURATION_SEC - countdown) / CAPTURE_DURATION_SEC) * 100} className="h-2" />
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center gap-3">
            {phase === 'idle' && (
              <Button onClick={startCamera} className="bg-[#5B7FDB] hover:bg-[#4A6ECA] font-semibold px-6">
                <Camera className="w-4 h-4 mr-2" />Start Camera
              </Button>
            )}
            {(phase === 'permission_denied' || phase === 'api_error') && (
              <Button onClick={reset} variant="outline" className="font-semibold">
                <RefreshCw className="w-4 h-4 mr-2" />Try Again
              </Button>
            )}
            {phase === 'result' && (
              <Button onClick={reset} variant="outline" className="font-semibold">
                <RefreshCw className="w-4 h-4 mr-2" />Check Again
              </Button>
            )}
          </div>

          {/* ── Result ──────────────────────────────────────────────────────── */}
          {phase === 'result' && result && (
            <div className="space-y-6">
              {/* Emotion result card */}
              <Card style={{ backgroundColor: result.bg, borderColor: result.color, borderWidth: 2 }}>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-white shadow-sm">
                        <result.IconComp className="w-6 h-6" style={{ color: result.color }} />
                      </div>
                      <div>
                        <CardTitle className="font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          Detected: {result.emotion}
                        </CardTitle>
                        <CardDescription>{CAPTURE_DURATION_SEC}-second average · highest confidence</CardDescription>
                      </div>
                    </div>
                    <Badge className="text-white font-bold text-base px-3 py-1" style={{ backgroundColor: result.color }}>
                      {result.confidence}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={result.confidence} className="h-2" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(result.rawScores).sort((a, b) => b[1] - a[1]).map(([key, val]) => {
                      const m = EMOTION_META[key];
                      return (
                        <div key={key} className="bg-white rounded-lg p-2 text-center shadow-sm">
                          <div className="text-xs text-muted-foreground capitalize">{m?.label ?? key}</div>
                          <div className="font-bold" style={{ color: m?.color ?? '#888' }}>{Math.round(val * 100)}%</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="mb-2 font-bold">💡 Recommendation</h4>
                    <p className="text-sm leading-relaxed">{result.recommendation}</p>
                  </div>
                </CardContent>
              </Card>

              {/* ── Gemini Meal Recommendations ──────────────────────────────── */}
              <Card className="border-2" style={{ borderColor: '#5B7FDB' }}>
                <CardHeader>
                  <CardTitle className="font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#5B7FDB]" />
                    <Utensils className="w-5 h-5 text-[#5B7FDB]" />
                    AI Meal Recommendations for You
                  </CardTitle>
                  <CardDescription>
                    Personalised for your <strong>{result.emotion}</strong> mood · Pregnancy-safe nutrition
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {mealsLoading ? (
                    <div className="flex items-center gap-3 py-6 justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-3 border-[#5B7FDB] border-t-transparent" />
                      <p className="text-sm text-muted-foreground">Asking Gemini AI for meal ideas…</p>
                    </div>
                  ) : meals ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {meals.meals?.map((meal, i) => (
                          <div key={i} className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3">
                              <span className="text-3xl">{meal.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm mb-1">{meal.name}</h4>
                                <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{meal.why}</p>
                                <Badge variant="outline" className="text-xs">{meal.nutrients}</Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {meals.tip && (
                        <div className="p-3 bg-[#E8EFFF] rounded-lg border border-blue-100">
                          <p className="text-sm font-medium text-[#5B7FDB]">✨ Quick tip</p>
                          <p className="text-sm text-muted-foreground mt-1">{meals.tip}</p>
                        </div>
                      )}
                      <Button
                        className="w-full bg-[#5B7FDB] hover:bg-[#4A6ECA] font-semibold"
                        onClick={() => onNavigate?.('diet')}
                      >
                        <Utensils className="w-4 h-4 mr-2" />
                        Go to Full Diet Planner
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  ) : (
                    <div className="py-4 space-y-3">
                      <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                        <AlertCircle className="w-4 h-4 inline mr-2 flex-shrink-0" />
                        <span className="font-semibold">Gemini API error: </span>
                        {mealError || 'Unknown error. Check the browser Console (F12) for details.'}
                      </div>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => onNavigate?.('diet')}>
                        <Utensils className="w-4 h-4 mr-2" />Open Diet Planner instead
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── Community posts with same emotion ────────────────────────── */}
              {relatedPosts.length > 0 && (
                <Card className="border-2 border-pink-200">
                  <CardHeader>
                    <CardTitle className="font-bold flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#FF69B4]" />
                      Others Feeling {result.emotion} Too
                    </CardTitle>
                    <CardDescription>
                      Community posts from moms feeling {EMOTION_LABELS[result.emotionKey] ?? result.emotion}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {relatedPosts.map(post => (
                      <div
                        key={post.id}
                        className="p-4 rounded-xl bg-pink-50 hover:bg-pink-100 transition-colors cursor-pointer border border-pink-100"
                        onClick={() => {
                          // Navigate to community with this post's emotion pre-filtered
                          if (onNavigate) {
                            // Store the filter so Community can pick it up
                            window.__GRAVIDA_EMOTION_FILTER__ = result.emotionKey;
                            onNavigate('community');
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={post.avatar}
                            alt={post.author}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-semibold text-sm">{post.author}</span>
                              <Badge variant="secondary" className="text-xs">{post.trimester}</Badge>
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">{post.timeAgo}</p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                        </div>
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      className="w-full font-semibold border-[#FF69B4] text-[#FF69B4] hover:bg-pink-50"
                      onClick={() => {
                        if (onNavigate) {
                          window.__GRAVIDA_EMOTION_FILTER__ = result.emotionKey;
                          onNavigate('community');
                        }
                      }}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      More posts like this in Community
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── History ────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="font-bold">Recent Emotion History</CardTitle>
          <CardDescription>Your emotional tracking over the past week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {history.map((record, index) => {
              const meta      = Object.values(EMOTION_META).find(m => m.label === record.emotion);
              const Icon      = meta?.icon ?? Smile;
              const iconColor = meta?.color ?? '#5B7FDB';
              return (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-[#FFD1E3]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-full">
                      <Icon className="w-4 h-4" style={{ color: iconColor }} />
                    </div>
                    <div>
                      <div className="font-semibold">{record.emotion}</div>
                      <div className="text-sm text-muted-foreground">{record.date}</div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-semibold">{record.confidence}%</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
