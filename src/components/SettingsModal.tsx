import React from 'react';
import { Modal, Form, Input, message } from 'antd';

interface SettingsModalProps {
  isOpen: boolean;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onClose: () => void;
  onSave: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  apiKey,
  onApiKeyChange,
  onClose,
  onSave,
}) => {
  const handleSave = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    onSave();
    message.success('API Key saved');
  };

  return (
    <Modal
      title="Settings"
      open={isOpen}
      onOk={handleSave}
      onCancel={onClose}
      okText="Save"
    >
      <Form layout="vertical">
        <Form.Item 
          label="Google Gemini API Key" 
          help="Required for AI summarization. Get one for free at aistudio.google.com"
        >
          <Input.Password 
            value={apiKey} 
            onChange={e => onApiKeyChange(e.target.value)} 
            placeholder="Enter your API Key here"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SettingsModal;
