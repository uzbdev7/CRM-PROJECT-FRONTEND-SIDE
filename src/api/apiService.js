// src/api/apiService.js
import { API_BASE } from "../utils/constants.js";

const req = (url, options = {}) =>
  fetch(`${API_BASE}${url}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

const get   = (url)       => req(url);
const post  = (url, body) =>
  body instanceof FormData
    ? reqFormData(url, "POST", body)
    : req(url, { method: "POST", body: JSON.stringify(body) });
const patch = (url, body) =>
  body instanceof FormData
    ? reqFormData(url, "PATCH", body)
    : req(url, { method: "PATCH", body: JSON.stringify(body) });
const del   = (url)       => req(url, { method: "DELETE" });

// FormData POST/PATCH helper - doesn't set content-type so browser auto-detects multipart
const reqFormData = (url, method, formData) =>
  fetch(`${API_BASE}${url}`, {
    credentials: "include",
    method,
    body: formData,
    // Do NOT set Content-Type header - browser will set it with boundary
  });

const json = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Xato: ${res.status}`);
  return data;
};

// ── Helper: Extract data from {success, data} response ──────────────────────
const extractData = (res) => res?.data !== undefined ? res.data : res;

// ── Universal login ───────────────────────────────────────────────────────
export async function universalLogin(email, password) {
  try {
    const res = await req("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { user: null, error: data.message || "Email yoki parol noto'g'ri!" };
    }
    return { user: data.user || data, error: null };
  } catch {
    throw new Error("Server bilan bog'lanib bo'lmadi.");
  }
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
  getAll:  ()         => get("/users/getAll").then(json).then(extractData),
  getById: (id)       => get(`/users/${id}`).then(json).then(extractData),
  update:  (id, body) => patch(`/users/${id}`, body).then(json).then(extractData),
  delete:  (id)       => del(`/users/delete/${id}`).then(json).then(extractData),
};

// ── Teachers ──────────────────────────────────────────────────────────────
export const teacherApi = {
  getAll:  ()       => get("/teacher/getAll").then(json).then(extractData),
  getById: (id)     => get(`/teacher/${id}`).then(json).then(extractData),
  create:  (fd)     => reqFormData("/teacher/create", "POST", fd).then(json).then(extractData),
  update:  (id, fd) => reqFormData(`/teacher/update/${id}`, "PATCH", fd).then(json).then(extractData),
  delete:  (id)     => del(`/teacher/delete/${id}`).then(json).then(extractData),
  // [O'ZGARTIRISH]: O'qituvchi o'zi ko'rish uchun my-homeworks API si qo'mshildi
  getTeacherHomeworks: () => get("/teacher/my-homeworks").then(json).then(extractData),
};

// ── Students ──────────────────────────────────────────────────────────────
export const studentApi = {
  getAll:  ()       => get("/student/getAll").then(json).then(extractData),
  getById: (id)     => get(`/student/${id}`).then(json).then(extractData),
  create:  (fd)     => reqFormData("/student/create", "POST", fd).then(json).then(extractData),
  update:  (id, fd) => reqFormData(`/student/update/${id}`, "PATCH", fd).then(json).then(extractData),
  delete:  (id)     => del(`/student/delete/${id}`).then(json).then(extractData),
  // [O'ZGARTIRISH]: O'quvchi o'z uy vazifalarini ko'rishi uchun my-homeworks API si qo'shildi
  getStudentHomeworks: () => get("/student/my-homeworks").then(json).then(extractData),
};

// ── Courses ───────────────────────────────────────────────────────────────
export const courseApi = {
  getAll:  ()         => get("/course/all/status").then(json).then(extractData),
  getById: (id)       => get(`/course/${id}`).then(json).then(extractData),
  create:  (body)     => post("/course/create", body).then(json).then(extractData),
  update:  (id, body) => patch(`/course/${id}`, body).then(json).then(extractData),
  delete:  (id)       => del(`/course/${id}`).then(json).then(extractData),
};

// ── Groups ────────────────────────────────────────────────────────────────
export const groupApi = {
  getAll:  ()         => get("/group/all/status").then(json).then(extractData),
  getById: (id)       => get(`/group/${id}`).then(json).then(extractData),
  create:  (body)     => post("/group/create", body).then(json).then(extractData),
  update:  (id, body) => patch(`/group/${id}`, body).then(json).then(extractData),
  delete:  (id)       => del(`/group/${id}`).then(json).then(extractData),
};

