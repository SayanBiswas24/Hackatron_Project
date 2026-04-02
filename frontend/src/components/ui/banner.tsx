"use client";
import React, { type HTMLAttributes, useEffect, useState } from "react";
import { cn } from "../../lib/utils";

type BannerVariant = "rainbow" | "normal";

export function Banner({
  id,
  variant = "normal",
  changeLayout = true,
  height = "auto",
  rainbowColors = [
    "rgba(192,255,0,0.56)",
    "rgba(0,240,255,0.56)",
    "rgba(192,255,0,0.73)",
    "rgba(0,240,255,0.66)",
  ],
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  height?: string;
  variant?: BannerVariant;
  rainbowColors?: string[];
  changeLayout?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const globalKey = id ? `nd-banner-${id}` : null;

  useEffect(() => {
    if (globalKey) setOpen(localStorage.getItem(globalKey) !== "true");
  }, [globalKey]);

  if (!open) return null;

  return (
    <div
      id={id}
      {...props}
      className={cn(
        "relative flex flex-col items-center justify-center text-center overflow-hidden",
        variant === "normal" && "bg-transparent",
        variant === "rainbow" && "bg-transparent",
        !open && "hidden",
        props.className,
      )}
      style={{
        height,
      }}
    >
      {changeLayout && open ? (
        <style>
          {globalKey
            ? `:root:not(.${globalKey}) { --fd-banner-height: ${height}; }`
            : `:root { --fd-banner-height: ${height}; }`}
        </style>
      ) : null}
      {globalKey ? (
        <style>{`.${globalKey} #${id} { display: none; }`}</style>
      ) : null}

      {variant === "rainbow"
        ? flow({
            colors: rainbowColors,
          })
        : null}
      <div className="relative z-10 w-full">
        {props.children}
      </div>
    </div>
  );
}

const maskImage =
  "linear-gradient(to bottom,white,transparent), radial-gradient(circle at top center, white, transparent)";

function flow({ colors }: { colors: string[] }) {
  return (
    <>
      <div
        className="absolute inset-0 z-0"
        style={
          {
            maskImage,
            maskComposite: "intersect",
            animation: "fd-moving-banner 20s linear infinite",
            backgroundImage: `repeating-linear-gradient(70deg, ${[...colors, colors[0]].map((color, i) => `${color} ${(i * 50) / colors.length}%`).join(", ")})`,
            backgroundSize: "200% 100%",
            filter: "saturate(2)",
          } as React.CSSProperties
        }
      />
      <style>
        {`@keyframes fd-moving-banner {
            from { background-position: 0% 0;  }
            to { background-position: 100% 0;  }
         }`}
      </style>
    </>
  );
}
