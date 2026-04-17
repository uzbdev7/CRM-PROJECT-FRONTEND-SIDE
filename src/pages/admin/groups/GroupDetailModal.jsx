import React, { useState } from "react";
import { Box, Typography, Button, IconButton, Modal, Tabs, Tab } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

import GroupInfoTab from "./GroupInfoTab.jsx";
import GroupLessonsTab from "./GroupLessonsTab.jsx";
// Assuming AttendanceModal exists, we'll map it to the 3rd tab or just mock it for now.
// If you have a separate component for it, import it here.

export default function GroupDetailModal({ group, onClose, onDelete, onEdit }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!group) return null;

  return (
    <Modal open={!!group} onClose={onClose} disableEscapeKeyDown>
      <Box sx={{ 
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: { xs: "98%", sm: "96%", md: "95%" }, maxWidth: 1200, height: { xs: "95vh", md: "90vh" }, bgcolor: "background.paper",
        boxShadow: 24, borderRadius: 3, display: "flex", flexDirection: "column", overflow: "hidden" 
      }}>
        
        {/* Header */}
        <Box sx={{ p: 3, borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button onClick={onClose} variant="outlined" size="small" sx={{ textTransform: "none", color: "#6b7280", borderColor: "#e5e7eb", borderRadius: 2 }}>
              ← Orqaga
            </Button>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>{group.name}</Typography>
              <Typography sx={{ fontSize: 13, color: "#6b7280" }}>Guruh ma'lumotlari</Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Button startIcon={<EditRoundedIcon />} variant="outlined" size="small" onClick={() => onEdit(group)} sx={{ borderColor: "#e5e7eb", color: "#4b5563", textTransform: "none", borderRadius: 2 }}>
              Tahrirlash
            </Button>
            <IconButton onClick={() => onDelete(group.id)} sx={{ bgcolor: "#fee2e2", color: "#ef4444", borderRadius: 2, "&:hover": { bgcolor: "#fecaca" } }}>
              <DeleteRoundedIcon fontSize="small" />
            </IconButton>
            <IconButton onClick={onClose} sx={{ color: "#9ca3af" }}><CloseRoundedIcon /></IconButton>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", px: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, val) => setActiveTab(val)}
            sx={{
              "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: 15, color: "#6b7280", py: 2 },
              "& .Mui-selected": { color: "#10b981" },
              "& .MuiTabs-indicator": { backgroundColor: "#10b981", height: 3 }
            }}
          >
            <Tab label="Ma'lumotlar" />
            <Tab label="Guruh darsliklari" />
            <Tab label="Akademik davomat" />
          </Tabs>
        </Box>

        {/* Content Area */}
        <Box sx={{ flex: 1, overflowY: "auto", p: 3, bgcolor: "#f9fafb" }}>
          {activeTab === 0 && <GroupInfoTab group={group} refreshGroup={() => {}} />}
          {activeTab === 1 && <GroupLessonsTab group={group} />}
          {activeTab === 2 && (
            <Box sx={{ textAlign: "center", mt: 10, color: "#9ca3af" }}>
              Davomat kalendari joylashadigan joy... (Attendance componentini bu yerga ulaymiz)
            </Box>
          )}
        </Box>

      </Box>
    </Modal>
  );
}
