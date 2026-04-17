// src/pages/teacher/TeacherGroupsPage.jsx
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  groupApi,
  lessonApi,
  attendanceApi,
  studentGroupApi,
  teacherApi,
} from "../../api/apiService.js";
import GroupDetailContext from "../admin/groups/GroupDetailContext.jsx";

// ── Constants ─────────────────────────────────────────────────────────────────
const GREEN = "#16a34a";
const GREEN_BG = "#f0fdf4";
const BORDER = "#e5e7eb";

const MONTH_NAMES_SHORT = [
  "Yan","Feb","Mar","Apr","May","Iyn",
  "Iyl","Avg","Sen","Okt","Noy","Dek",
];
const MONTH_NAMES_FULL = [
  "Yanvar","Fevral","Mart","Aprel","May","Iyun",
  "Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr",
];
const WEEKDAY_KEYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"];
const WEEKDAY_SHORT = { MONDAY:"Du", TUESDAY:"Se", WEDNESDAY:"Cho", THURSDAY:"Pa", FRIDAY:"Ju", SATURDAY:"Sha", SUNDAY:"Ya" };
// JS getDay(): 0=Sun,1=Mon,...,6=Sat
const WEEKDAY_JS = { MONDAY:1, TUESDAY:2, WEDNESDAY:3, THURSDAY:4, FRIDAY:5, SATURDAY:6, SUNDAY:0 };

const toDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2,"0");
  const day = String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
};

const fmtTime = (t) => t?.slice(0,5) || "—";

// Oy ichidagi dars kunlarini hisoblash
const getLessonDatesForMonth = (group, year, month) => {
  if (!group?.weeKDays?.length) return [];
  const dayNums = group.weeKDays.map(k => WEEKDAY_JS[k]).filter(n => n !== undefined);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dates = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    if (dayNums.includes(date.getDay())) dates.push(new Date(year, month, d));
  }
  return dates;
};

// Tarix strip uchun sanalar (bugundan ±15 kun)
const buildDateStrip = (centerDate) => {
  const dates = [];
  for (let i = -7; i <= 14; i++) {
    const d = new Date(centerDate);
    d.setDate(d.getDate() + i);
    dates.push(new Date(d));
  }
  return dates;
};

const DAY_NAMES = ["Ya","Du","Se","Cho","Pa","Ju","Sha"];

