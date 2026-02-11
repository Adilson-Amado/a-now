import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Mic,
  MicOff,
  Sparkles,
  FileText,
  Tag,
  X,
  Loader2,
} from 'lucide-react';
import { useNotesStore } from '@/stores/notesStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AdvancedNoteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NOTE_CATEGORIES = [
  { id: 'personal', label: 'Pessoal', color: 'bg-blue-100 text-blue-800' },
  { id: 'work', label: 'Trabalho', color: 'bg-green-100 text-green-800' },
  { id: 'ideas', label: 'Ideias', color: 'bg-purple-100 text-purple-800' },
  { id: 'todo', label: 'Tarefas', color: 'bg-orange-100 text-orange-800' },
  { id: 'learning', label: 'Aprendizagem', color: 'bg-pink-100 text-pink-800' },
  { id: 'other', label: 'Outro', color: 'bg-gray-100 text-gray-800' },
];

export function AdvancedNoteForm({ open, onOpenChange }: AdvancedNoteFormProps) {
  const { addNote } = useNotesStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('personal');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // Voice recording
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'pt-PT';

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setContent(prev => prev + transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        toast.error('Erro no reconhecimento de voz');
      };
    }
  }, []);

  const startRecording = async () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsRecording(true);
        toast.success('Gravação iniciada');
      } else {
        // Fallback to MediaRecorder API
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          // Here you would send to a speech-to-text API
          // For now, we'll just show a placeholder
          setContent(prev => prev + '\n[Gravação de áudio - transcrição pendente]');
          toast.info('Gravação salva. Transcrição em desenvolvimento.');
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        toast.success('Gravação iniciada');
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Não foi possível iniciar a gravação');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      toast.success('Gravação parada');
    } else if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      toast.success('Gravação parada');
    }
  };

  const generateAIContent = async () => {
    if (!title.trim()) {
      toast.error('Adiciona um título primeiro');
      return;
    }

    setIsGenerating(true);
    try {
      // TODO: Implement AI generation
      // For now, simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const aiContent = `# ${title}

## Resumo
Esta nota foi gerada por IA com base no título "${title}". 

## Pontos principais
- Primeiro ponto importante sobre ${title}
- Segundo aspecto relevante a considerar
- Terceiro elemento para análise futura

## Ideias relacionadas
- Conceito A que se conecta com este tema
- Conceito B que complementa a análise
- Conceito C para exploração adicional

## Próximos passos
- [ ] Pesquisar mais sobre ${title}
- [ ] Desenvolver os pontos mencionados
- [ ] Adicionar exemplos práticos

---
*Gerado por IA em ${new Date().toLocaleDateString('pt-PT')}*`;

      setContent(aiContent);
      toast.success('Conteúdo gerado por IA!');
    } catch (error) {
      toast.error('Erro ao gerar conteúdo');
    } finally {
      setIsGenerating(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    setIsLoading(true);
    try {
      addNote({
        title: title.trim(),
        content: content.trim() || undefined,
        category,
        tags: tags.length > 0 ? tags : undefined,
      });
      toast.success('Nota criada com sucesso!');
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao criar nota');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategory('personal');
    setTags([]);
    setTagInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addTag();
    }
  };

  const selectedCategory = NOTE_CATEGORIES.find(c => c.id === category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5" />
            </div>
            Criar Nota Avançada
          </DialogTitle>
          <DialogDescription>
            Cria notas detalhadas com IA, gravação por voz e organização
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Ideias para novo projeto"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <div className={cn('w-2 h-2 rounded-full', cat.color.split(' ')[0])} />
                            {cat.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  <AnimatePresence>
                    {tags.map((tag) => (
                      <motion.div
                        key={tag}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Badge variant="secondary" className="gap-1">
                          {tag}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Adicionar tag..."
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    <Tag className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Creation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Conteúdo
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateAIContent}
                    disabled={isGenerating || !title.trim()}
                    className="gap-1"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Gerar com IA
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={cn(
                      "gap-1",
                      isRecording && "bg-red-100 text-red-800 border-red-200"
                    )}
                  >
                    {isRecording ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                    {isRecording ? 'Gravando...' : 'Gravar Voz'}
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Escreve o conteúdo, usa IA para gerar ideias ou grava por voz
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreve o conteúdo da tua nota aqui... ou usa as ferramentas acima para criar conteúdo."
                rows={12}
                className="resize-none"
              />
              
              {/* Category Badge */}
              {selectedCategory && (
                <div className="mt-3">
                  <Badge className={selectedCategory.color}>
                    {selectedCategory.label}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? 'A criar...' : 'Criar Nota'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
