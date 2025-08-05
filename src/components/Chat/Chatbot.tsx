import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Loader, Sparkles, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm your entertainment assistant! I can help you find movies, recommend shows, answer questions, or just chat. What would you like to know?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call secure serverless function instead of direct OpenAI API
      const response = await fetch('/.netlify/functions/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const data = await response.json();
      
      // Handle fallback responses
      if (data.fallback) {
        throw new Error('AI service unavailable');
      }
      
      const botResponse = data.response || "I'm sorry, I couldn't process that request.";

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponse,
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      
      // Fallback responses for common queries
      const fallbackResponse = getFallbackResponse(userMessage.content);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: fallbackResponse,
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      toast.error('AI service temporarily unavailable, using fallback responses');
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('movie') || input.includes('film')) {
      return "I'd love to help you find movies! You can browse our extensive collection in the Movies section. We have everything from classics like The Shawshank Redemption to recent hits like Interstellar. What genre are you in the mood for?";
    }
    
    if (input.includes('anime')) {
      return "Great choice! We have amazing anime series like Attack on Titan, Jujutsu Kaisen, and Solo Leveling. You can find them all in our Movies section. Are you looking for action, romance, or something else?";
    }
    
    if (input.includes('recommend') || input.includes('suggest')) {
      return "I'd be happy to recommend something! Based on our popular content, I suggest checking out:\n\n🎬 Movies: Interstellar, The Dark Knight, Parasite\n📺 Series: 11.22.63, The Queen's Gambit, Squid Game\n🎌 Anime: Attack on Titan, Jujutsu Kaisen\n\nWhat type of content interests you most?";
    }
    
    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      return "Hello! Welcome to our entertainment platform! I'm here to help you discover amazing movies, series, and anime. You can also chat with friends, share quotes, and see where other users are located on our world map. What would you like to explore first?";
    }
    
    if (input.includes('help')) {
      return "I'm here to help! Here's what you can do on our platform:\n\n🎬 Browse movies and series with direct watch links\n💬 Chat with other users in real-time\n✨ Read and share inspirational quotes\n🗺️ See user locations on our world map\n🎮 Play games like Tic Tac Toe\n👥 Create posts and interact with the community\n\nWhat would you like to know more about?";
    }
    
    return "Thanks for your message! I'm here to help with movies, shows, platform features, and general questions. Feel free to ask me anything about our entertainment platform!";
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-purple-500/20">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-700">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-medium text-white">Entertainment Assistant</h3>
          <p className="text-sm text-gray-400">AI-powered helper</p>
        </div>
        <div className="ml-auto">
          <Sparkles className="w-5 h-5 text-yellow-400" />
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
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                message.isBot
                  ? 'bg-gray-800 text-gray-100'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
              }`}>
                <div className="flex items-start gap-2">
                  {message.isBot && (
                    <Bot className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-2 ${
                      message.isBot ? 'text-gray-400' : 'text-purple-100'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
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
            <div className="bg-gray-800 text-gray-100 px-4 py-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-400" />
                <Loader className="w-4 h-4 animate-spin text-blue-400" />
                <span>Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about movies, shows, or the platform..."
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            "Recommend a movie",
            "What anime do you have?",
            "Help me find something to watch",
            "How does this platform work?"
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInput(suggestion)}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-full transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}