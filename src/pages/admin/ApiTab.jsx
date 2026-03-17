// src/pages/admin/ApiTab.jsx
import { API_BASE } from "../../utils/constants.js";

const ENDPOINTS = [
  // Users
  { m:"POST",   p:"/users/register", d:"Yangi foydalanuvchi (multipart)",   tag:"Users",      auth:"SUPERADMIN | ADMIN" },
  { m:"POST",   p:"/users/login",    d:"ADMIN / SUPERADMIN login",          tag:"Users",      auth:"Public" },
  { m:"POST",   p:"/users/logout",   d:"Tizimdan chiqish",                  tag:"Users",      auth:"Token" },
  // Teacher
  { m:"POST",   p:"/teacher/login",  d:"Teacher login",                     tag:"Teacher",    auth:"Public" },
  { m:"POST",   p:"/teacher/logout", d:"Teacher tizimdan chiqish",          tag:"Teacher",    auth:"Token" },
  // Student
  { m:"POST",   p:"/student/login",  d:"Student login",                     tag:"Student",    auth:"Public" },
  { m:"POST",   p:"/student/logout", d:"Student tizimdan chiqish",          tag:"Student",    auth:"Token" },
  // Groups (kelajak)
  { m:"GET",    p:"/groups",         d:"Barcha guruhlar",                   tag:"Groups",     auth:"Token" },
  { m:"POST",   p:"/groups",         d:"Guruh yaratish",                    tag:"Groups",     auth:"ADMIN" },
  { m:"PATCH",  p:"/groups/:id",     d:"Guruhni yangilash",                 tag:"Groups",     auth:"ADMIN" },
  { m:"DELETE", p:"/groups/:id",     d:"Guruhni o'chirish",                 tag:"Groups",     auth:"ADMIN" },
  // Lessons
  { m:"GET",    p:"/lessons",        d:"Barcha darslar",                    tag:"Lessons",    auth:"Token" },
  { m:"POST",   p:"/lessons",        d:"Dars yaratish",                     tag:"Lessons",    auth:"TEACHER" },
  // Attendance
  { m:"GET",    p:"/attendance",     d:"Davomat ro'yxati",                  tag:"Attendance", auth:"Token" },
  { m:"POST",   p:"/attendance",     d:"Davomat belgilash",                 tag:"Attendance", auth:"TEACHER" },
  // Homework
  { m:"GET",    p:"/homework",       d:"Topshiriqlar",                      tag:"Homework",   auth:"Token" },
  { m:"POST",   p:"/homework",       d:"Topshiriq yaratish",                tag:"Homework",   auth:"TEACHER" },
  { m:"POST",   p:"/homework/result","d":"Natija yuborish",                 tag:"Homework",   auth:"STUDENT" },
];

const METHOD_STYLE = {
  GET:    { bg:"rgba(99,218,177,.12)",  color:"#63DAB1" },
  POST:   { bg:"rgba(59,130,246,.12)",  color:"#93C5FD" },
  PATCH:  { bg:"rgba(251,191,36,.12)",  color:"#FCD34D" },
  DELETE: { bg:"rgba(239,68,68,.12)",   color:"#FCA5A5" },
  PUT:    { bg:"rgba(249,115,22,.12)",  color:"#FDBA74" },
};

const TAGS = [...new Set(ENDPOINTS.map(e => e.tag))];

export default function ApiTab() {
  return (
    <div className="fade-up" style={{ maxWidth:720 }}>
      {/* Base URL */}
      <div className="card" style={{ padding:"12px 18px",marginBottom:14,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap" }}>
        <div style={{ width:7,height:7,borderRadius:"50%",background:"#63DAB1",animation:"pulse 1.8s ease-in-out infinite" }}/>
        <span style={{ color:"#4A5568",fontSize:13 }}>Base URL:</span>
        <code style={{ color:"#63DAB1",background:"#070918",padding:"3px 12px",borderRadius:6,fontSize:12,fontFamily:"monospace" }}>
          {API_BASE}
        </code>
        <span style={{ marginLeft:"auto",color:"#2D3A5C",fontSize:11 }}>{ENDPOINTS.length} endpoint</span>
      </div>

      {/* Endpoints by tag */}
      {TAGS.map(tag => (
        <div key={tag} className="card" style={{ marginBottom:10,overflow:"hidden" }}>
          <div style={{ padding:"11px 18px",borderBottom:"1px solid #1C2748",display:"flex",alignItems:"center",gap:8 }}>
            <div style={{ width:3,height:14,background:"#63DAB1",borderRadius:2 }}/>
            <span style={{ color:"#E2E8F0",fontWeight:600,fontSize:13 }}>{tag}</span>
            <span style={{ marginLeft:"auto",color:"#2D3A5C",fontSize:11 }}>
              {ENDPOINTS.filter(e => e.tag===tag).length} ta
            </span>
          </div>

          {ENDPOINTS.filter(e => e.tag===tag).map((ep, i, arr) => {
            const ms = METHOD_STYLE[ep.m] || { bg:"rgba(100,100,100,.1)", color:"#94A3B8" };
            return (
              <div key={i} style={{
                display:"flex",alignItems:"center",gap:14,
                padding:"11px 18px",
                borderBottom: i < arr.length-1 ? "1px solid rgba(28,39,72,.4)" : "none",
                transition:"background .15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,.018)"}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                <span style={{
                  fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:5,
                  width:54,textAlign:"center",flexShrink:0,fontFamily:"monospace",
                  background:ms.bg,color:ms.color,
                }}>{ep.m}</span>

                <code style={{ color:"#63DAB1",flex:1,fontSize:12,fontFamily:"monospace" }}>{ep.p}</code>

                <span style={{ color:"#4A5568",fontSize:12,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{ep.d}</span>

                <span style={{
                  fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:99,flexShrink:0,
                  background:"rgba(255,255,255,.04)",color:"#2D3A5C",border:"1px solid #1C2748",
                  whiteSpace:"nowrap",
                }}>{ep.auth}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}