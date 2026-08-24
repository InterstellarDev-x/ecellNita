import React, { useState } from "react";
import { BarChart3, ClipboardCheck, Package, Settings2, ShieldCheck, Users, X, MapPin, Flag, Lightbulb } from "lucide-react";
import { useAdminContentReports, useAdminDashboard, useAdminFeatureRequests, useAdminMeetingLocations, useAdminProductReports, useAdminProducts, useAdminSettings, useAdminSubmissions, useAdminUsers, useReviewAdminSubmission, useUpdateAdminSettings, useUpdateAdminUserStatus } from "../hooks/useAdminQueries";
import MeetingLocationsAdmin from "../components/Admin/MeetingLocationsAdmin";
import ContentReportsAdmin from "../components/Admin/ContentReportsAdmin";
import FeatureRequestsAdmin from "../components/Admin/FeatureRequestsAdmin";
import ProductReportsAdmin from "../components/Admin/ProductReportsAdmin";
import "./AdminPanel.css";

const navItems = [
  ["overview", "Overview", BarChart3],
  ["listings", "Listings", Package],
  ["reviews", "Review queue", ClipboardCheck],
  ["people", "People", Users],
  ["locations", "Meeting locations", MapPin],
  ["reports", "Safety reports", Flag],
  ["features", "Feature requests", Lightbulb],
  ["settings", "Review settings", Settings2],
];

