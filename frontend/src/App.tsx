import { BrowserRouter, Routes, Route, Navigate, NavLink } from "react-router-dom";
import { LayoutCtx } from "./context.js";
import DashboardPage from "./views/DashboardPage.js";
import BuyerWorkspacePage from "./views/BuyerWorkspacePage.js";
import SellerWorkspacePage from "./views/SellerWorkspacePage.js";
import ListingDetailPage from "./views/ListingDetailPage.js";
import OfferNegotiationPage from "./views/OfferNegotiationPage.js";
import ShowingCalendarPage from "./views/ShowingCalendarPage.js";
import TransactionTrackerPage from "./views/TransactionTrackerPage.js";
import DisclosureWizardPage from "./views/DisclosureWizardPage.js";

const SEED_BUYER = "buyer-1";
const SEED_SELLER = "seller-1";

const layout = {
  agentId: "agent-1",
  agentName: "Sarah Chen",
  brokerage: "LocalEdge Realty",
  viewport: "desktop" as const,
  theme: "light" as const,
};

export default function App() {
  return (
    <LayoutCtx.Provider value={layout}>
      <BrowserRouter>
        <div className="app-shell">
          <nav className="sidebar">
            <div className="sidebar-logo">LocalEdge</div>
            <div className="sidebar-section">
              <div className="sidebar-label">Main</div>
              <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
                Dashboard
              </NavLink>
              <NavLink to="/showings" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
                Showings
              </NavLink>
            </div>
            <div className="sidebar-section">
              <div className="sidebar-label">Quick Access</div>
              <NavLink to={`/buyer/${SEED_BUYER}`} className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
                Buyer: Alice J.
              </NavLink>
              <NavLink to={`/seller/${SEED_SELLER}`} className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
                Seller: Bob M.
              </NavLink>
            </div>
          </nav>

          <div className="page-content">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/buyer/:buyerId" element={<BuyerWorkspacePage />} />
              <Route path="/seller/:sellerId" element={<SellerWorkspacePage />} />
              <Route path="/listing/:listingId" element={<ListingDetailPage />} />
              <Route path="/offer/:offerId" element={<OfferNegotiationPage />} />
              <Route path="/showings" element={<ShowingCalendarPage />} />
              <Route path="/transaction/:transactionId" element={<TransactionTrackerPage />} />
              <Route path="/disclosure/:propertyId" element={<DisclosureWizardPage />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </LayoutCtx.Provider>
  );
}
