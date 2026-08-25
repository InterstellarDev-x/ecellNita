import React from "react";
import { MessageCircle } from "lucide-react";
import BuyerNavbar from "../components/BuyerInterface/BuyerNavbar/BuyerNavbar";
import BuyerPageHeader from "../components/BuyerInterface/BuyerPageHeader/BuyerPageHeader";
import PrivateQuestions from "../components/CommonInterface/Questions/PrivateQuestions";

export default function BuyerQuestions() {
  return (
    <>
      <BuyerNavbar />
      <main className="buyer-page-shell">
        <BuyerPageHeader
          icon={MessageCircle}
          kicker="Private conversations"
          title="My private questions"
          description="Only you and the seller can see these conversations."
          accent="blue"
        />
        <div className="buyer-page-shell__content">
          <PrivateQuestions audience="buyer" embedded />
        </div>
      </main>
    </>
  );
}
