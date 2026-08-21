import React, { useState } from "react";
import { Shield, ChevronLeft, Eye, EyeOff, Building2, ShoppingCart, Activity, DollarSign, FileBarChart } from "lucide-react";
import { Role } from "../data";

interface RoleSelectProps {
  onLoginSuccess: (role: Role, userEmail: string, userName: string) => void;
}

export function RoleSelect({ onLoginSuccess }: RoleSelectProps) {
  const [currentView, setCurrentView] = useState<"role-select" | "login" | "register" | "forgot" | "reset">("role-select");
  const [selectedRole, setSelectedRole] = useState<Role>("Administrator");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const roles: { role: Role; desc: string; icon: React.ElementType; color: string; bg: string }[] = [
    { role: "Administrator",        desc: "Platform & system control",   icon: Shield,       color: "#1565C0", bg: "#EEF4FF" },
    { role: "Procurement Manager",  desc: "Vendors & purchase orders",   icon: ShoppingCart, color: "#2E7D32", bg: "#E8F5E9" },
    { role: "Supply Chain Manager", desc: "Logistics & fulfillment",     icon: Activity,     color: "#6A1B9A", bg: "#F3E5F5" },
    { role: "Finance Officer",      desc: "Budgets & payments",          icon: DollarSign,   color: "#E65100", bg: "#FFF3E0" },
    { role: "Vendor",               desc: "Supplier portal access",      icon: Building2,    color: "#006064", bg: "#E0F7FA" },
    { role: "Auditor",              desc: "Compliance & reporting",      icon: FileBarChart, color: "#B71C1C", bg: "#FFEBEE" },
  ];

  const handleRoleSelect = (r: Role) => {
    setSelectedRole(r);
    setErrorMsg("");
    setSuccessMsg("");
    setCurrentView("login");
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (!password.trim()) {
      setErrorMsg("Password is required.");
      return;
    }
    setErrorMsg("");
    // Simulate JWT Generation & Storage
    const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." + btoa(JSON.stringify({ role: selectedRole, email }));
    localStorage.setItem("token", fakeToken);
    onLoginSuccess(selectedRole, email, fullName || "Hrithik");
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !mobileNumber.trim() || !password.trim()) {
      setErrorMsg("All fields are mandatory.");
      return;
    }
    if (!email.includes("@")) {
      setErrorMsg("Invalid email format.");
      return;
    }
    if (selectedRole === "Vendor" && !companyName.trim()) {
      setErrorMsg("Company Name is required for Vendors.");
      return;
    }
    if (selectedRole !== "Vendor" && !employeeId.trim()) {
      setErrorMsg("Employee ID is required for internal users.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("Registration successful! Please login.");
    setCurrentView("login");
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid registered email.");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("Password reset link sent! Check your inbox.");
    setTimeout(() => {
      setCurrentView("reset");
    }, 1500);
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("Password updated successfully! Redirecting to login.");
    setTimeout(() => {
      setCurrentView("login");
    }, 1500);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "Inter, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: currentView === "role-select" ? 700 : 460, background: "#fff", borderRadius: 20, border: "1px solid #E4E7EC", padding: "40px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}>
        
        {/* LOGO */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 38, height: 38, background: "#1565C0", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={20} color="#fff" />
          </div>
          <span style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>VendorIQ</span>
        </div>
        <div style={{ fontSize: 10, color: "#667085", letterSpacing: "0.12em", fontWeight: 600, textAlign: "center", marginBottom: currentView === "role-select" ? 36 : 24 }}>
          ENTERPRISE PROCUREMENT INTELLIGENCE
        </div>

        {errorMsg && (
          <div style={{ background: "#FFEBEE", border: "1px solid #C6282830", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#C62828", marginBottom: 20 }}>
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ background: "#E8F5E9", border: "1px solid #2E7D3230", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#2E7D32", marginBottom: 20 }}>
            {successMsg}
          </div>
        )}

        {/* 1. ROLE SELECT VIEW */}
        {currentView === "role-select" && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", textAlign: "center", marginBottom: 6 }}>Who are you signing in as?</h2>
            <p style={{ fontSize: 13, color: "#667085", textAlign: "center", marginBottom: 32 }}>Select your department or portal role to proceed</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
              {roles.map(({ role, desc, icon: Icon, color, bg }) => (
                <button
                  key={role}
                  onClick={() => handleRoleSelect(role)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", border: "1px solid #E4E7EC", borderRadius: 14, background: "#fff", cursor: "pointer", textAlign: "left", transition: "border-color 0.15s, box-shadow 0.15s", fontFamily: "Inter, sans-serif" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 0 0 3px ${color}14`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#E4E7EC"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={20} color={color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{role}</div>
                    <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 2. LOGIN VIEW */}
        {currentView === "login" && (
          <form onSubmit={handleLoginSubmit}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#EEF4FF", padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: "#1565C0" }}>
                <Shield size={12} /> {selectedRole}
              </div>
              <button type="button" onClick={() => setCurrentView("role-select")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#667085", display: "flex", alignItems: "center", gap: 4, fontFamily: "Inter, sans-serif" }}>
                <ChevronLeft size={14} /> Change role
              </button>
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Welcome back</h3>
            <p style={{ fontSize: 13, color: "#667085", marginBottom: 24 }}>Sign in using your {selectedRole.toLowerCase()} credentials</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase" }}>Email Address</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="name@company.com"
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 8, border: "1px solid #E4E7EC", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase" }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="••••••••"
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", paddingRight: "40px", borderRadius: 8, border: "1px solid #E4E7EC", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif" }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#667085" }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#374151", cursor: "pointer" }}>
                  <input type="checkbox" /> Remember me
                </label>
                <button type="button" onClick={() => setCurrentView("forgot")} style={{ background: "none", border: "none", color: "#1565C0", fontWeight: 600, cursor: "pointer" }}>
                  Forgot password?
                </button>
              </div>

              <button type="submit" style={{ width: "100%", padding: "12px", background: "#1565C0", color: "#fff", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif", marginTop: 8 }}>
                Sign In
              </button>
            </div>

            <div style={{ borderTop: "1px solid #E4E7EC", marginTop: 24, paddingTop: 18, textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#667085" }}>
                New to the platform?{" "}
                <button type="button" onClick={() => setCurrentView("register")} style={{ background: "none", border: "none", color: "#1565C0", fontWeight: 700, cursor: "pointer" }}>
                  Create account
                </button>
              </p>
            </div>
          </form>
        )}

        {/* 3. REGISTER VIEW */}
        {currentView === "register" && (
          <form onSubmit={handleRegisterSubmit}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#EEF4FF", padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: "#1565C0" }}>
                <Shield size={12} /> {selectedRole}
              </div>
              <button type="button" onClick={() => setCurrentView("login")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#1565C0", fontWeight: 700, display: "flex", alignItems: "center", gap: 4, fontFamily: "Inter, sans-serif" }}>
                <ChevronLeft size={14} /> Back to Login
              </button>
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Register Account</h3>
            <p style={{ fontSize: 13, color: "#667085", marginBottom: 24 }}>Fill down the fields to apply for a portal profile</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="John Doe" style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 8, border: "1px solid #E4E7EC", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif" }} />
              </div>

              {selectedRole === "Vendor" ? (
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Company Name</label>
                  <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} required placeholder="Acmecorp Ltd" style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 8, border: "1px solid #E4E7EC", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif" }} />
                </div>
              ) : (
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Employee ID</label>
                  <input type="text" value={employeeId} onChange={e => setEmployeeId(e.target.value)} required placeholder="EMP-2026-92" style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 8, border: "1px solid #E4E7EC", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif" }} />
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="name@company.com" style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 8, border: "1px solid #E4E7EC", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Mobile Number</label>
                <input type="tel" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} required placeholder="+91 99999 88888" style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 8, border: "1px solid #E4E7EC", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 chars" style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 8, border: "1px solid #E4E7EC", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Confirm</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Retype pass" style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 8, border: "1px solid #E4E7EC", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif" }} />
                </div>
              </div>

              <button type="submit" style={{ width: "100%", padding: "12px", background: "#1565C0", color: "#fff", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif", marginTop: 8 }}>
                Register Account
              </button>
            </div>
          </form>
        )}

        {/* 4. FORGOT PASSWORD VIEW */}
        {currentView === "forgot" && (
          <form onSubmit={handleForgotSubmit}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#EEF4FF", padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: "#1565C0" }}>
                <Shield size={12} /> {selectedRole}
              </div>
              <button type="button" onClick={() => setCurrentView("login")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#1565C0", fontWeight: 700, display: "flex", alignItems: "center", gap: 4, fontFamily: "Inter, sans-serif" }}>
                <ChevronLeft size={14} /> Back to Login
              </button>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Forgot Password?</h3>
            <p style={{ fontSize: 13, color: "#667085", marginBottom: 24 }}>Enter your registered email address to receive a secure recovery code</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Registered Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="name@company.com" style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 8, border: "1px solid #E4E7EC", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif" }} />
              </div>
              <button type="submit" style={{ width: "100%", padding: "12px", background: "#1565C0", color: "#fff", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                Send Reset Link
              </button>
            </div>
          </form>
        )}

        {/* 5. RESET PASSWORD VIEW */}
        {currentView === "reset" && (
          <form onSubmit={handleResetSubmit}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#EEF4FF", padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: "#1565C0" }}>
                <Shield size={12} /> {selectedRole}
              </div>
              <button type="button" onClick={() => setCurrentView("login")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#1565C0", fontWeight: 700, display: "flex", alignItems: "center", gap: 4, fontFamily: "Inter, sans-serif" }}>
                <ChevronLeft size={14} /> Back to Login
              </button>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Create New Password</h3>
            <p style={{ fontSize: 13, color: "#667085", marginBottom: 24 }}>Please set a strong password to secure your account</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>New Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 8, border: "1px solid #E4E7EC", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Confirm password" style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 8, border: "1px solid #E4E7EC", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif" }} />
              </div>
              <button type="submit" style={{ width: "100%", padding: "12px", background: "#1565C0", color: "#fff", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                Save Password
              </button>
            </div>
          </form>
        )}

      </div>
      <p style={{ marginTop: 20, fontSize: 12, color: "#9CA3AF" }}>© 2026 VendorIQ · Enterprise Procurement Platform</p>
    </div>
  );
}
