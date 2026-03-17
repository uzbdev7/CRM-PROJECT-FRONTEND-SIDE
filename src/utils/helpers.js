// src/utils/helpers.js

export const getInitials = (name = "") =>
  name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

export const avatarColors = ["#63DAB1","#60A5FA","#F59E0B","#A78BFA","#FB7185","#34D399","#F472B6"];
export const getAvatarColor = (name = "A") => avatarColors[name.charCodeAt(0) % avatarColors.length];

// Logindan keyin qaysi endpointdan foydalanish kerakligini aniqlash
// Frontend login qilishda rolni bilmaydi — shuning uchun ketma-ket urinib ko'radi
export const detectRoleFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role || payload.Role || null;
  } catch {
    return null;
  }
};