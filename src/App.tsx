import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, MessageSquare } from 'lucide-react';
import ChatMessage from './components/ChatMessage';
import CodeInput from './components/CodeInput';
import { sendMessage, uploadFile, generateImage } from './api';

interface Message {
  role: 'user' | 'assistant' | 'error';
  content: string;
  imageUrl?: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedContent, setUploadedContent] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const newMessage: Message = { role: 'user', content: input };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let messageToSend = input;
      if (uploadedContent) {
        messageToSend = `${input}\n\nFile content: ${uploadedContent}`;
        setUploadedContent(null);
      }
      const response = await sendMessage(messageToSend);
      
      if (response.startsWith('GENERATE_IMAGE: ')) {
        const imagePrompt = response.substring('GENERATE_IMAGE: '.length);
        const imageUrl = await generateImage(imagePrompt);
        const assistantMessage: Message = { 
          role: 'assistant', 
          content: `Here's the image you requested:\n\n![Generated Image](${imagePrompt})`,
          imageUrl: imageUrl
        };
        setMessages(prevMessages => [...prevMessages, assistantMessage]);
      } else {
        const assistantMessage: Message = { role: 'assistant', content: response };
        setMessages(prevMessages => [...prevMessages, assistantMessage]);
      }
    } catch (error) {
      const errorMessage: Message = { 
        role: 'error', 
        content: error instanceof Error ? error.message : 'An unknown error occurred. Please try again.'
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await uploadFile(file);
      setUploadedContent(content);
      const newMessage: Message = { role: 'user', content: `Uploaded file: ${file.name}. Please provide your question or instructions about this file.` };
      setMessages(prevMessages => [...prevMessages, newMessage]);
    } catch (error) {
      const errorMessage: Message = { 
        role: 'error', 
        content: error instanceof Error ? error.message : 'An unknown error occurred while processing your file. Please try again.'
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">AI Chatbot</h1>
      </header>
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        {isLoading && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
      <div className="p-4 bg-white border-t">
        <CodeInput
          value={input}
          onChange={setInput}
          onSubmit={handleSend}
          placeholder={uploadedContent ? "Ask a question about the uploaded file..." : "Type your message or ask for an image..."}
          disabled={isLoading}
        />
        <div className="flex items-center justify-between mt-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            disabled={isLoading}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            disabled={isLoading}
          >
            <Upload size={20} />
          </button>
          <button
            onClick={handleSend}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isLoading || input.trim() === ''}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;