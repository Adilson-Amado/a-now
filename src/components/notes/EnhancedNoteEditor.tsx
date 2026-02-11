import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Square, Pause, Play, RotateCcw, Save, FileText, Loader2, Sparkles } from 'lucide-react';
import { useNotesStore } from '@/stores/notesStore';
import { directGeminiService } from '@/services/directGeminiService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EnhancedNoteEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NOTE_CATEGORIES = [
  { id: 'personal', label: 'Pessoal' },
  { id: 'work', label: 'Trabalho' },
  { id: 'ideas', label: 'Ideias' },
  { id: 'todo', label: 'Tarefas' },
  { id: 'learning', label: 'Aprendizagem' },
  { id: 'other', label: 'Outro' },
] as const;

type VoiceState = 'idle' | 'recording' | 'paused' | 'saved';

export function EnhancedNoteEditor({ open, onOpenChange }: EnhancedNoteEditorProps) {
  const { addNote } = useNotesStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<(typeof NOTE_CATEGORIES)[number]['id']>('personal');
  const [tagsInput, setTagsInput] = useState('');
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [audioState, setAudioState] = useState<VoiceState>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDurationMs, setAudioDurationMs] = useState(0);

  const recognitionRef = useRef<any>(null);
  const shouldDictateRef = useRef(false);
  const isPauseRequestedRef = useRef(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startedAudioAtRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);

  const draftKey = useMemo(() => 'focus-flow-note-draft', []);

  useEffect(() => {
    if (!open) return;
    const savedDraft = localStorage.getItem(draftKey);
    if (!savedDraft) return;

    try {
      const parsed = JSON.parse(savedDraft);
      setTitle(parsed.title || '');
      setContent(parsed.content || '');
      setCategory(parsed.category || 'personal');
      setTagsInput(parsed.tagsInput || '');
      if (parsed.audioUrl) {
        setAudioUrl(parsed.audioUrl);
        setAudioDurationMs(parsed.audioDurationMs || 0);
        setAudioState('saved');
      }
    } catch {
      // Ignore malformed draft.
    }
  }, [open, draftKey]);

  useEffect(() => {
    if (!open) return;
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => {
      const payload = {
        title,
        content,
        category,
        tagsInput,
        audioUrl,
        audioDurationMs,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(draftKey, JSON.stringify(payload));
    }, 1200);

    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [title, content, category, tagsInput, audioUrl, audioDurationMs, open, draftKey]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) return;

    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'pt-PT';

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      if (transcript.trim()) {
        setContent((prev) => `${prev}${prev.endsWith(' ') || prev.length === 0 ? '' : ' '}${transcript.trim()} `);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') toast.error(`Falha no ditado: ${event.error}`);
    };

    recognition.onend = () => {
      if (shouldDictateRef.current && !isPauseRequestedRef.current) {
        recognition.start();
        setVoiceState('recording');
      } else if (isPauseRequestedRef.current) {
        setVoiceState('paused');
      } else {
        setVoiceState('idle');
      }
    };

    recognitionRef.current = recognition;
  }, []);

  const startDictation = () => {
    if (!recognitionRef.current) {
      toast.error('Ditado nao suportado neste navegador');
      return;
    }
    try {
      shouldDictateRef.current = true;
      isPauseRequestedRef.current = false;
      recognitionRef.current.start();
      setVoiceState('recording');
      toast.success('Ditado ativo ate voce clicar em Parar');
    } catch {
      // no-op: can throw if already started.
    }
  };

  const pauseDictation = () => {
    if (!recognitionRef.current) return;
    isPauseRequestedRef.current = true;
    recognitionRef.current.stop();
  };

  const resumeDictation = () => {
    if (!recognitionRef.current) return;
    isPauseRequestedRef.current = false;
    shouldDictateRef.current = true;
    recognitionRef.current.start();
    setVoiceState('recording');
  };

  const stopDictation = () => {
    if (!recognitionRef.current) return;
    shouldDictateRef.current = false;
    isPauseRequestedRef.current = false;
    recognitionRef.current.stop();
    setVoiceState('idle');
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      startedAudioAtRef.current = Date.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        const nextUrl = URL.createObjectURL(blob);
        setAudioUrl(nextUrl);
        const duration = startedAudioAtRef.current ? Date.now() - startedAudioAtRef.current : 0;
        setAudioDurationMs(duration);
        setAudioState('saved');
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setAudioState('recording');
    } catch {
      toast.error('Nao foi possivel acessar o microfone');
    }
  };

  const stopAudioRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
  };

  const togglePlayAudio = () => {
    if (!audioElementRef.current) return;
    if (audioElementRef.current.paused) {
      audioElementRef.current.play();
      setAudioState('recording');
      return;
    }
    audioElementRef.current.pause();
    setAudioState('paused');
  };

  const reRecordAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioDurationMs(0);
    setAudioState('idle');
    startAudioRecording();
  };

  const handleGenerateWithAI = async () => {
    if (!title.trim()) {
      toast.error('Defina o titulo para gerar conteudo');
      return;
    }
    setIsGenerating(true);
    try {
      const generated = await directGeminiService.generateNoteContent(title, category, [], content || undefined);
      setContent(generated.content || content);
      toast.success('Conteudo sugerido por IA');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao gerar');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveNote = async () => {
    if (!title.trim()) {
      toast.error('Titulo obrigatorio');
      return;
    }
    setIsSaving(true);

    const tags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    addNote({
      title: title.trim(),
      content: content.trim() || undefined,
      category,
      tags: tags.length > 0 ? tags : undefined,
      audio:
        audioUrl && audioDurationMs > 0
          ? {
              url: audioUrl,
              durationMs: audioDurationMs,
              createdAt: new Date(),
            }
          : undefined,
      saveStatus: 'saved',
    });

    localStorage.removeItem(draftKey);
    setVoiceState('saved');
    setAudioState(audioUrl ? 'saved' : audioState);
    setIsSaving(false);
    toast.success('Nota salva');
    onOpenChange(false);
  };

  const voiceBadgeClass =
    voiceState === 'recording'
      ? 'bg-red-50 text-red-700 border-red-200'
      : voiceState === 'paused'
      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
      : 'bg-green-50 text-green-700 border-green-200';

  const voiceBadgeText =
    voiceState === 'recording'
      ? 'Gravando'
      : voiceState === 'paused'
      ? 'Pausado'
      : voiceState === 'saved'
      ? 'Salvo'
      : 'Pronto';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bloco de notas inteligente
          </DialogTitle>
          <DialogDescription>Ditado continuo, gravador completo e salvamento manual + autosave</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados da nota</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="note-title">Titulo</Label>
                <Input id="note-title" value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={category} onValueChange={(value) => setCategory(value as (typeof NOTE_CATEGORIES)[number]['id'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTE_CATEGORIES.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note-tags">Tags (separadas por virgula)</Label>
                  <Input
                    id="note-tags"
                    value={tagsInput}
                    onChange={(event) => setTagsInput(event.target.value)}
                    placeholder="planejamento, ideias"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ditado por voz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className={cn('rounded-lg border px-3 py-2 text-sm font-medium', voiceBadgeClass)}>
                {voiceState === 'recording' && '🎙️ '}
                {voiceState === 'paused' && '⏸️ '}
                {voiceState === 'saved' && '✅ '}
                {voiceBadgeText}
              </div>
              <div className="flex flex-wrap gap-2">
                {voiceState !== 'recording' && (
                  <Button type="button" variant="outline" onClick={startDictation}>
                    <Mic className="mr-2 h-4 w-4" />
                    Iniciar
                  </Button>
                )}
                {voiceState === 'recording' && (
                  <Button type="button" variant="outline" onClick={pauseDictation}>
                    <Pause className="mr-2 h-4 w-4" />
                    Pausar
                  </Button>
                )}
                {voiceState === 'paused' && (
                  <Button type="button" variant="outline" onClick={resumeDictation}>
                    <Play className="mr-2 h-4 w-4" />
                    Retomar
                  </Button>
                )}
                <Button type="button" variant="destructive" onClick={stopDictation}>
                  <Square className="mr-2 h-4 w-4" />
                  Parar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gravador de audio da nota</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border p-3 text-sm">
                {audioState === 'recording' && '🎙️ Gravando'}
                {audioState === 'paused' && '⏸️ Pausado'}
                {audioState === 'saved' && '✅ Salvo'}
                {audioState === 'idle' && 'Pronto para gravar'}
                {audioDurationMs > 0 && (
                  <span className="ml-2 text-muted-foreground">
                    ({Math.round(audioDurationMs / 1000)}s)
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {audioState !== 'recording' && (
                  <Button type="button" variant="outline" onClick={startAudioRecording}>
                    <Mic className="mr-2 h-4 w-4" />
                    Gravar
                  </Button>
                )}
                {audioState === 'recording' && mediaRecorderRef.current && (
                  <Button type="button" variant="destructive" onClick={stopAudioRecording}>
                    <Square className="mr-2 h-4 w-4" />
                    Parar gravacao
                  </Button>
                )}
                {audioUrl && (
                  <>
                    <Button type="button" variant="outline" onClick={togglePlayAudio}>
                      {audioState === 'recording' ? (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Play
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={reRecordAudio}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Regravar
                    </Button>
                  </>
                )}
              </div>
              {audioUrl && <audio ref={audioElementRef} src={audioUrl} onEnded={() => setAudioState('saved')} className="hidden" />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                Conteudo
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateWithAI}
                  disabled={isGenerating}
                >
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Gerar com IA
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={12}
                placeholder="Escreva aqui. O autosave salva o rascunho automaticamente."
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Badge variant="outline">Autosave ativo</Badge>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={saveNote} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Salvar nota
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
