import React from "react";
import BuyerNavbar from "../components/BuyerInterface/BuyerNavbar/BuyerNavbar";
import PrivateQuestions from "../components/CommonInterface/Questions/PrivateQuestions";

export default function BuyerQuestions() {
  return (
    <>
      <BuyerNavbar />
      <main className="buyer-page-shell messages-page-shell">
        <div className="buyer-page-shell__content buyer-page-shell__content--chat">
          <PrivateQuestions audience="buyer" embedded />
        </div>
      </main>
    </>
  );
}
