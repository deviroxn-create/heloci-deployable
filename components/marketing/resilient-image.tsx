"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type ResilientImageProps = Omit<ImageProps, "src" | "alt"> & {
  src: string;
  alt: string;
};

export function ResilientImage({ src, alt, ...props }: ResilientImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <div className="h-full w-full bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE]" aria-label={alt} role="img" />;
  }

  return <Image src={src} alt={alt} {...props} onError={() => setFailed(true)} />;
}
