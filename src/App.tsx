import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Upload, Card, Typography, Spin, message, Input, Space, Tag, Modal, Form } from 'antd';
import { UploadOutlined, DeleteOutlined, SaveOutlined, DownloadOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Note } from './db';
import { recognizeImage } from './utils/ocr';
import { extractInfo } from './utils/extractor';
import { analyzeImageWithGemini } from './utils/llm';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

const App: React.FC = () => {
  const notes = useLiveQuery(() => db.notes.toArray());
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');

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
  }, [apiKey]); // Re-bind if API key changes (though handleUpload reads state directly, dependency here ensures freshness if closure issues arise)

  const handleClose = (removedTag: string) => {
    if (!editingNote) return;
    const newTags = editingNote.tags?.filter(tag => tag !== removedTag) || [];
    setEditingNote({ ...editingNote, tags: newTags });
  };

  const showInput = () => {
    setInputVisible(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputConfirm = () => {
    if (inputValue && editingNote) {
        const tags = editingNote.tags || [];
        if (!tags.includes(inputValue)) {
             setEditingNote({ ...editingNote, tags: [...tags, inputValue] });
        }
    }
    setInputVisible(false);
    setInputValue('');
  };

  const handleUpload = async (file: File) => {
    setLoading(true);
    try {
      // Convert image to Base64 first (needed for both DB and LLM)
      const reader = new FileReader();
      const base64Image = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      let text = "";
      let info = {
        urls: [] as string[],
        emails: [] as string[],
        keywords: [] as string[],
        sentences: [] as string[],
        suggestedTitle: "New Note"
      };

      if (apiKey) {
        // Use Gemini LLM
        try {
            message.info("Analyzing with Gemini AI...");
            const result = await analyzeImageWithGemini(apiKey, base64Image);
            text = result.summary; // Use summary as main content
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
        tags: info.keywords, // Initialize tags with extracted keywords
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
    return false; // Prevent auto upload
  };

  const handleSave = async () => {
    if (editingNote && editingNote.id) {
      await db.notes.update(editingNote.id, editingNote);
      message.success('Note saved.');
    }
  };

  const handleDelete = async (id: number) => {
    await db.notes.delete(id);
    if (selectedNoteId === id) setSelectedNoteId(null);
    message.success('Note deleted.');
  };

  const handleExport = async () => {
    const allNotes = await db.notes.toArray();
    const blob = new Blob([JSON.stringify(allNotes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notes_backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={300} style={{ borderRight: '1px solid #f0f0f0' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Title level={4} style={{ margin: 0 }}>Screenshot Notes</Title>
            <Button icon={<SettingOutlined />} onClick={() => setIsSettingsOpen(true)} />
          </div>
          <Space>
            <Upload beforeUpload={handleUpload} showUploadList={false} accept="image/*">
                <Button icon={<UploadOutlined />} type="primary" loading={loading}>Upload / Paste</Button>
            </Upload>
            <Button icon={<DownloadOutlined />} onClick={handleExport} title="Export Data" />
          </Space>
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedNoteId ? [selectedNoteId.toString()] : []}
          onClick={({ key }) => setSelectedNoteId(Number(key))}
          items={notes?.map(note => ({
            key: String(note.id!),
            label: (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{note.title}</span>
                    <DeleteOutlined onClick={(e) => { e.stopPropagation(); handleDelete(note.id!); }} style={{ color: 'red' }} />
                </div>
            )
          }))}
        />
      </Sider>
      <Layout>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', overflowY: 'auto' }}>
          {loading ? (
             <div style={{ textAlign: 'center', marginTop: 50 }}><Spin size="large" tip="Processing OCR..." /></div>
          ) : editingNote ? (
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                  <Input 
                    size="large" 
                    value={editingNote.title} 
                    onChange={e => setEditingNote({...editingNote, title: e.target.value})} 
                    style={{ fontWeight: 'bold', fontSize: 20, width: '80%' }}
                  />
                  <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>Save</Button>
              </div>

              <div style={{ marginBottom: 16 }}>
                  {editingNote.tags?.map((tag) => (
                    <Tag
                        key={tag}
                        closable
                        onClose={(e) => {
                            e.preventDefault();
                            handleClose(tag);
                        }}
                    >
                        {tag}
                    </Tag>
                  ))}
                  {inputVisible ? (
                    <Input
                        type="text"
                        size="small"
                        style={{ width: 78 }}
                        value={inputValue}
                        onChange={handleInputChange}
                        onBlur={handleInputConfirm}
                        onPressEnter={handleInputConfirm}
                        autoFocus
                    />
                  ) : (
                    <Tag onClick={showInput} style={{ borderStyle: 'dashed' }}>
                        <PlusOutlined /> New Tag
                    </Tag>
                  )}
              </div>
              
              <Card title="Extracted Information" size="small" style={{ marginBottom: 16, background: '#f9f9f9' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    {editingNote.originalImage && (
                        <div style={{ textAlign: 'center', marginBottom: 10 }}>
                            <img src={editingNote.originalImage} alt="Original Screenshot" style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }} />
                        </div>
                    )}
                    {editingNote.extractedData.urls.length > 0 && (
                        <div>
                            <Text strong>URLs:</Text>
                            <ul>{editingNote.extractedData.urls.map((u, i) => <li key={i}><a href={u} target="_blank" rel="noopener noreferrer">{u}</a></li>)}</ul>
                        </div>
                    )}
                    {editingNote.extractedData.keywords.length > 0 && (
                        <div>
                            <Text strong>Keywords:</Text>
                            <div>{editingNote.extractedData.keywords.map(k => <Text code key={k}>{k}</Text>)}</div>
                        </div>
                    )}
                </Space>
              </Card>

              <Title level={5}>Content</Title>
              <TextArea 
                rows={15} 
                value={editingNote.content} 
                onChange={e => setEditingNote({...editingNote, content: e.target.value})} 
              />
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#ccc', marginTop: 100 }}>
              Select a note or upload a screenshot to get started
            </div>
          )}
        </Content>
      </Layout>

      <Modal
        title="Settings"
        open={isSettingsOpen}
        onOk={() => {
            localStorage.setItem('gemini_api_key', apiKey);
            setIsSettingsOpen(false);
            message.success('API Key saved');
        }}
        onCancel={() => setIsSettingsOpen(false)}
      >
        <Form layout="vertical">
            <Form.Item label="Google Gemini API Key" help="Required for AI summarization. Get one for free at aistudio.google.com">
                <Input.Password 
                    value={apiKey} 
                    onChange={e => setApiKey(e.target.value)} 
                    placeholder="Enter your API Key here"
                />
            </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default App;
