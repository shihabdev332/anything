import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { serverUrl } from "../../config";
import Title from "./Title.jsx";
import Product from "./Product.jsx";
import Container from "./Container.jsx";
import ProductSkeleton from "./ProductSkeleton.jsx";

const TopSelling = () => {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["topSellingProducts"],
    queryFn: async () => {
      const { data } = await axios.get(`${serverUrl}/api/product/top-selling`);
      return data?.success ? data.product : [];
    },
    staleTime: 1000 * 60 * 10,
  });

  if (!isLoading && products.length === 0) return null;

  return (
    <Container className="border-t border-zinc-100 py-10 md:py-14">
      <div className="mb-8 flex flex-col items-center text-center sm:mb-10">
        <Title className="text-2xl font-black tracking-tight sm:text-3xl md:text-4xl">Top Selling Products</Title>
        <p className="mt-2 max-w-md text-xs text-zinc-500 sm:text-sm">Our most popular products, ranked by units sold.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-7 2xl:grid-cols-5">
        {isLoading
          ? Array.from({ length: 8 }, (_, index) => <ProductSkeleton key={index} />)
          : products.map((item) => <Product key={item._id} item={item} />)}
      </div>
    </Container>
  );
};

export default TopSelling;
