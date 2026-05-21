import { Toaster as Sonner, type ToasterProps } from "sonner";
const Toaster = ({ ...props }: ToasterProps) => {
  // next-themes 대신 document.documentElement class 직접 감지
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const theme = isDark ? "dark" : "light";

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
