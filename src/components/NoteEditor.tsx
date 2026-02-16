import React, { useState } from 'react';
import { Card, Typography, Button, Input, Tag, Space } from 'antd';
import { SaveOutlined, PlusOutlined } from '@ant-design/icons';
import { Note } from '../db';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface NoteEditorProps {
  note: Note;
  onSave: (note: Note) => void;
  onChange: (note: Note) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onChange }) => {
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleClose = (removedTag: string) => {
    const newTags = note.tags?.filter(tag => tag !== removedTag) || [];
    onChange({ ...note, tags: newTags });
  };

  const handleInputConfirm = () => {
    if (inputValue && !note.tags?.includes(inputValue)) {
      onChange({ ...note, tags: [...(note.tags || []), inputValue] });
    }
    setInputVisible(false);
    setInputValue('');
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Input 
          size="large" 
          value={note.title} 
          onChange={e => onChange({...note, title: e.target.value})} 
          style={{ fontWeight: 'bold', fontSize: 20, width: '80%' }}
          placeholder="Note title"
        />
        <Button type="primary" icon={<SaveOutlined />} onClick={() => onSave(note)}>
          Save
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        {note.tags?.map((tag) => (
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
            onChange={e => setInputValue(e.target.value)}
            onBlur={handleInputConfirm}
            onPressEnter={handleInputConfirm}
            autoFocus
          />
        ) : (
          <Tag onClick={() => setInputVisible(true)} style={{ borderStyle: 'dashed', cursor: 'pointer' }}>
            <PlusOutlined /> New Tag
          </Tag>
        )}
      </div>
      
      <Card title="Extracted Information" size="small" style={{ marginBottom: 16, background: '#f9f9f9' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {note.originalImage && (
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <img 
                src={note.originalImage} 
                alt="Original Screenshot" 
                style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }} 
              />
            </div>
          )}
          {note.extractedData.urls.length > 0 && (
            <div>
              <Text strong>URLs:</Text>
              <ul>
                {note.extractedData.urls.map((u, i) => (
                  <li key={i}>
                    <a href={u} target="_blank" rel="noopener noreferrer">{u}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {note.extractedData.emails.length > 0 && (
            <div>
              <Text strong>Emails:</Text>
              <ul>
                {note.extractedData.emails.map((e, i) => (
                  <li key={i}>
                    <a href={`mailto:${e}`}>{e}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {note.extractedData.keywords.length > 0 && (
            <div>
              <Text strong>Keywords:</Text>
              <div>
                {note.extractedData.keywords.map(k => (
                  <Text code key={k} style={{ marginRight: 4 }}>{k}</Text>
                ))}
              </div>
            </div>
          )}
        </Space>
      </Card>

      {note.visionCaption && (
        <div style={{ marginBottom: 8 }}>
          <Text strong>Vision Caption:</Text> <span>{note.visionCaption}</span>
        </div>
      )}
      <Title level={5}>Content</Title>
      <TextArea 
        rows={15} 
        value={note.content} 
        onChange={e => onChange({...note, content: e.target.value})} 
        placeholder="Note content..."
      />
    </div>
  );
};

export default NoteEditor;
