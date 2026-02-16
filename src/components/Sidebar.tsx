import React from 'react';
import { Layout, Menu, Button, Upload, Typography, Input, Space } from 'antd';
import { UploadOutlined, DeleteOutlined, DownloadOutlined, SettingOutlined } from '@ant-design/icons';
import { Note } from '../db';

const { Sider } = Layout;
const { Title } = Typography;

interface SidebarProps {
  notes: Note[] | undefined;
  selectedNoteId: number | null;
  loading: boolean;
  searchQuery: string;
  onSelectNote: (id: number) => void;
  onDeleteNote: (id: number) => void;
  onUpload: (file: File) => boolean | Promise<boolean>;
  onExport: () => void;
  onOpenSettings: () => void;
  onSearchChange: (value: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  notes,
  selectedNoteId,
  loading,
  searchQuery,
  onSelectNote,
  onDeleteNote,
  onUpload,
  onExport,
  onOpenSettings,
  onSearchChange,
}) => {
  const filteredNotes = notes?.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Sider theme="light" width={320} style={{ borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Title level={4} style={{ margin: 0 }}>Screenshot Notes</Title>
          <Button icon={<SettingOutlined />} onClick={onOpenSettings} />
        </div>
        
        <Input.Search
          placeholder="Search notes..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          style={{ marginBottom: 12 }}
          allowClear
        />
        
        <Space>
          <Upload beforeUpload={onUpload} showUploadList={false} accept="image/*">
            <Button icon={<UploadOutlined />} type="primary" loading={loading}>
              Upload / Paste
            </Button>
          </Upload>
          <Button icon={<DownloadOutlined />} onClick={onExport} title="Export Data" />
        </Space>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Menu
          mode="inline"
          selectedKeys={selectedNoteId ? [selectedNoteId.toString()] : []}
          onClick={({ key }) => onSelectNote(Number(key))}
          items={filteredNotes?.map(note => ({
            key: String(note.id!),
            label: (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                  {note.title}
                </span>
                <DeleteOutlined 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onDeleteNote(note.id!); 
                  }} 
                  style={{ color: 'red' }} 
                />
              </div>
            )
          }))}
        />
      </div>
      
      <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0', fontSize: 12, color: '#999' }}>
        {filteredNotes?.length || 0} notes
      </div>
    </Sider>
  );
};

export default Sidebar;
