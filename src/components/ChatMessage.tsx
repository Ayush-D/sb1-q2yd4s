import React, { useState } from 'react';
import { MessageSquare, User, AlertTriangle, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { SyntaxHighlighterProps } from 'react-syntax-highlighter';
import OctobotIcon from './OctobotIcon';

interface ChatMessageProps {
  message: {
    role: 'user' | 'assistant' | 'error';
    content: string;
    imageUrl?: string;
  };
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  const getMessageStyle = () => {
    switch (message.role) {
      case 'user':
        return 'bg-white bg-opacity-20 text-white';
      case 'assistant':
        return 'bg-purple-700 bg-opacity-50 text-white';
      case 'error':
        return 'bg-red-500 bg-opacity-50 text-white';
      default:
        return 'bg-gray-100';
    }
  };

  const getIcon = () => {
    switch (message.role) {
      case 'user':
        return <User size={16} />;
      case 'assistant':
        return <OctobotIcon size={16} color="currentColor" />;
      case 'error':
        return <AlertTriangle size={16} />;
      default:
        return null;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex flex-col max-w-3/4 ${getMessageStyle()} rounded-lg p-3 shadow-md`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getIcon()}
            <span className="font-semibold">
              {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'Octabot' : 'Error'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="text-white opacity-70 hover:opacity-100 focus:outline-none"
              title="Copy message"
            >
              {isCopied ? 'Copied!' : <Copy size={16} />}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white opacity-70 hover:opacity-100 focus:outline-none"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
        {isExpanded && (
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={tomorrow}
                      language={match[1]}
                      PreTag="div"
                      {...props as SyntaxHighlighterProps}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                img: ({ src, alt }) => (
                  <img src={src} alt={alt} className="max-w-full h-auto rounded-lg shadow-md" />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
            {message.imageUrl && (
              <img 
                src={message.imageUrl}
                alt="Uploaded or Generated" 
                className="mt-2 max-w-full h-auto rounded-lg shadow-md" 
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;