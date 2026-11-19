import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { serverUrl } from "../../config";
import { getAuthToken } from "../auth/session";
import { FaRobot, FaPaperPlane, FaTimes, FaMinus } from "react-icons/fa";
import { cn } from "./ui/cn";

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_MESSAGES = 8;
const MAX_HISTORY_CHARS = 4000;

const getRequestHistory = (messages) => {
  const recentMessages = messages.slice(-MAX_HISTORY_MESSAGES).reverse();
  const history = [];
  let totalChars = 0;

  for (const message of recentMessages) {
    const content = message.text.trim();
    if (!content || content.length > MAX_MESSAGE_LENGTH) continue;
    if (totalChars + content.length > MAX_HISTORY_CHARS) break;

    history.push({
      role: message.role === "user" ? "user" : "assistant",
      content,
    });
    totalChars += content.length;
  }

  return history.reverse();
};

const formatProductPrice = (value) => {
  const amount = Number(value);
  return value !== null && Number.isFinite(amount)
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
    : "Price unavailable";
};

const ProductResultCard = ({ product }) => {
  const specifications = Object.entries(product.specifications || {}).slice(0, 4);
  const productLink = typeof product.url === "string" && product.url.startsWith("/product/")
    ? product.url
    : "";

  return (
    <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      {productLink ? (
        <Link to={productLink} className="flex gap-3 p-3 transition-colors hover:bg-zinc-50">
          {product.images?.[0] && <img src={product.images[0]} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-lg bg-zinc-100 object-cover" />}
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-xs font-bold text-zinc-900">{product.name}</p>
            <p className="mt-0.5 truncate text-[10px] text-zinc-500">{[product.brand, product.category].filter(Boolean).join(" · ")}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-xs font-black text-zinc-900">{formatProductPrice(product.price)}</span>
              {product.originalPrice !== null && <span className="text-[10px] text-zinc-400 line-through">{formatProductPrice(product.originalPrice)}</span>}
              {product.discountPercent > 0 && <span className="text-[10px] font-bold text-emerald-700">{product.discountPercent}% off</span>}
            </div>
            <span className={`mt-1 inline-block text-[10px] font-semibold ${product.inStock ? "text-emerald-700" : "text-rose-600"}`}>
              {product.availability}
            </span>
          </div>
        </Link>
      ) : (
        <div className="p-3"><p className="text-xs font-bold text-zinc-900">{product.name}</p></div>
      )}
      {product.description && <p className="px-3 pb-2 text-[10px] leading-relaxed text-zinc-600">{product.description}</p>}
      {specifications.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-zinc-100 px-3 py-2">
          {specifications.map(([key, value]) => <div key={key} className="min-w-0"><dt className="truncate text-[9px] font-semibold text-zinc-400">{key}</dt><dd className="line-clamp-2 break-words text-[10px] text-zinc-700">{Array.isArray(value) ? value.join(", ") : typeof value === "object" && value !== null ? JSON.stringify(value) : String(value)}</dd></div>)}
        </dl>
      )}
      {(product.colors?.length > 0 || product.modelNumber || product.warranty || product.rating !== null) && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-zinc-100 px-3 py-2 text-[10px] text-zinc-500">
          {product.colors?.length > 0 && <span>Colors: {product.colors.slice(0, 4).join(", ")}</span>}
          {product.modelNumber && <span>Model: {product.modelNumber}</span>}
          {product.warranty && <span>Warranty: {product.warranty}</span>}
          {product.rating !== null && <span>★ {product.rating}{product.reviewCount ? ` (${product.reviewCount})` : ""}</span>}
        </div>
      )}
      {product.features?.length > 0 && <p className="truncate border-t border-zinc-100 px-3 py-2 text-[10px] text-zinc-500">Features: {product.features.slice(0, 4).join(", ")}</p>}
    </article>
  );
};

/**
 * Premium AiChat Component
 * Features: Mobile-responsive height, Glassmorphism UI, and Floating Label.
 */
const AiChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hi, I’m Savron. What can I help you with today?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [loadingMoreId, setLoadingMoreId] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isOpen]);

  const handleSend = async () => {
    const message = input.trim();
    if (!message || message.length > MAX_MESSAGE_LENGTH || loading || loadingMoreId) return;

    const history = getRequestHistory(messages);
    const assistantId = `assistant-${Date.now()}-${messages.length}`;
    const userMessage = { role: "user", text: message };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setInput("");

    try {
      const token = getAuthToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const { data } = await axios.post(
        `${serverUrl}/api/ai/chat`,
        { message, history },
        { headers },
      );
      if (data.success) {
        setMessages((prev) => [...prev, {
          id: assistantId,
          role: "ai",
          text: data.reply,
          products: Array.isArray(data.products) ? data.products : [],
          nextCursor: data.nextCursor || null,
          request: { message, history },
        }]);
      } else {
        setMessages((prev) => [...prev, {
          id: assistantId,
          role: "ai",
          text: data.message || "I couldn't complete that just now. Please try again.",
        }]);
      }
    } catch (error) {
      const errorMessage =
        error.response?.status === 429
          ? "You've sent too many messages. Please wait a moment and try again."
          : error.response?.status === 401
            ? "Your sign-in has expired. Please sign in again to continue."
            : "I'm having trouble connecting. Please try again later.";
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "ai",
          text: errorMessage,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async (assistantMessage) => {
    if (loading || loadingMoreId || !assistantMessage?.nextCursor || !assistantMessage.request) return;
    setLoadingMoreId(assistantMessage.id);

    try {
      const token = getAuthToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const { data } = await axios.post(
        `${serverUrl}/api/ai/chat`,
        { ...assistantMessage.request, cursor: assistantMessage.nextCursor },
        { headers },
      );

      if (data.success) {
        setMessages((prev) => prev.map((item) => {
          if (item.id !== assistantMessage.id) return item;
          const currentProducts = item.products || [];
          const seen = new Set(currentProducts.map((product) => product.url || product.name));
          const newProducts = (Array.isArray(data.products) ? data.products : [])
            .filter((product) => !seen.has(product.url || product.name));
          return {
            ...item,
            products: [...currentProducts, ...newProducts],
            nextCursor: data.nextCursor || null,
            loadMoreError: "",
          };
        }));
      }
    } catch (error) {
      const errorMessage = error.response?.status === 429
        ? "Too many requests. Please wait a moment and try again."
        : "Couldn't load more products. Please try again.";
      setMessages((prev) => prev.map((item) => item.id === assistantMessage.id
        ? { ...item, loadMoreError: errorMessage }
        : item));
    } finally {
      setLoadingMoreId(null);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[99999] font-sans flex flex-col items-end">
      {/* Chat Window Container */}
      {isOpen && (
        <div
          className={cn(
            "bg-white/95 backdrop-blur-xl w-[90vw] md:w-[400px] rounded-[2rem] shadow-[0_25px_70px_rgba(0,0,0,0.25)] border border-white/20 flex flex-col overflow-hidden mb-6 transition-all duration-500 ease-out animate-in slide-in-from-bottom-12 fade-in",
            "h-[75dvh] max-h-[600px] min-h-[400px]", // Dynamic height for mobile keyboard
          )}
        >
          {/* Premium Gradient Header */}
          <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 p-6 flex items-center justify-between text-white shrink-0 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="bg-gradient-to-tr from-orange-600 to-amber-400 p-2.5 rounded-2xl shadow-lg animate-pulse">
                  <FaRobot size={20} />
                </div>
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-zinc-900 rounded-full"></span>
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">Savron</h3>
                <p className="text-[10px] text-zinc-400 font-medium">Digital Store · Customer care</p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close customer care chat"
              onClick={() => setIsOpen(false)}
              className="p-2.5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <FaTimes size={18} className="text-zinc-400" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gradient-to-b from-zinc-50/50 to-white custom-scrollbar">
            {messages.map((msg, idx) => (
              <div
                key={msg.id || `${msg.role}-${idx}`}
                className={cn(
                  "flex w-full animate-in fade-in slide-in-from-bottom-2",
                  msg.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "min-w-0 px-4 py-3 text-[13.5px] leading-relaxed shadow-sm",
                    msg.role === "user"
                      ? "max-w-[85%] bg-zinc-900 text-white rounded-2xl rounded-tr-none"
                      : "w-[95%] max-w-[95%] bg-white text-zinc-800 border border-zinc-100 rounded-2xl rounded-tl-none",
                  )}
                >
                  {msg.text}
                  {msg.products?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.products.slice(0, 8).map((product, productIndex) => <ProductResultCard key={`${product.url || product.name}-${productIndex}`} product={product} />)}
                    </div>
                  )}
                  {msg.nextCursor && msg.request && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => handleLoadMore(msg)}
                        disabled={loading || Boolean(loadingMoreId)}
                        className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loadingMoreId === msg.id ? "Loading products…" : "Show more products"}
                      </button>
                      {msg.loadMoreError && <p className="mt-2 text-xs text-rose-600">{msg.loadMoreError}</p>}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start" role="status" aria-label="Savron is replying">
                <div className="bg-zinc-100 px-4 py-3 rounded-2xl rounded-tl-none border border-zinc-200">
                  <p className="mb-2 text-[10px] font-medium text-zinc-500">Savron is typing</p>
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Premium Input Area */}
          <div className="p-4 bg-white/80 border-t border-zinc-100 shrink-0">
            <div className="flex items-center gap-2 bg-zinc-100 p-1.5 rounded-2xl focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100 transition-all">
              <input
                type="text"
                value={input}
                maxLength={MAX_MESSAGE_LENGTH}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask a question or say hello…"
                aria-label="Message Savron"
                className="flex-1 bg-transparent border-none px-4 py-2 text-sm text-zinc-800 outline-none"
              />
              <button
                type="button"
                aria-label="Send message"
                onClick={handleSend}
                disabled={!input.trim() || loading || Boolean(loadingMoreId)}
                className={cn(
                  "p-3 rounded-xl transition-all flex items-center justify-center cursor-pointer active:scale-95",
                  input.trim()
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/30"
                    : "bg-zinc-200 text-zinc-400",
                )}
              >
                <FaPaperPlane size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button Group */}
      <div className="relative group flex flex-col items-center">
        {/* "AI Assistant" Label - Above the icon */}
        {!isOpen && (
          <div className="mb-3 px-3 py-1.5 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-xl animate-bounce border border-zinc-800 whitespace-nowrap">
            AI Assistant
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 rotate-45 border-r border-b border-zinc-800"></div>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "relative p-5 rounded-full shadow-2xl text-white transition-all duration-500 cursor-pointer active:scale-90 overflow-hidden",
            isOpen
              ? "bg-zinc-900 rotate-180"
              : "bg-gradient-to-br from-orange-600 to-amber-500 hover:scale-110",
          )}
        >
          <div className="relative z-10">
            {isOpen ? <FaMinus size={20} /> : <FaRobot size={26} />}
          </div>

          {/* Shine effect for premium feel */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
        </button>
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e4e4e7;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default AiChat;
