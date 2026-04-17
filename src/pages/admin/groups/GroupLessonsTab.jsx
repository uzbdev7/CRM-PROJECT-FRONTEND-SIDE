import React, { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import LessonListSubTab from "./LessonListSubTab.jsx";
import HomeworkSubTab from "./HomeworkSubTab.jsx";
import VideosSubTab from "./VideosSubTab.jsx";

export default function GroupLessonsTab({ group }) {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* Kichik sub-tablar */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 500,
              fontSize: 14,
              color: "#6b7280",
              minHeight: 40,
              py: 0.5,
              "&.Mui-selected": {
                color: "#10b981",
                fontWeight: 600,
              }
            },
            "& .MuiTabs-indicator": {
              backgroundColor: "#10b981",
            }
          }}
        >
          <Tab label="Darsliklar" />
          <Tab label="Uyga vazifa" />
          <Tab label="Videolar" />
        </Tabs>
      </Box>

      {/* Tab contentlari */}
      {activeTab === 0 && <LessonListSubTab group={group} />}
      {activeTab === 1 && <HomeworkSubTab group={group} />}
      {activeTab === 2 && <VideosSubTab group={group} />}
    </Box>
  );
}
