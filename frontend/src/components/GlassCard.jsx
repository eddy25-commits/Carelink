export default function GlassCard({ children, tight = false, strong = false, className = "", style, ...rest }) {
  const classes = [
    "glass",
    strong ? "glass-strong" : "",
    tight ? "card-tight" : "card",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} style={style} {...rest}>
      {children}
    </div>
  );
}
