import React, { useState } from "react";
import {
  Settings2, Bell, Shield, Building2, Users, Wallet, Globe,
  Database, Mail, Lock, AlertTriangle, CheckCircle2, Save, RefreshCw, ChevronRight
} from "lucide-react";
import { Role } from "../data";

interface SettingsProps {
  currentRole: Role;
  userEmail: string;
  userName: string;
}

const SETTING_TABS = [
  { id: "general",       label: "General",          icon: Settings2  },
  { id: "procurement",   label: "Procurement",       icon: Building2  },
  { id: "finance",       label: "Finance & Payments",icon: Wallet     },
  { id: "notifications", label: "Notifications",     icon: Bell       },
  { id: "security",      label: "Security & Access", icon: Shield     },
  { id: "integrations",  label: "Integrations",      icon: Globe      },
];

function SectionHead({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{title}</div>
      <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{subtitle}</div>
    </div>
  );
}

function Toggle({ label, note, checked, onChange }: { label: string; note?: string; checked: boolean; onChange: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F1F5F9" }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{label}</div>
        {note && <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{note}</div>}
      </div>
      <button onClick={onChange}
        style={{
          width: 44, height: 24, borderRadius: 100, border: "none", cursor: "pointer",
          background: checked ? "#1565C0" : "#E5E7EB", position: "relative", flexShrink: 0, transition: "background 0.2s"
        }}>
        <div style={{
          width: 18, height: 18, borderRadius: "50%", background: "#fff",
          position: "absolute", top: 3, left: checked ? 23 : 3, transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
        }} />
      </button>
    </div>
  );
}

function FieldRow({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F1F5F9", gap: 20 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{label}</div>
        {note && <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{note}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

const INP = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} style={{ padding: "6px 10px", border: "1px solid #E4E7EC", borderRadius: 6, fontSize: 13, ...props.style }} />
);

const SEL = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} style={{ padding: "6px 10px", border: "1px solid #E4E7EC", borderRadius: 6, fontSize: 13, ...props.style }} />
);

