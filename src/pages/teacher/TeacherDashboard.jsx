// src/pages/teacher/TeacherDashboard.jsx
import { useState } from "react";
import { Avatar, Badge } from "../../components/ui/index.jsx";

const NAV = [
  { id:"home",    label:"Bosh sahifa" },
  { id:"profile", label:"Mening profilim" },
];

export default function TeacherDashboard({ user, onLogout }) {
  const [tab, setTab] = useState("home");

  return (
    <div style={{ minHeight:"100vh",background:"#07091A" }}>
      {/* Header */}
      <header style={{
        borderBottom:"1px solid #1C2748",
        padding:"13px 32px",
        display:"flex",alignItems:"center",gap:16,
        background:"rgba(7,9,26,.9)",backdropFilter:"blur(20px)",
        position:"sticky",top:0,zIndex:20,
      }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{
            width:32,height:32,borderRadius:9,
            background:"linear-gradient(135deg,#63DAB1,#4299E1)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontWeight:800,fontSize:11,color:"#07091A",
          }}>EC</div>
          <span style={{ color:"#E2E8F0",fontWeight:700,fontSize:14,letterSpacing:"-.3px" }}>
            Edu<span style={{ color:"#63DAB1" }}>CRM</span>
          </span>
        </div>

        <nav style={{ display:"flex",gap:2,marginLeft:24 }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} style={{
              padding:"7px 14px",borderRadius:8,fontSize:13,cursor:"pointer",
              fontWeight: tab===n.id ? 600 : 400,
              background: tab===n.id ? "rgba(99,218,177,.08)" : "none",
              color: tab===n.id ? "#63DAB1" : "#4A5568",
              border: tab===n.id ? "1px solid rgba(99,218,177,.2)" : "1px solid transparent",
              fontFamily:"inherit",transition:"all .15s",
            }}>{n.label}</button>
          ))}
        </nav>

        <div style={{ marginLeft:"auto",display:"flex",alignItems:"center",gap:12 }}>
          <Avatar name={user.fullName} size={30}/>
          <button onClick={onLogout} style={{
            display:"flex",alignItems:"center",gap:6,
            background:"none",border:"none",color:"#4A5568",
            cursor:"pointer",fontSize:13,fontFamily:"inherit",
            padding:"7px 12px",borderRadius:8,transition:"all .15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color="#F87171"; e.currentTarget.style.background="rgba(239,68,68,.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.color="#4A5568"; e.currentTarget.style.background="none"; }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Chiqish
          </button>
        </div>
      </header>

      <div style={{ maxWidth:840,margin:"0 auto",padding:"32px 24px" }}>

        {/* HOME TAB */}
        {tab === "home" && (
          <div className="fade-up">
            {/* Welcome hero */}
            <div className="card" style={{ padding:"32px 36px",marginBottom:20,position:"relative",overflow:"hidden" }}>
              <div style={{
                position:"absolute",top:0,right:0,width:300,height:220,
                background:"radial-gradient(circle at 80% 30%,rgba(99,218,177,.1) 0%,transparent 70%)",
                pointerEvents:"none",
              }}/>
              <div style={{ fontSize:44,marginBottom:16 }}>🎓</div>
              <h1 style={{
                color:"#E2E8F0",fontSize:26,fontWeight:700,
                letterSpacing:"-.5px",marginBottom:8,lineHeight:1.2,
              }}>
                Xush kelibsiz, {user.fullName}!
              </h1>
              <p style={{ color:"#4A5568",fontSize:14,marginBottom:20 }}>
                Bugungi darslaringiz va talabalaringizni kuzating
              </p>
              <div style={{ display:"inline-flex",alignItems:"center",gap:8 }}>
                <Badge role={user.role}/>
                <span style={{ color:"#2D3A5C",fontSize:12 }}>·</span>
                <span style={{ display:"flex",alignItems:"center",gap:5 }}>
                  <span style={{ width:6,height:6,borderRadius:"50%",background:"#63DAB1",animation:"pulse 1.8s ease-in-out infinite" }}/>
                  <span style={{ color:"#63DAB1",fontSize:12 }}>Faol</span>
                </span>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20 }}>
              {[
                { i:"🏫", l:"Guruhlar",     v:"—", c:"#63DAB1" },
                { i:"👥", l:"Talabalar",    v:"—", c:"#4299E1" },
                { i:"📅", l:"Darslar",      v:"—", c:"#F59E0B" },
                { i:"📝", l:"Topshiriqlar", v:"—", c:"#A78BFA" },
              ].map((s, i) => (
                <div key={i} className="card card-hover" style={{ padding:18,textAlign:"center",position:"relative",overflow:"hidden" }}>
                  <div style={{ position:"absolute",top:-12,right:-12,width:50,height:50,borderRadius:"50%",background:s.c,opacity:.08 }}/>
                  <div style={{ fontSize:22,marginBottom:10 }}>{s.i}</div>
                  <div style={{ fontSize:22,fontWeight:700,color:"#E2E8F0" }}>{s.v}</div>
                  <div style={{ color:"#4A5568",fontSize:12,marginTop:4 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Placeholder info */}
            <div className="card" style={{ padding:24,textAlign:"center" }}>
              <div style={{ fontSize:28,marginBottom:10 }}>🔄</div>
              <div style={{ color:"#E2E8F0",fontWeight:600,fontSize:14,marginBottom:6 }}>
                Ma'lumotlar yuklanmoqda
              </div>
              <div style={{ color:"#4A5568",fontSize:13,lineHeight:1.6 }}>
                Darslar, talabalar va boshqa ma'lumotlar backend to'liq ulangach ko'rinadi.<br/>
                <code style={{ color:"#2D3A5C",fontSize:11 }}>POST /teacher/login → TEACHER token</code>
              </div>
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {tab === "profile" && (
          <div className="fade-up" style={{ maxWidth:460,margin:"0 auto" }}>
            {/* Avatar card */}
            <div className="card" style={{ padding:28,textAlign:"center",marginBottom:14 }}>
              {user.photo
                ? <img src={user.photo} alt="avatar" style={{ width:84,height:84,borderRadius:"50%",objectFit:"cover",margin:"0 auto 14px",display:"block" }}/>
                : <div style={{
                    width:84,height:84,borderRadius:"50%",margin:"0 auto 14px",
                    background:"linear-gradient(135deg,#63DAB1,#4299E1)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:28,fontWeight:700,color:"#07091A",
                  }}>
                    {user.fullName?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                  </div>
              }
              <h2 style={{ color:"#E2E8F0",fontSize:18,fontWeight:700,marginBottom:4 }}>{user.fullName}</h2>
              <p style={{ color:"#4A5568",fontSize:13,marginBottom:10 }}>{user.position || "O'qituvchi"}</p>
              <Badge role={user.role}/>
            </div>

            {/* Info */}
            <div className="card" style={{ padding:20,marginBottom:12 }}>
              <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:14 }}>
                <div style={{ width:3,height:13,background:"#63DAB1",borderRadius:2 }}/>
                <span style={{ color:"#E2E8F0",fontWeight:600,fontSize:14 }}>Shaxsiy ma'lumotlar</span>
              </div>
              {[
                { l:"To'liq ism",  v: user.fullName },
                { l:"Email",       v: user.email },
                { l:"Lavozim",     v: user.position || "—" },
                { l:"Rol",         v: user.role },
                { l:"ID",          v: `#${user.id}` },
              ].map((f, i) => (
                <div key={i} style={{
                  display:"flex",justifyContent:"space-between",alignItems:"center",
                  padding:"10px 0",
                  borderBottom: i < 4 ? "1px solid rgba(28,39,72,.5)" : "none",
                }}>
                  <span style={{ color:"#4A5568",fontSize:13 }}>{f.l}</span>
                  <span style={{
                    color:"#E2E8F0",fontSize:13,fontWeight:500,
                    fontFamily: f.l === "ID" ? "monospace" : "inherit",
                  }}>{f.v}</span>
                </div>
              ))}
            </div>

            <button onClick={onLogout} style={{
              width:"100%",padding:"12px",borderRadius:10,
              background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",
              color:"#F87171",cursor:"pointer",fontSize:14,fontWeight:600,
              fontFamily:"inherit",display:"flex",alignItems:"center",
              justifyContent:"center",gap:8,transition:"background .18s",
            }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(239,68,68,.14)"}
            onMouseLeave={e => e.currentTarget.style.background="rgba(239,68,68,.08)"}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Tizimdan chiqish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}