// ── Yo'qlama Dialog ───────────────────────────────────────────────────────────
function AttendanceModal({ open, onClose, lesson, students }) {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});
  const [topic, setTopic] = useState("");
  const [lessonType, setLessonType] = useState("other");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !lesson) return;
    setLoading(true);
    setError("");
    setTopic(lesson.title || "");
    attendanceApi.getByLessonId(lesson.id)
      .then(res => {
        const data = res?.data || res || [];
        setAttendances(Array.isArray(data) ? data : []);
      })
      .catch(() => setAttendances([]))
      .finally(() => setLoading(false));
  }, [open, lesson]);

  const getStatus = (studentId) => {
    const a = attendances.find(a => a.studentId === studentId);
    if (!a) return null;
    return a.isPresent;
  };

  const handleToggle = async (studentId, present) => {
    setSaving(p => ({ ...p, [studentId]: true }));
    try {
      await attendanceApi.create({ lessonId: lesson.id, studentId, isPresent: present });
      setAttendances(prev => {
        const exists = prev.find(a => a.studentId === studentId);
        if (exists) return prev.map(a => a.studentId === studentId ? { ...a, isPresent: present } : a);
        return [...prev, { studentId, isPresent: present, lessonId: lesson.id }];
      });
    } catch (e) { setError(e.message); }
    finally { setSaving(p => ({ ...p, [studentId]: false })); }
  };

  const presentCount = attendances.filter(a => a.isPresent === true).length;
  const absentCount  = attendances.filter(a => a.isPresent === false).length;

  if (!open) return null;

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1000,
      background:"rgba(0,0,0,0.35)", backdropFilter:"blur(2px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:16,
    }}
    onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background:"#fff", borderRadius:16, width:"100%", maxWidth:560,
        maxHeight:"90vh", display:"flex", flexDirection:"column",
        boxShadow:"0 20px 60px rgba(0,0,0,0.15)",
        border:`1px solid ${BORDER}`,
      }}>
        {/* Header */}
        <div style={{
          padding:"16px 20px", borderBottom:`1px solid ${BORDER}`,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          flexShrink:0,
        }}>
          <div>
            <div style={{ fontWeight:700, fontSize:15, color:"#111827" }}>
              Yo'qlama va mavzu kiritish
            </div>
            {lesson?.date && (
              <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>
                {lesson.date}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{
            border:"none", background:"#f3f4f6", borderRadius:8,
            width:32, height:32, cursor:"pointer", display:"flex",
            alignItems:"center", justifyContent:"center", color:"#6b7280",
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>
          {error && (
            <div style={{
              background:"#fef2f2", border:`1px solid #fecaca`,
              borderRadius:8, padding:"10px 14px", marginBottom:12,
              fontSize:13, color:"#dc2626",
            }}>{error}</div>
          )}

          {/* Lesson type */}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, color:"#6b7280", display:"block", marginBottom:6 }}>
              Dars turi
            </label>
            <div style={{ display:"flex", gap:8 }}>
              {[
                { value:"plan",  label:"O'quv reja bo'yicha" },
                { value:"other", label:"Boshqa" },
              ].map(opt => (
                <label key={opt.value} style={{
                  display:"flex", alignItems:"center", gap:6,
                  cursor:"pointer", fontSize:13,
                  color: lessonType === opt.value ? GREEN : "#374151",
                  fontWeight: lessonType === opt.value ? 600 : 400,
                }}>
                  <div style={{
                    width:16, height:16, borderRadius:"50%",
                    border:`2px solid ${lessonType === opt.value ? GREEN : "#d1d5db"}`,
                    background: lessonType === opt.value ? GREEN : "#fff",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    transition:"all .15s",
                  }}>
                    {lessonType === opt.value && (
                      <div style={{ width:6, height:6, borderRadius:"50%", background:"#fff" }} />
                    )}
                  </div>
                  <input
                    type="radio" value={opt.value}
                    checked={lessonType === opt.value}
                    onChange={() => setLessonType(opt.value)}
                    style={{ display:"none" }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, color:"#6b7280", display:"block", marginBottom:6 }}>
              <span style={{ color:"#ef4444" }}>* </span>Mavzu
            </label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="exam continue"
              style={{
                width:"100%", padding:"8px 12px", fontSize:13,
                border:`1px solid ${BORDER}`, borderRadius:8,
                outline:"none", color:"#111827", background:"#fff",
                boxSizing:"border-box",
              }}
              onFocus={e => e.target.style.borderColor = GREEN}
              onBlur={e => e.target.style.borderColor = BORDER}
            />
          </div>

          {/* Stats */}
          <div style={{
            display:"grid", gridTemplateColumns:"repeat(3,1fr)",
            gap:8, marginBottom:16,
          }}>
            {[
              { label:"Jami",    value:students.length, color:"#374151", bg:"#f9fafb" },
              { label:"Keldi",   value:presentCount,    color:GREEN,     bg:GREEN_BG },
              { label:"Kelmadi", value:absentCount,     color:"#dc2626", bg:"#fef2f2" },
            ].map(s => (
              <div key={s.label} style={{
                background:s.bg, borderRadius:10, padding:"10px 8px",
                textAlign:"center", border:`1px solid ${BORDER}`,
              }}>
                <div style={{ fontSize:22, fontWeight:700, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:11, color:"#9ca3af", marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Students table */}
          {loading ? (
            <div style={{ textAlign:"center", padding:"24px 0", color:"#9ca3af", fontSize:13 }}>
              Yuklanmoqda...
            </div>
          ) : (
            <div style={{ border:`1px solid ${BORDER}`, borderRadius:10, overflow:"hidden" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"#f9fafb" }}>
                    <th style={{ padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:600, color:"#9ca3af", width:32 }}>#</th>
                    <th style={{ padding:"8px 12px", textAlign:"left", fontSize:11, fontWeight:600, color:"#9ca3af" }}>O'quvchi ismi</th>
                    <th style={{ padding:"8px 12px", textAlign:"center", fontSize:11, fontWeight:600, color:"#9ca3af", width:70 }}>Vaqti</th>
                    <th style={{ padding:"8px 12px", textAlign:"right", fontSize:11, fontWeight:600, color:"#9ca3af", width:70 }}>Keldi</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => {
                    const status = getStatus(s.id);
                    return (
                      <tr key={s.id} style={{
                        borderTop:`1px solid ${BORDER}`,
                        background: i % 2 === 0 ? "#fff" : "#fafafa",
                      }}>
                        <td style={{ padding:"10px 12px", fontSize:13, color:"#9ca3af" }}>{i + 1}</td>
                        <td style={{ padding:"10px 12px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{
                              width:30, height:30, borderRadius:"50%",
                              background: GREEN_BG,
                              border:`1px solid #bbf7d0`,
                              display:"flex", alignItems:"center", justifyContent:"center",
                              fontSize:12, fontWeight:700, color:GREEN, flexShrink:0,
                            }}>
                              {s.fullName?.[0]?.toUpperCase() || "S"}
                            </div>
                            <span style={{ fontSize:13, fontWeight:500, color:"#111827" }}>
                              {s.fullName}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding:"10px 12px", textAlign:"center", fontSize:13, color:"#6b7280" }}>
                          {lesson?.startTime ? fmtTime(lesson.startTime) : "18:30"}
                        </td>
                        <td style={{ padding:"10px 12px", textAlign:"right" }}>
                          <label style={{ position:"relative", display:"inline-block", width:38, height:22, cursor:"pointer" }}>
                            <input
                              type="checkbox"
                              checked={status === true}
                              disabled={saving[s.id]}
                              onChange={e => handleToggle(s.id, e.target.checked)}
                              style={{ opacity:0, width:0, height:0 }}
                            />
                            <span style={{
                              position:"absolute", inset:0,
                              background: status === true ? GREEN : "#d1d5db",
                              borderRadius:22, transition:"background .2s",
                            }}>
                              <span style={{
                                position:"absolute",
                                width:16, height:16, borderRadius:"50%",
                                background:"#fff", top:3,
                                left: status === true ? 19 : 3,
                                transition:"left .2s",
                                boxShadow:"0 1px 3px rgba(0,0,0,0.2)",
                              }} />
                            </span>
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding:"24px", textAlign:"center", fontSize:13, color:"#9ca3af" }}>
                        O'quvchilar topilmadi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding:"14px 20px", borderTop:`1px solid ${BORDER}`,
          display:"flex", justifyContent:"flex-end", gap:8, flexShrink:0,
        }}>
          <button onClick={onClose} style={{
            padding:"8px 16px", borderRadius:8, border:`1px solid ${BORDER}`,
            background:"#fff", color:"#374151", fontSize:13, fontWeight:500,
            cursor:"pointer",
          }}>
            Bekor qilish
          </button>
          <button onClick={onClose} style={{
            padding:"8px 20px", borderRadius:8, border:"none",
            background:GREEN, color:"#fff", fontSize:13, fontWeight:600,
            cursor:"pointer",
          }}>
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create Lesson Modal ───────────────────────────────────────────────────────
function CreateLessonModal({ open, onClose, onCreated, groupId, date }) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) { setTitle(""); setError(""); setDone(false); }
  }, [open]);

  const handleCreate = async () => {
    if (!title.trim()) { setError("Mavzu nomi shart!"); return; }
    setSaving(true); setError("");
    try {
      const res = await lessonApi.create({ title: title.trim(), groupId });
      setDone(true);
      onCreated(res?.data || res, date);
      setTimeout(() => { setDone(false); onClose(); }, 1200);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (!open) return null;

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1000,
      background:"rgba(0,0,0,0.35)", backdropFilter:"blur(2px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:16,
    }}
    onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background:"#fff", borderRadius:16, width:"100%", maxWidth:400,
        boxShadow:"0 20px 60px rgba(0,0,0,0.15)", border:`1px solid ${BORDER}`,
        overflow:"hidden",
      }}>
        <div style={{
          padding:"14px 20px", borderBottom:`1px solid ${BORDER}`,
          display:"flex", alignItems:"center", justifyContent:"space-between",
        }}>
          <span style={{ fontWeight:700, fontSize:15, color:"#111827" }}>Yangi dars qo'shish</span>
          <button onClick={onClose} style={{
            border:"none", background:"#f3f4f6", borderRadius:8,
            width:32, height:32, cursor:"pointer", display:"flex",
            alignItems:"center", justifyContent:"center", color:"#6b7280",
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div style={{ padding:20 }}>
          {done ? (
            <div style={{ textAlign:"center", padding:"16px 0" }}>
              <div style={{
                width:52, height:52, borderRadius:"50%", background:GREEN_BG,
                display:"flex", alignItems:"center", justifyContent:"center",
                margin:"0 auto 12px",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12l5 5L19 7" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ fontWeight:700, fontSize:15, color:"#111827" }}>Dars qo'shildi!</div>
            </div>
          ) : (
            <>
              {error && (
                <div style={{
                  background:"#fef2f2", border:"1px solid #fecaca",
                  borderRadius:8, padding:"10px 14px", marginBottom:12,
                  fontSize:13, color:"#dc2626",
                }}>{error}</div>
              )}
              <div style={{ marginBottom:8 }}>
                <label style={{ fontSize:12, color:"#6b7280", display:"block", marginBottom:6 }}>
                  <span style={{ color:"#ef4444" }}>* </span>Dars mavzusi
                </label>
                <input
                  autoFocus
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCreate()}
                  placeholder="1-dars: NodeJs ga kirish"
                  style={{
                    width:"100%", padding:"9px 12px", fontSize:13,
                    border:`1px solid ${BORDER}`, borderRadius:8,
                    outline:"none", boxSizing:"border-box", color:"#111827",
                  }}
                  onFocus={e => e.target.style.borderColor = GREEN}
                  onBlur={e => e.target.style.borderColor = BORDER}
                />
              </div>
              {date && (
                <div style={{ fontSize:12, color:"#9ca3af", marginTop:6 }}>
                  Sana: {toDateStr(date)}
                </div>
              )}
            </>
          )}
        </div>
        {!done && (
          <div style={{
            padding:"12px 20px", borderTop:`1px solid ${BORDER}`,
            display:"flex", justifyContent:"flex-end", gap:8,
          }}>
            <button onClick={onClose} style={{
              padding:"8px 16px", borderRadius:8, border:`1px solid ${BORDER}`,
              background:"#fff", color:"#374151", fontSize:13, fontWeight:500, cursor:"pointer",
            }}>Bekor</button>
            <button onClick={handleCreate} disabled={saving} style={{
              padding:"8px 20px", borderRadius:8, border:"none",
              background: saving ? "#86efac" : GREEN,
              color:"#fff", fontSize:13, fontWeight:600, cursor: saving ? "not-allowed" : "pointer",
              display:"flex", alignItems:"center", gap:6,
            }}>
              {saving ? "Saqlanmoqda..." : "Qo'shish"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Group Detail View ─────────────────────────────────────────────────────────
function GroupDetailView({ group, onBack }) {
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [lessons, setLessons] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeLesson, setActiveLesson] = useState(null);
  const [clickedDate, setClickedDate] = useState(null);

  // Date strip
  const dateStrip = useMemo(() => buildDateStrip(today), [today]);

  useEffect(() => {
    if (!group?.id) return;
    setLoading(true);
    Promise.all([
      lessonApi.getAll(),
      studentGroupApi.getAllFull().catch(() => ({ data: [] })),
    ])
      .then(([lRes, sgRes]) => {
        const allLessons = lRes?.data || lRes || [];
        setLessons(
          Array.isArray(allLessons)
            ? allLessons.filter(l => Number(l.groupId) === Number(group.id))
            : []
        );
        const allSg = sgRes?.data || sgRes || [];
        const groupStudents = Array.isArray(allSg)
          ? allSg
              .filter(sg => Number(sg.group?.id) === Number(group.id))
              .map(sg => sg.student)
              .filter(Boolean)
          : [];
        setStudents(groupStudents);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [group]);

  const getLessonByDate = (date) => {
    const dateStr = toDateStr(date);
    return lessons.find(l => l.date === dateStr || l.created_at?.startsWith(dateStr));
  };

  const isLessonDay = (date) => {
    if (!group?.weeKDays?.length) return false;
    const dayNums = group.weeKDays.map(k => WEEKDAY_JS[k]).filter(n => n !== undefined);
    return dayNums.includes(date.getDay());
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    const lesson = getLessonByDate(date);
    if (lesson) {
      setActiveLesson({ ...lesson, date: toDateStr(date), startTime: group?.startTime });
      setAttendanceOpen(true);
    } else if (isLessonDay(date)) {
      setClickedDate(date);
      setCreateOpen(true);
    }
  };

  const handleLessonCreated = (lesson, date) => {
    if (lesson) {
      setLessons(p => [...p, { ...lesson, date: toDateStr(date) }]);
      setActiveLesson({ ...lesson, date: toDateStr(date), startTime: group?.startTime });
      setAttendanceOpen(true);
    }
  };

  const selectedLesson = getLessonByDate(selectedDate);

  return (
    <div style={{ background:"#fff", minHeight:"100vh" }}>
      {/* Top bar */}
      <div style={{
        padding:"14px 20px",
        borderBottom:`1px solid ${BORDER}`,
        display:"flex", alignItems:"center", gap:12,
        background:"#fff", position:"sticky", top:0, zIndex:10,
      }}>
        <button onClick={onBack} style={{
          width:36, height:36, border:`1px solid ${BORDER}`,
          borderRadius:10, background:"#fff", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", color:"#374151",
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:16, color:"#111827" }}>{group.name}</div>
          <div style={{ fontSize:12, color:"#9ca3af" }}>
            {group.course?.name || "—"} · {group.startTime ? fmtTime(group.startTime) : "—"}
          </div>
        </div>
        <div style={{
          padding:"4px 10px", borderRadius:20,
          background: group.status?.toUpperCase() === "ACTIVE" ? GREEN_BG : "#fef2f2",
          color: group.status?.toUpperCase() === "ACTIVE" ? GREEN : "#dc2626",
          fontSize:12, fontWeight:600,
          border: `1px solid ${group.status?.toUpperCase() === "ACTIVE" ? "#bbf7d0" : "#fecaca"}`,
        }}>
          {group.status?.toUpperCase() === "ACTIVE" ? "Faol" : "Nofaol"}
        </div>
      </div>

      <div style={{ padding:16 }}>
        {/* Teacher info card */}
        <div style={{
          background:"#fff", border:`1px solid ${BORDER}`,
          borderRadius:12, padding:16, marginBottom:14,
        }}>
          <div style={{ fontSize:12, color:"#9ca3af", fontWeight:500, marginBottom:10, textTransform:"uppercase", letterSpacing:.5 }}>
            Ma'lumot
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
            <div style={{
              width:42, height:42, borderRadius:"50%",
              background:"#f3f4f6", border:`1px solid ${BORDER}`,
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="#9ca3af">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight:600, fontSize:14, color:"#111827" }}>
                {group.teacher?.fullName || "—"}
              </div>
              <div style={{ fontSize:12, color:"#9ca3af" }}>Teacher</div>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[
              { label:"Dars kuni",  value: `${selectedDate.getDate()} ${MONTH_NAMES_FULL[selectedDate.getMonth()]}, ${selectedDate.getFullYear()}` },
              { label:"Dars vaqti", value: group.startTime && group.endTime ? `${fmtTime(group.startTime)} – ${fmtTime(group.endTime)}` : group.startTime ? fmtTime(group.startTime) : "—" },
              { label:"Filial",     value: group.room?.branch?.name || group.branch?.name || "—" },
              { label:"Xona",       value: group.room?.name || "—" },
            ].map((item, i) => (
              <div key={i} style={{
                background:"#f9fafb", borderRadius:8, padding:"8px 10px",
                border:`1px solid ${BORDER}`,
              }}>
                <div style={{ fontSize:10, color:"#9ca3af", marginBottom:3 }}>{item.label}</div>
                <div style={{ fontSize:12, fontWeight:600, color:"#111827" }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Date strip */}
        <div style={{
          background:"#fff", border:`1px solid ${BORDER}`,
          borderRadius:12, padding:"12px 14px", marginBottom:14,
        }}>
          <div style={{ fontSize:11, color:"#9ca3af", marginBottom:8 }}>8-o'quv oyi</div>
          <div style={{
            display:"flex", gap:4, overflowX:"auto",
            paddingBottom:2, scrollbarWidth:"none",
          }}>
            {dateStrip.map((date, i) => {
              const isActive = toDateStr(date) === toDateStr(selectedDate);
              const isToday  = toDateStr(date) === toDateStr(today);
              const isPast   = date < today && !isToday;
              const hasLesson = !!getLessonByDate(date);
              const isDayLesson = isLessonDay(date);

              return (
                <button
                  key={i}
                  onClick={() => handleDateClick(date)}
                  style={{
                    flexShrink:0, minWidth:44,
                    display:"flex", flexDirection:"column", alignItems:"center",
                    padding:"6px 4px", borderRadius:10, cursor:"pointer",
                    border: isActive ? "none" : `1px solid ${isDayLesson ? "#bbf7d0" : "transparent"}`,
                    background: isActive ? GREEN : hasLesson ? GREEN_BG : "transparent",
                    opacity: isPast && !hasLesson ? 0.45 : 1,
                    transition:"all .15s",
                  }}
                >
                  <span style={{
                    fontSize:10, fontWeight:500,
                    color: isActive ? "rgba(255,255,255,.8)" : "#9ca3af",
                  }}>
                    {DAY_NAMES[date.getDay()]}
                  </span>
                  <span style={{
                    fontSize:15, fontWeight: isActive || isToday ? 700 : 500,
                    color: isActive ? "#fff" : isToday ? GREEN : "#111827",
                    marginTop:1,
                  }}>
                    {date.getDate()}
                  </span>
                  {isDayLesson && !isActive && (
                    <span style={{
                      width:5, height:5, borderRadius:"50%",
                      background: hasLesson ? GREEN : "#d1fae5",
                      marginTop:2,
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected date lesson info */}
        <div style={{
          background:"#fff", border:`1px solid ${BORDER}`,
          borderRadius:12, overflow:"hidden", marginBottom:14,
        }}>
          <div style={{
            padding:"12px 16px", borderBottom:`1px solid ${BORDER}`,
            display:"flex", alignItems:"center", justifyContent:"space-between",
          }}>
            <div>
              <div style={{ fontWeight:600, fontSize:14, color:"#111827" }}>
                {group.name} · {toDateStr(selectedDate)}
              </div>
              {selectedLesson && (
                <div style={{ fontSize:12, color:"#9ca3af", marginTop:2 }}>
                  {selectedLesson.title}
                </div>
              )}
            </div>
            {isLessonDay(selectedDate) && (
              <button
                onClick={() => handleDateClick(selectedDate)}
                style={{
                  padding:"7px 14px", borderRadius:8, border:"none",
                  background: selectedLesson ? "#f0fdf4" : GREEN,
                  color: selectedLesson ? GREEN : "#fff",
                  fontSize:13, fontWeight:600, cursor:"pointer",
                  display:"flex", alignItems:"center", gap:6,
                }}
              >
                {selectedLesson ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7l4 4 6-7" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Yo'qlama
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1v12M1 7h12" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Dars qo'shish
                  </>
                )}
              </button>
            )}
          </div>

          {/* Students preview */}
          <div style={{ padding:16 }}>
            {loading ? (
              <div style={{ textAlign:"center", padding:16, color:"#9ca3af", fontSize:13 }}>
                Yuklanmoqda...
              </div>
            ) : students.length > 0 ? (
              <>
                <div style={{
                  display:"grid",
                  gridTemplateColumns:"32px 1fr 60px 70px",
                  gap:8, padding:"6px 0",
                  borderBottom:`1px solid ${BORDER}`, marginBottom:4,
                }}>
                  {["#","O'quvchi ismi","Vaqti","Keldi"].map((h, i) => (
                    <div key={i} style={{
                      fontSize:11, fontWeight:600, color:"#9ca3af",
                      textAlign: i > 1 ? "center" : "left",
                    }}>{h}</div>
                  ))}
                </div>
                {students.slice(0, 5).map((s, i) => {
                  const att = selectedLesson
                    ? null // real data loads in modal
                    : null;
                  return (
                    <div key={s.id} style={{
                      display:"grid",
                      gridTemplateColumns:"32px 1fr 60px 70px",
                      gap:8, padding:"8px 0", alignItems:"center",
                      borderBottom: i < Math.min(students.length, 5) - 1 ? `1px solid #f9fafb` : "none",
                    }}>
                      <div style={{ fontSize:13, color:"#9ca3af" }}>{i + 1}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{
                          width:28, height:28, borderRadius:"50%",
                          background:GREEN_BG, border:`1px solid #bbf7d0`,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:11, fontWeight:700, color:GREEN, flexShrink:0,
                        }}>
                          {s.fullName?.[0]?.toUpperCase() || "S"}
                        </div>
                        <span style={{
                          fontSize:13, fontWeight:500, color:"#111827",
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                        }}>{s.fullName}</span>
                      </div>
                      <div style={{ fontSize:13, color:"#9ca3af", textAlign:"center" }}>
                        {group.startTime ? fmtTime(group.startTime) : "18:30"}
                      </div>
                      <div style={{ textAlign:"center" }}>
                        <div style={{
                          width:38, height:22, borderRadius:22,
                          background:"#e5e7eb", display:"inline-block",
                          position:"relative",
                        }}>
                          <div style={{
                            width:16, height:16, borderRadius:"50%",
                            background:"#fff", position:"absolute",
                            top:3, left:3,
                            boxShadow:"0 1px 3px rgba(0,0,0,0.2)",
                          }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {students.length > 5 && (
                  <div style={{
                    textAlign:"center", padding:"8px 0", fontSize:12,
                    color:"#9ca3af", borderTop:`1px solid ${BORDER}`,
                  }}>
                    + {students.length - 5} ta o'quvchi
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign:"center", padding:"16px 0", fontSize:13, color:"#9ca3af" }}>
                O'quvchilar yo'q
              </div>
            )}
          </div>
        </div>

        {/* Dars kunlari */}
        <div style={{
          background:"#fff", border:`1px solid ${BORDER}`,
          borderRadius:12, padding:16,
        }}>
          <div style={{ fontWeight:600, fontSize:13, color:"#374151", marginBottom:10 }}>
            Haftalik dars kunlari
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {WEEKDAY_KEYS.map(k => {
              const isActive = group.weeKDays?.includes(k);
              return (
                <div key={k} style={{
                  padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:600,
                  background: isActive ? GREEN_BG : "#f9fafb",
                  color: isActive ? GREEN : "#9ca3af",
                  border: `1px solid ${isActive ? "#bbf7d0" : BORDER}`,
                }}>
                  {WEEKDAY_SHORT[k]}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AttendanceModal
        open={attendanceOpen}
        onClose={() => setAttendanceOpen(false)}
        lesson={activeLesson}
        students={students}
      />
      <CreateLessonModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleLessonCreated}
        groupId={group.id}
        date={clickedDate}
      />
    </div>
  );
}

// ── Main TeacherGroupsPage ────────────────────────────────────────────────────
export default function TeacherGroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    groupApi.getAll()
      .then(res => {
        const all = res?.data || res || [];
        const arr = Array.isArray(all) ? all : [];
        // Teacher panelda har doim faqat o'z guruhlari ko'rsatiladi.
        const myTeacherIds = [Number(user?.id ?? user?.userId), Number(user?.teacherId)].filter((id) => Number.isFinite(id) && id > 0);
        if (!myTeacherIds.length) {
          setGroups([]);
          return;
        }

        setGroups(
          arr.filter((g) => {
            const groupTeacherId = Number(g?.teacher?.id ?? g?.teacherId ?? g?.teacher?.userId);
            return Number.isFinite(groupTeacherId) && myTeacherIds.includes(groupTeacherId);
          })
        );
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (selectedGroup) {
    return (
      <GroupDetailContext
        groupId={selectedGroup.id}
        canManageStudents={false}
        onBack={() => setSelectedGroup(null)}
      />
    );
  }

  const filtered = groups.filter(g =>
    g.name?.toLowerCase().includes(search.toLowerCase()) ||
    g.course?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background:"#fff", minHeight:"100vh" }}>
      {/* Header */}
      <div style={{
        padding:"16px 20px", borderBottom:`1px solid ${BORDER}`,
        position:"sticky", top:0, zIndex:10, background:"#fff",
      }}>
        <div style={{ fontWeight:700, fontSize:18, color:"#111827", marginBottom:12 }}>
          Guruhlar
        </div>
        {/* Search */}
        <div style={{ position:"relative" }}>
          <svg style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)" }}
            width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="#9ca3af" strokeWidth="1.5"/>
            <path d="M10.5 10.5l3 3" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Guruh nomi yoki kurs..."
            style={{
              width:"100%", padding:"9px 12px 9px 32px", fontSize:13,
              border:`1px solid ${BORDER}`, borderRadius:10,
              outline:"none", boxSizing:"border-box", color:"#111827",
            }}
            onFocus={e => e.target.style.borderColor = GREEN}
            onBlur={e => e.target.style.borderColor = BORDER}
          />
        </div>
      </div>

      <div style={{ padding:16 }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:"40px 0", color:"#9ca3af", fontSize:14 }}>
            Yuklanmoqda...
          </div>
        ) : error ? (
          <div style={{
            background:"#fef2f2", border:"1px solid #fecaca",
            borderRadius:10, padding:16, color:"#dc2626", fontSize:13,
          }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"40px 0", color:"#9ca3af", fontSize:14 }}>
            {search ? "Guruh topilmadi" : "Guruhlar yo'q"}
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {filtered.map(group => {
              const isActive = group.status?.toUpperCase() === "ACTIVE";
              const days = (group.weeKDays || []).map(k => WEEKDAY_SHORT[k]).filter(Boolean);

              return (
                <div
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  style={{
                    background:"#fff", border:`1px solid ${BORDER}`,
                    borderRadius:12, padding:16, cursor:"pointer",
                    transition:"all .15s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "#bbf7d0";
                    e.currentTarget.style.boxShadow = "0 2px 12px rgba(22,163,74,.08)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = BORDER;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:15, color:"#111827", marginBottom:3 }}>
                        {group.name}
                      </div>
                      <div style={{ fontSize:12, color:"#9ca3af" }}>
                        {group.course?.name || "—"}
                      </div>
                    </div>
                    <div style={{
                      padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600,
                      background: isActive ? GREEN_BG : "#fef2f2",
                      color: isActive ? GREEN : "#dc2626",
                      border: `1px solid ${isActive ? "#bbf7d0" : "#fecaca"}`,
                      flexShrink:0, marginLeft:8,
                    }}>
                      {isActive ? "Faol" : "Nofaol"}
                    </div>
                  </div>

                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                    {days.map(d => (
                      <span key={d} style={{
                        padding:"3px 8px", borderRadius:6, fontSize:11, fontWeight:600,
                        background:GREEN_BG, color:GREEN, border:"1px solid #bbf7d0",
                      }}>{d}</span>
                    ))}
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                    {[
                      {
                        icon: (
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <circle cx="6.5" cy="4.5" r="2.5" stroke="#9ca3af" strokeWidth="1.3"/>
                            <path d="M1.5 12c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round"/>
                          </svg>
                        ),
                        value: group.teacher?.fullName?.split(" ")[0] || "—",
                      },
                      {
                        icon: (
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <circle cx="6.5" cy="6.5" r="5.5" stroke="#9ca3af" strokeWidth="1.3"/>
                            <path d="M6.5 3.5v3l2 2" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ),
                        value: group.startTime ? fmtTime(group.startTime) : "—",
                      },
                      {
                        icon: (
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <rect x="1.5" y="2.5" width="10" height="9" rx="1.5" stroke="#9ca3af" strokeWidth="1.3"/>
                            <path d="M1.5 5.5h10M4.5 1v3M8.5 1v3" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round"/>
                          </svg>
                        ),
                        value: group.startDate
                          ? new Date(group.startDate).toLocaleDateString("uz-UZ", { day:"2-digit", month:"2-digit", year:"2-digit" })
                          : "—",
                      },
                    ].map((item, i) => (
                      <div key={i} style={{
                        display:"flex", alignItems:"center", gap:5,
                        background:"#f9fafb", borderRadius:7, padding:"6px 8px",
                      }}>
                        {item.icon}
                        <span style={{ fontSize:12, color:"#374151", fontWeight:500,
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", marginTop:10 }}>
                    <span style={{ fontSize:12, color:GREEN, fontWeight:600 }}>
                      Ko'rish →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}