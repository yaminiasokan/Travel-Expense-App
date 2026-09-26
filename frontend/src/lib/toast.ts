import toast from "react-hot-toast";

const baseStyle = {
  borderRadius: "9999px",
  padding: "10px 18px",
  fontSize: "13px",
  fontWeight: 500,
  boxShadow: "0 8px 24px rgba(27, 36, 48, 0.12)",
};

export const notify = {
  success: (message: string) =>
    toast.success(message, {
      style: { ...baseStyle, background: "#e4efec", color: "#2f6f63" },
      iconTheme: { primary: "#2f6f63", secondary: "#e4efec" },
    }),
  error: (message: string) =>
    toast.error(message, {
      style: { ...baseStyle, background: "#f7e6df", color: "#c1502e" },
      iconTheme: { primary: "#c1502e", secondary: "#f7e6df" },
    }),
  info: (message: string) =>
    toast(message, {
      style: { ...baseStyle, background: "#20242b", color: "#faf7f0" },
    }),
};
