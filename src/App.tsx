import { useState, useEffect, useCallback } from 'react';
import { Layout, Spin, message } from 'antd';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Note } from './db';
import { recognizeImage, warmupWorker } from './utils/ocr';
import { captionImageFromFile } from './utils/vision';
import { extractInfo } from './utils/extractor';
import { analyzeImageWithGemini } from './utils/llm';
import { compressImage, getFileSizeMB } from './utils/imageCompression';
import { Sidebar, NoteEditor, SettingsModal, EmptyState, ErrorBoundary } from './components';

const { Content } = Layout;

function App() {
  const notes = useLiveQuery(() => db.notes.toArray());
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [searchQuery, setSearchQuery] = useState('');

  // Pre-warm OCR worker on app start
  useEffect(() => {
    warmupWorker().catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedNoteId && notes) {
      const note = notes.find(n => n.id === selectedNoteId);
      if (note) setEditingNote(note);
    } else {
      setEditingNote(null);
    }
  }, [selectedNoteId, notes]);

  // Paste Event Listener
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) handleUpload(blob);
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [apiKey]);

  const handleUpload = useCallback(async (file: File) => {
    // Check file size (max 10MB)
    if (getFileSizeMB(file) > 10) {
      message.error('File size too large. Maximum 10MB allowed.');
      return false;
    }

    setLoading(true);
    try {
      // Compress image first
      const { dataUrl: base64Image } = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.85,
        type: 'image/jpeg'
      });

      let text = "";
      let info = {
        urls: [] as string[],
        emails: [] as string[],
        keywords: [] as string[],
        sentences: [] as string[],
        suggestedTitle: "New Note"
      };
      // Vision caption (optional)
      let visionCaption = '';
      try {
        visionCaption = await captionImageFromFile(file);
      } catch (err) {
        console.error('Vision caption failed', err);
      }

      if (apiKey) {
        // Use Gemini LLM
        try {
          message.info("Analyzing with Gemini AI...");
          const result = await analyzeImageWithGemini(apiKey, base64Image);
          text = result.summary;
          info = result.extractedInfo;
        } catch (err) {
          console.error("Gemini failed, falling back to OCR", err);
          message.warning("AI Analysis failed, falling back to OCR.");
          // Fallback to OCR
          text = await recognizeImage(file);
          info = extractInfo(text);
        }
      } else {
        // Use OCR
        message.info("Processing with local OCR...");
        text = await recognizeImage(file);
        info = extractInfo(text);
      }
      
      const newNote: Note = {
        title: info.suggestedTitle,
        content: text,
        originalImage: base64Image,
        extractedData: {
          urls: info.urls,
          emails: info.emails,
          keywords: info.keywords,
          sentences: info.sentences
        },
        tags: info.keywords,
        visionCaption,
        createdAt: new Date(),
      };
      
      const id = await db.notes.add(newNote);
      setSelectedNoteId(Number(id));
      message.success('Screenshot processed successfully!');
    } catch (error) {
      console.error(error);
      message.error('Failed to process image.');
    } finally {
      setLoading(false);
    }
    return false;
  }, [apiKey]);

  const handleSave = useCallback(async (note: Note) => {
    if (note.id) {
      await db.notes.update(note.id, note);
      message.success('Note saved.');
    }
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    await db.notes.delete(id);
    if (selectedNoteId === id) setSelectedNoteId(null);
    message.success('Note deleted.');
  }, [selectedNoteId]);

  const handleExport = useCallback(async () => {
    const allNotes = await db.notes.toArray();
    const blob = new Blob([JSON.stringify(allNotes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <ErrorBoundary>
      <Layout style={{ minHeight: '100vh' }}>
        <Sidebar
          notes={notes}
          selectedNoteId={selectedNoteId}
          loading={loading}
          searchQuery={searchQuery}
          onSelectNote={setSelectedNoteId}
          onDeleteNote={handleDelete}
          onUpload={handleUpload}
          onExport={handleExport}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onSearchChange={setSearchQuery}
        />
        
        <Layout>
          <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', marginTop: 50 }}>
                <Spin size="large" tip="Processing..." />
              </div>
            ) : editingNote ? (
              <NoteEditor
                note={editingNote}
                onSave={handleSave}
                onChange={setEditingNote}
              />
            ) : (
              <EmptyState />
            )}
          </Content>
        </Layout>

        <SettingsModal
          isOpen={isSettingsOpen}
          apiKey={apiKey}
          onApiKeyChange={setApiKey}
          onClose={() => setIsSettingsOpen(false)}
          onSave={() => setIsSettingsOpen(false)}
        />
      </Layout>
    </ErrorBoundary>
  );
}

export default App;
