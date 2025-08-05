import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your AI assistant. I can help you with movies, entertainment, and general questions. How can I assist you today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Try to use Netlify function first
      const response = await fetch('/.netlify/functions/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.text,
          username: user?.user_metadata?.username || 'User'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || "I'm sorry, I couldn't process your request at the moment. Please try again.",
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Chatbot error:', error);
      
      // Fallback to intelligent hardcoded responses
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: getIntelligentResponse(userMessage.text),
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getIntelligentResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    // Movie-related responses
    if (lowerInput.includes('movie') || lowerInput.includes('film') || lowerInput.includes('cinema')) {
      const movieResponses = [
        "I'd love to help you with movies! You can explore our Cinema section to discover trending films, search for specific titles, or get recommendations based on your preferences.",
        "For movie recommendations, try browsing our Cinema tab where you can find popular movies, search by genre, or discover what's trending on TMDB.",
        "Movies are amazing! Our platform integrates with TMDB to bring you the latest information about films, cast, ratings, and more. What genre are you interested in?"
      ];
      return movieResponses[Math.floor(Math.random() * movieResponses.length)];
    }

    // Chat-related responses
    if (lowerInput.includes('chat') || lowerInput.includes('message') || lowerInput.includes('talk')) {
      return "You can chat with other users on our platform! Go to the Chat section to start conversations, find friends by their username or email, and stay connected with the community.";
    }

    // Location/map responses
    if (lowerInput.includes('location') || lowerInput.includes('map') || lowerInput.includes('where')) {
      return "Check out our Map feature to see where other users are located and share your own location with friends. It's a great way to connect with people nearby!";
    }

    // Social features
    if (lowerInput.includes('follow') || lowerInput.includes('friend') || lowerInput.includes('social')) {
      return "Our social features let you follow other users, like and comment on posts, and build your network. Visit the Feed section to see what everyone is sharing!";
    }

    // Profile-related
    if (lowerInput.includes('profile') || lowerInput.includes('account') || lowerInput.includes('settings')) {
      return "You can customize your profile in the Profile section. Add a bio, profile picture, update your information, and manage your account settings.";
    }

    // Help/how-to questions
    if (lowerInput.includes('how') || lowerInput.includes('help') || lowerInput.includes('use')) {
      return "I can help you navigate CineConnect! We have features for movies, chat, social feed, location sharing, and more. What specific feature would you like to learn about?";
    }

    // Greeting responses
    if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
      return `Hello ${user?.user_metadata?.username || 'there'}! Welcome to CineConnect. I'm here to help you make the most of our platform. What can I assist you with today?`;
    }

    // Default intelligent response
    const defaultResponses = [
      "That's an interesting question! While I'd love to give you a detailed answer, I can help you explore our platform features like Movies, Chat, Social Feed, and Location sharing. What would you like to know more about?",
      "I understand you're looking for information. Our platform offers many features including movie discovery, social networking, and real-time chat. How can I guide you through these features?",
      "Thanks for your message! I'm designed to help with CineConnect features. You can discover movies, chat with friends, share posts, and explore locations. What interests you most?",
      "I appreciate your question! While I focus on helping with our platform features, I can guide you through movies, social features, messaging, and more. What would you like to explore?"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-full">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold">AI Assistant</h3>
            <p className="text-sm opacity-90">Always here to help</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-2 max-w-[80%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`p-2 rounded-full ${message.isUser ? 'bg-blue-500' : 'bg-gray-200'}`}>
                  {message.isUser ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                <div
                  className={`p-3 rounded-lg ${
                    message.isUser
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <p className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-start gap-2">
              <div className="p-2 rounded-full bg-gray-200">
                <Bot className="w-4 h-4 text-gray-600" />
              </div>
              <div className="bg-gray-100 p-3 rounded-lg rounded-bl-sm">
                <div className="flex items-center gap-1">
                  <Loader className="w-4 h-4 animate-spin text-gray-500" />
                  <span className="text-sm text-gray-500">Thinking...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4 bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about CineConnect..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isLoading}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}