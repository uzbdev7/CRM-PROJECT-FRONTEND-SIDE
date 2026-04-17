import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Pagination,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import OpenInFullRoundedIcon from "@mui/icons-material/OpenInFullRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";

import {
  attendanceApi,
  lessonApi,
  lessonVideoApi,
  ratingApi,
  studentApi,
  studentGroupApi,
} from "../../api/apiService.js";
import { API_BASE } from "../../utils/constants.js";
import Rating from "@mui/material/Rating";

const FILE_ROOT = API_BASE.replace(/\/api\/?$/, "");
const ACCENT = "#7c3aed";
const ACCENT_BG = "#f5f3ff";
const SUCCESS = "#10b981";
const SUCCESS_BG = "#ecfdf5";
const BORDER = "#e5e7eb";
const LESSONS_PER_PAGE = 5;
const MAX_HOMEWORK_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_HOMEWORK_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "image/jpeg",
  "image/png",
  "image/gif",
  "text/plain",
];
const ALLOWED_HOMEWORK_EXT = ["pdf", "doc", "docx", "zip", "jpg", "jpeg", "png", "gif", "txt"];
const HOMEWORK_ACCEPT = ".pdf,.doc,.docx,.zip,.jpg,.jpeg,.png,.gif,.txt";

const pad2 = (v) => String(v).padStart(2, "0");

