import { useEffect, useRef, useState, type FormEvent } from 'react';
import { listMessages, sendMessage, subscribeToMessages } from '../../lib/api';
import type { MessageRecord } from '../../types/database';
import { Button } from '../ui/Button';
import { Input } from '../ui/Field';

export function MessageThread({ contractId, currentUserId }: { contractId: string; currentUserId: string }) {
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    listMessages(contractId).then((msgs) => {
      if (active) setMessages(msgs);
    });

    const unsubscribe = subscribeToMessages(contractId, (msg) => {
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [contractId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setSending(true);
    setDraft('');
    try {
      await sendMessage({ contract_id: contractId, sender_id: currentUserId, content });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border border-blueprint-700 rounded-sm flex flex-col h-[420px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-line-500 font-mono text-sm">No messages yet — say hello.</p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-sm px-3 py-2 text-sm ${
                  mine ? 'bg-signal-950 border border-signal-600/40 text-line-100' : 'bg-blueprint-800 text-line-100'
                }`}
              >
                <p>{m.content}</p>
                <p className="label-tag mt-1 opacity-70">{new Date(m.created_at).toLocaleTimeString()}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-blueprint-700 p-3 flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message…"
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={sending || !draft.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
