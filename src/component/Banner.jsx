import React, { useState, useEffect, useCallback } from "react";
import { bannerData } from "../constant";
import Container from "../component/Container";
import { useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Banner = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === bannerData.length - 1 ? 0 : prev + 1));
  }, []);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? bannerData.length - 1 : prev - 1));
  };

  useEffect(() => {
    const slideInterval = setInterval(nextSlide, 4000);
    return () => clearInterval(slideInterval);
  }, [nextSlide]);

  return (
    <Container className="py-5">
      <div className="group relative h-[400px] w-full overflow-hidden rounded-3xl border border-zinc-100 shadow-2xl lg:h-[600px]">
        {/* Main Slider Wrapper */}
        <div
          className="flex w-full h-full transition-transform duration-1000 ease-[cubic-bezier(0.7,0,0.3,1)]"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {bannerData?.map((item, index) => (
            <div key={index} className="w-full h-full flex-shrink-0 relative">
              {/* Background Image with subtle zoom effect */}
              <img
                src={item.image}
                alt={item?.title || "Digital Store featured collection"}
                className={`w-full h-full object-cover transition-transform duration-[5000ms] ${
                  currentSlide === index ? "scale-110" : "scale-100"
                }`}
                loading="eager"
                fetchPriority={currentSlide === index ? "high" : "low"}
              />

              {/* Premium Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10 flex items-center">
                <div className="px-8 md:px-16 w-full">
                  <div className="flex flex-col gap-4 md:gap-6 max-w-2xl">
                    {/* Animate-In Content */}
                    <div
                      className={`transition-all duration-1000 delay-300 transform ${
                        currentSlide === index
                          ? "translate-y-0 opacity-100"
                          : "translate-y-10 opacity-0"
                      }`}
                    >
                      <span className="mb-2 inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md md:text-xs">
                        {item?.sale}
                      </span>

                      <h2 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white md:text-7xl">
                        {item?.title}
                      </h2>
                    </div>

                    <div
                      className={`transition-all duration-1000 delay-500 transform ${
                        currentSlide === index
                          ? "translate-y-0 opacity-100"
                          : "translate-y-10 opacity-0"
                      }`}
                    >
                      <p className="mb-1 text-lg font-medium text-zinc-200 md:text-2xl">
                        {item?.discount} —{" "}
                        <span className="font-bold text-orange-300">
                          From {item?.from}
                        </span>
                      </p>

                      <button
                        onClick={() => navigate("/shop")}
                        className="mt-6 w-fit cursor-pointer rounded-full border border-white/15 bg-white px-10 py-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-950 shadow-lg shadow-black/20 transition-all duration-300 hover:bg-orange-500 hover:text-white active:scale-95 md:text-sm"
                      >
                        Explore Collection
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Controls */}
        <div className="absolute inset-x-0 top-1/2 z-20 flex -translate-y-1/2 justify-between px-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <button
            onClick={prevSlide}
            aria-label="Previous featured collection"
            className="cursor-pointer rounded-full border border-white/25 bg-black/20 p-4 text-white backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-black"
          >
            <FaChevronLeft size={20} />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next featured collection"
            className="cursor-pointer rounded-full border border-white/25 bg-black/20 p-4 text-white backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-black"
          >
            <FaChevronRight size={20} />
          </button>
        </div>

        {/* Minimalist Progress Indicators */}
        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-3">
          {bannerData.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`group relative h-1 transition-all duration-500 rounded-full overflow-hidden ${
                currentSlide === index ? "w-12 bg-white/30" : "w-6 bg-white/20"
              }`}
            >
              {currentSlide === index && (
                <div className="absolute inset-0 bg-white origin-left animate-progress"></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </Container>
  );
};

export default Banner;
