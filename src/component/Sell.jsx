import React from "react";
import Apple from "../assets/images/apple11.png";
import { Link } from "react-router-dom";
import Banner1 from "../assets/images/banner5.jpg";
import Banner2 from "../assets/images/banner4.jpg";
import Container from "./Container";
import { HiOutlineArrowNarrowRight } from "react-icons/hi"; // Modern arrow icon

const Sell = () => {
  return (
    <Container className="py-16">
      <div className="w-full h-auto lg:h-[650px] flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Main Featured Banner */}
        <div className="w-full lg:w-3/5 h-[400px] lg:h-full group relative overflow-hidden rounded-[2.5rem] shadow-2xl border border-zinc-100">
          <img
            src={Apple}
            alt="Main Promotion"
            className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105" loading="lazy"
          />
          
          {/* Premium Gradient Overlay */}
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-tr from-black/80 via-black/20 to-transparent p-10 md:p-16">
            <div className="flex flex-col gap-4">
              <div className="flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-md">
                <span className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></span>
                Limited Edition
              </div>
              
              <h2 className="text-4xl font-black leading-[1.1] tracking-tighter text-white md:text-6xl">
                Exclusive <br /> 
                <span className="text-orange-600">Smart</span> Deals.
              </h2>
              
              <p className="max-w-sm text-sm font-medium leading-relaxed text-zinc-300 md:text-lg">
                Elevate your lifestyle with our premium phone collection. Performance meets elegance.
              </p>
              
              <Link
                to="/shop"
                className="mt-6 flex w-fit items-center justify-center gap-3 rounded-full bg-white px-10 py-4 text-xs font-bold uppercase tracking-widest text-zinc-950 shadow-xl transition-all duration-500 hover:bg-orange-600 hover:text-white active:scale-95"
              >
                Explore Now <HiOutlineArrowNarrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side: Two Smaller Banners */}
        <div className="w-full lg:w-2/5 flex flex-col gap-8 h-full">
          
          {/* Top Small Banner */}
          <div className="w-full h-[280px] lg:h-1/2 group relative overflow-hidden rounded-[2.5rem] shadow-xl border border-zinc-100">
            <img
              src={Banner1}
              alt="Promotion 1"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" loading="lazy"
            />
            <div className="absolute inset-0 flex items-center bg-gradient-to-r from-black/65 to-transparent p-10">
              <div className="flex flex-col gap-3">
                <h3 className="text-2xl font-black tracking-tight text-white md:text-3xl">Accessory <br/> Essentials</h3>
                <p className="text-sm font-bold uppercase tracking-widest text-orange-300">Up to 20% Off</p>
                <Link
                  to="/shop"
                  className="mt-2 text-white flex items-center gap-2 font-bold text-xs uppercase tracking-widest group/btn"
                >
                  Discover <span className="w-8 h-[1px] bg-white transition-all group-hover/btn:w-12"></span>
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Small Banner */}
          <div className="w-full h-[280px] lg:h-1/2 group relative overflow-hidden rounded-[2.5rem] shadow-xl border border-zinc-100">
            <img
              src={Banner2}
              alt="Promotion 2"
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" loading="lazy"
            />
            <div className="absolute inset-0 flex items-center bg-gradient-to-r from-black/65 to-transparent p-10">
              <div className="flex flex-col gap-3">
                <h3 className="text-2xl font-black tracking-tight text-white md:text-3xl">The New <br/> Standard</h3>
                <p className="text-sm font-medium text-zinc-300">Next-gen tech has arrived.</p>
                <Link
                  to="/shop"
                  className="mt-2 text-white flex items-center gap-2 font-bold text-xs uppercase tracking-widest group/link"
                >
                  Shop Arrival <HiOutlineArrowNarrowRight className="transition-transform group-hover/link:translate-x-2" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Container>
  );
};

export default Sell;
