import React from "react";
import { Flag, ShieldBan } from "lucide-react";
import { useReviewContentReport } from "../../hooks/useAdminQueries";

function ContentReportsAdmin({ reports, onError, onBlockUser, readOnly = false }) {
  const review = useReviewContentReport();
  const decide = async (reportId, resolution) => { try { await review.mutateAsync({ reportId, resolution }); } catch (error) { onError(error.message || "Could not review report."); } };
  const block = async (report) => { try { await onBlockUser(report.reportedUser?._id); await decide(report._id, "actioned"); } catch (error) { onError(error.message || "Could not block sender."); } };
  return <section className="admin-panel"><div className="admin-panel-head"><div><span>Private message safety</span><h2>{reports.length} pending reports</h2></div><Flag size={20} /></div><div className="admin-report-list">{reports.map((report) => <article key={report._id}><div className="admin-report-list__head"><strong>{report.targetType === "question" ? "Buyer question" : "Seller reply"}</strong><span>{report.question?.product?.productname || "Product removed"}</span></div><p className="admin-report-list__quote">“{report.contentSnapshot}”</p>{report.reason && <p className="admin-report-list__reason">Reason: {report.reason}</p>}<small>Reported by {report.reporter?.email} · Sender: {report.reportedUser?.email}</small>{!readOnly && <div className="admin-report-list__actions"><button onClick={() => decide(report._id, "dismissed")}>Dismiss & restore</button><button className="keep-hidden" onClick={() => decide(report._id, "actioned")}>Keep hidden</button><button className="block" onClick={() => block(report)}><ShieldBan size={14} /> Block sender</button></div>}</article>)}{reports.length === 0 && <p className="admin-empty">No private-message reports need review.</p>}</div></section>;
}

export default ContentReportsAdmin;
