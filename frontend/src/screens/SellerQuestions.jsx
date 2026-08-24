import React from "react";
import SellerSidebar from "../components/SellerInterface/SellerDashboard/SellerSidebar";
import SellerTopNavbar from "../components/SellerInterface/SellerDashboard/SellerTopNavbar";
import SellerMobileNav from "../components/SellerInterface/SellerDashboard/SellerMobileNav";
import PrivateQuestions from "../components/CommonInterface/Questions/PrivateQuestions";
import "./SellerDashboard.css";

export default function SellerQuestions() {
  return <div className="seller-dashboard-container"><SellerSidebar /><div className="seller-dashboard-main"><SellerTopNavbar /><div className="seller-dashboard-content"><PrivateQuestions audience="seller" /></div></div><SellerMobileNav /></div>;
}
