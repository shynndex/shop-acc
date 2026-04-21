import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Thumbs, Zoom } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductGalleryProps {
  images: string[];
}

export const ProductGallery = ({ images }: ProductGalleryProps) => {
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);

  if (!images.length) return null;

  return (
    <div className="space-y-4">
      {/* Ảnh lớn với navigation arrows */}
      <div className="relative">
        <Swiper
          modules={[Navigation, Thumbs, Zoom]}
          navigation={{
            prevEl: ".swiper-button-prev",
            nextEl: ".swiper-button-next",
          }}
          thumbs={{ swiper: thumbsSwiper }}
          zoom={{ maxRatio: 3 }}
          className="rounded-lg overflow-hidden"
        >
          {images.map((img, idx) => (
            <SwiperSlide key={idx}>
              <img
                src={img}
                alt={`Product ${idx + 1}`}
                className="w-full h-full object-contain aspect-video"
              />
            </SwiperSlide>
          ))}
        </Swiper>

        {images.length > 1 && (
          <>
            <button className="swiper-button-prev absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg z-10">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button className="swiper-button-next absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg z-10">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <Swiper
          onSwiper={setThumbsSwiper}
          spaceBetween={10}
          slidesPerView={4}
          modules={[Thumbs]}
          className="h-20"
        >
          {images.map((img, idx) => (
            <SwiperSlide key={idx}>
              <div className="border-2 border-transparent hover:border-blue-500 rounded overflow-hidden cursor-pointer h-full">
                <img
                  src={img}
                  alt={`thumb-${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
};
