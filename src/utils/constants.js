// src/utils/constants.js

export const API_BASE = "http://localhost:5005";

// Har bir rol uchun login endpoint
export const LOGIN_ENDPOINTS = {
  SUPERADMIN:    `${API_BASE}/users/login`,
  ADMIN:         `${API_BASE}/users/login`,
  ADMINISTRATOR: `${API_BASE}/users/login`,
  MANAGEMENT:    `${API_BASE}/users/login`,
  TEACHER:       `${API_BASE}/teacher/login`,
  STUDENT:       `${API_BASE}/student/login`,
};

export const LOGOUT_ENDPOINTS = {
  SUPERADMIN:    `${API_BASE}/users/logout`,
  ADMIN:         `${API_BASE}/users/logout`,
  ADMINISTRATOR: `${API_BASE}/users/logout`,
  MANAGEMENT:    `${API_BASE}/users/logout`,
  TEACHER:       `${API_BASE}/teacher/logout`,
  STUDENT:       `${API_BASE}/student/logout`,
};

export const ADMIN_ROLES = ["SUPERADMIN", "ADMIN", "ADMINISTRATOR", "MANAGEMENT"];
export const TEACHER_ROLES = ["TEACHER"];
export const STUDENT_ROLES = ["STUDENT"];

export const ROLE_COLORS = {
  SUPERADMIN:    { bg: "rgba(168,85,247,.1)",  text: "#D8B4FE", border: "rgba(168,85,247,.25)" },
  ADMIN:         { bg: "rgba(99,102,241,.1)",  text: "#A5B4FC", border: "rgba(99,102,241,.25)" },
  ADMINISTRATOR: { bg: "rgba(59,130,246,.1)",  text: "#93C5FD", border: "rgba(59,130,246,.25)" },
  TEACHER:       { bg: "rgba(99,218,177,.1)",  text: "#63DAB1", border: "rgba(99,218,177,.25)" },
  STUDENT:       { bg: "rgba(251,191,36,.1)",  text: "#FCD34D", border: "rgba(251,191,36,.25)" },
  MANAGEMENT:    { bg: "rgba(251,113,133,.1)", text: "#FDA4AF", border: "rgba(251,113,133,.25)" },
};

export const STORAGE_KEY = "_edu_crm_session_";