import React, { useState } from "react";
import { Flag, MessageCircle, Send } from "lucide-react";
import { toast } from "react-toastify";
import { useAnswerProductQuestion, useBuyerQuestions, useReportProductQuestion, useSellerQuestions } from "../../../hooks/useQuestionQueries";
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
  const reply = useAnswerProductQuestion();
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

  return (
    <article className="private-questions__card">
      <header>
        <div className="private-questions__product"><img src={item.product?.images?.[0] || "/logo192.png"} alt="" /><span><strong>{item.product?.productname || "Product"}</strong><small>{formatDate(item.createdAt)}</small></span></div>
        <span className={`private-questions__status ${item.answer ? "is-answered" : ""}`}>{item.answer ? "Answered" : "Awaiting reply"}</span>
      </header>
      <section className="private-questions__message">
        <div className="private-questions__label">Buyer’s question</div>
        {item.questionHidden ? <p className="private-questions__hidden">This question is hidden pending admin review.</p> : <p>{item.question}</p>}
        {seller && !item.questionHidden && <ReportButton questionId={item._id} targetType="question" />}
      </section>
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

function PrivateQuestions({ audience }) {
  const buyerQuery = useBuyerQuestions(audience === "buyer");
  const sellerQuery = useSellerQuestions(audience === "seller");
  const query = audience === "seller" ? sellerQuery : buyerQuery;
  const questions = query.data || [];
  const headline = audience === "seller" ? "Buyer questions" : "My private questions";
  const description = audience === "seller" ? "Answer product questions once. Keep every reply useful and respectful." : "Only you and the seller can see these conversations.";

  return <main className="private-questions">
    <section className="private-questions__hero"><div className="private-questions__eyebrow"><MessageCircle size={16} /> Private conversations</div><h1>{headline}</h1><p>{description}</p></section>
    {query.isLoading ? <div className="private-questions__empty">Loading private questions…</div> : query.isError ? <div className="private-questions__empty">{query.error.message || "Could not load questions."}</div> : questions.length === 0 ? <div className="private-questions__empty"><MessageCircle size={26} /><strong>No questions yet</strong><span>{audience === "seller" ? "Questions about your listings will appear here." : "Ask a seller from any product page when you need more detail."}</span></div> : <section className="private-questions__list">{questions.map((item) => <QuestionCard key={item._id} item={item} audience={audience} />)}</section>}
  </main>;
}

export default PrivateQuestions;
