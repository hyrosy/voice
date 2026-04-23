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
  // 🚀 NEW: Extracts the clean URL from a pasted iframe embed code
  extractIframeSrc: (input?: string | null) => {
    if (!input) return "";
    const srcMatch = input.match(/src="([^"]+)"/);
    return srcMatch ? srcMatch[1] : input;
  },

  // 🚀 NEW: Generates a bulletproof Google Maps directions link
  getGoogleMapsLink: (addressOrTitle?: string, explicitUrl?: string) => {
    if (explicitUrl) return explicitUrl;
    if (!addressOrTitle) return "#";
    // Official Google Maps Search API format
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      addressOrTitle
    )}`;
  },
};
