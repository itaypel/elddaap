"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { CURRENT_OPERATOR } from "@/lib/data";
import { useOperator, useStore } from "@/lib/store";
import { ReplySheet } from "@/components/reply-sheet";
import { Badge, Button, Card, PageTitle, ScoreBar } from "@/components/ui";

export default function ReviewsPage() {
  const op = useOperator(CURRENT_OPERATOR)!;
  const toast = useStore((s) => s.toast);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [replyTo, setReplyTo] = useState<string | null>(null);

  return (
    <>
      <PageTitle title="דירוגים" sub={`${op.rating.toFixed(1)} מתוך 5 · ${op.reviewsCount} ביקורות מאומתות`} />
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <Card className="flex flex-col gap-3 p-5">
          <h2 className="font-bold">המפעיל</h2>
          <ScoreBar label="דייקנות" value={op.sub.punctuality} />
          <ScoreBar label="יחס ותקשורת" value={op.sub.communication} />
          <ScoreBar label="עמידה במה שהובטח" value={op.sub.asPromised} />
        </Card>
        <Card className="flex flex-col gap-3 p-5">
          <h2 className="font-bold">ההפעלה</h2>
          <ScoreBar label="הנאת הילדים" value={op.sub.kidsFun} />
          <ScoreBar label="התאמה לגיל" value={op.sub.ageFit} />
          <ScoreBar label="תמורה למחיר" value={op.sub.value} />
        </Card>
      </div>
      <Card className="mt-4 p-5">
        <ul className="divide-y divide-line">
          {op.reviews.map((r) => {
            const reply = r.reply ?? replies[r.id];
            return (
              <li key={r.id} className="py-4 first:pt-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{r.author}</span>
                    <span className="text-[13px] text-muted">
                      {r.context} · {r.when}
                    </span>
                    {r.verified && <Badge tone="success">הזמנה מאומתת</Badge>}
                  </p>
                  <span className="flex items-center gap-1 text-sm font-bold tabular">
                    <Star aria-hidden className="size-4 fill-star text-star" />
                    {r.score} / 5
                  </span>
                </div>
                <p className="mt-2 text-[15px] leading-relaxed">{r.text}</p>
                {reply ? (
                  <p className="mt-2 rounded-xl bg-sunken px-3 py-2 text-sm">
                    <span className="font-bold">התגובה שלכם: </span>
                    {reply}
                  </p>
                ) : (
                  <Button variant="secondary" size="sm" className="mt-2" onClick={() => setReplyTo(r.id)}>
                    תגובה לביקורת
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
      <ReplySheet
        open={!!replyTo}
        onClose={() => setReplyTo(null)}
        onSend={(text) => {
          if (replyTo) setReplies((r) => ({ ...r, [replyTo]: text }));
          setReplyTo(null);
          toast("התגובה פורסמה");
        }}
      />
    </>
  );
}
