import React, { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, List, ListItem, ListItemText, ListItemSecondaryAction, Divider, Tabs, Tab, Checkbox,
  Avatar
} from "@mui/material";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import HowToRegRoundedIcon from "@mui/icons-material/HowToRegRounded";

import { 
  groupApi, lessonApi, lessonVideoApi, homeworkApi, 
  attendanceApi, homeworkResultApi, teacherApi 
} from "../../api/apiService.js";

// Helper for UI
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function TeacherGroupsTab({ user }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Navigatsiya holatlari
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [innerTab, setInnerTab] = useState(0); 

  // Darslar, O'quvchilar va Baholash uchun state
  const [groupLessons, setGroupLessons] = useState([]);
  const [students, setStudents] = useState([]); // Guruhga kirgan o'quvchilar
  const [homeworksData, setHomeworksData] = useState([]);

  // Modal oynalar
  const [openLessonModal, setOpenLessonModal] = useState(false);
  const [openAttendanceModal, setOpenAttendanceModal] = useState(false);
  const [openVideoModal, setOpenVideoModal] = useState(false);
  const [openHomeworkModal, setOpenHomeworkModal] = useState(false);

  // Form statelari
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonDate, setNewLessonDate] = useState("");
  const [currentLesson, setCurrentLesson] = useState(null);
  const [attendanceList, setAttendanceList] = useState({});
  const [attendanceMap, setAttendanceMap] = useState({}); // { studentId: { id, isPresent } }
  const [uploadFile, setUploadFile] = useState(null);
  const [homeworkTitle, setHomeworkTitle] = useState("");

  const [hwDuration, setHwDuration] = useState(16); // Uy vazifa berilgan soat

  // Ball qo'yish (Checking homeworks)
  const [openCheckModal, setOpenCheckModal] = useState(false);
  const [gradingResponse, setGradingResponse] = useState(null);
  const [hwScore, setHwScore] = useState("");
  const [hwFeedback, setHwFeedback] = useState("Vazifa qabul qilindi");

  useEffect(() => {
    // Ustozga tegishli barcha guruhlarni olish
    groupApi.getAll()
      .then(res => {
        const allGrps = (res?.data || res || []);
        const myGrps = Array.isArray(allGrps) ? allGrps.filter(g => Number(g.teacherId) === Number(user.id)) : [];
        setGroups(myGrps);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.id]);

  const loadGroupDetails = (group) => {
    setSelectedGroup(group);
    setInnerTab(0);
    fetchLessons(group.id);
    fetchTeacherHomeworks(); // Vazifalarni tortib olamiz
    
    // Guruhga tegishli studentlarni olish uchun (Soddalashtirilgan).
    // Odatda studentGroupApi orqali bilsa bo'ladi
    groupApi.getById(group.id).then(res => {
        if(res.success && res.data?.studentGroups) {
            setStudents(res.data.studentGroups.map(sg => sg.student));
        }
    }).catch(console.error);
  };

  const fetchLessons = (groupId) => {
    lessonApi.getAll()
      .then(res => {
        const allLists = res?.data || res || [];
        setGroupLessons(Array.isArray(allLists) ? allLists.filter(l => Number(l.groupId) === Number(groupId)) : []);
      })
      .catch(console.error);
  };

  const fetchTeacherHomeworks = () => {
    // API ni endi to'g'irladik (homeworkResponses bilan keladi)
    teacherApi.getTeacherHomeworks()
      .then(res => {
         setHomeworksData(res?.data || []);
      }).catch(console.error);
  };

  // --- DARS YARATISH ---
  const handleCreateLesson = async () => {
    if (!newLessonTitle || !newLessonDate) return;
    try {
      await lessonApi.create({
        title: newLessonTitle,
        groupId: selectedGroup.id,
        // Backend DTO qanday edi? Ko'pincha title va groupId yetarli yoki date ham.
      });
      fetchLessons(selectedGroup.id);
      setOpenLessonModal(false);
      setNewLessonTitle("");
    } catch (e) {
      alert("Xato: " + e.message);
    }
  };

  // --- DAVOMAT ---
  const handleOpenAttendance = (lesson) => {
    setCurrentLesson(lesson);
    setNewLessonTitle(lesson?.title || "");
    setNewLessonDate("");
    // Hozirgi davomat statusini yuklash (bo'lsa)
    attendanceApi.getByLessonId(lesson.id).then(res => {
        const exist = res?.data || res || [];
        const statusMap = {};
        const existingMap = {};
        if (Array.isArray(exist) && exist.length > 0) {
            exist.forEach(a => {
              statusMap[a.studentId] = a.isPresent;
              existingMap[a.studentId] = a; // { id, studentId, lessonId, isPresent, ... }
            });
        } else {
            // Bo'sh holatda default false bo'ladi, tasodifiy "hammasi keldi" yozilib ketmaydi
            students.forEach(s => statusMap[s.id] = false);
        }
        setAttendanceList(statusMap);
        setAttendanceMap(existingMap);
        setOpenAttendanceModal(true);
    }).catch(e => {
        const msg = String(e?.message || "");
        if (msg.includes("404")) {
          alert("Bu dars topilmadi (o'chirilgan bo'lishi mumkin). Ro'yxatni yangilang.");
          return;
        }
        const map = {};
        students.forEach(s => map[s.id] = false);
        setAttendanceList(map);
        setAttendanceMap({});
        setOpenAttendanceModal(true);
    });
  };

  const saveAttendance = async () => {
    try {
      let lessonId = currentLesson?.id;
      
      // Agar currentLesson bo'lmasa yoki title bo'sh bo'lsa, yangi dars yaratamiz
      if (!lessonId) {
        if (!newLessonTitle.trim()) {
          alert("Mavzu nomini kiriting!");
          return;
        }
        const lessonPayload = {
          title: newLessonTitle.trim(),
          groupId: selectedGroup.id,
          date: newLessonDate || new Date().toISOString().split('T')[0],
        };
        const lessonRes = await lessonApi.create(lessonPayload).catch(e => {
          throw new Error("Dars yaratishda xato: " + e.message);
        });
        lessonId = lessonRes?.data?.id || lessonRes?.id;
        if (!lessonId) throw new Error("Dars ID yo'q");
        
        // Yangi darsni groupLessons'ga qo'shamiz
        const newLesson = lessonRes?.data || lessonRes || { id: lessonId, title: newLessonTitle, created_at: new Date() };
        setGroupLessons(prev => [...prev, newLesson]);
      }
      
      // Endi davomat yozamiz
      const promises = students.map(s => {
          const existing = attendanceMap[s.id];
          if (existing?.id) {
            return attendanceApi.update(existing.id, {
              lessonId: lessonId,
              studentId: s.id,
              isPresent: !!attendanceList[s.id],
            }).catch(console.error);
          } else {
            return attendanceApi.create({
              studentId: s.id,
              lessonId: lessonId,
              isPresent: !!attendanceList[s.id],
              delayTime: 0,
              description: ""
            }).catch(console.error);
          }
      });
      await Promise.all(promises);
      
      alert("Davomat saqlandi!");
      setOpenAttendanceModal(false);
      setNewLessonTitle("");
      setNewLessonDate("");
      setCurrentLesson(null);
      
      // Darslar ro'yxatini yangilash
      if (selectedGroup?.id) {
        const lessonsRes = await lessonApi.getAll().catch(() => ({ data: [] }));
        const allLessons = lessonsRes?.data || lessonsRes || [];
        const filtered = allLessons.filter(l => Number(l.groupId) === Number(selectedGroup.id));
        setGroupLessons(filtered);
      }
    } catch (e) {
      alert("Davomat saqlashda muammo: " + e.message);
    }
  };

  // --- VIDEO YUKLASH ---
  const handleSaveVideo = async () => {
    if (!uploadFile) return;
    try {
      const fd = new FormData();
      fd.append("lessonId", currentLesson.id);
      fd.append("file", uploadFile);
      await lessonVideoApi.create(fd);
      alert("Video yuklandi!");
      setOpenVideoModal(false);
      setUploadFile(null);
    } catch (e) {
      alert("Xato: " + e.message);
    }
  };

  // --- UY VAZIFA YUKLASH ---
  const handleSaveHomework = async () => {
    if (!homeworkTitle) return;
    try {
      const fd = new FormData();
      fd.append("lessonId", currentLesson.id);
      fd.append("title", homeworkTitle);
      fd.append("durationTime", hwDuration);
      if (uploadFile) fd.append("file", uploadFile);
      
      await homeworkApi.create(fd);
      alert("Vazifa e'lon qilindi!");
      setOpenHomeworkModal(false);
      setUploadFile(null);
      setHomeworkTitle("");
      fetchTeacherHomeworks();
    } catch (e) {
        alert("Xato: " + e.message);
    }
  };

  // --- BALL QO'YISH ---
  const handleOpenGrade = (hw, resp) => {
    setGradingResponse({ hw, resp });
    setHwScore("");
    setHwFeedback(resp.title || "");
    setOpenCheckModal(true);
  };

  const submitGrade = async () => {
    try {
        const fd = new FormData();
        fd.append("homeworkId", gradingResponse.hw.id);
        fd.append("studentId", gradingResponse.resp.studentId);
        fd.append("title", hwFeedback);
        fd.append("score", Number(hwScore));
        // Qo'shimcha tekshirilgan fayl yozsa bo'ladi fd.append('file', ...)
        
        await homeworkResultApi.create(fd);
        alert("Baho qo'yildi!");
        setOpenCheckModal(false);
        fetchTeacherHomeworks(); // Yangilash
    } catch(e) {
        alert("Baho saqlashda xato: " + e.message);
    }
  };


  // ============================
  // VIEWS
  // ============================

  if (loading) return <CircularProgress />;

  // 1. Asosiy Guruhlar Ro'yxati
  if (!selectedGroup) {
      if(groups.length === 0) return <Typography>Sizga hech qanday guruh biriktirilmagan.</Typography>
      return (
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: "#111827" }}>
              Mening Guruhlarim
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb" }}>
                <Table>
                    <TableHead sx={{ bgcolor: "#f9fafb" }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Guruh nomi</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Dars vaqti</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Holati</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>Amallar</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {groups.map(g => (
                            <TableRow key={g.id} hover onClick={() => loadGroupDetails(g)} sx={{ cursor: "pointer" }}>
                                <TableCell><Typography sx={{ fontWeight: 600 }}>{g.name}</Typography></TableCell>
                                <TableCell>{g.startTime || "Noma'lum"}</TableCell>
                                <TableCell>
                                    <Chip label={g.status} size="small" 
                                      sx={{ bgcolor: g.status === 'ACTIVE'?"#dcfce7":"#f3f4f6", 
                                            color: g.status === 'ACTIVE'?"#16a34a":"#4b5563", fontWeight: 700}}/>
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small"><ChevronRightRoundedIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
          </Box>
      );
  }

  // Vazifalarni faqat hozirgi guruh uchun filterlash
  // Eslatma: TeacherHomeworks arrayida har bir homeworkni `lesson` obyektida `groupId` bor edi
  const currGroupHomeworks = homeworksData.filter(hw => Number(hw?.lesson?.groupId) === Number(selectedGroup.id));

  // 2. Guruhning Ichki Oynasi
  return (
      <Box>
         <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => setSelectedGroup(null)} sx={{ mb: 2, textTransform: "none" }}>
            Orqaga qaytish
         </Button>
         <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>{selectedGroup.name}</Typography>
         <Typography sx={{ color: "#6b7280", mb: 3 }}>Bu guruh uchun dars jarayonlarini quyida boshqaring:</Typography>
         
         <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={innerTab} onChange={(e, val) => setInnerTab(val)} indicatorColor="primary">
                <Tab label="Mavzular va Davomat" sx={{ textTransform: "none", fontWeight: 600 }} />
                <Tab label="Uy vazifalar tekshiruvi" sx={{ textTransform: "none", fontWeight: 600 }} />
                <Tab label="O'quvchilar ro'yxati" sx={{ textTransform: "none", fontWeight: 600 }} />
            </Tabs>
         </Box>

         <TabPanel value={innerTab} index={0}>
             <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                 <Typography variant="h6" sx={{ fontWeight: 700 }}>Darslar ro'yxati</Typography>
                 <Button variant="contained" startIcon={<AddRoundedIcon />} sx={{ bgcolor: "#7c3aed", textTransform: "none" }}
                         onClick={() => setOpenLessonModal(true)}>
                    Yangi Dars Qo'shish
                 </Button>
             </Box>
             
             {groupLessons.length === 0 ? <Typography>Hali mavzular ochilmagan</Typography> : (
                 <List sx={{ bgcolor: "#fff", borderRadius: 3, border: "1px solid #e5e7eb" }}>
                    {groupLessons.map((lesson, idx) => (
                        <Box key={lesson.id}>
                            <ListItem sx={{ py: 2 }}>
                                <ListItemText 
                                  primary={<Typography sx={{ fontWeight: 700, fontSize: 16 }}>{lesson.title}</Typography>}
                                  secondary={`Ochilgan sana: ${new Date(lesson.created_at || Date.now()).toLocaleDateString()}`}
                                />
                                <Box sx={{ display: "flex", gap: 1 }}>
                                    <Button size="small" variant="outlined" startIcon={<VideocamRoundedIcon/>}
                                            onClick={() => { setCurrentLesson(lesson); setOpenVideoModal(true); }}>
                                        Video yuklash
                                    </Button>
                                    <Button size="small" variant="outlined" startIcon={<AssignmentRoundedIcon/>}
                                            onClick={() => { setCurrentLesson(lesson); setOpenHomeworkModal(true); }}>
                                        Vazifa berish
                                    </Button>
                                    <Button size="small" variant="contained" color="success" startIcon={<HowToRegRoundedIcon/>}
                                            onClick={() => handleOpenAttendance(lesson)}>
                                        Davomat qilish
                                    </Button>
                                </Box>
                            </ListItem>
                            {idx < groupLessons.length - 1 && <Divider />}
                        </Box>
                    ))}
                 </List>
             )}
         </TabPanel>

         <TabPanel value={innerTab} index={1}>
             <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Kelib tushgan uy vazifalar (Javoblar)</Typography>
             {currGroupHomeworks.length === 0 ? <Typography>Ushbu guruhga vazifalar mavjud emas.</Typography> : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {currGroupHomeworks.map(hw => (
                        <Paper key={hw.id} elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e5e7eb" }}>
                            <Typography sx={{ fontWeight: 800, mb: 1, fontSize: 16 }}>Dars: {hw.lesson?.title}</Typography>
                            <Typography sx={{ color: "#3b82f6", mb: 2, fontWeight: 600 }}>Vazifa nomi: {hw.title}</Typography>
                            
                            <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1 }}>O'quvchilar jo'natgan fayllar:</Typography>
                            {(!hw.homeworkResponses || hw.homeworkResponses.length === 0) ? (
                                <Typography sx={{ color: "#9ca3af", fontStyle: "italic", fontSize: 13 }}>Hech kim vazifa topshirmagan...</Typography>
                            ) : (
                                <Table size="small">
                                    <TableHead><TableRow>
                                        <TableCell>O'quvchi</TableCell>
                                        <TableCell>Holat</TableCell>
                                        <TableCell>Baho</TableCell>
                                        <TableCell align="right">Amal</TableCell>
                                    </TableRow></TableHead>
                                    <TableBody>
                                        {hw.homeworkResponses.map(resp => {
                                            // Shu respect uchun homeworkResults bormi?
                                            const grade = hw.homeworkResults?.find(r => r.studentId === resp.studentId);
                                            return (
                                                <TableRow key={resp.id}>
                                                    <TableCell sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                        <Avatar sx={{ width: 24, height: 24, fontSize: 11 }}>{resp.student?.fullName?.[0]}</Avatar>
                                                        {resp.student?.fullName}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip label={grade ? "Tekshirilgan" : "Yangi"} size="small" 
                                                              color={grade ? "success" : "warning"} />
                                                    </TableCell>
                                                    <TableCell>{grade ? <Typography sx={{ fontWeight: 800, color: "#16a34a" }}>{grade.score} ball</Typography> : "-"}</TableCell>
                                                    <TableCell align="right">
                                                        {grade ? (
                                                           <Button size="small" disabled>Baholangan</Button>
                                                        ) : (
                                                           <Button size="small" variant="contained" sx={{ textTransform: "none", bgcolor: "#ef4444" }}
                                                                   onClick={() => handleOpenGrade(hw, resp)}>Ball qo'yish</Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </Paper>
                    ))}
                </Box>
             )}
         </TabPanel>

         <TabPanel value={innerTab} index={2}>
             <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>O'quvchilar</Typography>
             <List sx={{ bgcolor: "#fff", borderRadius: 3, border: "1px solid #e5e7eb" }}>
                {students.map((st, i) => (
                    <Box key={st.id}>
                        <ListItem>
                            <ListItemText primary={<Typography sx={{ fontWeight: 600 }}>{st.fullName}</Typography>} secondary={st.email} />
                        </ListItem>
                        {i < students.length - 1 && <Divider/>}
                    </Box>
                ))}
            </List>
         </TabPanel>

         {/* --- MODALS --- */}
         <Dialog open={openLessonModal} onClose={() => setOpenLessonModal(false)} maxWidth="xs" fullWidth>
             <DialogTitle>Yangi Mavzu/Dars ochish</DialogTitle>
             <DialogContent>
                 <TextField autoFocus fullWidth label="Dars mavzusi" margin="normal" value={newLessonTitle} onChange={e => setNewLessonTitle(e.target.value)} />
                 <TextField fullWidth type="date" value={newLessonDate} onChange={e => setNewLessonDate(e.target.value)} sx={{ mt: 2 }} />
             </DialogContent>
             <DialogActions>
                 <Button onClick={() => setOpenLessonModal(false)}>Bekor qilish</Button>
                 <Button onClick={handleCreateLesson} variant="contained" sx={{ bgcolor: "#7c3aed" }}>Saqlash</Button>
             </DialogActions>
         </Dialog>

         <Dialog open={openAttendanceModal} onClose={() => setOpenAttendanceModal(false)} maxWidth="sm" fullWidth>
             <DialogTitle>Davomat</DialogTitle>
             <DialogContent dividers>
                <TextField
                  autoFocus
                  fullWidth
                  label="Mavzu nomi"
                  margin="normal"
                  value={newLessonTitle}
                  onChange={e => setNewLessonTitle(e.target.value)}
                  placeholder="masalan: Props drilling"
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  type="date"
                  margin="normal"
                  value={newLessonDate}
                  onChange={e => setNewLessonDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 3 }}
                />
                <Typography sx={{ fontWeight: 600, mb: 1.5, fontSize: 14, color: "#111827" }}>O'quvchilar davomat:</Typography>
                <List disablePadding>
                    {students.map(st => (
                        <ListItem key={st.id}>
                            <ListItemText primary={st.fullName} />
                            <ListItemSecondaryAction>
                                <Checkbox 
                                    checked={!!attendanceList[st.id]} 
                                    onChange={(e) => setAttendanceList({...attendanceList, [st.id]: e.target.checked})}
                                />
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
             </DialogContent>
             <DialogActions>
                 <Button onClick={() => setOpenAttendanceModal(false)}>Bekor qilish</Button>
                 <Button onClick={saveAttendance} variant="contained" color="success">Saqlash</Button>
             </DialogActions>
         </Dialog>

         <Dialog open={openVideoModal} onClose={() => setOpenVideoModal(false)} maxWidth="xs" fullWidth>
             <DialogTitle>Video Fayl Yuklash</DialogTitle>
             <DialogContent>
                 <Typography sx={{ mb: 2, fontSize: 13, color: "#6b7280" }}>Faqat mp4, dars formati kutiladi.</Typography>
                 <Button variant="outlined" component="label" fullWidth sx={{ textTransform: "none" }}>
                      {uploadFile ? uploadFile.name : "Video Tanlash"}
                      <input type="file" hidden accept="video/*" onChange={e => setUploadFile(e.target.files[0])} />
                 </Button>
             </DialogContent>
             <DialogActions>
                 <Button onClick={() => setOpenVideoModal(false)}>Bekor qilish</Button>
                 <Button onClick={handleSaveVideo} variant="contained" sx={{ bgcolor: "#7c3aed" }}>Yuklash</Button>
             </DialogActions>
         </Dialog>

         <Dialog open={openHomeworkModal} onClose={() => setOpenHomeworkModal(false)} maxWidth="xs" fullWidth>
             <DialogTitle>Uy Vazifa Berish</DialogTitle>
             <DialogContent>
                 <TextField autoFocus fullWidth label="Vazifa tafsiloti / nomi" margin="normal" value={homeworkTitle} onChange={e => setHomeworkTitle(e.target.value)} />
                 <TextField fullWidth type="number" label="Muddat (Soat)" margin="normal" value={hwDuration} onChange={e => setHwDuration(e.target.value)} />
                 <Button variant="outlined" component="label" fullWidth sx={{ textTransform: "none", mt: 2 }}>
                      {uploadFile ? uploadFile.name : "Qo'shimcha Vazifa Fayli (Ixtiyoriy)"}
                      <input type="file" hidden onChange={e => setUploadFile(e.target.files[0])} />
                 </Button>
             </DialogContent>
             <DialogActions>
                 <Button onClick={() => setOpenHomeworkModal(false)}>Bekor qilish</Button>
                 <Button onClick={handleSaveHomework} variant="contained" sx={{ bgcolor: "#7c3aed" }}>E'lon qilish</Button>
             </DialogActions>
         </Dialog>

         <Dialog open={openCheckModal} onClose={() => setOpenCheckModal(false)} maxWidth="xs" fullWidth>
             <DialogTitle>Baholash</DialogTitle>
             <DialogContent>
                 <Typography sx={{ fontWeight: 600, mb: 2, fontSize: 15 }}>O'quvchi: {gradingResponse?.resp?.student?.fullName}</Typography>
                 <Typography sx={{ mb: 2, fontSize: 13, color: "#3b82f6" }}>Javob xati: {gradingResponse?.resp?.title}</Typography>
                 {gradingResponse?.resp?.file && (
                     <Button size="small" variant="outlined" sx={{ mb: 2 }} href={`http://localhost:5005${gradingResponse.resp.file}`} target="_blank">
                        Faylni Ko'rish
                     </Button>
                 )}
                 <TextField autoFocus fullWidth type="number" label="Ball (0 dan 100 gacha)" margin="normal" value={hwScore} onChange={e => setHwScore(e.target.value)} />
                 <TextField fullWidth label="O'quvchiga izoh" margin="normal" value={hwFeedback} onChange={e => setHwFeedback(e.target.value)} />
             </DialogContent>
             <DialogActions>
                 <Button onClick={() => setOpenCheckModal(false)}>Ortga</Button>
                 <Button onClick={submitGrade} variant="contained" color="error">Baho qoyish (Yopib yuborish)</Button>
             </DialogActions>
         </Dialog>

      </Box>
  );
}
