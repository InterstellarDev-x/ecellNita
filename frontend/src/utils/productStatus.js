const PRODUCT_STATUS_LABELS = {
  Forsale: "For sale",
  Sold: "Sold",
  Purchased: "Purchased",
};

export const formatProductStatus = (status, fallback = "For sale") => {
  if (!status) return fallback;
  if (/^for\s*sale$/i.test(String(status))) return "For sale";
  return PRODUCT_STATUS_LABELS[status] || status;
};
