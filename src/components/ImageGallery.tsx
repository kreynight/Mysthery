"use client";

import Image from "next/image";
import { useState } from "react";

interface ImageGalleryProps {
  images: string[];
  name: string;
}

export default function ImageGallery({ images, name }: ImageGalleryProps) {
  const [selected, setSelected] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-stone-200/50 flex items-center justify-center text-stone-300 text-8xl font-light">
        ?
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-square bg-stone-200/50 overflow-hidden mb-3">
        <Image
          src={images[selected]}
          alt={`${name} - image ${selected + 1}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-6 gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`relative aspect-square bg-stone-200/50 overflow-hidden border-2 transition-colors ${
                i === selected ? "border-[#3d4a3a]" : "border-transparent"
              }`}
            >
              <Image
                src={img}
                alt={`${name} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
