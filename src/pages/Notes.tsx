import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNotesStore, Note } from '@/stores/notesStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Trash2, Tag, Calendar, Mic, Sparkles } from 'lucide-react';
import { EnhancedNoteEditor } from '@/components/notes/EnhancedNoteEditor';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function Notes() {
  const { t } = useTranslation();
  const { notes, deleteNote } = useNotesStore();
  const [open, setOpen] = useState(false);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'personal': return 'bg-blue-100 text-blue-800';
      case 'work': return 'bg-green-100 text-green-800';
      case 'ideas': return 'bg-purple-100 text-purple-800';
      case 'todo': return 'bg-orange-100 text-orange-800';
      case 'learning': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'personal': return 'Pessoal';
      case 'work': return 'Trabalho';
      case 'ideas': return 'Ideias';
      case 'todo': return 'Tarefas';
      case 'learning': return 'Aprendizado';
      default: return 'Outro';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('myNotes')}</h1>
          <p className="text-muted-foreground">Editor avançado com formatação, voz e IA</p>
        </div>
        
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Criar Nota
        </Button>
      </div>

      <EnhancedNoteEditor open={open} onOpenChange={setOpen} />

      {notes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Ainda não há notas. Cria a tua primeira nota avançada!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} onDelete={() => deleteNote(note.id)} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function NoteCard({ note, onDelete }: { note: Note; onDelete: () => void }) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'personal': return 'bg-blue-100 text-blue-800';
      case 'work': return 'bg-green-100 text-green-800';
      case 'ideas': return 'bg-purple-100 text-purple-800';
      case 'todo': return 'bg-orange-100 text-orange-800';
      case 'learning': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'personal': return 'Pessoal';
      case 'work': return 'Trabalho';
      case 'ideas': return 'Ideias';
      case 'todo': return 'Tarefas';
      case 'learning': return 'Aprendizagem';
      default: return 'Outro';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base mb-2">{note.title}</CardTitle>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getCategoryColor(note.category)}>
                {getCategoryLabel(note.category)}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(note.createdAt), "dd/MM/yyyy", { locale: pt })}
              </div>
            </div>
            {note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {note.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Tag className="h-2 w-2 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {note.content ? (
          <p className="text-sm text-muted-foreground line-clamp-4">
            {note.content}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">Sem conteúdo</p>
        )}
      </CardContent>
    </Card>
  );
}
