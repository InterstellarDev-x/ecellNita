import React from "react";
import { Heart } from "lucide-react";
import BuyerNavbar from "../components/BuyerInterface/BuyerNavbar/BuyerNavbar";
import BuyerPageHeader from "../components/BuyerInterface/BuyerPageHeader/BuyerPageHeader";
import ProductList from "../components/BuyerInterface/ProductListing/ProductList";
import { useWishlist } from "../hooks/useBuyerQueries";

function Wishlist() {
  const { data: wishlistProducts = [], isLoading } = useWishlist();

  return (
    <>
      <BuyerNavbar />
      <main className="buyer-page-shell">
        <BuyerPageHeader
          icon={Heart}
          kicker="Your collection"
          title="Wishlist"
          description="Keep listings you want to revisit in one place."
          count={`${wishlistProducts.length} saved`}
          accent="red"
        />
        <div className="buyer-page-shell__content">
          <ProductList
            products={wishlistProducts}
            totalProducts={wishlistProducts.length}
            isLoading={isLoading}
            hasActiveFilters={false}
            hideHeader
            emptyTitle="Your wishlist is empty"
            emptyDescription="Tap the heart on any listing to save it here for later."
          />
        </div>
      </main>
    </>
  );
}

export default Wishlist;
