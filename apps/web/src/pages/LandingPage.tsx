import { useState } from "react";
import { useNavigate } from "react-router-dom";

type PlanDetails = {
  name: string;
  monthlyReplies: number;
  templates: number | string;
  brandVoices: number | string;
  historyDays: number | string;
  features: string[];
  popular?: boolean;
};

const PLAN_DETAILS: Record<"FREE" | "PRO" | "PREMIUM", PlanDetails> = {
  FREE: {
    name: "Free",
    monthlyReplies: 20,
    templates: 1,
    brandVoices: 1,
    historyDays: "30 days",
    features: [
      "20 AI-generated replies per month",
      "1 template",
      "1 brand voice",
      "30 days reply history",
      "Basic tone control",
      "Community support",
    ],
  },
  PRO: {
    name: "Pro",
    monthlyReplies: 500,
    templates: 10,
    brandVoices: 10,
    historyDays: "6 months",
    features: [
      "500 AI-generated replies per month",
      "10 templates",
      "10 brand voices",
      "6 months reply history",
      "Advanced tone control",
      "Priority email support",
      "Export replies",
      "Custom brand voice guidelines",
    ],
    popular: true,
  },
  PREMIUM: {
    name: "Premium",
    monthlyReplies: 2000,
    templates: "Unlimited",
    brandVoices: "Unlimited",
    historyDays: "Unlimited",
    features: [
      "2,000 AI-generated replies per month",
      "Unlimited templates",
      "Unlimited brand voices",
      "Unlimited reply history",
      "Advanced tone control & presets",
      "Priority support (24/7)",
      "Bulk reply generation",
      "Team collaboration features",
      "Advanced analytics & insights",
      "API access (coming soon)",
    ],
  },
};

