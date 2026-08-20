import React from "react";
import { ClipboardList, LayoutDashboard, PackagePlus, PackageSearch, UserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import "./SellerMobileNav.css";

const items = [
  ["/seller/seller-dashboard", "Overview", LayoutDashboard],
  ["/seller/add-product", "Add", PackagePlus],
  ["/seller/view-product", "Listings", PackageSearch],
  ["/seller/product-requests", "Requests", ClipboardList],
  ["/student-profile", "Profile", UserRound],
];

function SellerMobileNav() {
  const location = useLocation();

  return (
    <nav className="seller-mobile-nav" aria-label="Seller navigation">
      {items.map(([path, label, Icon]) => (
        <Link key={path} to={path} className={location.pathname === path ? "active" : ""}>
          <Icon size={20} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export default SellerMobileNav;
