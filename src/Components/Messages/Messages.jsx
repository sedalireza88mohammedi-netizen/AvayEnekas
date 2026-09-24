import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ChevronRight, Inbox } from 'lucide-react';
import { getMyMessages } from '../../api';
import { useCartStore } from '../../cartStore';
import './Messages.css';

const toPersianDigits = (num) =>
  String(num).replace(/\d/g, (x) => '۰۱۲۳۴۵۶۷۸۹'[x]);

function formatJalali(iso) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return toPersianDigits(
      d.toLocaleDateString('fa-IR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    );
  } catch {
    return '';
  }
}

export default function Messages() {
  const navigate = useNavigate();
  const { markOneMessageRead, refreshMessages } = useCartStore();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getMyMessages()
      .then((data) => {
        if (mounted) setMessages(data || []);
      })
      .catch(() => {
        if (mounted) setError('امکان دریافت پیام‌ها وجود ندارد');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const allRead = messages.length > 0 && messages.every((m) => m.is_read);

  const openMessage = (msg) => {
    if (!msg.is_read) {
      markOneMessageRead(msg.id);
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m)));
    }
  };

  const markAll = () => {
    messages.forEach((m) => {
      if (!m.is_read) markOneMessageRead(m.id);
    });
    setMessages((prev) => prev.map((m) => ({ ...m, is_read: true })));
  };

  return (
    <div className="messages-page">
      <div className="messages-header">
        <button type="button" className="messages-back" onClick={() => navigate(-1)} aria-label="بازگشت">
          <ChevronRight size={20} />
        </button>
        <div className="messages-header-title">
          <Bell size={18} />
          <h1>پیام‌های من</h1>
        </div>
        {!allRead && messages.length > 0 && (
          <button type="button" className="messages-markall" onClick={markAll}>
            <CheckCheck size={15} />
            علامت‌گذاری همه
          </button>
        )}
      </div>

      <div className="messages-body">
        {loading ? (
          <div className="messages-empty">در حال دریافت پیام‌ها...</div>
        ) : error ? (
          <div className="messages-empty">{error}</div>
        ) : messages.length === 0 ? (
          <div className="messages-empty">
            <Inbox size={40} />
            <p>هنوز پیامی برای شما ارسال نشده است.</p>
          </div>
        ) : (
          <ul className="messages-list">
            {messages.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  className={`message-item${m.is_read ? ' is-read' : ''}`}
                  onClick={() => openMessage(m)}
                >
                  <span className="message-dot" />
                  <div className="message-content">
                    <p className="message-text">{m.text}</p>
                    <span className="message-date">{formatJalali(m.created_at)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}