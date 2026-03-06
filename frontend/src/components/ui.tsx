import { useContext, useState } from "react";
import { ActionContext } from "../context.js";
import type { UserAction } from "../../realestate-ui/domain-types.js";

type FC<P = Record<string, unknown>> = React.FC<P & { children?: React.ReactNode }>;

// ─── Layout Shells ────────────────────────────────────────────────────────────

export const DashboardLayout: FC<{
  agentName: string; brokerage: string; urgentCount: number; theme: string; viewport: string; loadingState: string;
}> = ({ agentName, brokerage, urgentCount, children }) => (
  <div>
    <div className="page-header">
      <div>
        <div className="page-title">Agent Dashboard</div>
        <div className="page-subtitle">{agentName} · {brokerage}{urgentCount > 0 ? ` · ${urgentCount} urgent` : ""}</div>
      </div>
    </div>
    <div className="section">{children}</div>
  </div>
);

export const BuyerWorkspaceLayout: FC<{
  buyerId: string; matchCount: number; savedCount: number; viewport: string; theme: string; loadingState: string;
}> = ({ buyerId, matchCount, savedCount, children }) => (
  <div>
    <div className="page-header">
      <div>
        <div className="page-title">Buyer Workspace</div>
        <div className="page-subtitle">{matchCount} matches · {savedCount} saved</div>
      </div>
    </div>
    <div className="section">{children}</div>
  </div>
);

export const SellerWorkspaceLayout: FC<{
  sellerId: string; listingId: string; disclosureStatus: string; receivedOfferCount: number;
  viewport: string; theme: string; loadingState: string;
}> = ({ disclosureStatus, receivedOfferCount, children }) => (
  <div>
    <div className="page-header">
      <div>
        <div className="page-title">Seller Workspace</div>
        <div className="page-subtitle">Disclosure: {disclosureStatus} · {receivedOfferCount} offers received</div>
      </div>
    </div>
    <div className="section">{children}</div>
  </div>
);

export const ListingDetailLayout: FC<{
  viewport: string; theme: string; loadingState: string;
}> = ({ children }) => (
  <div>
    <div className="page-header"><div className="page-title">Listing Detail</div></div>
    <div className="section">{children}</div>
  </div>
);

export const OfferNegotiationLayout: FC<{
  offerId: string; listingId: string; currentStatus: string; viewport: string; theme: string; loadingState: string;
}> = ({ offerId, currentStatus, children }) => (
  <div>
    <div className="page-header">
      <div>
        <div className="page-title">Offer Negotiation</div>
        <div className="page-subtitle">Offer {offerId} · Status: <strong>{currentStatus}</strong></div>
      </div>
    </div>
    <div className="section">{children}</div>
  </div>
);

export const ShowingCalendarLayout: FC<{
  totalShowings: number; confirmedCount: number; pendingCount: number;
  pendingFeedbackCount: number; viewport: string; theme: string; loadingState: string;
}> = ({ totalShowings, confirmedCount, pendingCount, pendingFeedbackCount, children }) => (
  <div>
    <div className="page-header">
      <div>
        <div className="page-title">Showing Calendar</div>
        <div className="page-subtitle">
          {totalShowings} total · {confirmedCount} confirmed · {pendingCount} pending
          {pendingFeedbackCount > 0 ? ` · ${pendingFeedbackCount} awaiting feedback` : ""}
        </div>
      </div>
    </div>
    <div className="section">{children}</div>
  </div>
);

export const TransactionTrackerLayout: FC<{
  transactionId: string; acceptedPrice: number; currentMilestone: string;
  closingDate: string | null; overdueCount: number; viewport: string; theme: string; loadingState: string;
}> = ({ acceptedPrice, currentMilestone, closingDate, overdueCount, children }) => (
  <div>
    <div className="page-header">
      <div>
        <div className="page-title">Transaction Tracker</div>
        <div className="page-subtitle">
          ${acceptedPrice.toLocaleString()} · Milestone: {currentMilestone}
          {closingDate ? ` · Closing ${new Date(closingDate).toLocaleDateString()}` : ""}
          {overdueCount > 0 ? ` · ⚠ ${overdueCount} overdue` : ""}
        </div>
      </div>
    </div>
    <div className="section">{children}</div>
  </div>
);