function AdminPanel() {
  const currentUser = (() => { try { return JSON.parse(localStorage.getItem("campusrecycleuser")); } catch { return null; } })();
  const isAdmin = currentUser?.accounttype === "Admin" || currentUser?.roles?.includes("admin");
  const visibleNavItems = navItems.filter(([key]) => isAdmin || key !== "settings");
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const dashboardQuery = useAdminDashboard(activeTab === "overview");
  const productsQuery = useAdminProducts(activeTab === "listings");
  const usersQuery = useAdminUsers(activeTab === "people");
  const locationsQuery = useAdminMeetingLocations(activeTab === "locations");
  const reportsQuery = useAdminContentReports(activeTab === "reports");
  const productReportsQuery = useAdminProductReports(activeTab === "reports");
  const featureRequestsQuery = useAdminFeatureRequests(activeTab === "features");
  const submissionsQuery = useAdminSubmissions(activeTab === "reviews");
  const settingsQuery = useAdminSettings(isAdmin);
  const updateSettings = useUpdateAdminSettings();
  const reviewSubmission = useReviewAdminSubmission();
  const updateUserStatus = useUpdateAdminUserStatus();
  const dashboard = dashboardQuery.data;
  const products = productsQuery.data || [];
  const users = usersQuery.data || [];
  const locations = locationsQuery.data || [];
  const reports = reportsQuery.data || [];
  const productReports = productReportsQuery.data || [];
  const featureRequests = featureRequestsQuery.data || [];
  const submissions = submissionsQuery.data || [];
  const settings = settingsQuery.data;
  const activeQuery = { overview: dashboardQuery, listings: productsQuery, reviews: submissionsQuery, people: usersQuery, locations: locationsQuery, reports: reportsQuery, features: featureRequestsQuery, settings: settingsQuery }[activeTab];
  const loading = activeQuery.isLoading || (activeTab === "reports" && productReportsQuery.isLoading) || (isAdmin && settingsQuery.isLoading);
  const visibleError = error || activeQuery.error?.message || productReportsQuery.error?.message || (isAdmin ? settingsQuery.error?.message : "");

  const load = async () => {
    setError("");
    const refreshes = [activeQuery.refetch()];
    if (activeTab === "reports") refreshes.push(productReportsQuery.refetch());
    if (isAdmin && activeQuery !== settingsQuery) refreshes.push(settingsQuery.refetch());
    await Promise.all(refreshes);
  };

  const saveMode = async (mode) => {
    try {
      await updateSettings.mutateAsync(mode);
    } catch (requestError) { setError(requestError?.response?.data?.message || requestError?.message || "Could not update review mode."); }
  };

  const decideSubmission = async (decision) => {
    if (!selectedSubmission) return;
    try {
      await reviewSubmission.mutateAsync({ submissionId: selectedSubmission._id, decision });
      setSelectedSubmission(null);
    } catch (requestError) { setError(requestError?.response?.data?.message || requestError?.message || "Could not save review decision."); }
  };

  const changeAccountStatus = async (userId, accountStatus) => {
    try {
      await updateUserStatus.mutateAsync({ userId, accountStatus });
    } catch (requestError) { setError(requestError?.response?.data?.message || requestError?.message || "Could not update account status."); }
  };
  const blockReportedUser = async (userId) => {
    if (!userId) return;
    try {
      await updateUserStatus.mutateAsync({ userId, accountStatus: "blocked" });
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || "Could not block account.");
      throw requestError;
    }
  };

  const total = dashboard?.products || 0;
  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand"><ShieldCheck size={25} /><span>Campus Control</span></div>
        <p className="admin-sidebar-kicker">Operations</p>
        <nav>{visibleNavItems.map(([key, label, Icon]) => <button key={key} className={activeTab === key ? "active" : ""} onClick={() => setActiveTab(key)}><Icon size={18} />{label}</button>)}</nav>
        <div className="admin-sidebar-note"><span>{isAdmin ? "Live policy" : "Access level"}</span><strong>{isAdmin ? settings?.mode?.replaceAll("_", " ") || "Loading" : "Moderator"}</strong></div>
      </aside>
      <section className="admin-content">
        <header className="admin-topbar">
          <div className="admin-mobile-brand"><ShieldCheck size={19} /><span>Campus Control</span></div>
          <div className="admin-topbar-title"><span className="admin-eyebrow">Marketplace operations</span><h1>{visibleNavItems.find(([key]) => key === activeTab)?.[1]}</h1></div>
          <button className="admin-refresh" onClick={load}>Refresh data</button>
        </header>
        {visibleError && <div className="admin-error">{visibleError}<button onClick={() => setError("")}><X size={16} /></button></div>}
        {loading ? <div className="admin-loading">Loading control centre…</div> : <>
          {activeTab === "overview" && <div className="admin-overview">
            <section className="admin-hero"><div><span>Marketplace health</span><h2>Everything that needs attention, in one place.</h2><p>Review listings, monitor activity, and apply your safety policy.</p></div><ShieldCheck size={56} /></section>
            <div className="admin-stat-grid">{[["Published products", total], ["People", dashboard?.users], ["Active requests", dashboard?.requests], ["Needs review", dashboard?.pendingReviews], ["AI/human rejects", dashboard?.rejectedReviews]].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value ?? "—"}</strong></article>)}</div>
            {isAdmin && <section className="admin-panel"><div className="admin-panel-head"><div><span>Current review path</span><h2>{settings?.mode?.replaceAll("_", " ")}</h2></div><button onClick={() => setActiveTab("settings")}>Manage policy</button></div><p>New listings follow this mode server-side. Sellers cannot override it from the upload form.</p></section>}
          </div>}
          {activeTab === "listings" && <section className="admin-panel"><div className="admin-panel-head"><div><span>Published inventory</span><h2>{products.length} listings</h2></div></div><div className="admin-table">{products.map((product) => <article className="admin-listing" key={product._id}><img src={product.images?.[0]} alt=""/><div><strong>{product.productname}</strong><p>{product.owner?.firstname} {product.owner?.lastname} · {product.owner?.email}</p></div><span className={`admin-pill ${product.publicationStatus}`}>{product.publicationStatus}</span><b>₹{product.price}</b></article>)}{products.length === 0 && <p className="admin-empty">No products found.</p>}</div></section>}
          {activeTab === "reviews" && <section className="admin-panel"><div className="admin-panel-head"><div><span>Human action required</span><h2>{submissions.length} pending submissions</h2></div></div><div className="admin-review-grid">{submissions.map((submission) => <article key={submission._id} className="admin-review-card"><div className="admin-review-avatar">{submission.seller?.firstname?.[0] || "?"}</div><span>{submission.reviewMode.replaceAll("_", " ")}</span><h3>{submission.listing?.productname}</h3><p>{submission.seller?.firstname} {submission.seller?.lastname} · {submission.seller?.email}</p><button onClick={() => setSelectedSubmission(submission)}>Open review</button></article>)}{submissions.length === 0 && <p className="admin-empty">The review queue is clear.</p>}</div></section>}
          {activeTab === "people" && <section className="admin-panel"><div className="admin-panel-head"><div><span>Accounts</span><h2>{users.length} people</h2></div></div><div className="admin-table">{users.map((user) => <article className="admin-listing admin-user" key={user._id}><img src={user.image || "https://api.dicebear.com/5.x/initials/svg?seed=user"} alt=""/><div><strong>{user.firstname} {user.lastname}</strong><p>{user.email} · {user.products?.length || 0} listings</p></div><span className={`admin-pill ${user.accountStatus}`}>{user.accountStatus}</span>{isAdmin && <select value={user.accountStatus} onChange={(event) => changeAccountStatus(user._id, event.target.value)}><option value="active">Active</option><option value="suspended">Suspended</option><option value="blocked">Blocked</option></select>}</article>)}</div></section>}
          {activeTab === "locations" && <MeetingLocationsAdmin locations={locations} onError={setError} readOnly={!isAdmin} />}
          {activeTab === "reports" && <div className="admin-settings"><ProductReportsAdmin reports={productReports} onError={setError} readOnly={!isAdmin} /><ContentReportsAdmin reports={reports} onError={setError} onBlockUser={blockReportedUser} readOnly={!isAdmin} /></div>}
          {activeTab === "features" && <FeatureRequestsAdmin requests={featureRequests} />}
          {isAdmin && activeTab === "settings" && <section className="admin-settings"><section className="admin-panel"><span className="admin-eyebrow">Publication safeguards</span><h2>How should new listings be reviewed?</h2><p>The change takes effect for every future product submission. Existing listings stay published.</p><div className="admin-mode-grid">{[["no_review", "No review", "Publish after regular backend validation."], ["human", "Human review", "Hold privately until a moderator approves it."], ["ai_escalation", "AI with escalation", "AI publishes clear passes and sends uncertain cases to humans."]].map(([mode, label, description]) => <button key={mode} className={settings?.mode === mode ? "selected" : ""} onClick={() => saveMode(mode)}><strong>{label}</strong><span>{description}</span></button>)}</div></section><section className="admin-panel admin-policy"><h2>Policy version</h2><p>{settings?.policyVersion}</p><small>AI failures are configured to hold a listing for human review rather than publish it.</small></section></section>}
        </>}
      </section>
      <nav className="admin-mobile-nav" aria-label="Admin navigation">
        {visibleNavItems.map(([key, label, Icon]) => (
          <button key={key} className={activeTab === key ? "active" : ""} onClick={() => setActiveTab(key)}>
            <Icon size={20} />
            <span>{key === "reviews" ? "Review" : key === "settings" ? "Settings" : label}</span>
          </button>
        ))}
      </nav>
      {selectedSubmission && <div className="admin-modal-backdrop"><section className="admin-review-modal"><button className="admin-modal-close" onClick={() => setSelectedSubmission(null)} aria-label="Close review"><X size={18}/></button><span className="admin-eyebrow">Review listing</span><h2>{selectedSubmission.listing?.productname}</h2>{selectedSubmission.previewUrls?.length > 0 && <div className="admin-review-images">{selectedSubmission.previewUrls.map((url, index) => <img key={url} src={url} alt={`${selectedSubmission.listing?.productname || "Product"} submission ${index + 1}`} />)}</div>}<p>{selectedSubmission.listing?.productdescription}</p><dl><div><dt>Price</dt><dd>₹{selectedSubmission.listing?.price}</dd></div><div><dt>Seller</dt><dd>{selectedSubmission.seller?.email}</dd></div></dl><div className="admin-review-actions"><button className="reject" onClick={() => decideSubmission("rejected")}>Reject</button><button className="approve" onClick={() => decideSubmission("approved")}>Approve & publish</button></div></section></div>}
    </main>
  );
}

export default AdminPanel;
