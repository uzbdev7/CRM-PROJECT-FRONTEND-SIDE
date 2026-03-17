// src/api/apiService.js
import { API_BASE } from "../utils/constants.js";

const req = (url, options = {}) =>
  fetch(`${API_BASE}${url}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

const get   = (url)       => req(url);
const post  = (url, body) => req(url, { method: "POST",   body: JSON.stringify(body) });
const patch = (url, body) => req(url, { method: "PATCH",  body: JSON.stringify(body) });
const del   = (url)       => req(url, { method: "DELETE" });

const json = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Xato: ${res.status}`);
  return data;
};

// ── Universal login ───────────────────────────────────────────────────────
export async function universalLogin(email, password) {
  const endpoints = ["/users/login", "/teacher/login", "/student/login"];
  let lastError = "Email yoki parol noto'g'ri!";
  for (const url of endpoints) {
    try {
      const res = await req(url, { method: "POST", body: JSON.stringify({ email, password }) });
      if (res.ok) {
        const data = await res.json();
        return { user: data.user || data, error: null };
      }
      if ([401, 403, 404].includes(res.status)) continue;
      const err = await res.json().catch(() => ({}));
      lastError = err.message || `Server xatosi: ${res.status}`;
    } catch {
      throw new Error("Server bilan bog'lanib bo'lmadi.");
    }
  }
  return { user: null, error: lastError };
}

// ── Register ──────────────────────────────────────────────────────────────
export async function registerUser(formData) {
  const res = await fetch(`${API_BASE}/users/register`, {
    method: "POST", credentials: "include", body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Ro'yxatdan o'tkazishda xato");
  return data;
}

// ── Users (Admin / Superadmin / Administrator) ────────────────────────────
export const userApi = {
  getAll:  ()         => get("/users/getAll").then(json),
  getById: (id)       => get(`/users/${id}`).then(json),
  update:  (id, body) => patch(`/users/${id}`, body).then(json),
  delete:  (id)       => del(`/users/delete/${id}`).then(json),
};

// ── Teachers ──────────────────────────────────────────────────────────────
export const teacherApi = {
  getAll:  ()       => get("/teacher/getAll").then(json),
  getById: (id)     => get(`/teacher/${id}`).then(json),
  create:  (fd)     => req("/teacher/create",       { method: "POST",  body: fd, headers: {} }).then(json),
  update:  (id, fd) => req(`/teacher/update/${id}`, { method: "PATCH", body: fd, headers: {} }).then(json),
  delete:  (id)     => del(`/teacher/delete/${id}`).then(json),
};

// ── Students ──────────────────────────────────────────────────────────────
export const studentApi = {
  getAll:  ()       => get("/student/getAll").then(json),
  getById: (id)     => get(`/student/${id}`).then(json),
  create:  (fd)     => req("/student/create",       { method: "POST",  body: fd, headers: {} }).then(json),
  update:  (id, fd) => req(`/student/update/${id}`, { method: "PATCH", body: fd, headers: {} }).then(json),
  delete:  (id)     => del(`/student/delete/${id}`).then(json),
};

// ── Courses ───────────────────────────────────────────────────────────────
export const courseApi = {
  getAll:  ()         => get("/course/all/status").then(r => r.json()),
  getById: (id)       => get(`/course/${id}`).then(json),
  create:  (body)     => post("/course/create", body).then(json),
  update:  (id, body) => patch(`/course/${id}`, body).then(json),
  delete:  (id)       => del(`/course/${id}`).then(json),
};

// ── Groups ────────────────────────────────────────────────────────────────
export const groupApi = {
  getAll:  ()         => get("/group/all/status").then(r => r.json()),
  getById: (id)       => get(`/group/${id}`).then(json),
  create:  (body)     => post("/group/create", body).then(json),
  update:  (id, body) => patch(`/group/${id}`, body).then(json),
  delete:  (id)       => del(`/group/${id}`).then(json),
};

// ── Student-Group ─────────────────────────────────────────────────────────
export const studentGroupApi = {
  getAll:       ()        => get("/student-group/all/status").then(r => r.json()),
  getByGroupId: (groupId) => get(`/student-group/all/status?groupId=${groupId}`).then(json),
  getAllFull:    ()        => get("/student-group/getAll").then(json),
};

// ── Lessons ───────────────────────────────────────────────────────────────
export const lessonApi = {
  getAll:       ()        => get("/lesson/all").then(json),
  getByGroupId: (groupId) => get("/lesson/all").then(json),
  getById:      (id)      => get(`/lesson/${id}`).then(json),
  create:       (body)    => post("/lesson/create", body).then(json),
  update:       (id, body)=> patch(`/lesson/${id}`, body).then(json),
  delete:       (id)      => del(`/lesson/${id}`).then(json),
};

// ── Attendance ────────────────────────────────────────────────────────────
export const attendanceApi = {
  getAll:        ()         => get("/attendance/all").then(json),
  getByLessonId: (lessonId) => get(`/attendance/${lessonId}`).then(json),
  create:        (body)     => post("/attendance/create", body).then(json),
  update:        (id, body) => patch(`/attendance/update/${id}`, body).then(json),
  delete:        (id)       => del(`/attendance/delete/${id}`).then(json),
};

// ── Homework ──────────────────────────────────────────────────────────────
export const homeworkApi = {
  getAll:      ()         => get("/homework/all").then(json),
  getByLesson: (lessonId) => get(`/homework/${lessonId}`).then(json),
  create:      (fd)       => req("/homework/create", { method: "POST",  body: fd, headers: {} }).then(json),
  update:      (id, fd)   => req(`/homework/${id}`,  { method: "PATCH", body: fd, headers: {} }).then(json),
  delete:      (id)       => del(`/homework/${id}`).then(json),
};

// ── Ratings ───────────────────────────────────────────────────────────────
export const ratingApi = {
  getAll: () => get("/rating/all").then(json),
};

// ── Rooms ─────────────────────────────────────────────────────────────────
export const roomApi = {
  getAll:  ()         => get("/room/all/status").then(json),
  getById: (id)       => get(`/room/${id}`).then(json),
  create:  (body)     => post("/room/create", body).then(json),
  update:  (id, body) => patch(`/room/${id}`, body).then(json),
  delete:  (id)       => del(`/room/${id}`).then(json),
};

// ── Logout ────────────────────────────────────────────────────────────────
export async function logoutUser(token, role) {
  const urlMap = {
    SUPERADMIN:    "/users/logout",
    ADMIN:         "/users/logout",
    ADMINISTRATOR: "/users/logout",
    MANAGEMENT:    "/users/logout",
    TEACHER:       "/teacher/logout",
    STUDENT:       "/student/logout",
  };
  await req(urlMap[role] || "/users/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});
}