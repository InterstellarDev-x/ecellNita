import React from "react";
import { Heart } from "lucide-react";
import BuyerNavbar from "../components/BuyerInterface/BuyerNavbar/BuyerNavbar";
import ProductList from "../components/BuyerInterface/ProductListing/ProductList";
import { useWishlist } from "../hooks/useBuyerQueries";

function Wishlist() {
  const { data: wishlistProducts = [], isLoading } = useWishlist();

  return (
    <>
      <BuyerNavbar />
      <main className="buyer-product-page">
        <section className="wishlist-intro">
          <span className="wishlist-intro-icon"><Heart size={20} fill="currentColor" /></span>
          <div>
            <span className="product-list-kicker">Your collection</span>
            <h1>Wishlist</h1>
            <p>Keep listings you want to revisit in one place.</p>
          </div>
        </section>
        <ProductList
          products={wishlistProducts}
          totalProducts={wishlistProducts.length}
          isLoading={isLoading}
          hasActiveFilters={false}
          kicker="Saved listings"
          title={`${wishlistProducts.length} saved product${wishlistProducts.length === 1 ? "" : "s"}`}
          totalLabel={`${wishlistProducts.length} saved in wishlist`}
          emptyTitle="Your wishlist is empty"
          emptyDescription="Tap the heart on any listing to save it here for later."
        />
      </main>
    </>
  );
}

export default Wishlist;
