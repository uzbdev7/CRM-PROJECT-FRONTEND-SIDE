import React, { useState } from "react";
import { Box, Typography, Chip, IconButton, Avatar, Grid, Button } from "@mui/material";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import StudentDrawer from "./StudentDrawer.jsx";

const WEEKDAY_UZ = {
  MONDAY: "Dushanba", TUESDAY: "Seshanba", WEDNESDAY: "Chorshanba",
  THURSDAY: "Payshanba", FRIDAY: "Juma", SATURDAY: "Shanba", SUNDAY: "Yakshanba"
};

export default function GroupInfoTab({ group, refreshGroup, canManageStudents = true }) {
  const [openStudentDrawer, setOpenStudentDrawer] = useState(false);

  if (!group) return null;

  const daysStr = (group.weeKDays || group.daysOfWeek || [])
    .map(d => WEEKDAY_UZ[d] || d).join(", ");

  return (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={3}>
        {/* Chap qism: Ma'lumotlar va O'qituvchi */}
        <Grid item xs={12} md={4}>
          <Box sx={{ border: "1px solid #f3f4f6", borderRadius: 3, p: 2, mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
              <Typography sx={{ fontWeight: 600, color: "#111827", fontSize: 16 }}>Ma'lumotlar</Typography>
              <Chip label={group.course?.name || "Noma'lum"} size="small" sx={{ bgcolor: "#f5f3ff", color: "#7c3aed", fontWeight: 600 }} />
            </Box>
            
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box>
                <Typography sx={{ fontSize: 13, color: "#6b7280" }}>Kurs nomi</Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{group.course?.name || "—"}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, color: "#6b7280" }}>Kurs to'lovi</Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{group.course?.price?.toLocaleString() || 0} so'm</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, color: "#6b7280" }}>O'tish kunlari</Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{daysStr || "—"}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, color: "#6b7280" }}>O'tish vaqti</Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{group.startTime?.slice(0,5) || "—"}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, color: "#6b7280" }}>O'qish davomiyligi</Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>120 minut</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, color: "#6b7280" }}>Xona</Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>{group.room?.name || "—"}</Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ border: "1px solid #f3f4f6", borderRadius: 3, p: 2 }}>
             <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
              <Typography sx={{ fontWeight: 600, color: "#111827", fontSize: 16 }}>O'qituvchilar</Typography>
              <Typography sx={{ color: "#9ca3af", fontSize: 13 }}>1 ta</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1, border: "1px solid #f3f4f6", borderRadius: 2 }}>
               <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                 <Avatar sx={{ width: 36, height: 36, bgcolor: "#f5f3ff", color: "#7c3aed", fontSize: 14, fontWeight: 600 }}>
                   {group.teacher?.fullName?.split(' ').map(n => n[0]).join('')}
                 </Avatar>
                 <Box>
                   <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{group.teacher?.fullName || "—"}</Typography>
                   <Typography sx={{ fontSize: 12, color: "#6b7280" }}>{group.teacher?.email}</Typography>
                 </Box>
               </Box>
            </Box>
          </Box>
        </Grid>

        {/* O'ng qism: Talabalar */}
        <Grid item xs={12} md={8}>
           <Box sx={{ p: 3, border: "1px solid #f3f4f6", borderRadius: 3, bgcolor: "#fafafa", minHeight: "100%" }}>
             <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                <Typography sx={{ fontWeight: 600, color: "#111827", fontSize: 16 }}>
                  Talabalar <Typography component="span" sx={{ color: "#9ca3af", ml: 1 }}>{(group.students || []).length} ta</Typography>
                </Typography>
                {canManageStudents && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddRoundedIcon />}
                    onClick={() => setOpenStudentDrawer(true)}
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      bgcolor: "#10b981",
                      "&:hover": { bgcolor: "#059669" },
                    }}
                  >
                    O'quvchi qo'shish
                  </Button>
                )}
             </Box>
             
             <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {(group.students || []).map((s) => {
                  const st = s.student || s;
                  return (
                    <Box key={st.id} sx={{ bgcolor: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.5, border: "1px solid #f3f4f6", borderRadius: 2, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: "#f5f3ff", color: "#7c3aed", fontSize: 14, fontWeight: 600 }}>
                          {st.fullName?.split(" ").map((n) => n[0]).join("") || "S"}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{st.fullName || "Noma'lum"}</Typography>
                          <Typography sx={{ fontSize: 12, color: "#6b7280" }}>{st.email}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Chip label="Faol" size="small" sx={{ bgcolor: "#ecfdf5", color: "#10b981", fontWeight: 600, fontSize: 11 }} />
                        <IconButton size="small"><MoreHorizRoundedIcon fontSize="small" /></IconButton>
                      </Box>
                    </Box>
                  );
                })}
                {(!group.students || group.students.length === 0) && (
                  <Typography sx={{ py: 3, textAlign: "center", color: "#9ca3af", fontStyle: "italic", fontSize: 14 }}>
                    Hali o'quvchilar qo'shilmagan
                  </Typography>
                )}
             </Box>
           </Box>
        </Grid>
      </Grid>

      {canManageStudents && (
        <StudentDrawer
          open={openStudentDrawer}
          onClose={() => setOpenStudentDrawer(false)}
          groupId={group.id}
          currentStudents={group.students || []}
          onAdded={refreshGroup}
        />
      )}
    </Box>
  );
}
