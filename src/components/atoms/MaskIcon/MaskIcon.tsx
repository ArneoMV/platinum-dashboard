import styles from "./MaskIcon.module.scss";

type MaskIconProps = {
  /** File name (without extension) under /public/images/icons/. */
  name: string;
  className?: string;
  size?: number;
};

// The provided SVGs have a hardcoded black fill, so we render them as a CSS
// mask over `currentColor` — the icon then takes the element's text color,
// letting us tint it (muted / ocean accent) via SCSS.
export default function MaskIcon({ name, className, size = 20 }: MaskIconProps) {
  const url = `/images/icons/${name}.svg`;
  return (
    <span
      className={[styles.icon, className].filter(Boolean).join(" ")}
      style={{
        WebkitMaskImage: `url("${url}")`,
        maskImage: `url("${url}")`,
        width: size,
        height: size,
      }}
      aria-hidden="true"
    />
  );
}
