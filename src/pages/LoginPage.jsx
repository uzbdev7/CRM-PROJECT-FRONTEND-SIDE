// src/pages/LoginPage.jsx
import { useEffect, useRef, useState } from "react";
import {
  Box, Button, CircularProgress, IconButton,
  InputAdornment, TextField, Typography, Alert,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { universalLogin } from "../api/apiService.js";

const HERO_IMAGE = "src/assets/study.svg";

export default function LoginPage({ onLogin }) {
  const [form, setForm]               = useState({ email: "", password: "" });
  const [showPw, setShowPw]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [successBanner, setSuccessBanner] = useState(false);
  const successTimer = useRef();

  useEffect(() => () => window.clearTimeout(successTimer.current), []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || successBanner) return;
    if (!form.email.trim() || !form.password.trim()) {
      setError("Email va parolni kiriting!");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { user, error: apiErr } = await universalLogin(
        form.email.trim(),
        form.password
      );
      if (user) {
        setSuccessBanner(true);
        window.clearTimeout(successTimer.current);
        successTimer.current = window.setTimeout(() => {
          setSuccessBanner(false);
          onLogin(user);
        }, 2500);
      } else {
        setError(apiErr || "Email yoki parol noto'g'ri.");
      }
    } catch (err) {
      setError(err?.message || "Tizimga kirishda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || successBanner;

  return (
    <Box sx={{ minHeight: "100vh", width: "100%", display: "flex", alignItems: "stretch" }}>

      {/* Success toast */}
      {successBanner && (
        <Alert severity="success" variant="filled" sx={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          borderRadius: 3, fontWeight: 600,
          boxShadow: "0 8px 32px rgba(16,185,129,0.35)",
        }}>
          Muvaffaqiyatli tizimga kirdingiz!
        </Alert>
      )}

      {/* LEFT: Illustration */}
      <Box sx={{
        display: { xs: "none", md: "flex" },
        flex: "1 1 55%", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        bgcolor: "#0f2044", position: "relative", overflow: "hidden",
      }}>
        <Box component="img" src={HERO_IMAGE} alt="Illustration" sx={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center", display: "block",
        }} />
      </Box>

      {/* RIGHT: Login form */}
      <Box sx={{
        flex: { xs: "1 1 100%", md: "0 0 45%" },
        display: "flex", alignItems: "center", justifyContent: "center",
        bgcolor: "#fff", px: { xs: 3, sm: 6 }, py: { xs: 6, sm: 8 },
      }}>
        <Box sx={{ width: "100%", maxWidth: 400 }}>
          <Box sx={{ mb: 3 }}>
            <Box component="img" src="/src/assets/image.png" alt="Najot Talim logo"
              sx={{ height: 90, width: "auto", objectFit: "contain", m: "auto", mb: 2 }}
            />
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 700, color: "text.primary", mb: 3 }}>
            Tizimga kirish
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate
            sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
          >
            {/* Email */}
            <TextField
              id="login-email" name="email" label="Login (Email)"
              type="email" autoComplete="username"
              placeholder="email@najottalim.uz"
              fullWidth size="medium" disabled={disabled}
              value={form.email} onChange={handleChange}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2.5,
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#06b6d4" },
                },
                "& label.Mui-focused": { color: "#06b6d4" },
              }}
            />

            {/* Password */}
            <TextField
              id="login-password" name="password" label="Parol"
              type={showPw ? "text" : "password"} autoComplete="current-password"
              placeholder="Parolni kiriting"
              fullWidth size="medium" disabled={disabled}
              value={form.password} onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPw((p) => !p)}
                      disabled={disabled} edge="end" size="small"
                      aria-label={showPw ? "Parolni yashirish" : "Parolni ko'rsatish"}
                    >
                      {showPw ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2.5,
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#10b981" },
                },
                "& label.Mui-focused": { color: "#10b981" },
              }}
            />

            {/* Error */}
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2, py: 0.5 }}>
                {error}
              </Alert>
            )}

            {/* Submit */}
            <Button type="submit" variant="contained" fullWidth
              disabled={disabled} size="large"
              sx={{
                mt: 0.5, py: 1.6, borderRadius: 2.5,
                fontWeight: 700, fontSize: "1rem", textTransform: "none",
                background: "linear-gradient(90deg, #10b981 0%, #06b6d4 100%)",
                boxShadow: "0 4px 20px rgba(16,185,129,0.35)",
                "&:hover": {
                  background: "linear-gradient(90deg, #059669 0%, #0891b2 100%)",
                  boxShadow: "0 6px 24px rgba(16,185,129,0.45)",
                },
                "&:disabled": { background: "#e2e8f0", color: "#94a3b8", boxShadow: "none" },
              }}
            >
              {loading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <CircularProgress size={18} sx={{ color: "#94a3b8" }} />
                  Tekshirilmoqda...
                </Box>
              ) : "Kirish"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}