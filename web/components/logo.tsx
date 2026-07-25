export function Logo({
  className = "",
  size = "base",
}: {
  className?: string;
  size?: "base" | "lg";
}) {
  return (
    <span
      className={`font-serif font-semibold leading-none ${
        size === "lg" ? "text-4xl md:text-5xl" : "text-xl"
      } ${className}`}
    >
      <span className="brand-yess">yess</span>
      <span className="brand-job">job</span>
    </span>
  );
}
