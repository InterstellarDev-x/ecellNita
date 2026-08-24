import React from "react";
import { Lightbulb } from "lucide-react";

function FeatureRequestsAdmin({ requests }) {
  return <section className="admin-panel"><div className="admin-panel-head"><div><span>User feedback</span><h2>{requests.length} feature requests</h2></div><Lightbulb size={21} /></div><div className="admin-feature-list">{requests.map((request) => <article key={request._id}><div><span>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(request.createdAt))}</span><strong>{request.title}</strong><p>{request.description}</p></div><small>{request.submittedBy?.firstname} {request.submittedBy?.lastname} · {request.submittedBy?.email}</small></article>)}{requests.length === 0 && <p className="admin-empty">No feature requests submitted yet.</p>}</div></section>;
}

export default FeatureRequestsAdmin;
