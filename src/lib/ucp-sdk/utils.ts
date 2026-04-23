export const utils = {
  getYoutubeId: (url: string | null | undefined) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  },

  // 🚀 NEW: Universal Video Detector
  isVideo: (url?: string | null) => {
    if (!url) return false;
    return !!url.match(/\.(mp4|webm|mov)$/i);
  },
  // 🚀 NEW: Strips everything except numbers (great for WhatsApp/Tel links)
  cleanPhoneNumber: (num?: string | null) => {
    if (!num) return "";
    return num.replace(/[^0-9]/g, "");
  },
};
