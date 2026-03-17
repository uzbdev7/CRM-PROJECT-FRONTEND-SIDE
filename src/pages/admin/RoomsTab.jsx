
// src/pages/admin/RoomsTab.jsx

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Tooltip,
  Button,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MeetingRoomRoundedIcon from "@mui/icons-material/MeetingRoomRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";

import { roomApi } from "../../api/apiService";

const ACCENT = "#7c3aed";

const EMPTY_FORM = {
  name: "",
  capacity: "",
  status: "ACTIVE"
};

export default function RoomsTab() {

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");

  const [delId, setDelId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await roomApi.getAll();
      setRooms(Array.isArray(data) ? data : data.data || []);
    } catch (e) {
      setError(e.message);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setDrawerOpen(true);
  };

  const openEdit = (room) => {
    setEditId(room.id);

    setForm({
      name: room.name,
      capacity: room.capacity,
      status: room.status
    });

    setDrawerOpen(true);
  };

  const handleClose = () => {
    setDrawerOpen(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {

    if (!form.name.trim()) {
      setFormErr("Xona nomi majburiy");
      return;
    }

    if (!form.capacity || Number(form.capacity) <= 0) {
      setFormErr("Sig'im noto'g'ri");
      return;
    }

    setSaving(true);
    setFormErr("");

    try {

      const body = {
        name: form.name,
        capacity: Number(form.capacity),
        status: form.status
      };

      if (editId) {

        await roomApi.update(editId, body);

      } else {

        const res = await roomApi.create(body);
        const newRoom = res?.data || res;
        setRooms((p) => [newRoom, ...p]);

      }

      await load();

      handleClose();

    } catch (e) {

      setFormErr(e.message);

    }

    setSaving(false);
  };

  const handleDelete = async () => {

    setDeleting(true);

    try {

      await roomApi.delete(delId);

      setRooms((p) => p.filter((r) => r.id !== delId));

      setDelId(null);

    } catch (e) {

      setError(e.message);

    }

    setDeleting(false);
  };

  const filtered = rooms.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>

      {/* HEADER */}

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>

        <Box>

          <Typography sx={{ fontWeight: 700, fontSize: 22, color:"#374151" }}>
            Xonalar
          </Typography>

          <Typography sx={{ fontSize: 13, color: "#374151" }}>
            {rooms.length} ta xona
          </Typography>

        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>

          <Tooltip title="Yangilash">
            <IconButton onClick={load}>
              <RefreshRoundedIcon />
            </IconButton>
          </Tooltip>

          <Button
            onClick={openCreate}
            variant="contained"
            startIcon={<AddRoundedIcon />}
            sx={{
              bgcolor: ACCENT,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700
            }}
          >
            Xona qo'shish
          </Button>

        </Box>

      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* SEARCH */}

      <TextField
        fullWidth
        size="small"
        placeholder="Xona qidirish..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon />
            </InputAdornment>
          )
        }}
        sx={{ mb: 3 }}
      />

      {/* ROOMS GRID */}

      {loading ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              md: "1fr 1fr 1fr"
            },
            gap: 2
          }}
        >

         {filtered.map((room) => (

          <Box
          key={room.id}
          sx={{
            p: 3,
            borderRadius: 4,
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            position: "relative",
            transition: "0.25s",

            "&:hover": {
              transform: "translateY(-6px)",
              boxShadow: "0 12px 30px rgba(0,0,0,0.12)"
            }
          }}
          >

          {/* ACTIONS */}

          <Box
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            display: "flex",
            gap: 1,

          }}
          >

          <IconButton
          size="small"
          onClick={() => openEdit(room)}
          sx={{
            bgcolor: "#f5f3ff",
            "&:hover": { bgcolor: "#ede9fe" }
          }}
          >
          <EditRoundedIcon sx={{ fontSize: 18, color: "#7c3aed" }}/>
          </IconButton>

          <IconButton
          size="small"
          onClick={() => setDelId(room.id)}
          sx={{
            bgcolor: "#fef2f2",
            "&:hover": { bgcolor: "#fee2e2" }
          }}
          >
          <DeleteRoundedIcon sx={{ fontSize: 18, color: "#ef4444" }}/>
          </IconButton>

          </Box>

          {/* ICON */}

          <Avatar
          sx={{
            width: 56,
            height: 56,
            bgcolor: "#f3e8ff",
            color: "#7c3aed",
            mb: 2
          }}
          >
          <MeetingRoomRoundedIcon sx={{ fontSize: 28 }}/>
          </Avatar>

          {/* ROOM NAME */}

          <Typography
          sx={{
            fontWeight: 800,
            fontSize: 18,
            color: "#111827"
          }}
          >
          {room.name}
          </Typography>

          {/* CAPACITY */}

          <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mt: 1
          }}
          >

          <PeopleAltRoundedIcon sx={{ fontSize: 18, color: "#6b7280" }}/>

          <Typography
          sx={{
            fontSize: 14,
            color: "#374151",
            fontWeight: 500
          }}
          >
          {room.capacity} kishi
          </Typography>

          </Box>

          {/* STATUS */}

          <Box sx={{ mt: 2 }}>

          <Chip
          label={room.status === "ACTIVE" ? "Faol" : "Nofaol"}
          size="small"
          sx={{
            bgcolor:
              room.status === "ACTIVE"
                ? "#dcfce7"
                : "#fee2e2",

            color:
              room.status === "ACTIVE"
                ? "#16a34a"
                : "#dc2626",

            fontWeight: 700
          }}
          />

          </Box>

          </Box>

          ))}

        </Box>

      )}

      {/* DRAWER */}

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 420 }
          }
        }}
      >

        <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>

            <Typography sx={{ fontWeight: 700 }}>
              {editId ? "Xonani tahrirlash" : "Yangi xona"}
            </Typography>

            <IconButton onClick={handleClose}>
              <CloseRoundedIcon />
            </IconButton>

          </Box>

          {formErr && (
            <Alert severity="error">
              {formErr}
            </Alert>
          )}

          <TextField
            label="Xona nomi"
            value={form.name}
            onChange={(e) =>
              setForm((p) => ({ ...p, name: e.target.value }))
            }
          />

          <TextField
            label="Sig'imi"
            type="number"
            value={form.capacity}
            onChange={(e) =>
              setForm((p) => ({ ...p, capacity: e.target.value }))
            }
          />

          <FormControl>

            <InputLabel>Status</InputLabel>

            <Select
              value={form.status}
              label="Status"
              onChange={(e) =>
                setForm((p) => ({ ...p, status: e.target.value }))
              }
            >

              <MenuItem value="ACTIVE">Faol</MenuItem>
              <MenuItem value="INACTIVE">Nofaol</MenuItem>

            </Select>

          </FormControl>

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{ bgcolor: ACCENT }}
          >
            {saving ? <CircularProgress size={18} /> : "Saqlash"}
          </Button>

        </Box>

      </Drawer>

      {/* DELETE DIALOG */}

      <Dialog open={!!delId} onClose={() => setDelId(null)}>

        <DialogTitle>
          O'chirishni tasdiqlang
        </DialogTitle>

        <DialogContent>
          Bu xonani o'chirmoqchimisiz?
        </DialogContent>

        <DialogActions>

          <Button onClick={() => setDelId(null)}>
            Bekor
          </Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
          >
            O'chirish
          </Button>

        </DialogActions>

      </Dialog>

    </Box>
  );
}