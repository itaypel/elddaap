"use client";

import { useState } from "react";
import { Sheet } from "./sheet";
import { Button, Field, Textarea } from "./ui";

export function ReplySheet({ open, onClose, onSend }: { open: boolean; onClose: () => void; onSend: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="תגובה לביקורת"
      footer={
        <Button
          className="w-full"
          disabled={!text.trim()}
          onClick={() => {
            onSend(text);
            setText("");
          }}
        >
          פרסום התגובה
        </Button>
      }
    >
      <p className="mb-3 text-[15px] text-muted">התגובה תופיע מתחת לביקורת בכרטיס המפעיל. אפשר להגיב פעם אחת, אז כדאי לכתוב בנחת.</p>
      <Field label="התגובה שלכם" htmlFor="reply-text">
        <Textarea id="reply-text" rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="תודה! שמחנו לחגוג איתכם." />
      </Field>
    </Sheet>
  );
}
