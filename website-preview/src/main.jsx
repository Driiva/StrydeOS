import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./strydeOS-website.jsx";
import SecurityPolicyPage from "./security-policy.jsx";
import PrivacyPolicyPage from "./privacy-policy.jsx";
import TermsOfServicePage from "./terms-of-service.jsx";

const path = window.location.pathname.replace(/\/+$/, "") || "/";

function PathRoutedApp() {
  if (path === "/security") return <SecurityPolicyPage />;
  if (path === "/privacy") return <PrivacyPolicyPage />;
  if (path === "/terms") return <TermsOfServicePage />;
  return <App />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PathRoutedApp />
  </StrictMode>
);
