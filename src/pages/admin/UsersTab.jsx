// src/pages/admin/UsersTab.jsx
import { useState } from "react";
import { Avatar, Badge } from "../../components/ui/index.jsx";
import { formatDate } from "../../utils/helpers.js";

export default function UsersTab({ users }) {
  const [search, setSearch] = useState("");
  const [role,   setRole]   = useState("ALL");
  const [status, setStatus] = useState("ALL");

  const filtered = users.filter(u => {
    const r = role   === "ALL" || u.role   === role;
    const s = status === "ALL" || u.status === status;
    const q = !search
      || u.fullName?.toLowerCase().includes(search.toLowerCase())
      || u.email?.toLowerCase().includes(search.toLowerCase());
    return r && s && q;
  });

  return (
    <div className="fade-up">
      {/* Filter bar */}
      <div style={{ display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center" }}>
        <div style={{ position:"relative",flex:1,minWidth:200 }}>
          <span style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",color:"#2D3A5C",fontSize:14 }}>⌕</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Ism yoki email bo'yicha..." className="inp"
            style={{ paddingLeft:30 }}
          />
        </div>
        <select value={role} onChange={e => setRole(e.target.value)} className="inp" style={{ width:"auto" }}>
          {["ALL","SUPERADMIN","ADMIN","ADMINISTRATOR","TEACHER","STUDENT","MANAGEMENT"].map(r => (
            <option key={r} value={r}>{r === "ALL" ? "Barcha rollar" : r}</option>
          ))}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className="inp" style={{ width:"auto" }}>
          <option value="ALL">Barcha status</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>

      <div style={{ color:"#2D3A5C",fontSize:12,marginBottom:10 }}>{filtered.length} ta natija</div>

      <div className="card" style={{ overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid #1C2748" }}>
                {["#","Foydalanuvchi","Email","Lavozim","Rol","Status","Sana"].map(h => (
                  <th key={h} style={{
                    textAlign:"left",padding:"11px 16px",
                    fontSize:10,fontWeight:700,color:"#2D3A5C",
                    textTransform:"uppercase",letterSpacing:".1em",whiteSpace:"nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id || i} style={{ borderBottom:"1px solid rgba(28,39,72,.5)",transition:"background .15s" }}
                  onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,.018)"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                  <td style={{ padding:"11px 16px",color:"#2D3A5C",fontSize:11,fontFamily:"monospace" }}>{i+1}</td>
                  <td style={{ padding:"11px 16px" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                      <Avatar name={u.fullName} size={29}/>
                      <span style={{ color:"#E2E8F0",fontSize:13,fontWeight:500,whiteSpace:"nowrap" }}>{u.fullName}</span>
                    </div>
                  </td>
                  <td style={{ padding:"11px 16px",color:"#4A5568",fontSize:12,fontFamily:"monospace" }}>{u.email}</td>
                  <td style={{ padding:"11px 16px",color:"#4A5568",fontSize:12 }}>{u.position || "—"}</td>
                  <td style={{ padding:"11px 16px" }}><Badge role={u.role}/></td>
                  <td style={{ padding:"11px 16px" }}>
                    <span style={{ display:"flex",alignItems:"center",gap:5 }}>
                      <span style={{
                        width:6,height:6,borderRadius:"50%",flexShrink:0,
                        background: u.status === "ACTIVE" ? "#63DAB1" : "#2D3A5C",
                      }}/>
                      <span style={{ fontSize:12,color: u.status === "ACTIVE" ? "#63DAB1" : "#4A5568" }}>
                        {u.status === "ACTIVE" ? "Faol" : "Nofaol"}
                      </span>
                    </span>
                  </td>
                  <td style={{ padding:"11px 16px",color:"#2D3A5C",fontSize:11,fontFamily:"monospace" }}>
                    {formatDate(u.hire_date || u.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filtered.length && (
            <div style={{ textAlign:"center",padding:48,color:"#2D3A5C" }}>
              <div style={{ fontSize:32,marginBottom:8 }}>🔍</div>
              <div style={{ fontSize:14 }}>Hech narsa topilmadi</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}