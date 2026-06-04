import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Thumbs, Zoom, EffectFade } from "swiper/modules";
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
          modules={[Navigation, Thumbs, Zoom, EffectFade]}
          navigation={{
            prevEl: ".swiper-button-prev",
            nextEl: ".swiper-button-next",
          }}
          thumbs={{ swiper: thumbsSwiper }}
          zoom={{ maxRatio: 3 }}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          speed={400}
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
            <button className="swiper-button-prev absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background/95 p-1.5 sm:p-2 rounded-full shadow-lg z-10 transition-all duration-200 hover:scale-110 active:scale-95 text-foreground">
              <ChevronLeft className="size-4 sm:size-5" />
            </button>
            <button className="swiper-button-next absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background/95 p-1.5 sm:p-2 rounded-full shadow-lg z-10 transition-all duration-200 hover:scale-110 active:scale-95 text-foreground">
              <ChevronRight className="size-4 sm:size-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <Swiper
          onSwiper={setThumbsSwiper}
          spaceBetween={8}
          slidesPerView={3}
          breakpoints={{
            480: { slidesPerView: 4, spaceBetween: 10 },
          }}
          modules={[Thumbs]}
          className="h-16 sm:h-20"
        >
          {images.map((img, idx) => (
            <SwiperSlide key={idx}>
              <div className="border-2 border-transparent hover:border-blue-500 rounded overflow-hidden cursor-pointer h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <img
                  src={img}
                  alt={`thumb-${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
};