export const DisclosureWizardLayout: FC<{
  propertyId: string; currentStep: number; totalSteps: number;
  isLastStep: boolean; canAdvance: boolean; viewport: string; theme: string; loadingState: string;
}> = ({ currentStep, totalSteps, isLastStep, canAdvance, children }) => (
  <div>
    <div className="page-header">
      <div>
        <div className="page-title">Disclosure Wizard</div>
        <div className="page-subtitle">Step {currentStep + 1} of {totalSteps}{isLastStep ? " (final)" : ""}</div>
      </div>
      {canAdvance && (
        <span className="badge badge-green" style={{ marginLeft: "auto" }}>Ready to advance</span>
      )}
    </div>
    <div className="section">{children}</div>
  </div>
);

// ─── Workflow & Alerts ────────────────────────────────────────────────────────

export const WorkflowStepBanner: FC<{
  stepName: string; status: string; nextSteps: string[]; dueDate: string | null;
  notes: string | null; variant: string;
}> = ({ stepName, status, nextSteps, dueDate, notes, variant }) => {
  const cls = variant === "urgent" ? "banner banner-urgent" : "banner banner-info";
  const statusBadge =
    status === "blocked" ? "badge badge-red" :
    status === "completed" ? "badge badge-green" :
    status === "in_progress" ? "badge badge-blue" : "badge badge-gray";

  return (
    <div className={cls}>
      <div className="banner-title">
        {stepName.replace(/([A-Z])/g, " $1").trim()}
        {" "}<span className={statusBadge}>{status}</span>
        {dueDate && <span style={{ fontSize: 11, marginLeft: 8, opacity: 0.7 }}>Due {new Date(dueDate).toLocaleDateString()}</span>}
      </div>
      {notes && <div style={{ fontSize: 12, marginTop: 4, opacity: 0.9 }}>{notes}</div>}
      {nextSteps?.length > 0 && (
        <ul style={{ marginTop: 6 }}>{nextSteps.map((s, i) => <li key={i}>{s}</li>)}</ul>
      )}
    </div>
  );
};

export const AlertBadge: FC<{ message: string }> = ({ message }) => {
  const fire = useContext(ActionContext);
  return (
    <div className="alert alert-warning">
      {message}
      <button className="alert-close" onClick={() => fire({ actionType: "click", sourceViewId: "", payload: { actionId: "dismiss-alert" } } as UserAction)}>×</button>
    </div>
  );
};

export const ActionResultBanner: FC<{ success: boolean; message: string; errors: string[] }> = ({ success, message, errors }) => (
  <div className={`banner ${success ? "banner-success" : "banner-error"}`}>
    <div className="banner-title">{message}</div>
    {errors?.length > 0 && (
      <ul>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
    )}
  </div>
);

export const DateDriftAlert: FC<{ description: string; severity: string }> = ({ description }) => (
  <div className="banner banner-urgent">
    <strong>⚠ Overdue:</strong> {description}
  </div>
);

// ─── Portfolio ────────────────────────────────────────────────────────────────

export const PortfolioStats: FC<{
  activeBuyers: number; activeSellers: number; pendingShowings: number; openTransactions: number;
}> = ({ activeBuyers, activeSellers, pendingShowings, openTransactions }) => (
  <div className="grid-4" style={{ marginBottom: 20 }}>
    {[
      { label: "Buyers", val: activeBuyers },
      { label: "Sellers", val: activeSellers },
      { label: "Showings", val: pendingShowings },
      { label: "Transactions", val: openTransactions },
    ].map(({ label, val }) => (
      <div key={label} className="stat-card">
        <div className="stat-num">{val}</div>
        <div className="stat-label">{label}</div>
      </div>
    ))}
  </div>
);

// ─── Qualification ────────────────────────────────────────────────────────────

