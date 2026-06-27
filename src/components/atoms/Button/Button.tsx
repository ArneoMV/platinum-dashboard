"use client";

import styles from "./Button.module.scss";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "solid";
  type?: "button" | "submit" | "reset";
};

export default function Button({
  children,
  onClick,
  variant,
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={[styles.button, variant === "solid" && styles.solid]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}
