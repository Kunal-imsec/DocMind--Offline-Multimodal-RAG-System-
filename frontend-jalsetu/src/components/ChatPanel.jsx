import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMaximize2, FiMinimize2, FiSend, FiPaperclip, FiInfo, FiFileText } from 'react-icons/fi';

const ChatPanel = ({
    messages,
    isFullscreen,
    onToggleFullscreen,
    onSendMessage,
    currentChat
}) => {
    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [activeCitation, setActiveCitation] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();

        if (!inputValue.trim() || isSending) return;

        const message = inputValue.trim();
        setInputValue('');
        setIsSending(true);

        try {
            await onSendMessage(message);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsSending(false);
            inputRef.current?.focus();
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="flex-1 flex flex-col glass border-x border-dark-600">
            {/* Header */}
            <div className="p-4 border-b border-dark-600 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white">
                        {currentChat?.name || 'Chat'}
                    </h2>
                    <p className="text-xs text-gray-500">
                        {messages.length} messages
                    </p>
                </div>
                <button
                    onClick={onToggleFullscreen}
                    className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                    {isFullscreen ? (
                        <FiMinimize2 className="text-xl text-gray-400" />
                    ) : (
                        <FiMaximize2 className="text-xl text-gray-400" />
                    )}
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                            <p className="text-lg mb-2">Start a conversation</p>
                            <p className="text-sm">Ask questions about your documents</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((message, index) => (
                            <motion.div
                                key={message.id || index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg p-3 ${message.sender === 'user'
                                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white'
                                        : 'glass-light text-gray-200'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap break-words">
                                        {message.content}
                                    </p>

                                    {/* Citations for assistant messages */}
                                    {message.sender === 'assistant' && message.citations && message.citations.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-dark-600">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FiInfo className="text-blue-400 text-sm" />
                                                <span className="text-xs text-gray-400 font-semibold">
                                                    Sources ({message.citations.length})
                                                </span>
                                            </div>
                                            <div className="space-y-1.5">
                                                {message.citations.map((citation, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="relative group"
                                                    >
                                                        <button
                                                            onClick={() => setActiveCitation(activeCitation === `${message.id}-${idx}` ? null : `${message.id}-${idx}`)}
                                                            className="w-full text-left glass-light rounded px-2 py-1.5 hover:bg-dark-700/50 transition-colors flex items-center gap-2"
                                                        >
                                                            <FiFileText className="text-blue-400 text-xs flex-shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs text-white truncate">
                                                                    {citation.document_name}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    Page {citation.page_number}
                                                                </p>
                                                            </div>
                                                        </button>

                                                        {/* Citation Popup */}
                                                        <AnimatePresence>
                                                            {activeCitation === `${message.id}-${idx}` && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: -10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    exit={{ opacity: 0, y: -10 }}
                                                                    className="absolute left-0 right-0 mt-1 glass rounded-lg p-3 shadow-xl z-10 border border-primary-500/30"
                                                                >
                                                                    <div className="flex items-start gap-2 mb-2">
                                                                        <FiFileText className="text-primary-400 mt-0.5 flex-shrink-0" />
                                                                        <div className="flex-1">
                                                                            <p className="text-xs font-semibold text-white">
                                                                                {citation.document_name}
                                                                            </p>
                                                                            <p className="text-xs text-primary-400">
                                                                                Page {citation.page_number}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="glass-light rounded p-2">
                                                                        <p className="text-xs text-gray-300 italic">
                                                                            "{citation.excerpt}"
                                                                        </p>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <p className={`text-xs mt-2 ${message.sender === 'user' ? 'text-primary-200' : 'text-gray-500'
                                        }`}>
                                        {formatTime(message.timestamp)}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-dark-600">
                <form onSubmit={handleSend} className="flex gap-2">
                    <div className="flex-1 relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type your message..."
                            disabled={isSending || !currentChat}
                            className="input-field pr-10"
                        />
                        <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-dark-700 rounded-lg transition-colors"
                            title="Attach file"
                        >
                            <FiPaperclip className="text-gray-400" />
                        </button>
                    </div>
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isSending || !currentChat}
                        className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FiSend className="text-lg" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatPanel;