const toDateSafe = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const fmtDate = (value) => {
  const date = toDateSafe(value);
  if (!date) return "—";
  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`;
};

const fmtDateTime = (value) => {
  const date = toDateSafe(value);
  if (!date) return "—";
  return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

const getLessonDate = (lesson) => lesson?.date || lesson?.created_at || lesson?.createdAt;

const formatGroupDuration = (group) => {
  const months = Number(group?.course?.durationMonth || 0);
  const lessons = Number(group?.course?.durationLesson || 0);
  if (!months && !lessons) return "—";
  if (months && lessons) return `${months} oy / ${lessons} dars`;
  if (months) return `${months} oy`;
  return `${lessons} dars`;
};

const sortByDate = (items) =>
  [...items].sort((a, b) => {
    const aDate = toDateSafe(getLessonDate(a))?.getTime() || 0;
    const bDate = toDateSafe(getLessonDate(b))?.getTime() || 0;
    return aDate - bDate;
  });

const normalizePath = (value) =>
  String(value || "").trim().replace(/^[/\\]+/, "").replace(/\\/g, "/");

const buildPathCandidates = (filePath) => {
  if (!filePath) return [];
  if (/^https?:\/\//i.test(filePath)) return [filePath];

  const clean = normalizePath(filePath);
  // Strip leading "api/" if present
  const withoutApi = clean.replace(/^api\//i, "");
  // Strip leading "uploads/" to get bare filename path
  const withoutUploads = withoutApi.replace(/^uploads\//i, "");

  const candidates = [
    // Direct path — works when DB stores "uploads/videos/file.mp4"
    `${FILE_ROOT}/${encodeURI(withoutApi)}`,
    // With /uploads/ prefix — works when DB stores "videos/file.mp4"
    `${FILE_ROOT}/uploads/${encodeURI(withoutUploads)}`,
    // Via API base fallbacks
    `${API_BASE}/${encodeURI(withoutApi)}`,
    `${API_BASE}/uploads/${encodeURI(withoutUploads)}`,
  ];

  return [...new Set(candidates.filter(Boolean))];
};

const buildFileUrl = (path) => {
  const list = buildPathCandidates(path);
  return list[0] || null;
};

const validateHomeworkFile = (file) => {
  if (!file) return "";
  if (file.size > MAX_HOMEWORK_FILE_SIZE) return "Fayl hajmi 20MB dan oshmasligi kerak";

  const mimeOk = ALLOWED_HOMEWORK_MIMES.includes(file.type);
  const ext = file.name?.split(".").pop()?.toLowerCase();
  const extOk = ext ? ALLOWED_HOMEWORK_EXT.includes(ext) : false;

  if (!mimeOk && !extOk) {
    return "Faqat pdf/doc/docx/zip/jpg/png/gif/txt formatlari ruxsat etiladi";
  }

  return "";
};

const countWords = (value) => String(value || "").trim().split(/\s+/).filter(Boolean).length;

export default function StudentGroupsTab({ user }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupLessons, setGroupLessons] = useState([]);
  const [studentHomeworks, setStudentHomeworks] = useState([]);
  const [attendanceByLesson, setAttendanceByLesson] = useState({});

  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoCountByLesson, setVideoCountByLesson] = useState({});
  const [lessonLoading, setLessonLoading] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  const [videoSrcIndex, setVideoSrcIndex] = useState(0);
  const [inlineVideoError, setInlineVideoError] = useState(false);
  const [modalVideoError, setModalVideoError] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [ratingByLesson, setRatingByLesson] = useState({});
  const [pendingVideoModalOpen, setPendingVideoModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [lessonPage, setLessonPage] = useState(1);

  const [homeworkDialogOpen, setHomeworkDialogOpen] = useState(false);
  const [homeworkDialogTarget, setHomeworkDialogTarget] = useState(null);
  const [homeworkTitle, setHomeworkTitle] = useState("");
  const [homeworkFile, setHomeworkFile] = useState(null);
  const [homeworkSubmitting, setHomeworkSubmitting] = useState(false);
  const [homeworkUploadProgress, setHomeworkUploadProgress] = useState(0);
  const [homeworkDialogError, setHomeworkDialogError] = useState("");
  const [homeworkDialogSuccess, setHomeworkDialogSuccess] = useState("");
  const [homeworkDragOver, setHomeworkDragOver] = useState(false);
  const homeworkFileInputRef = useRef(null);

  useEffect(() => {
    studentGroupApi
      .getAllFull()
      .then((res) => {
        const data = res?.data || res || [];
        const currentStudentId = Number(user?.id ?? user?.userId);
        const myGroups = Array.isArray(data)
          ? data
              .filter((sg) => Number(sg.student?.id ?? sg.studentId) === currentStudentId)
              .map((sg) => sg.group)
              .filter(Boolean)
          : [];
        setGroups(myGroups);
      })
      .catch((e) => setError(e.message || "Guruhlarni yuklashda xatolik"))
      .finally(() => setLoading(false));
  }, [user?.id, user?.userId]);

  const selectedLessonHomeworks = useMemo(() => {
    if (!selectedLesson?.id) return [];
    return studentHomeworks.filter((hw) => Number(hw.lesson?.id || hw.lessonId) === Number(selectedLesson.id));
  }, [selectedLesson, studentHomeworks]);

  const openGroup = async (group) => {
    setSelectedGroup(group);
    setSelectedLesson(null);
    setSelectedVideo(null);
    setError("");
    setLessonLoading(true);
    setLessonPage(1);

    setVideoSrcIndex(0);
    setInlineVideoError(false);
    setModalVideoError(false);
    setRatingDialogOpen(false);
    setPendingVideoModalOpen(false);
    setRatingError("");

    try {
      const [lessonRes, homeworkRes, attendanceRes, ratingRes, videoResAll] = await Promise.all([
        lessonApi.getAll().catch(() => ({ data: [] })),
        studentApi.getStudentHomeworks().catch(() => ({ data: [] })),
        attendanceApi.getAll().catch(() => ({ data: [] })),
        ratingApi.getMyRatings().catch(() => ({ data: [] })),
        lessonVideoApi.getAll().catch(() => ({ data: [] })),
      ]);

      const allLessons = lessonRes?.data || lessonRes || [];
      const lessons = Array.isArray(allLessons)
        ? sortByDate(allLessons.filter((lesson) => Number(lesson.groupId) === Number(group.id)))
        : [];

      const allHomeworks = homeworkRes?.data || homeworkRes || [];
      const homeworks = Array.isArray(allHomeworks)
        ? allHomeworks.filter((hw) => Number(hw.lesson?.groupId) === Number(group.id))
        : [];

      const allAttendance = attendanceRes?.data || attendanceRes || [];
      const byLesson = {};
      const currentStudentId = Number(user?.id ?? user?.userId);
      if (Array.isArray(allAttendance)) {
        allAttendance
          .filter((att) => Number(att.studentId) === currentStudentId)
          .forEach((att) => {
            byLesson[att.lessonId] = att;
          });
      }

      const allRatings = ratingRes?.data || ratingRes || [];
      const ratingsMap = {};
      if (Array.isArray(allRatings)) {
        allRatings.forEach((rating) => {
          if (rating?.lessonId) {
            ratingsMap[Number(rating.lessonId)] = Number(rating.score || 0);
          }
        });
      }

      setGroupLessons(lessons);
      setStudentHomeworks(homeworks);
      setAttendanceByLesson(byLesson);
      setRatingByLesson(ratingsMap);

      const allVideos = videoResAll?.data || videoResAll || [];
      const countMap = {};
      if (Array.isArray(allVideos)) {
        allVideos.forEach((video) => {
          const lid = Number(video.lessonId);
          if (!lid) return;
          const belongsToGroup = lessons.some((ls) => Number(ls.id) === lid);
          if (!belongsToGroup) return;
          countMap[lid] = (countMap[lid] || 0) + 1;
        });
      }
      setVideoCountByLesson(countMap);

      if (lessons.length > 0) {
        const firstLesson = lessons[0];
        setSelectedLesson(firstLesson);
        const videoRes = await lessonVideoApi.getByLessonId(firstLesson.id).catch(() => null);
        const videoData = videoRes?.data || videoRes;
        setSelectedVideo(Array.isArray(videoData) ? videoData[0] || null : videoData || null);
      }
    } catch (e) {
      setError(e.message || "Guruh ma'lumotlarini yuklashda xatolik");
    } finally {
      setLessonLoading(false);
    }
  };

  const openLesson = async (lesson) => {
    setSelectedLesson(lesson);
    setSelectedVideo(null);
    setLessonLoading(true);

    setVideoSrcIndex(0);
    setInlineVideoError(false);
    setModalVideoError(false);
    setRatingDialogOpen(false);
    setPendingVideoModalOpen(false);
    setRatingError("");
    setRatingError("");

    try {
      const videoRes = await lessonVideoApi.getByLessonId(lesson.id).catch(() => null);
      const videoData = videoRes?.data || videoRes;
      setSelectedVideo(Array.isArray(videoData) ? videoData[0] || null : videoData || null);
    } catch {
      setSelectedVideo(null);
    } finally {
      setLessonLoading(false);
    }
  };

  const refreshCurrentGroupHomeworks = async () => {
    if (!selectedGroup?.id) return;
    const homeworkRes = await studentApi.getStudentHomeworks().catch(() => ({ data: [] }));
    const allHomeworks = homeworkRes?.data || homeworkRes || [];
    const homeworks = Array.isArray(allHomeworks)
      ? allHomeworks.filter((hw) => Number(hw.lesson?.groupId) === Number(selectedGroup.id))
      : [];
    setStudentHomeworks(homeworks);
  };

  const isLessonRated = (lessonId) => Boolean(ratingByLesson[Number(lessonId)]);
  const activeLessonId = selectedLesson?.id;
  const activeLessonRated = activeLessonId ? isLessonRated(activeLessonId) : false;

  const blurActiveElement = () => {
    if (typeof document === "undefined") return;
    const active = document.activeElement;
    if (active && typeof active.blur === "function") active.blur();
  };

  const openLessonVideo = () => {
    if (!selectedLesson?.id) return;
    if (isLessonRated(selectedLesson.id)) {
      blurActiveElement();
      setPendingVideoModalOpen(false);
      setVideoModalOpen(true);
      return;
    }

    setPendingVideoModalOpen(false);
    setRatingError("Avval video ustidagi yulduzchalarni tanlang.");
  };

  const submitLessonRating = async () => {
    if (!selectedLesson?.id) return;
    if (!ratingScore || ratingScore < 1) {
      setRatingError("Kamida 1 ta yulduz tanlang.");
      return;
    }

    setRatingSubmitting(true);
    setRatingError("");

    try {
      await ratingApi.create({ lessonId: selectedLesson.id, score: ratingScore });
      setRatingByLesson((prev) => ({ ...prev, [Number(selectedLesson.id)]: Number(ratingScore) }));
      setRatingDialogOpen(false);
      if (pendingVideoModalOpen) {
        setVideoModalOpen(true);
      }
      setPendingVideoModalOpen(false);
    } catch (err) {
      setRatingError(err?.message || "Baholashda xatolik");
    } finally {
      setRatingSubmitting(false);
    }
  };

  const openHomeworkDialog = (homework, existingResponse) => {
    blurActiveElement();
    setHomeworkDialogTarget({ homework, existingResponse });
    setHomeworkTitle(existingResponse?.title || homework?.title || "");
    setHomeworkFile(null);
    setHomeworkDialogError("");
    setHomeworkDialogSuccess("");
    setHomeworkUploadProgress(0);
    setHomeworkDragOver(false);
    setHomeworkDialogOpen(true);
  };

  const handleHomeworkFileChange = (file) => {
    const err = validateHomeworkFile(file);
    if (err) {
      setHomeworkDialogError(err);
      setHomeworkFile(null);
      return;
    }
    setHomeworkDialogError("");
    setHomeworkFile(file || null);
  };

  const submitHomeworkResponse = () => {
    const homework = homeworkDialogTarget?.homework;
    const existingResponse = homeworkDialogTarget?.existingResponse;

    if (!homework?.id) {
      setHomeworkDialogError("Uyga vazifa topilmadi");
      return;
    }

    if (!homeworkTitle.trim()) {
      setHomeworkDialogError("Izoh yoki sarlavha kiriting");
      return;
    }

    if (countWords(homeworkTitle) > 100) {
      setHomeworkDialogError("Title/izoh 100 ta so'zdan oshmasligi kerak.");
      return;
    }

    const validationError = validateHomeworkFile(homeworkFile);
    if (validationError) {
      setHomeworkDialogError(validationError);
      return;
    }

    setHomeworkSubmitting(true);
    setHomeworkDialogError("");
    setHomeworkDialogSuccess("");
    setHomeworkUploadProgress(0);

    const fd = new FormData();
    fd.append("title", homeworkTitle.trim());
    if (!existingResponse?.id) {
      fd.append("homeworkId", String(homework.id));
    }
    if (homeworkFile) fd.append("file", homeworkFile);

    const endpoint = existingResponse?.id
      ? `${API_BASE}/homework-response/${existingResponse.id}`
      : `${API_BASE}/homework-response/create`;
    const method = existingResponse?.id ? "PATCH" : "POST";

    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setHomeworkUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = async () => {
      setHomeworkSubmitting(false);
      try {
        const payload = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 200 && xhr.status < 300) {
          setHomeworkDialogSuccess(existingResponse?.id ? "Vazifa yangilandi" : "Vazifa muvaffaqiyatli topshirildi");
          await refreshCurrentGroupHomeworks();
          setTimeout(() => setHomeworkDialogOpen(false), 650);
        } else {
          setHomeworkDialogError(payload?.message || "Vazifa yuborishda xatolik");
        }
      } catch {
        setHomeworkDialogError("Server javobi noto'g'ri formatda keldi");
      }
    };

    xhr.onerror = () => {
      setHomeworkSubmitting(false);
      setHomeworkDialogError("Server bilan bog'lanishda xatolik");
    };

    xhr.open(method, endpoint);
    xhr.send(fd);
  };

  const filteredGroups = groups.filter((group) => {
    const query = search.toLowerCase();
    return group.name?.toLowerCase().includes(query) || group.course?.name?.toLowerCase().includes(query);
  });

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress sx={{ color: ACCENT }} />
      </Box>
    );
  }

  if (!selectedGroup) {
    return (
      <Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", mb: 0.5 }}>
            Guruhlarim
          </Typography>
          <Typography sx={{ color: "#6b7280", fontSize: 14 }}>
            Faqat sizga biriktirilgan guruhlar ko'rinadi.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
          <Box sx={{ p: 2, borderBottom: `1px solid ${BORDER}` }}>
            <TextField
              fullWidth
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Guruh nomi yoki kurs bo'yicha qidirish"
              InputProps={{
                startAdornment: <SearchRoundedIcon sx={{ mr: 1, color: "#9ca3af", fontSize: 20 }} />,
              }}
            />
          </Box>

          {filteredGroups.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center", color: "#9ca3af" }}>Sizga biriktirilgan guruh topilmadi.</Box>
          ) : (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={2}>
                {filteredGroups.map((group, idx) => {
                  const isActive = group.status?.toUpperCase() === "ACTIVE";
                  const tone = [
                    { ring: "rgba(124,58,237,.35)", gradA: "#fbf7ff", gradB: "#f4f8ff", tile: "#f6f3ff" },
                    { ring: "rgba(16,185,129,.35)", gradA: "#f5fffb", gradB: "#f4f8ff", tile: "#f1fcf6" },
                    { ring: "rgba(59,130,246,.35)", gradA: "#f5f9ff", gradB: "#f7f9ff", tile: "#eef6ff" },
                  ][idx % 3];
                  return (
                    <Grid item xs={12} md={6} lg={4} key={group.id}>
                      <Paper
                        elevation={0}
                        onClick={() => openGroup(group)}
                        sx={{
                          p: 2.3,
                          borderRadius: 4,
                          border: `1px solid ${BORDER}`,
                          cursor: "pointer",
                          transition: "all .25s ease",
                          bgcolor: "#fff",
                          background: `linear-gradient(145deg, ${tone.gradA} 0%, ${tone.gradB} 100%)`,
                          position: "relative",
                          overflow: "hidden",
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            inset: "0 0 auto 0",
                            height: 4,
                            background: `linear-gradient(90deg, ${tone.ring}, rgba(255,255,255,0))`,
                          },
                          "&:hover": {
                            borderColor: tone.ring,
                            boxShadow: "0 16px 34px rgba(15,23,42,.12)",
                            transform: "translateY(-4px)",
                          },
                        }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 2 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 0 }}>
                            <Avatar sx={{ bgcolor: tone.tile, color: ACCENT, fontWeight: 700 }}>
                              <GroupsRoundedIcon />
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 700, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {group.name}
                              </Typography>
                              <Typography sx={{ fontSize: 12, color: "#6b7280" }}>
                                {group.course?.name || "Kurs biriktirilmagan"}
                              </Typography>
                            </Box>
                          </Box>

                          <Chip
                            label={isActive ? "Faol" : "Nofaol"}
                            size="small"
                            sx={{
                              bgcolor: isActive ? SUCCESS_BG : "#f3f4f6",
                              color: isActive ? SUCCESS : "#6b7280",
                              fontWeight: 700,
                            }}
                          />
                        </Box>

                        <Grid container spacing={1.2}>
                          <Grid item xs={6}>
                            <Box sx={{ p: 1.2, borderRadius: 2.5, bgcolor: tone.tile, border: `1px solid ${BORDER}` }}>
                              <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>Talabalar</Typography>
                              <Typography sx={{ fontWeight: 700, color: "#111827" }}>{group?._count?.studentGroups ?? "—"}</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ p: 1.2, borderRadius: 2.5, bgcolor: tone.tile, border: `1px solid ${BORDER}` }}>
                              <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>Dars vaqti</Typography>
                              <Typography sx={{ fontWeight: 700, color: "#111827" }}>{group.startTime || "—"}</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ p: 1.2, borderRadius: 2.5, bgcolor: tone.tile, border: `1px solid ${BORDER}` }}>
                              <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>Davomiyligi</Typography>
                              <Typography sx={{ fontWeight: 700, color: "#111827" }}>{formatGroupDuration(group)}</Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ p: 1.2, borderRadius: 2.5, bgcolor: tone.tile, border: `1px solid ${BORDER}` }}>
                              <Typography sx={{ fontSize: 11, color: "#9ca3af" }}>Boshlanish sanasi</Typography>
                              <Typography sx={{ fontWeight: 700, color: "#111827" }}>{fmtDate(group.startDate)}</Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}
        </Paper>
      </Box>
    );
  }

  const lessonCount = groupLessons.length;
  const homeworkCount = studentHomeworks.length;
  const scoredCount = studentHomeworks.filter((hw) => (hw.homeworkResults || []).length > 0).length;
  const totalStudents = Number(selectedGroup?._count?.studentGroups || 0);

  const totalPages = Math.max(1, Math.ceil(groupLessons.length / LESSONS_PER_PAGE));
  const paginatedLessons = groupLessons.slice((lessonPage - 1) * LESSONS_PER_PAGE, lessonPage * LESSONS_PER_PAGE);

  const videoCandidates = buildPathCandidates(selectedVideo?.file);
  const videoUrl = videoCandidates[videoSrcIndex] || videoCandidates[0] || null;
  const hasNextVideoCandidate = videoSrcIndex < videoCandidates.length - 1;

  const selectedAttendance = selectedLesson?.id ? attendanceByLesson[selectedLesson.id] : null;

  const getHomeworkDeadline = (homework) => {
    if (!homework) return null;
    const base = toDateSafe(homework.created_at || homework.createdAt);
    if (!base) return null;
    base.setHours(base.getHours() + Number(homework.durationTime || 16));
    return base;
  };

  const getHomeworkStatusMeta = (homework) => {
    if (!homework) {
      return { label: "Berilmagan", bgcolor: "#6b7280", textColor: "#fff" };
    }

    const result = homework.homeworkResults?.[0] || null;
    const response = homework.homeworkResponses?.[0] || null;

    if (result?.status === "ACCEPTED" || result?.status === "APPROVED") {
      return { label: "Qabul qilingan", bgcolor: "#4caf50", textColor: "#fff" };
    }

    if (result?.status === "CANCELLED" || result?.status === "REJECTED") {
      return { label: "Bekor qilingan", bgcolor: "#ef4444", textColor: "#fff" };
    }

    if (response) {
      return { label: "Tekshiruvda", bgcolor: "#f59e0b", textColor: "#fff" };
    }

    return { label: "Berilmagan", bgcolor: "#6b7280", textColor: "#fff" };
  };

  const lessonStatusRows = groupLessons.map((lesson) => {
    const lessonHomework = studentHomeworks.find((hw) => Number(hw.lesson?.id || hw.lessonId) === Number(lesson.id));
    return {
      lesson,
      homework: lessonHomework || null,
      videoCount: Number(videoCountByLesson[Number(lesson.id)] || 0),
      deadline: getHomeworkDeadline(lessonHomework),
      statusMeta: getHomeworkStatusMeta(lessonHomework),
    };
  });

  const handleVideoSourceError = () => {
    if (hasNextVideoCandidate) {
      setVideoSrcIndex((prev) => prev + 1);
      setInlineVideoError(false);
      setModalVideoError(false);
      setRatingError("");
      return;
    }
    setInlineVideoError(true);
    setModalVideoError(true);
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBackRoundedIcon />}
        onClick={() => setSelectedGroup(null)}
        sx={{ mb: 2, textTransform: "none", transition: "all .2s", "&:hover": { transform: "translateX(-2px)" } }}
      >
        Guruhlarga qaytish
      </Button>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: `1px solid ${BORDER}`,
          mb: 3,
          background: "linear-gradient(145deg, #ffffff 0%, #f8f7ff 100%)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ bgcolor: ACCENT, width: 48, height: 48, fontWeight: 700 }}>
              {selectedGroup.name?.[0] || "G"}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827" }}>{selectedGroup.name}</Typography>
              <Typography sx={{ color: "#6b7280", fontSize: 14 }}>
                Sizning guruhingizdagi darslar, davomat, videolar va uyga vazifalar
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip icon={<SchoolRoundedIcon />} label={selectedGroup.course?.name || "Kurs"} sx={{ bgcolor: "#eff6ff", color: "#2563eb", fontWeight: 700 }} />
            <Chip icon={<GroupsRoundedIcon />} label={`${totalStudents} talaba`} sx={{ bgcolor: "#fef3c7", color: "#92400e", fontWeight: 700 }} />
            <Chip icon={<CalendarMonthRoundedIcon />} label={selectedGroup.startTime || "—"} sx={{ bgcolor: ACCENT_BG, color: ACCENT, fontWeight: 700 }} />
            <Chip label={formatGroupDuration(selectedGroup)} sx={{ bgcolor: "#ecfeff", color: "#0f766e", fontWeight: 700 }} />
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {[
            { label: "Darslar", value: lessonCount, bg: "#fef2f2", color: "#ef4444", Icon: MenuBookRoundedIcon },
            { label: "Uy vazifalar", value: homeworkCount, bg: "#eff6ff", color: "#2563eb", Icon: AssignmentTurnedInRoundedIcon },
            { label: "Ball olgan", value: scoredCount, bg: "#f0fdf4", color: SUCCESS, Icon: StarRoundedIcon },
          ].map((item) => (
            <Grid item xs={12} md={4} key={item.label}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: item.bg, border: `1px solid ${BORDER}` }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box>
                    <Typography sx={{ fontSize: 12, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>
                      {item.label}
                    </Typography>
                    <Typography sx={{ fontSize: 30, fontWeight: 800, color: item.color }}>
                      {item.value}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: "rgba(255,255,255,.75)", color: item.color }}>
                    <item.Icon />
                  </Avatar>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${BORDER}`,
          overflow: "hidden",
          mb: 3,
          bgcolor: "#fff",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1.8fr 1fr 1.2fr", md: "2fr .7fr 1.2fr 1.2fr 1fr" },
            gap: 1,
            px: 2,
            py: 1.7,
            bgcolor: "#f8fafc",
            borderBottom: `1px solid ${BORDER}`,
          }}
        >
          <Typography sx={{ fontWeight: 800, color: "#1f2937" }}>Mavzular</Typography>
          <Typography sx={{ fontWeight: 800, color: "#1f2937" }}>Video</Typography>
          <Typography sx={{ fontWeight: 800, color: "#1f2937" }}>Uyga vazifa holati</Typography>
          <Typography sx={{ display: { xs: "none", md: "block" }, fontWeight: 800, color: "#1f2937" }}>Uyga vazifa tugash vaqti</Typography>
          <Typography sx={{ display: { xs: "none", md: "block" }, fontWeight: 800, color: "#1f2937" }}>Dars sanasi</Typography>
        </Box>

        {lessonStatusRows.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center", color: "#9ca3af" }}>Bu guruhda hali mavzular mavjud emas.</Box>
        ) : (
          <Box>
            {lessonStatusRows.map((row, index) => {
              const isSelected = Number(selectedLesson?.id) === Number(row.lesson.id);
              return (
                <Box
                  key={row.lesson.id}
                  onClick={() => openLesson(row.lesson)}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1.8fr 1fr 1.2fr", md: "2fr .7fr 1.2fr 1.2fr 1fr" },
                    gap: 1,
                    px: 2,
                    py: 1.5,
                    alignItems: "center",
                    cursor: "pointer",
                    bgcolor: isSelected ? ACCENT_BG : "#fff",
                    borderBottom: index < lessonStatusRows.length - 1 ? `1px solid ${BORDER}` : "none",
                    transition: "background-color .2s ease",
                    "&:hover": { bgcolor: "#f9fafb" },
                  }}
                >
                  <Typography sx={{ fontWeight: 700, color: "#111827", pr: 1 }}>{row.lesson.title}</Typography>

                  <Box>
                    {row.videoCount > 0 ? (
                      <Chip
                        size="small"
                        label={row.videoCount}
                        sx={{
                          minWidth: 30,
                          height: 30,
                          borderRadius: "50px",
                          bgcolor: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #93c5fd",
                          fontWeight: 700,
                        }}
                      />
                    ) : (
                      <Typography sx={{ color: "#9ca3af", fontWeight: 600 }}>0</Typography>
                    )}
                  </Box>

                  <Box>
                    <Chip
                      size="small"
                      label={row.statusMeta.label}
                      sx={{
                        bgcolor: row.statusMeta.bgcolor,
                        color: row.statusMeta.textColor,
                        fontWeight: 700,
                        borderRadius: 2,
                      }}
                    />
                  </Box>

                  <Typography sx={{ display: { xs: "none", md: "block" }, color: "#111827", fontWeight: 600 }}>
                    {row.deadline ? fmtDateTime(row.deadline) : "-"}
                  </Typography>

                  <Typography sx={{ display: { xs: "none", md: "block" }, color: "#111827", fontWeight: 600 }}>
                    {fmtDate(getLessonDate(row.lesson))}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
            <Box sx={{ p: 2, borderBottom: `1px solid ${BORDER}` }}>
              <Typography sx={{ fontWeight: 800, color: "#111827" }}>Darslar</Typography>
              <Typography sx={{ fontSize: 12, color: "#6b7280" }}>
                Ro'yxat paginatsiya qilingan, darsni tanlab ichki ma'lumotni ko'ring
              </Typography>
            </Box>

            {lessonLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                <CircularProgress sx={{ color: ACCENT }} />
              </Box>
            ) : groupLessons.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center", color: "#9ca3af" }}>Hali darslar qo'shilmagan.</Box>
            ) : (
              <List disablePadding sx={{ maxHeight: 600, overflowY: "auto" }}>
                {paginatedLessons.map((lesson, index) => {
                  const lessonHomeworks = studentHomeworks.filter((hw) => Number(hw.lesson?.id || hw.lessonId) === Number(lesson.id));
                  const isSelected = Number(selectedLesson?.id) === Number(lesson.id);
                  const attendance = attendanceByLesson[lesson.id];
                  const score = lessonHomeworks?.[0]?.homeworkResults?.[0]?.score;

                  return (
                    <Box key={lesson.id}>
                      <ListItemButton
                        selected={isSelected}
                        onClick={() => openLesson(lesson)}
                        sx={{
                          py: 1.5,
                          px: 2,
                          alignItems: "flex-start",
                          "&.Mui-selected": { bgcolor: ACCENT_BG },
                          "&:hover": { bgcolor: ACCENT_BG },
                        }}
                      >
                        <ListItemText
                          secondaryTypographyProps={{ component: "div" }}
                          primary={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                              <Typography sx={{ fontWeight: 700, color: "#111827", fontSize: 14 }}>
                                {lesson.title}
                              </Typography>
                              {isSelected && <CheckCircleRoundedIcon sx={{ fontSize: 16, color: ACCENT }} />}
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.7 }}>
                              <Typography sx={{ fontSize: 12, color: "#6b7280" }}>
                                {fmtDate(getLessonDate(lesson))}
                              </Typography>
                              <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap" }}>
                                <Chip size="small" icon={<VideocamRoundedIcon />} label="Video" sx={{ height: 24, bgcolor: SUCCESS_BG, color: SUCCESS, fontSize: 11 }} />
                                <Chip size="small" icon={<AssignmentTurnedInRoundedIcon />} label={lessonHomeworks.length ? `${lessonHomeworks.length} vazifa` : "Uy vazifa yo'q"} sx={{ height: 24, bgcolor: lessonHomeworks.length ? "#eff6ff" : "#f3f4f6", color: lessonHomeworks.length ? "#2563eb" : "#6b7280", fontSize: 11 }} />
                                <Chip
                                  size="small"
                                  icon={attendance ? (attendance.isPresent ? <EventAvailableRoundedIcon /> : <EventBusyRoundedIcon />) : <PendingActionsRoundedIcon />}
                                  label={attendance ? (attendance.isPresent ? "Qatnashgan" : "Qatnashmagan") : "Davomat yo'q"}
                                  sx={{
                                    height: 24,
                                    bgcolor: attendance ? (attendance.isPresent ? "#dcfce7" : "#fee2e2") : "#f3f4f6",
                                    color: attendance ? (attendance.isPresent ? "#15803d" : "#dc2626") : "#6b7280",
                                    fontSize: 11,
                                  }}
                                />
                                {typeof score === "number" && (
                                  <Chip size="small" icon={<StarRoundedIcon />} label={`${score} ball`} sx={{ height: 24, bgcolor: "#fefce8", color: "#ca8a04", fontSize: 11, fontWeight: 700 }} />
                                )}
                              </Box>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction sx={{ top: 18 }}>
                          <IconButton edge="end" onClick={() => openLesson(lesson)} sx={{ color: ACCENT }}>
                            <PlayCircleOutlineRoundedIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItemButton>
                      {index < paginatedLessons.length - 1 && <Divider />}
                    </Box>
                  );
                })}
              </List>
            )}

            {groupLessons.length > LESSONS_PER_PAGE && (
              <Box sx={{ p: 1.4, borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "center" }}>
                <Pagination page={lessonPage} count={totalPages} onChange={(_, p) => setLessonPage(p)} size="small" color="primary" />
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${BORDER}`, overflow: "hidden", minHeight: 420 }}>
            {!selectedLesson ? (
              <Box sx={{ p: 4, textAlign: "center", color: "#9ca3af" }}>
                <MenuBookRoundedIcon sx={{ fontSize: 52, mb: 1, color: "#d1d5db" }} />
                <Typography sx={{ fontWeight: 700, color: "#6b7280", mb: 0.5 }}>Darsni tanlang</Typography>
                <Typography sx={{ fontSize: 14 }}>Chap tarafdagi ro'yxatdan bitta darsni tanlang.</Typography>
              </Box>
            ) : (
              <Box sx={{ p: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 3 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: "#111827", mb: 0.5 }}>{selectedLesson.title}</Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      <Chip icon={<CalendarMonthRoundedIcon />} label={fmtDate(getLessonDate(selectedLesson))} sx={{ bgcolor: "#f0fdf4", color: SUCCESS, fontWeight: 700 }} />
                      <Chip icon={<SchoolRoundedIcon />} label={selectedGroup.course?.name || "Kurs"} sx={{ bgcolor: "#eff6ff", color: "#2563eb", fontWeight: 700 }} />
                      <Chip
                        icon={selectedAttendance ? (selectedAttendance.isPresent ? <EventAvailableRoundedIcon /> : <EventBusyRoundedIcon />) : <PendingActionsRoundedIcon />}
                        label={selectedAttendance ? (selectedAttendance.isPresent ? "Davomat: qatnashgan" : "Davomat: qatnashmagan") : "Davomat: ma'lumot yo'q"}
                        sx={{
                          bgcolor: selectedAttendance ? (selectedAttendance.isPresent ? "#dcfce7" : "#fee2e2") : "#f3f4f6",
                          color: selectedAttendance ? (selectedAttendance.isPresent ? "#15803d" : "#dc2626") : "#6b7280",
                          fontWeight: 700,
                        }}
                      />
                    </Box>
                  </Box>

                  <Button
                    startIcon={<OpenInFullRoundedIcon />}
                    variant="outlined"
                    onClick={openLessonVideo}
                    sx={{ textTransform: "none", borderRadius: 2, borderColor: BORDER, color: "#374151" }}
                  >
                    Video katta oynada
                  </Button>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} lg={12}>
                    <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
                      <Box sx={{ p: 2, borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 1 }}>
                        <VideocamRoundedIcon sx={{ color: ACCENT }} />
                        <Typography sx={{ fontWeight: 800, color: "#111827" }}>Video dars</Typography>
                      </Box>

                      {!activeLessonRated ? (
                        <Box sx={{ position: "relative", bgcolor: "#0b1220", width: "100%", minHeight: { xs: 280, md: 460 }, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(5,9,18,.72)", backdropFilter: "blur(1px)" }} />
                          <Box sx={{ position: "relative", zIndex: 1, textAlign: "center", px: 2 }}>
                            <Typography sx={{ fontWeight: 800, color: "#fff", mb: 1 }}>
                              Videoni boshlashdan oldin darsni baholang
                            </Typography>
                            <Typography sx={{ fontSize: 13, color: "#cbd5e1", mb: 1.5 }}>
                              1-5 yulduz tanlang. Bahodan keyin video ochiladi.
                            </Typography>
                            <Rating
                              value={ratingScore}
                              onChange={(_, value) => setRatingScore(value || 0)}
                              precision={1}
                              size="large"
                              sx={{ mb: 1, "& .MuiRating-iconFilled": { color: "#fbbf24" } }}
                            />
                            {ratingError && <Alert severity="error" sx={{ mb: 1.5, textAlign: "left" }}>{ratingError}</Alert>}
                            <Button
                              variant="contained"
                              startIcon={<StarRoundedIcon />}
                              disabled={ratingSubmitting}
                              onClick={submitLessonRating}
                              sx={{ textTransform: "none", borderRadius: 2, bgcolor: ACCENT, boxShadow: "none", "&:hover": { bgcolor: "#6d28d9" } }}
                            >
                              {ratingSubmitting ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Baholab videoni yoqish"}
                            </Button>
                          </Box>
                        </Box>
                      ) : videoUrl && !inlineVideoError ? (
                        <Box sx={{ bgcolor: "#000", width: "100%", minHeight: { xs: 280, md: 460 }, aspectRatio: { xs: "unset", md: "16/9" } }}>
                          <video
                            controls
                            src={videoUrl}
                            onLoadedData={() => setInlineVideoError(false)}
                            onError={handleVideoSourceError}
                            style={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }}
                          />
                        </Box>
                      ) : (
                        <Box sx={{ p: 4, textAlign: "center", bgcolor: "#fafafa" }}>
                          <PlayCircleOutlineRoundedIcon sx={{ fontSize: 56, color: "#d1d5db", mb: 1 }} />
                          <Typography sx={{ fontWeight: 700, color: "#6b7280" }}>Video yuklanmadi yoki mavjud emas</Typography>
                          {videoCandidates.length > 1 && (
                            <Typography sx={{ fontSize: 12, color: "#9ca3af", mt: 0.5 }}>
                              URL sinov: {videoSrcIndex + 1}/{videoCandidates.length}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  <Grid item xs={12} lg={12}>
                    <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${BORDER}`, overflow: "hidden", mb: 3 }}>
                      <Box sx={{ p: 2, borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 1 }}>
                        <AssignmentTurnedInRoundedIcon sx={{ color: "#2563eb" }} />
                        <Typography sx={{ fontWeight: 800, color: "#111827" }}>Uyga vazifalar</Typography>
                      </Box>

                      {selectedLessonHomeworks.length === 0 ? (
                        <Box sx={{ p: 3, textAlign: "center", bgcolor: "#fafafa" }}>
                          <PendingActionsRoundedIcon sx={{ fontSize: 46, color: "#d1d5db", mb: 1 }} />
                          <Typography sx={{ color: "#6b7280", fontWeight: 600 }}>Bu mavzuda uyga vazifa yo'q</Typography>
                        </Box>
                      ) : (
                        <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                          {selectedLessonHomeworks.map((hw) => {
                            const homeworkResponse = hw.homeworkResponses?.[0] || null;
                            const homeworkResult = hw.homeworkResults?.[0] || null;
                            const homeworkDeadline = toDateSafe(hw.created_at || hw.createdAt);
                            if (homeworkDeadline) homeworkDeadline.setHours(homeworkDeadline.getHours() + Number(hw.durationTime || 16));

                            const isAccepted = homeworkResult?.status === "ACCEPTED" || homeworkResult?.status === "APPROVED";
                            const isRejected = homeworkResult?.status === "CANCELLED" || homeworkResult?.status === "REJECTED";

                            const canUpdateResponse = !homeworkDeadline || new Date() <= homeworkDeadline;
                            const taskFileUrl = buildFileUrl(hw.file);
                            const responseFileUrl = buildFileUrl(homeworkResponse?.file);
                            const resultFileUrl = buildFileUrl(homeworkResult?.file);

                            return (
                              <Paper key={hw.id} elevation={0} sx={{ p: 2, borderRadius: 2.5, border: `1px solid ${BORDER}`, bgcolor: homeworkResult ? "#f8fafc" : "#fff" }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 1 }}>
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 800, color: "#111827" }}>{hw.title}</Typography>
                                    <Typography sx={{ fontSize: 12, color: "#6b7280" }}>Berilgan: {fmtDateTime(hw.created_at || hw.createdAt)}</Typography>
                                    <Typography sx={{ fontSize: 12, color: "#6b7280" }}>Tugash vaqti: {fmtDateTime(homeworkDeadline)}</Typography>
                                  </Box>
                                  {typeof homeworkResult?.score === "number" && (
                                    <Chip icon={<StarRoundedIcon />} label={`${homeworkResult.score} ball`} sx={{ bgcolor: "#fefce8", color: "#ca8a04", fontWeight: 800 }} />
                                  )}
                                </Box>

                                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                                  <Chip
                                    size="small"
                                    label={homeworkResponse ? `Topshirildi (${homeworkResponse.status})` : "Hali topshirilmagan"}
                                    icon={homeworkResponse ? <CheckCircleRoundedIcon /> : <PendingActionsRoundedIcon />}
                                    sx={{
                                      bgcolor: homeworkResponse ? SUCCESS_BG : "#fef2f2",
                                      color: homeworkResponse ? SUCCESS : "#ef4444",
                                      fontWeight: 700,
                                    }}
                                  />
                                  <Chip
                                    size="small"
                                    label={
                                      homeworkResult
                                        ? isAccepted
                                          ? "Qabul qilingan"
                                          : isRejected
                                            ? "Vazifa bekor qilindi"
                                            : "Tekshiruvda"
                                        : "Ball kutilmoqda"
                                    }
                                    icon={homeworkResult ? <StarRoundedIcon /> : <PendingActionsRoundedIcon />}
                                    sx={{
                                      bgcolor: homeworkResult ? (isAccepted ? "#dcfce7" : isRejected ? "#fee2e2" : "#eff6ff") : "#f3f4f6",
                                      color: homeworkResult ? (isAccepted ? "#15803d" : isRejected ? "#dc2626" : "#2563eb") : "#6b7280",
                                      fontWeight: 700,
                                    }}
                                  />
                                </Box>

                                {homeworkResult && (
                                  <Paper
                                    elevation={0}
                                    sx={{
                                      mt: 1.5,
                                      p: 1.5,
                                      borderRadius: 2,
                                      border: `1px solid ${isRejected ? "#fecaca" : "#bbf7d0"}`,
                                      bgcolor: isRejected ? "#fff5f5" : "#f0fdf4",
                                    }}
                                  >
                                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap", mb: 1 }}>
                                      <Typography sx={{ fontWeight: 700, color: "#111827" }}>O'qituvchi izohi</Typography>
                                      <Typography sx={{ fontWeight: 800, color: isRejected ? "#dc2626" : "#15803d" }}>
                                        {isRejected ? "Vazifa bekor qilindi" : isAccepted ? "Vazifa qabul qilindi" : "Natija kiritildi"}
                                      </Typography>
                                    </Box>

                                    {homeworkResult.title ? (
                                      <Typography sx={{ color: "#374151", mb: 1 }}>
                                        {isRejected ? "Bekor qilish sababi" : "Izoh"}: {homeworkResult.title}
                                      </Typography>
                                    ) : null}

                                    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                                      <Typography sx={{ color: "#6b7280" }}>
                                        Tekshiruvchi: {homeworkResult.teacher?.full_name || homeworkResult.teacher?.name || "O'qituvchi"}
                                      </Typography>
                                      <Typography sx={{ fontWeight: 800, color: "#111827" }}>
                                        Ball: {typeof homeworkResult.score === "number" ? homeworkResult.score : 0}
                                      </Typography>
                                    </Box>
                                  </Paper>
                                )}

                                {homeworkResponse?.title && (
                                  <Typography sx={{ fontSize: 12, color: "#374151", mt: 1 }}>
                                    Izoh: {homeworkResponse.title}
                                  </Typography>
                                )}

                                {taskFileUrl && (
                                  <Button href={taskFileUrl} target="_blank" rel="noreferrer" startIcon={<OpenInNewRoundedIcon />} variant="outlined" size="small" sx={{ mt: 1.5, textTransform: "none", borderRadius: 2, borderColor: BORDER, color: "#374151" }}>
                                    Vazifa faylini ochish
                                  </Button>
                                )}

                                {responseFileUrl && (
                                  <Button href={responseFileUrl} target="_blank" rel="noreferrer" startIcon={<OpenInNewRoundedIcon />} variant="outlined" size="small" sx={{ mt: 1.5, ml: 1, textTransform: "none", borderRadius: 2, borderColor: "#bbf7d0", color: "#16a34a", bgcolor: "#f0fdf4" }}>
                                    Men yuborgan fayl
                                  </Button>
                                )}

                                {resultFileUrl && (
                                  <Button href={resultFileUrl} target="_blank" rel="noreferrer" startIcon={<OpenInNewRoundedIcon />} variant="outlined" size="small" sx={{ mt: 1.5, ml: 1, textTransform: "none", borderRadius: 2, borderColor: "#bfdbfe", color: "#2563eb", bgcolor: "#eff6ff" }}>
                                    Ustoz fayli
                                  </Button>
                                )}

                                <Button
                                  startIcon={<UploadFileRoundedIcon />}
                                  variant="contained"
                                  size="small"
                                  onClick={() => openHomeworkDialog(hw, homeworkResponse)}
                                  sx={{
                                    mt: 1.5,
                                    ml: 1,
                                    textTransform: "none",
                                    borderRadius: 2,
                                    bgcolor: canUpdateResponse ? ACCENT : "#9ca3af",
                                    boxShadow: "none",
                                    "&:hover": { bgcolor: canUpdateResponse ? "#6d28d9" : "#9ca3af" },
                                  }}
                                  disabled={Boolean(homeworkResponse?.id && !canUpdateResponse)}
                                >
                                  {homeworkResponse?.id ? "Qayta yuklash" : "Vazifani topshirish"}
                                </Button>

                                {homeworkResponse?.id && !canUpdateResponse && (
                                  <Typography sx={{ fontSize: 12, color: "#ef4444", mt: 1 }}>
                                    Deadline tugagan, vazifani yangilab bo'lmaydi.
                                  </Typography>
                                )}
                              </Paper>
                            );
                          })}
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        fullWidth
        maxWidth="xl"
        PaperProps={{ sx: { borderRadius: 3, overflow: "hidden", bgcolor: "#000" } }}
      >
        <DialogTitle sx={{ bgcolor: "#0f172a", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <VideocamRoundedIcon sx={{ color: SUCCESS }} />
            <Typography sx={{ fontWeight: 800 }}>{selectedLesson?.title || "Video"}</Typography>
          </Box>
          <IconButton onClick={() => setVideoModalOpen(false)} sx={{ color: "#fff" }}>
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, bgcolor: "#000" }}>
          <Box sx={{ width: "100%", minHeight: { xs: 320, md: 560 }, height: { xs: "58vh", md: "78vh" }, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {!activeLessonRated ? (
              <Box sx={{ color: "#9ca3af", textAlign: "center", px: 3 }}>
                <StarRoundedIcon sx={{ fontSize: 56, color: "#f59e0b", mb: 1 }} />
                <Typography sx={{ fontWeight: 700, color: "#fff" }}>Videoni ko'rishdan oldin baholang</Typography>
              </Box>
            ) : videoUrl && !modalVideoError ? (
              <video
                controls
                src={videoUrl}
                onLoadedData={() => setModalVideoError(false)}
                onError={handleVideoSourceError}
                style={{ width: "100%", height: "100%", display: "block", objectFit: "contain" }}
              />
            ) : (
              <Box sx={{ color: "#9ca3af", textAlign: "center" }}>
                Video mavjud emas
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog
        open={ratingDialogOpen}
        onClose={() => !ratingSubmitting && setRatingDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Darsni baholang</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#6b7280", fontSize: 14, mb: 2 }}>
            Videoni ko'rish uchun o'qituvchini 5 yulduzgacha baholang.
          </Typography>
          {ratingError && <Alert severity="error" sx={{ mb: 2 }}>{ratingError}</Alert>}
          <Box sx={{ display: "flex", justifyContent: "center", py: 1.5 }}>
            <Rating
              value={ratingScore}
              onChange={(_, value) => setRatingScore(value || 0)}
              precision={1}
              size="large"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRatingDialogOpen(false)} disabled={ratingSubmitting} sx={{ textTransform: "none" }}>
            Bekor qilish
          </Button>
          <Button
            onClick={submitLessonRating}
            disabled={ratingSubmitting}
            variant="contained"
            sx={{ textTransform: "none", bgcolor: ACCENT, boxShadow: "none", "&:hover": { bgcolor: "#6d28d9" } }}
          >
            {ratingSubmitting ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Baholab videoni ochish"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={homeworkDialogOpen}
        onClose={() => !homeworkSubmitting && setHomeworkDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {homeworkDialogTarget?.existingResponse?.id ? "Uyga vazifani yangilash" : "Uyga vazifani topshirish"}
        </DialogTitle>

        <DialogContent>
          {homeworkDialogError && <Alert severity="error" sx={{ mb: 2 }}>{homeworkDialogError}</Alert>}
          {homeworkDialogSuccess && <Alert severity="success" sx={{ mb: 2 }}>{homeworkDialogSuccess}</Alert>}

          <TextField
            fullWidth
            label="Topshiriq sarlavhasi (title)"
            value={homeworkTitle}
            onChange={(e) => setHomeworkTitle(e.target.value)}
            multiline
            minRows={2}
            helperText={`${countWords(homeworkTitle)}/100 so'z`}
            error={countWords(homeworkTitle) > 100}
            InputLabelProps={{
              shrink: true,
              sx: { fontSize: 13 },
            }}
            sx={{
              mb: 2,
              mt: 0.5,
              "& .MuiInputLabel-root.MuiInputLabel-shrink": {
                transform: "translate(14px, -7px) scale(0.85)",
                bgcolor: "#fff",
                px: 0.5,
              },
            }}
          />

          <Box
            onDragOver={(e) => {
              e.preventDefault();
              if (!homeworkSubmitting) setHomeworkDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setHomeworkDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setHomeworkDragOver(false);
              if (homeworkSubmitting) return;
              const dropped = e.dataTransfer?.files?.[0] || null;
              handleHomeworkFileChange(dropped);
            }}
            onClick={() => !homeworkSubmitting && homeworkFileInputRef.current?.click()}
            sx={{
              border: "2px dashed",
              borderColor: homeworkDragOver ? ACCENT : "#d1d5db",
              bgcolor: homeworkDragOver ? "#f5f3ff" : "#fafafa",
              borderRadius: 2,
              p: 2,
              cursor: homeworkSubmitting ? "not-allowed" : "pointer",
              transition: "all .2s",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <UploadFileRoundedIcon sx={{ color: ACCENT }} />
              <Typography sx={{ fontWeight: 600, color: "#374151" }}>
                {homeworkFile ? homeworkFile.name : "Faylni shu yerga tashlang yoki tanlang (ixtiyoriy)"}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 12, color: "#6b7280", mt: 0.8 }}>
              Ruxsat etiladi: PDF, DOC, DOCX, ZIP, JPG, PNG, GIF, TXT. Maksimal: 20MB.
            </Typography>
            <input
              ref={homeworkFileInputRef}
              hidden
              type="file"
              accept={HOMEWORK_ACCEPT}
              onChange={(e) => handleHomeworkFileChange(e.target.files?.[0] || null)}
            />
          </Box>

          {homeworkSubmitting && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.7 }}>
                <Typography sx={{ fontSize: 12, color: "#6b7280" }}>Yuklanmoqda...</Typography>
                <Typography sx={{ fontSize: 12, color: ACCENT, fontWeight: 700 }}>{homeworkUploadProgress}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={homeworkUploadProgress}
                sx={{
                  height: 8,
                  borderRadius: 8,
                  bgcolor: "#ede9fe",
                  "& .MuiLinearProgress-bar": { bgcolor: ACCENT },
                }}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setHomeworkDialogOpen(false)} disabled={homeworkSubmitting}>Bekor</Button>
          <Button
            onClick={submitHomeworkResponse}
            disabled={homeworkSubmitting || !homeworkTitle.trim()}
            variant="contained"
            sx={{ textTransform: "none", borderRadius: 2, bgcolor: ACCENT, boxShadow: "none", "&:hover": { bgcolor: "#6d28d9" } }}
          >
            {homeworkSubmitting ? "Yuborilmoqda..." : "Saqlash"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
