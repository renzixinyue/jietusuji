import React from 'react';
import { InboxOutlined } from '@ant-design/icons';

const EmptyState: React.FC = () => {
  return (
    <div style={{ 
      textAlign: 'center', 
      color: '#ccc', 
      marginTop: 100,
      padding: '40px'
    }}>
      <InboxOutlined style={{ fontSize: 64, marginBottom: 16 }} />
      <p style={{ fontSize: 16 }}>
        Select a note or upload a screenshot to get started
      </p>
      <p style={{ fontSize: 14, color: '#aaa' }}>
        Tip: You can paste screenshots directly from clipboard
      </p>
    </div>
  );
};

export default EmptyState;
