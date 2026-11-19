import React from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query"; // ✅ React Query ইম্পোর্ট
import { serverUrl } from "../../config";
import Title from "./Title.jsx";
import Product from "./Product.jsx";
import Container from "./Container.jsx";
import { useNavigate } from "react-router-dom";
import ProductSkeleton from "../component/ProductSkeleton";

const PAGE_SIZE = 8;

const Recommended = () => {
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);

  // ✅ React Query ক্যাশিং লজিক
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["recommendedProducts"],
    queryFn: async () => {
      const response = await axios.get(`${serverUrl}/api/product/list`);
      if (response?.data?.success) {
        // ডেটা ফেচ করে শফল এবং স্লাইস করা হচ্ছে
        const data = response.data.product;
        return data.sort(() => 0.5 - Math.random()).slice(0, 16);
      }
      return [];
    },
    staleTime: 1000 * 60 * 10, // ১০ মিনিট পর্যন্ত ডেটা ক্যাশে থাকবে
  });

  return (
    <Container className="border-t border-zinc-100 py-10 md:py-14">
      <div className="mb-8 flex flex-col items-center text-center sm:mb-10">
        <Title className="text-2xl font-black tracking-tight sm:text-3xl md:text-4xl">Recommended For You</Title>
        <p className="mt-2 max-w-md text-xs text-zinc-500 sm:text-sm">
          Explore our top-picked products based on quality and current trends.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-7 2xl:grid-cols-5">
        {isLoading ? (
          // লোডিং অবস্থায় ব্লিঙ্কিং স্কেলিটন দেখাবে
          Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))
        ) : (
          // ক্যাশ থেকে বা সার্ভার থেকে আসা ডেটা দেখাবে
          products.slice(0, visibleCount).map((item) => (
            <Product key={item._id} item={item} />
          ))
        )}
      </div>
      
      {/* View All Button */}
      {!isLoading && products.length > 0 && (
        <div className="mt-9 flex justify-center sm:mt-10">
          <div className="flex flex-wrap justify-center gap-3">
            {visibleCount < products.length && (
              <button
                onClick={() => setVisibleCount((count) => Math.min(count + PAGE_SIZE, products.length))}
                className="cursor-pointer rounded-full bg-zinc-900 px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-white shadow-md transition-all duration-300 hover:bg-orange-600 active:scale-95 sm:px-9 sm:py-3.5 sm:text-xs"
              >
                More Products
              </button>
            )}
            <button
              onClick={() => navigate("/shop")}
              className="cursor-pointer rounded-full border border-zinc-300 px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-900 transition-all duration-300 hover:border-orange-600 hover:text-orange-600 active:scale-95 sm:px-9 sm:py-3.5 sm:text-xs"
            >
              Visit Shop
            </button>
          </div>
        </div>
      )}
    </Container>
  );
};

export default Recommended;
