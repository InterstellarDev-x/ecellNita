import React from "react";
import { EyeOff, Flag } from "lucide-react";
import { useReviewProductReport } from "../../hooks/useAdminQueries";

function ProductReportsAdmin({ reports, onError, readOnly = false }) {
  const review = useReviewProductReport();
  const decide = async (reportId, resolution, hideProduct = false) => {
    try {
      await review.mutateAsync({ reportId, resolution, hideProduct });
    } catch (error) {
      onError(error.message || "Could not review product report.");
    }
  };

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <div><span>Marketplace listing safety</span><h2>{reports.length} product reports</h2></div>
        <Flag size={20} />
      </div>
      <div className="admin-report-list">
        {reports.map((report) => (
          <article key={report._id}>
            <div className="admin-report-list__head">
              <strong>{report.product?.productname || "Product removed"}</strong>
              <span>{report.reason}</span>
            </div>
            <p className="admin-report-list__reason">{report.details}</p>
            <small>Reported by {report.reporter?.email || "Unknown"} · Seller: {report.product?.owner?.email || "Unknown"}</small>
            {!readOnly && (
              <div className="admin-report-list__actions">
                <button onClick={() => decide(report._id, "dismissed")}>Dismiss report</button>
                <button className="keep-hidden" onClick={() => decide(report._id, "resolved")}>Resolve</button>
                <button className="block" onClick={() => decide(report._id, "resolved", true)}><EyeOff size={14} /> Hide listing</button>
              </div>
            )}
          </article>
        ))}
        {reports.length === 0 && <p className="admin-empty">No product reports need review.</p>}
      </div>
    </section>
  );
}

export default ProductReportsAdmin;
