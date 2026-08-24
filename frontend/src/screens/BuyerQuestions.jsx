import React from "react";
import BuyerNavbar from "../components/BuyerInterface/BuyerNavbar/BuyerNavbar";
import PrivateQuestions from "../components/CommonInterface/Questions/PrivateQuestions";

export default function BuyerQuestions() {
  return <><BuyerNavbar /><PrivateQuestions audience="buyer" /></>;
}
