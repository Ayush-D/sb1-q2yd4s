import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, MessageSquare, X, Bot, Image as ImageIcon, Loader } from 'lucide-react';
import ChatMessage from './components/ChatMessage';
import CodeInput from './components/CodeInput';
import { sendMessage, uploadFile, generateImage, describeImage, extractTextFromImage } from './api';
import Header from './components/Header';

interface Message {
  role: 'user' | 'assistant' | 'error';
  content: string;
  imageUrl?: string;
}

interface ProcessedImage {
  file: File;
  previewUrl: string;
  description?: string;
  extractedText?: string;
  analyzing: boolean;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const welcomeMessage: Message = {
      role: 'assistant',
      content: "Welcome to Ayush's Octabot! I'm here to help you with any questions or tasks. You can also upload files by dragging and dropping them into the chat. How can I assist you today?"
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  });

  const handleSend = async () => {
    if (input.trim() === '' && !processedImage) return;
    if (isLoading) return;
  
    setIsLoading(true);
  
    try {
      let messageToSend = input;
      let imageDescription: string | undefined;
      let extractedText: string | undefined;
      let imageUrl: string | undefined;
  
      if (processedImage) {
        imageDescription = processedImage.description;
        extractedText = processedImage.extractedText;
        imageUrl = processedImage.previewUrl;
        messageToSend += `\n\nUploaded image: ${processedImage.file.name}`;
      }
  
      const newMessage: Message = {
        role: 'user',
        content: messageToSend,
        imageUrl: imageUrl,
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setInput('');
      setProcessedImage(null);
  
      const response = await sendMessage(messageToSend, imageDescription, extractedText);
  
      if (response.startsWith('GENERATE_IMAGE: ')) {
        const imagePrompt = response.substring('GENERATE_IMAGE: '.length);
        const generatedImageUrl = await generateImage(imagePrompt);
        const assistantMessage: Message = {
          role: 'assistant',
          content: `Here's the image you requested based on the prompt: "${imagePrompt}"`,
          imageUrl: generatedImageUrl,
        };
        setMessages((prevMessages) => [...prevMessages, assistantMessage]);
      } else {
        const assistantMessage: Message = { role: 'assistant', content: response };
        setMessages((prevMessages) => [...prevMessages, assistantMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        role: 'error',
        content: error instanceof Error ? error.message : 'An unknown error occurred. Please try again.',
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      await processImageFile(files[0]);
    }
  };

  const processImageFile = async (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setProcessedImage({ file, previewUrl, analyzing: true });

    try {
      const [imageDescription, extractedText] = await Promise.all([
        describeImage(file),
        extractTextFromImage(file)
      ]);
      setProcessedImage(prev => 
        prev ? { ...prev, description: imageDescription, extractedText, analyzing: false } : null
      );
    } catch (error) {
      console.error('Error processing image:', error);
      setProcessedImage(prev => 
        prev ? { ...prev, description: 'Error processing image', analyzing: false } : null
      );
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

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target === dropZoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      await processImageFile(files[0]);
    }
  };

  const removeFile = () => {
    if (processedImage) {
      URL.revokeObjectURL(processedImage.previewUrl);
    }
    setProcessedImage(null);
  };

  return (
    <div 
      className="flex flex-col h-screen bg-gradient-to-b from-blue-600 to-purple-600"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
    >
      <Header />
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        {isLoading && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>
      <div className="p-4 bg-white bg-opacity-10 shadow-md">
        {isDragging && (
          <div 
            ref={dropZoneRef}
            className="mb-4 p-4 border-2 border-dashed border-white rounded-lg bg-white bg-opacity-20 text-center"
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <p className="text-white font-semibold">Drop files here to chat</p>
          </div>
        )}
        {processedImage && (
          <div className="mb-4">
            <p className="font-semibold mb-2 text-white">Attached file:</p>
            <div className="flex items-center justify-between bg-white bg-opacity-20 p-2 rounded">
              <span className="flex items-center">
                <img 
                  src={processedImage.previewUrl} 
                  alt="Preview" 
                  className="w-10 h-10 object-cover rounded mr-2" 
                />
                <span className="text-white">{processedImage.file.name}</span>
              </span>
              <div className="flex items-center">
                {processedImage.analyzing && <Loader className="animate-spin mr-2 text-white" size={16} />}
                <button onClick={removeFile} className="text-red-300 hover:text-red-100">
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
        <CodeInput
          value={input}
          onChange={setInput}
          onSubmit={handleSend}
          placeholder={processedImage ? (processedImage.analyzing ? "Analyzing image..." : "Ask about the attached image or type your message...") : "Chat with Octabot or ask for an image..."}
          disabled={isLoading}
          inputRef={inputRef}
        />
        <div className="flex items-center justify-between mt-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*"
            disabled={isLoading || !!processedImage}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition-colors duration-200"
            disabled={isLoading || !!processedImage}
          >
            <Upload size={20} />
          </button>
          <button
            onClick={handleSend}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
            disabled={isLoading || (input.trim() === '' && !processedImage)}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;