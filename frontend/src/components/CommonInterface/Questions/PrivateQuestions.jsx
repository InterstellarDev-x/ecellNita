import React, { useState } from "react";
import { Flag, MessageCircle, Send, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { useAnswerProductQuestion, useBuyerQuestions, useDeleteProductQuestion, useReportProductQuestion, useSellerQuestions } from "../../../hooks/useQuestionQueries";
import "./PrivateQuestions.css";

const formatDate = (value) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

function ReportButton({ questionId, targetType }) {
  const report = useReportProductQuestion();
  const submit = async () => {
    const reason = window.prompt("Why are you reporting this message? (optional)");
    if (reason === null) return;
    try {
      await report.mutateAsync({ questionId, targetType, reason });
      toast.success("Message hidden and sent for review.");
    } catch (error) { toast.error(error.message || "Could not report the message."); }
  };
  return <button type="button" className="private-questions__report" onClick={submit} disabled={report.isPending}><Flag size={14} /> Report</button>;
}

function QuestionCard({ item, audience }) {
  const [answer, setAnswer] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const reply = useAnswerProductQuestion();
  const deleteQuestion = useDeleteProductQuestion();
  const seller = audience === "seller";
  const submitReply = async (event) => {
    event.preventDefault();
    if (!answer.trim()) return;
    try {
      await reply.mutateAsync({ questionId: item._id, answer });
      setAnswer("");
      toast.success("Private reply sent.");
    } catch (error) { toast.error(error.message || "Could not send the reply."); }
  };

  const submitDelete = async () => {
    try {
      await deleteQuestion.mutateAsync(item._id);
      toast.success("Question unsent.");
    } catch (error) {
      setConfirmingDelete(false);
      toast.error(error?.response?.data?.message || error.message || "Could not unsend the question.");
    }
  };

  return (
    <article className="private-questions__card">
      <header>
        <div className="private-questions__product"><img src={item.product?.images?.[0] || "/logo192.png"} alt="" /><span><strong>{item.product?.productname || "Product"}</strong><small>{formatDate(item.createdAt)}</small></span></div>
        <div className="private-questions__header-actions">
          <span className={`private-questions__status ${item.answer ? "is-answered" : ""}`}>{item.answer ? "Answered" : "Awaiting reply"}</span>
          {!seller && !item.answer && !item.questionHidden && (
            <button type="button" className="private-questions__unsend" onClick={() => setConfirmingDelete(true)} disabled={deleteQuestion.isPending}>
              <Trash2 size={13} /> Unsend
            </button>
          )}
        </div>
      </header>
      <section className="private-questions__message">
        <div className="private-questions__label">Buyer’s question</div>
        {item.questionHidden ? <p className="private-questions__hidden">This question is hidden pending admin review.</p> : <p>{item.question}</p>}
        {seller && !item.questionHidden && <ReportButton questionId={item._id} targetType="question" />}
      </section>
      {confirmingDelete && (
        <section className="private-questions__unsend-confirm" role="alert">
          <span><strong>Unsend this question?</strong><small>It will disappear for both you and the seller.</small></span>
          <div>
            <button type="button" className="is-cancel" onClick={() => setConfirmingDelete(false)} disabled={deleteQuestion.isPending}>Keep it</button>
            <button type="button" className="is-danger" onClick={submitDelete} disabled={deleteQuestion.isPending}>{deleteQuestion.isPending ? "Unsending…" : "Yes, unsend"}</button>
          </div>
        </section>
      )}
      {item.answer && <section className="private-questions__message private-questions__answer">
        <div className="private-questions__label">Seller’s reply <small>{formatDate(item.answer.respondedAt)}</small></div>
        {item.answer.hidden ? <p className="private-questions__hidden">This reply is hidden pending admin review.</p> : <p>{item.answer.body}</p>}
        {!seller && !item.answer.hidden && <ReportButton questionId={item._id} targetType="answer" />}
      </section>}
      {seller && !item.questionHidden && !item.answer && <form className="private-questions__reply" onSubmit={submitReply}>
        <label htmlFor={`reply-${item._id}`}>Your one-time reply</label>
        <textarea id={`reply-${item._id}`} value={answer} onChange={(event) => setAnswer(event.target.value)} maxLength={1000} placeholder="Give the buyer a clear, helpful answer…" />
        <button type="submit" disabled={reply.isPending || !answer.trim()}><Send size={15} /> {reply.isPending ? "Sending…" : "Send reply"}</button>
      </form>}
    </article>
  );
}

function PrivateQuestions({ audience, embedded = false }) {
  const buyerQuery = useBuyerQuestions(audience === "buyer");
  const sellerQuery = useSellerQuestions(audience === "seller");
  const query = audience === "seller" ? sellerQuery : buyerQuery;
  const questions = query.data || [];
  const headline = audience === "seller" ? "Buyer questions" : "My private questions";
  const description = audience === "seller" ? "Answer product questions once. Keep every reply useful and respectful." : "Only you and the seller can see these conversations.";

  const content = <>
    {query.isLoading ? <div className="private-questions__empty">Loading private questions…</div> : query.isError ? <div className="private-questions__empty">{query.error.message || "Could not load questions."}</div> : questions.length === 0 ? <div className="private-questions__empty"><MessageCircle size={26} /><strong>No questions yet</strong><span>{audience === "seller" ? "Questions about your listings will appear here." : "Ask a seller from any product page when you need more detail."}</span></div> : <section className="private-questions__list">{questions.map((item) => <QuestionCard key={item._id} item={item} audience={audience} />)}</section>}
  </>;

  if (embedded) {
    return <div className="private-questions private-questions--embedded">{content}</div>;
  }

  return <main className="private-questions">
    <section className="private-questions__hero"><div className="private-questions__eyebrow"><MessageCircle size={16} /> Private conversations</div><h1>{headline}</h1><p>{description}</p></section>
    {content}
  </main>;
}

export default PrivateQuestions;
