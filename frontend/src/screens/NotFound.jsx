import React from "react";
import { ArrowLeft, SearchX } from "lucide-react";
import { Link } from "react-router-dom";
import "./NotFound.css";

function NotFound() {
  const destination = localStorage.getItem("campusrecycletoken") ? "/buyer/productlist" : "/";
  return (
    <main className="not-found-page">
      <section>
        <span><SearchX size={32} /></span>
        <p>404 · Page not found</p>
        <h1>This page is no longer on the shelf.</h1>
        <p>The address may be incorrect, or the page may have moved.</p>
        <Link to={destination}><ArrowLeft size={16} /> {destination === "/" ? "Back home" : "Back to marketplace"}</Link>
      </section>
    </main>
  );
}

export default NotFound;