export const QualificationBadge: FC<{
  status: string; preApprovalAmount?: number; buyerId?: string; sellerId?: string;
}> = ({ status, preApprovalAmount }) => {
  const fire = useContext(ActionContext);
  const cls = status === "qualified" ? "badge-green" : status === "disqualified" ? "badge-red" : "badge-yellow";
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span className={`badge ${cls}`}>{status.toUpperCase()}</span>
          {preApprovalAmount != null && preApprovalAmount > 0 && (
            <span style={{ marginLeft: 12, color: "#555" }}>Pre-approved up to ${preApprovalAmount.toLocaleString()}</span>
          )}
        </div>
        {status !== "qualified" && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => fire({ actionType: "click", sourceViewId: "", payload: { actionId: "qualify-buyer" } } as UserAction)}
          >
            Run Qualification
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Buyer Criteria ───────────────────────────────────────────────────────────

export const BuyerCriteriaEditor: FC<{
  formId: string; fields: Record<string, unknown>; dirty: boolean; qualificationRequired: boolean;
}> = ({ fields, dirty }) => {
  const fire = useContext(ActionContext);
  const [maxPrice, setMaxPrice] = useState(String(fields["maxPrice"] ?? ""));
  const [minBeds, setMinBeds] = useState(String(fields["minBedrooms"] ?? ""));
  const [minBaths, setMinBaths] = useState(String(fields["minBathrooms"] ?? ""));
  const [locations, setLocations] = useState(String(fields["preferredLocations"] ?? ""));

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-header">Search Criteria</div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Max Price ($)</label>
          <input className="form-input" type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Preferred Locations</label>
          <input className="form-input" value={locations} placeholder="e.g. Westside, Downtown" onChange={e => setLocations(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Min Bedrooms</label>
          <input className="form-input" type="number" value={minBeds} onChange={e => setMinBeds(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Min Bathrooms</label>
          <input className="form-input" type="number" value={minBaths} onChange={e => setMinBaths(e.target.value)} />
        </div>
      </div>
      <button
        className="btn btn-primary"
        onClick={() => fire({
          actionType: "submit",
          sourceViewId: "",
          payload: {
            actionId: "update-criteria",
            criteria: {
              maxPrice: Number(maxPrice),
              minBedrooms: Number(minBeds),
              minBathrooms: Number(minBaths),
              preferredLocations: locations.split(",").map(s => s.trim()).filter(Boolean),
              requiredFeatures: [],
            },
          },
        } as UserAction)}
      >
        Search Listings
      </button>
      {dirty && <span style={{ marginLeft: 8, color: "#888", fontSize: 12 }}>Unsaved changes</span>}
    </div>
  );
};

// ─── Listing Match Card ───────────────────────────────────────────────────────

export const ListingMatchCard: FC<{
  listingId: string; address: string; price: number; score: number; isSaved: boolean;
}> = ({ listingId, address, price, score, isSaved }) => {
  const fire = useContext(ActionContext);
  const scoreClass = score >= 80 ? "score-high" : score >= 60 ? "score-med" : "score-low";
  return (
    <div
      className="match-card"
      onClick={() => fire({ actionType: "click", sourceViewId: "", payload: { actionId: "view-listing", listingId } } as UserAction)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{address}</div>
          <div style={{ color: "#555" }}>${price.toLocaleString()}</div>
        </div>
        <span className={`match-score ${scoreClass}`}>{score}%</span>
      </div>
      {isSaved && <span className="badge badge-blue" style={{ marginTop: 8 }}>Saved</span>}
    </div>
  );
};

// ─── Listing Detail ───────────────────────────────────────────────────────────

export const ListingDetailPanel: FC<{
  listingId: string; address: string; price: number; bedrooms: number; bathrooms: number;
  sqft: number; features: string[]; daysOnMarket: number; status: string;
}> = ({ address, price, bedrooms, bathrooms, sqft, features, daysOnMarket, status }) => (
  <div className="card" style={{ marginBottom: 16 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>${price.toLocaleString()}</div>
        <div style={{ color: "#555", marginTop: 4 }}>{address}</div>
      </div>
      <span className={`badge ${status === "active" ? "badge-green" : "badge-gray"}`}>{status}</span>
    </div>
    <div className="grid-4" style={{ marginBottom: 12 }}>
      {[
        { label: "Beds", val: bedrooms },
        { label: "Baths", val: bathrooms },
        { label: "Sqft", val: sqft.toLocaleString() },
        { label: "Days on Market", val: daysOnMarket },
      ].map(({ label, val }) => (
        <div key={label} style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600 }}>{val}</div>
          <div style={{ fontSize: 11, color: "#888" }}>{label}</div>
        </div>
      ))}
    </div>
    <div style={{ fontSize: 12, color: "#555" }}>
      Features: {features.join(", ")}
    </div>
  </div>
);

export const MatchGapAnalysis: FC<{
  matchScore: number | null; matchedCriteria: string[]; missedCriteria: string[]; summary: string | null;
}> = ({ matchScore, matchedCriteria, missedCriteria, summary }) => (
  <div className="card" style={{ marginBottom: 16 }}>
    <div className="card-header">
      Match Analysis
      {matchScore != null && (
        <span className={`match-score ${matchScore >= 80 ? "score-high" : matchScore >= 60 ? "score-med" : "score-low"}`} style={{ marginLeft: 8 }}>
          {matchScore}%
        </span>
      )}
    </div>
    {summary && <div style={{ marginBottom: 12, color: "#555" }}>{summary}</div>}
    <div className="gap-analysis">
      <div>
        <div style={{ fontWeight: 600, marginBottom: 6, color: "#2e7d32" }}>Matched</div>
        <ul className="criteria-list">
          {matchedCriteria.length === 0
            ? <li style={{ color: "#aaa" }}>None</li>
            : matchedCriteria.map((c, i) => <li key={i} className="criteria-item met">{c}</li>)}
        </ul>
      </div>
      <div>
        <div style={{ fontWeight: 600, marginBottom: 6, color: "#d32f2f" }}>Missing</div>
        <ul className="criteria-list">
          {missedCriteria.length === 0
            ? <li style={{ color: "#aaa" }}>None</li>
            : missedCriteria.map((c, i) => <li key={i} className="criteria-item miss">{c}</li>)}
        </ul>
      </div>
    </div>
  </div>
);

export const ShowingSlotPicker: FC<{
  listingId: string; availableSlots: string[]; listingStatus: string; disabled: boolean;
}> = ({ listingId, availableSlots, disabled }) => {
  const fire = useContext(ActionContext);
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-header">Available Showing Slots</div>
      {disabled ? (
        <div style={{ color: "#aaa" }}>Showing requests are not available for this listing</div>
      ) : availableSlots.length === 0 ? (
        <div style={{ color: "#aaa" }}>No available slots</div>
      ) : (
        <div className="slot-grid">
          {availableSlots.slice(0, 6).map((slot, i) => (
            <button
              key={i}
              className="slot-btn"
              onClick={() => fire({
                actionType: "click",
                sourceViewId: "",
                payload: { actionId: "request-showing", listingId, requestedDate: slot, durationMinutes: 30 },
              } as UserAction)}
            >
              {new Date(slot).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Offer Negotiation ────────────────────────────────────────────────────────

export const OfferHistoryRow: FC<{
  index: number; party: string; amount: number; timestamp: string; status: string;
}> = ({ index, party, amount, timestamp, status }) => (
  <div className="offer-row">
    <div>
      <strong>#{index}</strong> {party}
      <span style={{ marginLeft: 8, fontSize: 12, color: "#888" }}>{new Date(timestamp).toLocaleDateString()}</span>
    </div>
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <span style={{ fontWeight: 600 }}>${amount.toLocaleString()}</span>
      <span className={`badge ${status === "accepted" ? "badge-green" : status === "rejected" ? "badge-red" : "badge-yellow"}`}>{status}</span>
    </div>
  </div>
);

export const OfferActionBar: FC<{
  offerId: string; currentStatus: string; counterOfferCount: number;
  showCounter: boolean; showAccept: boolean; showReject: boolean; counterLimitReached: boolean;
}> = ({ offerId, currentStatus, showCounter, showAccept, showReject, counterLimitReached }) => {
  const fire = useContext(ActionContext);
  const isFinal = currentStatus === "accepted" || currentStatus === "rejected" || currentStatus === "withdrawn";

  if (isFinal) {
    return (
      <div className="card" style={{ marginTop: 16 }}>
        <span className={`badge ${currentStatus === "accepted" ? "badge-green" : "badge-red"}`} style={{ fontSize: 14, padding: "6px 12px" }}>
          Offer {currentStatus.toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-header">Actions</div>
      <div className="btn-group">
        {showAccept && (
          <button
            className="btn btn-success"
            onClick={() => fire({ actionType: "click", sourceViewId: "", payload: { actionId: "accept-offer", offerId } } as UserAction)}
          >
            Accept Offer
          </button>
        )}
        {showReject && (
          <button
            className="btn btn-danger"
            onClick={() => fire({ actionType: "click", sourceViewId: "", payload: { actionId: "reject-offer", offerId } } as UserAction)}
          >
            Reject Offer
          </button>
        )}
        {showCounter && (
          <button
            className="btn btn-outline"
            disabled={counterLimitReached}
            onClick={() => fire({ actionType: "click", sourceViewId: "", payload: { actionId: "counter-offer", offerId } } as UserAction)}
          >
            Counter Offer{counterLimitReached ? " (limit reached)" : ""}
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Showing Calendar ─────────────────────────────────────────────────────────

export const ShowingCard: FC<{
  showingId: string; listingId: string; address: string; date: string;
  durationMinutes: number; status: string; needsFeedback: boolean;
}> = ({ showingId, address, date, durationMinutes, status, needsFeedback }) => {
  const fire = useContext(ActionContext);
  const statusColors: Record<string, string> = {
    confirmed: "badge-green", requested: "badge-yellow",
    completed: "badge-gray", cancelled: "badge-red",
  };

  return (
    <div className="showing-card">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 600 }}>{address || `Showing ${showingId.slice(0, 8)}`}</div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
            {new Date(date).toLocaleString()} · {durationMinutes} min
          </div>
        </div>
        <span className={`showing-status ${statusColors[status] ?? "badge-gray"}`}>{status}</span>
      </div>
      <div className="btn-group">
        {status === "requested" && (
          <button
            className="btn btn-success btn-sm"
            onClick={() => fire({
              actionType: "click", sourceViewId: "",
              payload: { actionId: "confirm-showing", showingId, confirmedDate: date },
            } as UserAction)}
          >
            Confirm
          </button>
        )}
        {(status === "requested" || status === "confirmed") && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => fire({ actionType: "click", sourceViewId: "", payload: { actionId: "cancel-showing", showingId } } as UserAction)}
          >
            Cancel
          </button>
        )}
        {needsFeedback && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => fire({ actionType: "click", sourceViewId: "", payload: { actionId: "open-feedback", showingId } } as UserAction)}
          >
            Add Feedback
          </button>
        )}
      </div>
    </div>
  );
};

export const ShowingFeedbackForm: FC<{ showingId: string }> = ({ showingId }) => {
  const fire = useContext(ActionContext);
  const [rating, setRating] = useState(3);
  const [interested, setInterested] = useState(false);
  const [comments, setComments] = useState("");

  return (
    <div className="card" style={{ borderColor: "#1565c0" }}>
      <div className="card-header">Feedback for Showing {showingId.slice(0, 8)}</div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Rating (1-5)</label>
          <input className="form-input" type="number" min={1} max={5} value={rating} onChange={e => setRating(Number(e.target.value))} />
        </div>
        <div className="form-group">
          <label className="form-label">Buyer Interested?</label>
          <select className="form-select" value={interested ? "yes" : "no"} onChange={e => setInterested(e.target.value === "yes")}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Comments</label>
        <textarea className="form-textarea" rows={3} value={comments} onChange={e => setComments(e.target.value)} />
      </div>
      <button
        className="btn btn-primary"
        onClick={() => fire({
          actionType: "submit", sourceViewId: "",
          payload: { actionId: "submit-feedback", showingId, rating, interested, comments, concerns: [] },
        } as UserAction)}
      >
        Submit Feedback
      </button>
    </div>
  );
};

// ─── Transaction Tracker ──────────────────────────────────────────────────────

export const MilestoneRailItem: FC<{
  milestoneName: string; isCurrent: boolean; isComplete: boolean;
  isBlocked: boolean; dueDate: string | null; notes: string | null; nextSteps: string[];
}> = ({ milestoneName, isCurrent, isComplete, isBlocked, dueDate, notes, nextSteps }) => {
  const fire = useContext(ActionContext);
  const dotClass = isComplete ? "done" : isBlocked ? "blocked" : isCurrent ? "current" : "pending";
  const itemClass = `milestone-item ${isCurrent ? "current" : ""} ${isBlocked ? "blocked" : ""}`.trim();

  return (
    <div className={itemClass}>
      <div className={`milestone-dot ${dotClass}`} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: isCurrent ? 700 : 500, textTransform: "capitalize" }}>
            {milestoneName.replace(/_/g, " ")}
          </span>
          {dueDate && <span style={{ fontSize: 11, color: "#888" }}>Due {new Date(dueDate).toLocaleDateString()}</span>}
          {isComplete && <span className="badge badge-green">Done</span>}
          {isBlocked && <span className="badge badge-red">Blocked</span>}
        </div>
        {notes && <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{notes}</div>}
      </div>
      {isCurrent && !isComplete && (
        <button
          className="btn btn-primary btn-sm"
          onClick={() => fire({ actionType: "click", sourceViewId: "", payload: { actionId: "complete-milestone", milestone: milestoneName } } as UserAction)}
        >
          Complete
        </button>
      )}
    </div>
  );
};

// ─── Disclosure Wizard ────────────────────────────────────────────────────────

export const WizardProgressBar: FC<{
  currentStep: number; totalSteps: number; stepTitles: string[]; completionMap: Record<string, boolean>;
}> = ({ currentStep, stepTitles, completionMap }) => (
  <div className="wizard-steps">
    {stepTitles.map((title, i) => {
      const cls = i === currentStep ? "active" : completionMap[title] ? "done" : "";
      return <div key={i} className={`wizard-step ${cls}`}>{title}</div>;
    })}
  </div>
);

export const DisclosureStepForm: FC<{
  stepIndex: number; stepTitle: string; formId: string;
  fields: Record<string, unknown>; fieldErrors: Record<string, string>;
  globalBlockers: string[]; isValid: boolean; isDirty: boolean;
}> = ({ stepTitle, globalBlockers, isValid }) => {
  const fire = useContext(ActionContext);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-header">{stepTitle}</div>
      {globalBlockers.length > 0 && (
        <div className="banner banner-urgent" style={{ marginBottom: 12 }}>
          {globalBlockers.map((b, i) => <div key={i}>{b}</div>)}
        </div>
      )}
      <div className="form-group">
        <label className="form-label">Any known issues with this section?</label>
        <textarea
          className="form-textarea"
          rows={4}
          placeholder="Describe any known defects, issues, or disclosures for this section..."
          value={answers["disclosure"] ?? ""}
          onChange={e => setAnswers({ ...answers, disclosure: e.target.value })}
        />
      </div>
      <div className="btn-group">
        <button
          className="btn btn-outline"
          onClick={() => fire({ actionType: "click", sourceViewId: "", payload: { actionId: "prev-step" } } as UserAction)}
        >
          ← Back
        </button>
        <button
          className="btn btn-primary"
          onClick={() => fire({
            actionType: "submit", sourceViewId: "",
            payload: { actionId: "answer-question", answers },
          } as UserAction)}
        >
          Save &amp; Continue →
        </button>
      </div>
      {isValid && <div style={{ marginTop: 8, color: "#2e7d32", fontSize: 12 }}>✓ This step is complete</div>}
    </div>
  );
};

export const ComplianceCheckPanel: FC<{
  passed: boolean;
  disclosureItems: Array<{ category: string; description: string; severity: string }>;
  generatedDocuments: string[];
  requiredSignatures: string[];
}> = ({ passed, disclosureItems, generatedDocuments, requiredSignatures }) => (
  <div className={`card ${passed ? "" : ""}`} style={{ borderColor: passed ? "#a5d6a7" : "#ffcdd2" }}>
    <div className="card-header">
      Compliance Check
      <span className={`badge ${passed ? "badge-green" : "badge-red"}`} style={{ marginLeft: 8 }}>
        {passed ? "PASSED" : "ISSUES FOUND"}
      </span>
    </div>
    {disclosureItems.length > 0 && (
      <div>
        {disclosureItems.map((item, i) => (
          <div key={i} className="compliance-item">
            <span className={`severity-${item.severity}`}>●</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 12 }}>{item.category}</div>
              <div style={{ fontSize: 12, color: "#555" }}>{item.description}</div>
            </div>
          </div>
        ))}
      </div>
    )}
    {generatedDocuments.length > 0 && (
      <div style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>Generated Documents</div>
        {generatedDocuments.map((doc, i) => <div key={i} style={{ fontSize: 12, color: "#1565c0" }}>📄 {doc}</div>)}
      </div>
    )}
    {requiredSignatures.length > 0 && (
      <div style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>Required Signatures</div>
        {requiredSignatures.map((sig, i) => <div key={i} style={{ fontSize: 12 }}>✍ {sig}</div>)}
      </div>
    )}
  </div>
);

// ─── Seller ───────────────────────────────────────────────────────────────────

export const DisclosureKickoffPanel: FC<{
  status: string; listingId: string; sellerId: string; ctaLabel: string;
}> = ({ status, ctaLabel, sellerId }) => {
  const fire = useContext(ActionContext);
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="card-header" style={{ marginBottom: 4 }}>Disclosure Packet</div>
          <span className={`badge ${status === "complete" ? "badge-green" : status === "in_progress" ? "badge-yellow" : "badge-gray"}`}>
            {status.replace(/_/g, " ")}
          </span>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => fire({ actionType: "click", sourceViewId: "", payload: { actionId: "start-disclosure", sellerId } } as UserAction)}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
};

export const SellerListingForm: FC<{
  formId: string; fields: Record<string, unknown>; dirty: boolean; listingId: string;
}> = ({ fields, sellerId, dirty }: any) => {
  const fire = useContext(ActionContext);
  const [price, setPrice] = useState(String(fields["price"] ?? ""));
  const [address, setAddress] = useState(String(fields["address"] ?? ""));

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-header">Listing Details</div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Listing Address</label>
          <input className="form-input" value={address} onChange={e => setAddress(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Asking Price ($)</label>
          <input className="form-input" type="number" value={price} onChange={e => setPrice(e.target.value)} />
        </div>
      </div>
      <button
        className="btn btn-primary"
        onClick={() => fire({
          actionType: "submit", sourceViewId: "",
          payload: { actionId: "update-listing", listing: { price: Number(price), address } },
        } as UserAction)}
      >
        Update Listing
      </button>
      {dirty && <span style={{ marginLeft: 8, color: "#888", fontSize: 12 }}>Unsaved</span>}
    </div>
  );
};

export const OfferSummaryPanel: FC<{
  receivedOfferCount: number; listingId: string;
}> = ({ receivedOfferCount }) => (
  <div className="card" style={{ marginBottom: 16 }}>
    <div className="card-header">Offers Received</div>
    {receivedOfferCount === 0 ? (
      <div className="empty-state">No offers yet</div>
    ) : (
      <div style={{ fontSize: 24, fontWeight: 700, color: "#1565c0" }}>
        {receivedOfferCount} offer{receivedOfferCount !== 1 ? "s" : ""}
      </div>
    )}
  </div>
);
