import React from "react";
import { cn } from "../../lib/utils";

interface FlippingCardProps {
  className?: string;
  height?: number;
  width?: number;
  frontContent?: React.ReactNode;
  backContent?: React.ReactNode;
}

export function FlippingCard({
  className,
  frontContent,
  backContent,
  height = 450,
  width = 400,
}: FlippingCardProps) {
  return (
    <div
      className="group/flipping-card [perspective:2000px] select-none"
      style={
        {
          "--height": `${height}px`,
          "--width": `${width}px`,
        } as React.CSSProperties
      }
    >
      <div
        className={cn(
          "relative rounded-[2.5rem] border border-white/10 bg-[#111614] shadow-2xl transition-all duration-1000 [transform-style:preserve-3d] group-hover/flipping-card:[transform:rotateY(180deg)]",
          "h-[var(--height)] w-[var(--width)]",
          className
        )}
      >
        {/* Front Face */}
        <div className="absolute inset-0 h-full w-full rounded-[inherit] bg-[#111614] text-white [transform-style:preserve-3d] [backface-visibility:hidden] [transform:rotateY(0deg)] overflow-hidden">
           {/* Background Glow */}
           <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 blur-[80px] rounded-full pointer-events-none" />
           <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/2 blur-[80px] rounded-full pointer-events-none" />
           
           <div className="relative [transform:translateZ(100px)_scale(.9)] h-full w-full flex flex-col items-center justify-center p-8 text-center">
            {frontContent}
          </div>
        </div>

        {/* Back Face */}
        <div className="absolute inset-0 h-full w-full rounded-[inherit] bg-[#141C18] text-white [transform-style:preserve-3d] [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-hidden border border-white/20">
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          
          <div className="relative [transform:translateZ(100px)_scale(.9)] h-full w-full flex flex-col items-center justify-center p-8 text-center">
            {backContent}
          </div>
        </div>
      </div>
    </div>
  );
}