export default function LandingPage() {
  const nav = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<"FREE" | "PRO" | "PREMIUM" | null>(null);

  return (
    <div className="container" style={{ maxWidth: "1200px" }}>
      {/* Professional Header */}
      <header
        className="topbar"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-lg)",
          marginBottom: "var(--spacing-2xl)",
        }}
      >
        <div
          style={{
            fontWeight: 800,
            fontSize: "24px",
            letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          ToneForge
        </div>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: "var(--spacing-md)",
            alignItems: "center",
          }}
        >
          <button
            className="secondary"
            onClick={() => nav("/login")}
            style={{ padding: "10px 20px", fontSize: "14px" }}
          >
            Log in
          </button>

          <button
            onClick={() => nav("/register")}
            style={{ padding: "10px 20px", fontSize: "14px" }}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="card"
        style={{
          padding: "var(--spacing-2xl)",
          textAlign: "center",
          marginBottom: "var(--spacing-2xl)",
          background: "linear-gradient(135deg, var(--card) 0%, var(--card-hover) 100%)",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(32px, 5vw, 56px)",
            letterSpacing: "-0.03em",
            lineHeight: 1.2,
            fontWeight: 800,
            marginBottom: "var(--spacing-lg)",
            background: "linear-gradient(135deg, var(--text) 0%, var(--text-secondary) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Not just AI.
          <br />
          Replies that actually work for your business.
        </h1>

        <p
          style={{
            margin: "0 auto",
            maxWidth: "680px",
            fontSize: "18px",
            lineHeight: 1.7,
            color: "var(--text-secondary)",
            marginBottom: "var(--spacing-xl)",
            marginTop: "var(--spacing-md)",
          }}
        >
          Most AI tools generate text.
          <br />
          ToneForge generates consistent, on-brand customer replies that match your tone, policies, and real support scenarios.
        </p>

        <div
          style={{
            display: "flex",
            gap: "var(--spacing-md)",
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: "var(--spacing-xl)",
          }}
        >
          <button
            onClick={() => nav("/register")}
            style={{ padding: "14px 32px", fontSize: "16px", fontWeight: 600 }}
          >
            Start Free Trial
          </button>
          <button
            className="secondary"
            onClick={() => nav("/login")}
            style={{ padding: "14px 32px", fontSize: "16px", fontWeight: 600 }}
          >
            Sign In
          </button>
        </div>
      </section>

      {/* How to Ask the Right Questions */}
      <section
        className="card"
        style={{
          padding: "var(--spacing-2xl)",
          marginBottom: "var(--spacing-2xl)",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(24px, 4vw, 32px)",
            fontWeight: 800,
            marginBottom: "var(--spacing-md)",
            textAlign: "center",
          }}
        >
          How to ask the right questions
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "var(--text-secondary)",
            fontSize: "16px",
            marginBottom: "var(--spacing-2xl)",
            maxWidth: "700px",
            margin: "0 auto var(--spacing-2xl) auto",
          }}
        >
          ToneForge works best when you describe the customer situation, not just a generic prompt.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "var(--spacing-xl)",
            marginTop: "var(--spacing-xl)",
          }}
        >
          {/* Bad Example */}
          <div
            className="card"
            style={{
              padding: "var(--spacing-xl)",
              border: "2px solid rgba(239, 68, 68, 0.3)",
              background: "rgba(239, 68, 68, 0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-sm)",
                marginBottom: "var(--spacing-md)",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#ef4444" }}>
                Generic AI prompt
              </h3>
            </div>
            <div
              style={{
                padding: "var(--spacing-md)",
                background: "var(--input-bg)",
                borderRadius: "var(--radius-md)",
                marginBottom: "var(--spacing-md)",
                fontSize: "14px",
                fontFamily: "var(--font-mono)",
                color: "var(--text-secondary)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
              }}
            >
              "Write a customer support reply"
            </div>
            <div
              style={{
                padding: "var(--spacing-md)",
                background: "rgba(239, 68, 68, 0.1)",
                borderRadius: "var(--radius-md)",
                fontSize: "13px",
                color: "#ef4444",
                border: "1px solid rgba(239, 68, 68, 0.3)",
              }}
            >
              <strong>Result:</strong> generic, robotic, inconsistent.
            </div>
          </div>

          {/* Good Example */}
          <div
            className="card"
            style={{
              padding: "var(--spacing-xl)",
              border: "2px solid rgba(16, 185, 129, 0.3)",
              background: "rgba(16, 185, 129, 0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-sm)",
                marginBottom: "var(--spacing-md)",
              }}
            >
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#10b981" }}>
                ToneForge-style prompt
              </h3>
            </div>
            <div
              style={{
                padding: "var(--spacing-md)",
                background: "var(--input-bg)",
                borderRadius: "var(--radius-md)",
                marginBottom: "var(--spacing-md)",
                fontSize: "14px",
                fontFamily: "var(--font-mono)",
                color: "var(--text-secondary)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                lineHeight: 1.6,
              }}
            >
              "Customer says their order is delayed by 3 days. They are frustrated but polite. We want a calm, professional response that reassures them and asks for the order number."
            </div>
            <div
              style={{
                padding: "var(--spacing-md)",
                background: "rgba(16, 185, 129, 0.1)",
                borderRadius: "var(--radius-md)",
                fontSize: "13px",
                color: "#10b981",
                border: "1px solid rgba(16, 185, 129, 0.3)",
              }}
            >
              <strong>Result:</strong> clear, empathetic, on-brand reply.
            </div>
          </div>
        </div>
      </section>

      {/* Tone + Context Section */}
      <section
        className="card"
        style={{
          padding: "var(--spacing-2xl)",
          marginBottom: "var(--spacing-2xl)",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(24px, 4vw, 32px)",
            fontWeight: 800,
            marginBottom: "var(--spacing-md)",
          }}
        >
          It's not about what you say — it's how you say it
        </h2>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "16px",
            marginBottom: "var(--spacing-2xl)",
            maxWidth: "600px",
            margin: "0 auto var(--spacing-2xl) auto",
          }}
        >
          Choose a tone and let ToneForge handle consistency across all replies.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "var(--spacing-lg)",
            marginTop: "var(--spacing-xl)",
          }}
        >
          {[
            { tone: "Friendly", desc: "warm, human, conversational", emoji: null },
            { tone: "Formal", desc: "professional, clear, corporate", emoji: null },
            { tone: "Calm", desc: "de-escalation, reassurance", emoji: null },
          ].map((item) => (
            <div
              key={item.tone}
              className="card"
              style={{
                padding: "var(--spacing-lg)",
                background: "var(--input-bg)",
                border: "1px solid var(--border)",
              }}
            >
              {item.emoji && <div style={{ fontSize: "32px", marginBottom: "var(--spacing-sm)" }}>{item.emoji}</div>}
              <div style={{ fontWeight: 700, fontSize: "18px", marginBottom: "var(--spacing-xs)" }}>
                {item.tone}
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{item.desc}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "var(--spacing-xl)",
            padding: "var(--spacing-lg)",
            background: "var(--primary-light)",
            borderRadius: "var(--radius-lg)",
            fontSize: "14px",
            color: "var(--text-secondary)",
            maxWidth: "500px",
            margin: "var(--spacing-xl) auto 0 auto",
          }}
        >
          <strong style={{ color: "var(--text)" }}>Same message.</strong>{" "}
          <strong style={{ color: "var(--primary)" }}>Different tone.</strong>{" "}
          <strong style={{ color: "var(--text)" }}>Same brand.</strong>
        </div>
      </section>

      {/* Templates + Brand Voice Section */}
      <section
        className="card"
        style={{
          padding: "var(--spacing-2xl)",
          marginBottom: "var(--spacing-2xl)",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(24px, 4vw, 32px)",
            fontWeight: 800,
            marginBottom: "var(--spacing-md)",
            textAlign: "center",
          }}
        >
          Templates and brand voice do the heavy lifting
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "var(--text-secondary)",
            fontSize: "16px",
            marginBottom: "var(--spacing-2xl)",
            maxWidth: "700px",
            margin: "0 auto var(--spacing-2xl) auto",
          }}
        >
          Instead of rewriting the same answers again and again:
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "var(--spacing-xl)",
            marginTop: "var(--spacing-xl)",
          }}
        >
          <div
            className="card"
            style={{
              padding: "var(--spacing-xl)",
              background: "var(--input-bg)",
              border: "1px solid var(--border)",
            }}
          >
            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "var(--spacing-sm)" }}>
              Templates
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6 }}>
              Use templates for common cases:
              <br />
              refunds, shipping, pricing, returns
            </p>
          </div>

          <div
            className="card"
            style={{
              padding: "var(--spacing-xl)",
              background: "var(--input-bg)",
              border: "1px solid var(--border)",
            }}
          >
            <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "var(--spacing-sm)" }}>
              Brand Voice
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6 }}>
              Enforce rules like:
              <br />
              what words to avoid, how formal you sound, how much detail you give
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: "var(--spacing-xl)",
            textAlign: "center",
            padding: "var(--spacing-lg)",
            background: "var(--primary-light)",
            borderRadius: "var(--radius-lg)",
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--text)",
          }}
        >
          You focus on the customer. ToneForge protects your brand.
        </div>
      </section>

      {/* Real-World Example Flow */}
      <section
        className="card"
        style={{
          padding: "var(--spacing-2xl)",
          marginBottom: "var(--spacing-2xl)",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(24px, 4vw, 32px)",
            fontWeight: 800,
            marginBottom: "var(--spacing-md)",
            textAlign: "center",
          }}
        >
          A real-world example
        </h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-lg)",
            marginTop: "var(--spacing-xl)",
            maxWidth: "600px",
            margin: "var(--spacing-xl) auto 0 auto",
          }}
        >
          {[
            { step: "1", text: "Customer message arrives" },
            { step: "2", text: "You describe the situation (not \"write a reply\")" },
            { step: "3", text: "Select tone + optional template" },
            { step: "4", text: "ToneForge generates a ready-to-send response" },
            { step: "5", text: "You stay consistent — even at scale" },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-md)",
                padding: "var(--spacing-md)",
                background: "var(--input-bg)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--primary)";
                e.currentTarget.style.background = "var(--primary-light)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.background = "var(--input-bg)";
              }}
            >
              <span style={{ 
                fontSize: "16px", 
                minWidth: "32px", 
                fontWeight: 700, 
                color: "var(--primary)",
                background: "var(--primary-light)",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>{item.step}</span>
              <span style={{ fontSize: "15px", color: "var(--text)" }}>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Why This Matters */}
      <section
        className="card"
        style={{
          padding: "var(--spacing-2xl)",
          marginBottom: "var(--spacing-2xl)",
          background: "var(--primary-light)",
        }}
      >
        <h3
          style={{
            fontSize: "20px",
            fontWeight: 700,
            marginBottom: "var(--spacing-lg)",
            textAlign: "center",
          }}
        >
          Why this matters
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "var(--spacing-lg)",
          }}
        >
          {[
            { text: "Customers expect fast replies", icon: null },
            { text: "Teams need consistency", icon: null },
            { text: "Generic AI answers hurt trust", icon: null },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                textAlign: "center",
                padding: "var(--spacing-md)",
              }}
            >
              {item.icon && <div style={{ fontSize: "32px", marginBottom: "var(--spacing-sm)" }}>{item.icon}</div>}
              <div style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: item.icon ? 400 : 600 }}>{item.text}</div>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: "var(--spacing-lg)",
            textAlign: "center",
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--text)",
          }}
        >
          ToneForge is built for support teams, not prompt engineers.
        </div>
      </section>

      {/* Final CTA Section */}
      <section
        className="card"
        style={{
          padding: "var(--spacing-2xl)",
          marginBottom: "var(--spacing-2xl)",
          textAlign: "center",
          background: "linear-gradient(135deg, var(--card) 0%, var(--card-hover) 100%)",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(28px, 4vw, 36px)",
            fontWeight: 800,
            marginBottom: "var(--spacing-md)",
          }}
        >
          Start replying with confidence.
          <br />
          Not just speed.
        </h2>
        <div
          style={{
            display: "flex",
            gap: "var(--spacing-md)",
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: "var(--spacing-xl)",
          }}
        >
          <button
            onClick={() => nav("/register")}
            style={{ padding: "14px 32px", fontSize: "16px", fontWeight: 600 }}
          >
            Try with Free Plan
          </button>
          <button
            className="secondary"
            onClick={() => {
              const pricingSection = document.querySelector('[data-section="pricing"]');
              pricingSection?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            style={{ padding: "14px 32px", fontSize: "16px", fontWeight: 600 }}
          >
            See Pricing
          </button>
        </div>
      </section>

      {/* Features + Pricing Grid */}
      <div style={{ marginTop: "var(--spacing-2xl)" }} className="grid" data-section="pricing">
        <div className="card">
          <h3 style={{ fontSize: "24px", marginBottom: "var(--spacing-lg)" }}>
            Why ToneForge?
          </h3>
          <ul
            style={{
              margin: 0,
              paddingLeft: "var(--spacing-lg)",
              lineHeight: 2,
              listStyle: "none",
            }}
          >
            {[
              "Tone control: formal / friendly / short",
              "Reusable templates for common cases",
              "Brand voice consistency across your team",
              "History, search & reuse past replies",
            ].map((feature, idx) => (
              <li
                key={idx}
                style={{
                  marginBottom: "var(--spacing-md)",
                  color: "var(--text-secondary)",
                  fontSize: "15px",
                }}
              >
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h3 style={{ fontSize: "24px", marginBottom: "var(--spacing-lg)" }}>Pricing</h3>

          <div style={{ display: "grid", gap: "var(--spacing-md)" }}>
            {(["FREE", "PRO", "PREMIUM"] as const).map((planKey) => {
              const plan = PLAN_DETAILS[planKey];
              const isPopular = plan.popular;
              const isSelected = selectedPlan === planKey;
              // Kartlar seçildiğinde mavi çerçeve
              const borderColor = isSelected ? "var(--primary)" : "var(--border)";
              
              return (
                <div
                  key={planKey}
                  onClick={() => setSelectedPlan(planKey)}
                  style={{
                    border: `2px solid ${borderColor}`,
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--spacing-lg)",
                    background: isPopular ? "var(--primary-light)" : "var(--input-bg)",
                    position: "relative",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                    e.currentTarget.style.borderColor = "var(--primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = isSelected ? "var(--primary)" : "var(--border)";
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: "18px", marginBottom: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                    {plan.name}
                    <span style={{ fontSize: "12px", opacity: 0.7, fontWeight: 500 }}>View details</span>
                  </div>
                  <div
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "13px",
                      marginBottom: "var(--spacing-md)",
                    }}
                  >
                    {planKey === "FREE" && "Basic quota for personal use"}
                    {planKey === "PRO" && "Higher quota + faster support"}
                    {planKey === "PREMIUM" && "Teams + highest limits"}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: "24px", color: "var(--primary)" }}>
                    {planKey === "FREE" && "₺0"}
                    {planKey === "PRO" && "$39.99"}
                    {planKey === "PREMIUM" && "$69.99"}
                    <span style={{ fontSize: "14px", fontWeight: 500 }}> / mo</span>
                  </div>
                  <div
                    style={{
                      marginTop: "var(--spacing-sm)",
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      opacity: 0.8,
                    }}
                  >
                    {plan.monthlyReplies} replies/month
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => nav("/register")}
            style={{
              marginTop: "var(--spacing-lg)",
              width: "100%",
              padding: "14px",
              fontSize: "15px",
            }}
          >
            Create Account
          </button>
        </div>
      </div>

      {/* Plan Details Modal */}
      {selectedPlan && (
        <div
          onClick={() => setSelectedPlan(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "var(--spacing-xl)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              position: "relative",
              animation: "fadeIn 0.2s ease",
            }}
          >
            <button
              onClick={() => setSelectedPlan(null)}
              style={{
                position: "absolute",
                top: "var(--spacing-md)",
                right: "var(--spacing-md)",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "18px",
                color: "var(--text-secondary)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--input-bg)";
                e.currentTarget.style.color = "var(--text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              ×
            </button>

            {(() => {
              const plan = PLAN_DETAILS[selectedPlan];
              return (
                <>
                  <div style={{ marginBottom: "var(--spacing-xl)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-md)", marginBottom: "var(--spacing-md)" }}>
                      <h2 style={{ margin: 0, fontSize: "28px", fontWeight: 800 }}>
                        {plan.name} Plan
                      </h2>
                    </div>
                    <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--primary)", marginBottom: "var(--spacing-sm)" }}>
                      {selectedPlan === "FREE" && "₺0"}
                      {selectedPlan === "PRO" && "$39.99"}
                      {selectedPlan === "PREMIUM" && "$69.99"}
                      <span style={{ fontSize: "16px", fontWeight: 500 }}> / month</span>
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>
                      Perfect for {selectedPlan === "FREE" && "testing and personal use"}
                      {selectedPlan === "PRO" && "small teams and growing businesses"}
                      {selectedPlan === "PREMIUM" && "enterprises and high-volume operations"}
                    </p>
                  </div>

                  <div style={{ marginBottom: "var(--spacing-xl)" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "var(--spacing-md)" }}>
                      What's included
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "var(--spacing-md)",
                        marginBottom: "var(--spacing-lg)",
                      }}
                    >
                      <div
                        style={{
                          padding: "var(--spacing-md)",
                          background: "var(--input-bg)",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                          Monthly Replies
                        </div>
                        <div style={{ fontSize: "20px", fontWeight: 700 }}>
                          {typeof plan.monthlyReplies === "number" ? plan.monthlyReplies.toLocaleString() : plan.monthlyReplies}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "var(--spacing-md)",
                          background: "var(--input-bg)",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                          Templates
                        </div>
                        <div style={{ fontSize: "20px", fontWeight: 700 }}>
                          {plan.templates}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "var(--spacing-md)",
                          background: "var(--input-bg)",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                          Brand Voices
                        </div>
                        <div style={{ fontSize: "20px", fontWeight: 700 }}>
                          {plan.brandVoices}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "var(--spacing-md)",
                          background: "var(--input-bg)",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                          History
                        </div>
                        <div style={{ fontSize: "20px", fontWeight: 700 }}>
                          {plan.historyDays}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: "var(--spacing-xl)" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "var(--spacing-md)" }}>
                      Features
                    </h3>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: "var(--spacing-lg)",
                        listStyle: "none",
                      }}
                    >
                      {plan.features.map((feature, idx) => (
                        <li
                          key={idx}
                          style={{
                            marginBottom: "var(--spacing-sm)",
                            color: "var(--text-secondary)",
                            fontSize: "15px",
                            lineHeight: 1.6,
                            position: "relative",
                            paddingLeft: "var(--spacing-md)",
                          }}
                        >
                          <span
                            style={{
                              position: "absolute",
                              left: 0,
                              color: "var(--primary)",
                              fontWeight: 700,
                            }}
                          >
                            ✓
                          </span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ display: "flex", gap: "var(--spacing-md)" }}>
                    <button
                      onClick={() => {
                        setSelectedPlan(null);
                        nav("/register");
                      }}
                      style={{
                        flex: 1,
                        padding: "14px",
                        fontSize: "15px",
                        fontWeight: 600,
                      }}
                    >
                      Get Started
                    </button>
                    <button
                      className="secondary"
                      onClick={() => setSelectedPlan(null)}
                      style={{
                        padding: "14px 24px",
                        fontSize: "15px",
                        fontWeight: 600,
                      }}
                    >
                      Close
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        style={{
          marginTop: "var(--spacing-2xl)",
          paddingTop: "var(--spacing-xl)",
          borderTop: "1px solid var(--border)",
          textAlign: "center",
          color: "var(--text-secondary)",
          fontSize: "13px",
        }}
      >
        © {new Date().getFullYear()} ToneForge. All rights reserved.
      </footer>
    </div>
  );
}