// ── Student-Group ─────────────────────────────────────────────────────────
export const studentGroupApi = {
  getAll:       ()        => get("/student-group/all/status").then(json).then(extractData),
  getByGroupId: (groupId) => get(`/student-group/all/status?groupId=${groupId}`).then(json).then(extractData),
  create:       (body)    => post("/student-group/create", body).then(json).then(extractData),
  delete:       (id)      => del(`/student-group/${id}`).then(json).then(extractData),
  // [O'ZGARTIRISH]: Noto'g'ri /getAll endpointi ishlamasligi sababli, to'g'ri bo'lgan /all/status ga o'zgartirildi
  getAllFull:   ()        => get("/student-group/all/status").then(json).then(extractData),
};

// ── Lessons ───────────────────────────────────────────────────────────────
export const lessonApi = {
  getAll:       ()        => get("/lesson/all").then(json).then(extractData),
  getByGroupId: (groupId) => get("/lesson/all").then(json).then(extractData),
  getById:      (id)      => get(`/lesson/${id}`).then(json).then(extractData),
  create:       (body)    => post("/lesson/create", body).then(json).then(extractData),
  update:       (id, body)=> patch(`/lesson/${id}`, body).then(json).then(extractData),
  delete:       (id)      => del(`/lesson/${id}`).then(json).then(extractData),
};

// ── Attendance ────────────────────────────────────────────────────────────
export const attendanceApi = {
  getAll:        ()         => get("/attendance/all").then(json).then(extractData),
  getByLessonId: (lessonId) => get(`/attendance/${lessonId}`).then(json).then(extractData),
  create:        (body)     => post("/attendance/create", body).then(json).then(extractData),
  update:        (id, body) => patch(`/attendance/${id}`, body).then(json).then(extractData),
  delete:        (id)       => del(`/attendance/${id}`).then(json).then(extractData),
};

// ── Homework ──────────────────────────────────────────────────────────────
export const homeworkApi = {
  getAll:      ()         => get("/homework/all").then(json).then(extractData),
  getByLesson: (lessonId) => get(`/homework/${lessonId}`).then(json).then(extractData),
  create:      (body)     => post("/homework/create", body).then(json).then(extractData),
  update:      (id, fd)   => reqFormData(`/homework/${id}`, "PATCH", fd).then(json).then(extractData),
  delete:      (id)       => del(`/homework/${id}`).then(json).then(extractData),
};

// ── Lesson Video (Yangi qo'shilgan) ───────────────────────────────────────
export const lessonVideoApi = {
  getAll:        ()          => get("/lesson-video/all").then(json).then(extractData),
  getByLessonId: (lessonId) => get(`/lesson-video/${lessonId}`).then(json).then(extractData),
  create:        (fd)       => reqFormData("/lesson-video/create", "POST", fd).then(json).then(extractData),
  update:        (id, fd)   => reqFormData(`/lesson-video/${id}`, "PATCH", fd).then(json).then(extractData),
  delete:        (id)       => del(`/lesson-video/${id}`).then(json).then(extractData),
};

// ── Homework Response (Uy vazifa topshirish) ──────────────────────────────
export const homeworkResponseApi = {
  create: (body) => post("/homework-response/create", body).then(json).then(extractData),
  update: (id, fd) => reqFormData(`/homework-response/${id}`, "PATCH", fd).then(json).then(extractData),
  getMyResponses: () => get("/homework-response/my-responses").then(json).then(extractData),
  getByHomeworkId: (hwId) => get(`/homework-response/homework/${hwId}`).then(json).then(extractData),
  getMissedStudents: (hwId) => get(`/homework-response/${hwId}/missed-students`).then(json).then(extractData),
};

// ── Homework Result (Baholash) ────────────────────────────────────────────
export const homeworkResultApi = {
  create: (body) => post("/homework-result/check", body).then(json).then(extractData),
  getAll: () => get("/homework-result/all").then(json).then(extractData),
  update: (id, fd) => reqFormData(`/homework-result/${id}`, "PATCH", fd).then(json).then(extractData),
  getById: (id) => get(`/homework-result/${id}`).then(json).then(extractData),
};

// ── Ratings ───────────────────────────────────────────────────────────────
export const ratingApi = {
  getAll: () => get("/rating/all").then(json).then(extractData),
  create: (body) => post("/rating/create", body).then(json).then(extractData),
  getMyRatings: () => get("/rating/my-ratings").then(json).then(extractData),
};

// ── Rooms ─────────────────────────────────────────────────────────────────
export const roomApi = {
  getAll:  ()         => get("/room/all/status").then(json).then(extractData),
  getById: (id)       => get(`/room/${id}`).then(json).then(extractData),
  create:  (body)     => post("/room/create", body).then(json).then(extractData),
  update:  (id, body) => patch(`/room/${id}`, body).then(json).then(extractData),
  delete:  (id)       => del(`/room/${id}`).then(json).then(extractData),
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