function SaveBar({ onSave }: { onSave: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 20, borderTop: "1px solid #E4E7EC", marginTop: 8 }}>
      <button style={{ padding: "8px 16px", background: "#fff", border: "1px solid #E4E7EC", borderRadius: 6, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
        <RefreshCw size={13} /> Reset to Defaults
      </button>
      <button onClick={onSave} style={{ padding: "8px 20px", background: "#1565C0", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
        <Save size={13} /> Save Changes
      </button>
    </div>
  );
}

export function Settings({ currentRole, userEmail, userName }: SettingsProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [saved, setSaved] = useState(false);

  // General
  const [orgName, setOrgName]     = useState("VendorIQ Enterprise Pvt Ltd");
  const [gstOrgNum, setGstOrgNum] = useState("27AAAAA1111A1Z1");
  const [panOrg, setPanOrg]       = useState("AAAAA1111A");
  const [currency, setCurrency]   = useState("INR (₹)");
  const [timezone, setTimezone]   = useState("Asia/Kolkata (IST)");
  const [fiscalYear, setFiscalYear] = useState("April – March");
  const [language, setLanguage]   = useState("English");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");

  // Procurement
  const [poApprovalLimit, setPoApprovalLimit] = useState("500000");
  const [dualAuth, setDualAuth]               = useState(true);
  const [slaThreshold, setSlaThreshold]       = useState("90");
  const [autoRejectDays, setAutoRejectDays]   = useState("14");
  const [vendorTrial, setVendorTrial]         = useState(true);
  const [categoryLocking, setCategoryLocking] = useState(false);
  const [poAutoClose, setPoAutoClose]         = useState(true);
  const [renewalAlert, setRenewalAlert]       = useState("30");

  // Finance
  const [paymentGrace, setPaymentGrace]       = useState("5");
  const [latePenalty, setLatePenalty]         = useState("1.5");
  const [tdsRate, setTdsRate]                 = useState("2");
  const [gstMode, setGstMode]                 = useState("IGST");
  const [autoInvoice, setAutoInvoice]         = useState(true);
  const [financeAlert, setFinanceAlert]       = useState(true);
  const [creditLimit, setCreditLimit]         = useState("2000000");
  const [paymentMethod, setPaymentMethod]     = useState("NEFT / RTGS");

  // Notifications
  const [emailAlerts, setEmailAlerts]         = useState(true);
  const [smsAlerts, setSmsAlerts]             = useState(false);
  const [inAppAlerts, setInAppAlerts]         = useState(true);
  const [slaBreachAlert, setSlaBreachAlert]   = useState(true);
  const [poCreatedAlert, setPoCreatedAlert]   = useState(true);
  const [vendorReg, setVendorReg]             = useState(true);
  const [contractExpiry, setContractExpiry]   = useState(true);
  const [digestFreq, setDigestFreq]           = useState("Daily");

  // Security
  const [mfa, setMfa]                         = useState(true);
  const [sessionTimeout, setSessionTimeout]   = useState("30");
  const [passwordPolicy, setPasswordPolicy]   = useState("Strong (12+ chars)");
  const [ipWhitelist, setIpWhitelist]         = useState(false);
  const [auditLogging, setAuditLogging]       = useState(true);
  const [roleReview, setRoleReview]           = useState("Quarterly");
  const [jwtExpiry, setJwtExpiry]             = useState("8");

  // Integrations
  const [apiAccess, setApiAccess]             = useState(true);
  const [erpMode, setErpMode]                 = useState("SAP S/4HANA");
  const [smtpHost, setSmtpHost]               = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort]               = useState("587");
  const [webhookUrl, setWebhookUrl]           = useState("");
  const [backupFreq, setBackupFreq]           = useState("Daily");

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Permission guard — only Admin can see all settings
  const isAdmin = currentRole === "Administrator";

  return (
    <div style={{ padding: "24px 28px", fontFamily: "Inter, sans-serif" }}>

      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 2 }}>Platform Configuration & Settings</h2>
        <span style={{ fontSize: 13, color: "#667085" }}>
          System preferences · Procurement controls · Security · Integrations
          {!isAdmin && <span style={{ marginLeft: 10, background: "#FFF3E0", color: "#E65100", fontSize: 11, fontWeight: 700, borderRadius: 100, padding: "2px 10px" }}>Limited access — {currentRole}</span>}
        </span>
      </div>

      {saved && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#E8F5E9", border: "1px solid #2E7D3230", borderRadius: 8, padding: "10px 16px", fontSize: 13, color: "#2E7D32", marginBottom: 20, fontWeight: 600 }}>
          <CheckCircle2 size={15} /> Settings saved successfully.
        </div>
      )}

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

        {/* SIDEBAR */}
        <div style={{ width: 200, flexShrink: 0, background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 8 }}>
          {SETTING_TABS.map(tab => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            // Lock Finance, Security, Integrations to Admin only
            const restricted = ["finance","security","integrations"].includes(tab.id) && !isAdmin;
            return (
              <button key={tab.id} onClick={() => !restricted && setActiveTab(tab.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  borderRadius: 8, border: "none", cursor: restricted ? "not-allowed" : "pointer",
                  background: isSel ? "#EEF4FF" : "transparent",
                  color: restricted ? "#C4C4C4" : isSel ? "#1565C0" : "#374151",
                  fontSize: 13, fontWeight: isSel ? 700 : 400, fontFamily: "Inter", textAlign: "left",
                  marginBottom: 2, opacity: restricted ? 0.5 : 1
                }}>
                <Icon size={14} /> {tab.label}
                {isSel && <ChevronRight size={13} style={{ marginLeft: "auto" }} />}
              </button>
            );
          })}
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1 }}>

          {/* ── GENERAL ── */}
          {activeTab === "general" && (
            <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 24 }}>
              <SectionHead title="Organisation & System" subtitle="Core company identity, locale, and date/currency preferences used across all reports and POs." />
              <FieldRow label="Organisation Legal Name"      note="As per MCA / GST registration">
                <INP value={orgName} onChange={e => setOrgName(e.target.value)} style={{ width: 280 }} />
              </FieldRow>
              <FieldRow label="Organisation GSTIN"          note="15-character GST Identification Number">
                <INP value={gstOrgNum} onChange={e => setGstOrgNum(e.target.value)} style={{ width: 200, fontFamily: "monospace" }} />
              </FieldRow>
              <FieldRow label="Company PAN"                 note="10-character Permanent Account Number">
                <INP value={panOrg} onChange={e => setPanOrg(e.target.value)} style={{ width: 160, fontFamily: "monospace" }} />
              </FieldRow>
              <FieldRow label="Default Currency">
                <SEL value={currency} onChange={e => setCurrency(e.target.value)} style={{ width: 180 }}>
                  {["INR (₹)","USD ($)","EUR (€)","GBP (£)"].map(c=><option key={c}>{c}</option>)}
                </SEL>
              </FieldRow>
              <FieldRow label="Timezone">
                <SEL value={timezone} onChange={e => setTimezone(e.target.value)} style={{ width: 220 }}>
                  {["Asia/Kolkata (IST)","America/New_York (EST)","Europe/London (GMT)","Asia/Singapore (SGT)"].map(t=><option key={t}>{t}</option>)}
                </SEL>
              </FieldRow>
              <FieldRow label="Fiscal Year">
                <SEL value={fiscalYear} onChange={e => setFiscalYear(e.target.value)} style={{ width: 180 }}>
                  {["April – March","January – December","October – September"].map(f=><option key={f}>{f}</option>)}
                </SEL>
              </FieldRow>
              <FieldRow label="Interface Language">
                <SEL value={language} onChange={e => setLanguage(e.target.value)} style={{ width: 150 }}>
                  {["English","Hindi","Tamil","Telugu","Marathi"].map(l=><option key={l}>{l}</option>)}
                </SEL>
              </FieldRow>
              <FieldRow label="Date Format">
                <SEL value={dateFormat} onChange={e => setDateFormat(e.target.value)} style={{ width: 160 }}>
                  {["DD/MM/YYYY","MM/DD/YYYY","YYYY-MM-DD"].map(d=><option key={d}>{d}</option>)}
                </SEL>
              </FieldRow>
              <SaveBar onSave={handleSave} />
            </div>
          )}

          {/* ── PROCUREMENT ── */}
          {activeTab === "procurement" && (
            <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 24 }}>
              <SectionHead title="Procurement Controls" subtitle="Purchase Order limits, approval workflows, SLA thresholds, vendor eligibility, and category rules." />

              <FieldRow label="PO Auto-Approval Limit (₹)"      note="POs above this value require dual Finance authorization">
                <INP type="number" value={poApprovalLimit} onChange={e => setPoApprovalLimit(e.target.value)} style={{ width: 160 }} />
              </FieldRow>
              <Toggle label="Enforce Dual Finance Authorization for High-Value POs"
                      note="Mandatory second sign-off for POs exceeding the approval limit"
                      checked={dualAuth} onChange={() => setDualAuth(!dualAuth)} />
              <FieldRow label="SLA Delivery Threshold (%)"       note="Below this % triggers automatic vendor risk alert">
                <INP type="number" min={0} max={100} value={slaThreshold} onChange={e => setSlaThreshold(e.target.value)} style={{ width: 100 }} />
              </FieldRow>
              <FieldRow label="Auto-Reject Pending POs After (days)" note="POs in pending state beyond this limit are auto-rejected">
                <INP type="number" value={autoRejectDays} onChange={e => setAutoRejectDays(e.target.value)} style={{ width: 100 }} />
              </FieldRow>
              <FieldRow label="Contract Renewal Alert Threshold (days)" note="Days before expiry to trigger renewal notification">
                <INP type="number" value={renewalAlert} onChange={e => setRenewalAlert(e.target.value)} style={{ width: 100 }} />
              </FieldRow>
              <Toggle label="Allow Trial Period Vendors in PO Creation"
                      note="Vendors in Pending approval status can receive trial POs under ₹50,000"
                      checked={vendorTrial} onChange={() => setVendorTrial(!vendorTrial)} />
              <Toggle label="Lock Vendor Category After First PO"
                      note="Prevents category changes once a vendor has an active Purchase Order"
                      checked={categoryLocking} onChange={() => setCategoryLocking(!categoryLocking)} />
              <Toggle label="Auto-Close Completed POs After 30 Days"
                      note="Automatically archives POs marked Completed after 30 days of inactivity"
                      checked={poAutoClose} onChange={() => setPoAutoClose(!poAutoClose)} />

              <div style={{ marginTop: 20, background: "#F5F8FC", borderRadius: 10, padding: 14, border: "1px solid #C7D7F7" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#1565C0", marginBottom: 8 }}>VENDOR APPROVAL WORKFLOW CONFIG</div>
                <FieldRow label="Initial Approval Role">
                  <SEL style={{ width: 200 }}>
                    {["Procurement Manager","Administrator","Supply Chain Manager"].map(r=><option key={r}>{r}</option>)}
                  </SEL>
                </FieldRow>
                <FieldRow label="Finance Counter-Sign Role">
                  <SEL style={{ width: 200 }}>
                    {["Finance Officer","Administrator"].map(r=><option key={r}>{r}</option>)}
                  </SEL>
                </FieldRow>
              </div>

              <SaveBar onSave={handleSave} />
            </div>
          )}

          {/* ── FINANCE ── */}
          {activeTab === "finance" && isAdmin && (
            <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 24 }}>
              <SectionHead title="Finance & Payments Configuration" subtitle="Payment terms, tax deductions, GST rules, invoice generation, and credit limit policies." />

              <FieldRow label="Late Payment Penalty (% per month)"  note="Applied to overdue invoices after grace period">
                <INP type="number" step="0.1" value={latePenalty} onChange={e => setLatePenalty(e.target.value)} style={{ width: 120 }} />
              </FieldRow>
              <FieldRow label="Payment Grace Period (days)"          note="Days after due date before penalty is triggered">
                <INP type="number" value={paymentGrace} onChange={e => setPaymentGrace(e.target.value)} style={{ width: 100 }} />
              </FieldRow>
              <FieldRow label="TDS Deduction Rate (%)"               note="Tax Deducted at Source on vendor payments (Section 194C)">
                <INP type="number" step="0.5" value={tdsRate} onChange={e => setTdsRate(e.target.value)} style={{ width: 100 }} />
              </FieldRow>
              <FieldRow label="GST Applicable Mode">
                <SEL value={gstMode} onChange={e => setGstMode(e.target.value)} style={{ width: 180 }}>
                  {["IGST","CGST + SGST","UTGST","Exempt"].map(g=><option key={g}>{g}</option>)}
                </SEL>
              </FieldRow>
              <FieldRow label="Preferred Payment Method">
                <SEL value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: 200 }}>
                  {["NEFT / RTGS","Cheque","UPI","Wire Transfer","IMPS"].map(m=><option key={m}>{m}</option>)}
                </SEL>
              </FieldRow>
              <FieldRow label="Per-Vendor Credit Limit (₹)"          note="Maximum outstanding payable to a single vendor">
                <INP type="number" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} style={{ width: 160 }} />
              </FieldRow>
              <Toggle label="Auto-Generate Invoice on PO Approval"    note="Automatically creates a draft invoice when a PO is marked Approved"
                      checked={autoInvoice} onChange={() => setAutoInvoice(!autoInvoice)} />
              <Toggle label="Finance Officer Alert on Invoice Overdue" note="Sends email + in-app notification to Finance Officer upon breach"
                      checked={financeAlert} onChange={() => setFinanceAlert(!financeAlert)} />

              <SaveBar onSave={handleSave} />
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeTab === "notifications" && (
            <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 24 }}>
              <SectionHead title="Notification Preferences" subtitle="Control how and when alerts are delivered — in-app, email, and SMS channels." />

              <div style={{ fontSize: 12, fontWeight: 700, color: "#1565C0", marginBottom: 8, textTransform: "uppercase" }}>Delivery Channels</div>
              <Toggle label="In-App Notifications"         note="Show alerts inside the VendorIQ dashboard"    checked={inAppAlerts}  onChange={() => setInAppAlerts(!inAppAlerts)} />
              <Toggle label="Email Notifications"          note={`Sent to: ${userEmail}`}                      checked={emailAlerts}  onChange={() => setEmailAlerts(!emailAlerts)} />
              <Toggle label="SMS / WhatsApp Alerts"        note="Critical alerts sent via registered mobile"    checked={smsAlerts}    onChange={() => setSmsAlerts(!smsAlerts)} />

              <div style={{ fontSize: 12, fontWeight: 700, color: "#1565C0", marginTop: 20, marginBottom: 8, textTransform: "uppercase" }}>Alert Triggers</div>
              <Toggle label="SLA Breach Detection"         note="Alert when vendor delivery score drops below threshold"    checked={slaBreachAlert}  onChange={() => setSlaBreachAlert(!slaBreachAlert)} />
              <Toggle label="New Purchase Order Created"   note="Notify approvers when a new PO is submitted for review"   checked={poCreatedAlert}  onChange={() => setPoCreatedAlert(!poCreatedAlert)} />
              <Toggle label="Vendor Registration Request" note="Alert when a new vendor profile is submitted for approval" checked={vendorReg}        onChange={() => setVendorReg(!vendorReg)} />
              <Toggle label="Contract Expiry Approaching" note="Notify 30 days before a vendor contract expires"          checked={contractExpiry}   onChange={() => setContractExpiry(!contractExpiry)} />

              <FieldRow label="Daily Digest Frequency"    note="Consolidated report of all activity sent by email">
                <SEL value={digestFreq} onChange={e => setDigestFreq(e.target.value)} style={{ width: 160 }}>
                  {["Daily","Weekly","Fortnightly","Monthly","Disabled"].map(f=><option key={f}>{f}</option>)}
                </SEL>
              </FieldRow>

              <SaveBar onSave={handleSave} />
            </div>
          )}

          {/* ── SECURITY ── */}
          {activeTab === "security" && isAdmin && (
            <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 24 }}>
              <SectionHead title="Security, Access & Compliance" subtitle="Multi-factor authentication, JWT session management, IP restrictions, and role review schedules." />

              <Toggle label="Enforce Multi-Factor Authentication (MFA)" note="All users must complete OTP verification on login" checked={mfa} onChange={() => setMfa(!mfa)} />
              <FieldRow label="JWT Session Timeout (hours)"   note="Users auto-logged out after this period of inactivity">
                <INP type="number" value={jwtExpiry} onChange={e => setJwtExpiry(e.target.value)} style={{ width: 100 }} />
              </FieldRow>
              <FieldRow label="UI Session Timeout (minutes)"  note="Browser tab auto-locks after idle period">
                <INP type="number" value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)} style={{ width: 100 }} />
              </FieldRow>
              <FieldRow label="Password Policy">
                <SEL value={passwordPolicy} onChange={e => setPasswordPolicy(e.target.value)} style={{ width: 220 }}>
                  {["Basic (8+ chars)","Strong (12+ chars)","Enterprise (16+ mixed)"].map(p=><option key={p}>{p}</option>)}
                </SEL>
              </FieldRow>
              <Toggle label="IP Whitelist Restriction"        note="Only allow logins from pre-approved IP addresses" checked={ipWhitelist} onChange={() => setIpWhitelist(!ipWhitelist)} />
              <Toggle label="Full Audit Logging"              note="Log every user action to the audit trail database"  checked={auditLogging} onChange={() => setAuditLogging(!auditLogging)} />
              <FieldRow label="Role Review Cadence"            note="Scheduled review of user roles and permissions">
                <SEL value={roleReview} onChange={e => setRoleReview(e.target.value)} style={{ width: 180 }}>
                  {["Monthly","Quarterly","Semi-Annual","Annual"].map(r=><option key={r}>{r}</option>)}
                </SEL>
              </FieldRow>

              <div style={{ marginTop: 20, background: "#FFEBEE", border: "1px solid #C6282820", borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "#C62828", marginBottom: 10 }}>
                  <AlertTriangle size={14} /> DANGER ZONE
                </div>
                {[
                  { label: "Force All Users to Re-Login",    note: "Invalidates all active JWT tokens immediately" },
                  { label: "Wipe Audit Log Archive",         note: "Permanently deletes logs older than 12 months" },
                  { label: "Reset User Permissions to Default", note: "Reverts all role assignments to factory settings" },
                ].map((action, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 2 ? "1px solid #FFCDD2" : "none" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{action.label}</div>
                      <div style={{ fontSize: 11, color: "#9CA3AF" }}>{action.note}</div>
                    </div>
                    <button style={{ padding: "5px 12px", background: "#fff", border: "1px solid #C62828", borderRadius: 6, color: "#C62828", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      Execute
                    </button>
                  </div>
                ))}
              </div>

              <SaveBar onSave={handleSave} />
            </div>
          )}

          {/* ── INTEGRATIONS ── */}
          {activeTab === "integrations" && isAdmin && (
            <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 12, padding: 24 }}>
              <SectionHead title="System Integrations & External APIs" subtitle="ERP connections, SMTP email server, REST webhooks, and backup/restore configuration." />

              <Toggle label="Enable REST API Access" note="Allow external systems to query VendorIQ via API key" checked={apiAccess} onChange={() => setApiAccess(!apiAccess)} />
              <FieldRow label="ERP System Integration">
                <SEL value={erpMode} onChange={e => setErpMode(e.target.value)} style={{ width: 220 }}>
                  {["SAP S/4HANA","Oracle NetSuite","Microsoft Dynamics","Tally Prime","None / Standalone"].map(e=><option key={e}>{e}</option>)}
                </SEL>
              </FieldRow>

              <div style={{ fontSize: 12, fontWeight: 700, color: "#1565C0", marginTop: 20, marginBottom: 8, textTransform: "uppercase" }}>SMTP Email Server</div>
              <FieldRow label="SMTP Host"   note="Outbound mail relay server address">
                <INP value={smtpHost} onChange={e => setSmtpHost(e.target.value)} style={{ width: 220 }} />
              </FieldRow>
              <FieldRow label="SMTP Port"   note="Common: 587 (TLS) or 465 (SSL)">
                <INP type="number" value={smtpPort} onChange={e => setSmtpPort(e.target.value)} style={{ width: 100 }} />
              </FieldRow>
              <FieldRow label="Auth Email"  note="From address for system notifications">
                <INP type="email" defaultValue="noreply@vendoriq.in" style={{ width: 240 }} />
              </FieldRow>

              <div style={{ fontSize: 12, fontWeight: 700, color: "#1565C0", marginTop: 20, marginBottom: 8, textTransform: "uppercase" }}>Webhook Notifications</div>
              <FieldRow label="Webhook Endpoint URL" note="Receives POST events for PO creation, vendor approvals, etc.">
                <INP value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://your-server/hook" style={{ width: 280 }} />
              </FieldRow>

              <div style={{ fontSize: 12, fontWeight: 700, color: "#1565C0", marginTop: 20, marginBottom: 8, textTransform: "uppercase" }}>Backup & Data</div>
              <FieldRow label="Automated Backup Frequency">
                <SEL value={backupFreq} onChange={e => setBackupFreq(e.target.value)} style={{ width: 160 }}>
                  {["Hourly","Daily","Weekly","Monthly"].map(f=><option key={f}>{f}</option>)}
                </SEL>
              </FieldRow>
              <FieldRow label="Storage Provider">
                <SEL style={{ width: 180 }}>
                  {["AWS S3","Azure Blob","GCP Storage","On-Premise NAS"].map(s=><option key={s}>{s}</option>)}
                </SEL>
              </FieldRow>

              <div style={{ marginTop: 20, background: "#F0FFF4", border: "1px solid #A7F3D0", borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "#065F46", marginBottom: 6 }}>
                  <CheckCircle2 size={14} /> API Status
                </div>
                <div style={{ display: "flex", gap: 24 }}>
                  {[
                    { name: "VendorIQ REST API",    status: "Operational" },
                    { name: "Webhook Engine",       status: "Operational" },
                    { name: "ERP Bridge",           status: "Standby" },
                    { name: "Email Relay",          status: "Operational" },
                  ].map((s,i) => (
                    <div key={i} style={{ fontSize: 11 }}>
                      <div style={{ fontWeight: 700, color: "#111827" }}>{s.name}</div>
                      <div style={{ color: s.status === "Operational" ? "#065F46" : "#E65100", marginTop: 2 }}>● {s.status}</div>
                    </div>
                  ))}
                </div>
              </div>

              <SaveBar onSave={handleSave} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
