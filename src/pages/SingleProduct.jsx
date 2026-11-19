import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { serverUrl } from "../../config";
import axios from "axios";
import ProductInfo from "../component/ProductInfo";
import Container from "../component/Container";
import { FaStore } from "react-icons/fa";
import Seo from "../component/Seo";
import { absoluteUrl } from "../utils/seoUtils";

const SingleProduct = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mainImage, setMainImage] = useState(null);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, show: false });

  // English Comment: Fetch product data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await axios.get(`${serverUrl}/api/product/single/${id}`);
        if (response?.data?.success) {
          const productData = response.data.product;
          setProduct(productData);
          if (productData.images?.length > 0) setMainImage(productData.images[0]);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
  }, [id]);

  // English Comment: Handle High-End Zoom Logic
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomPos({ x, y, show: true });
  };

  if (loading) return (
    <>
      <Seo title="Loading product | Digital Store" description="Loading product details from Digital Store." path={`/product/${id}`} noindex />
      <Container className="py-20 flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-zinc-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </Container>
    </>
  );

  if (!product) return (
    <>
      <Seo title="Product not found | Digital Store" description="This product is unavailable on Digital Store." path={`/product/${id}`} noindex />
      <div className="text-center py-20">Product not found</div>
    </>
  );

  const seller = product.sellerId && typeof product.sellerId === "object" ? product.sellerId : null;
  const sellerId = seller?._id || product.sellerId;
  const productTitle = `${product.name} | Buy Online at Digital Store`;
  const productDescription = String(product.description || `Shop ${product.name}${product.brand ? ` by ${product.brand}` : ""} on Digital Store.`)
    .replace(/\s+/g, " ").trim().slice(0, 160);
  const productPrice = Number(product.price);
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: productDescription,
    image: (product.images || []).filter(Boolean).slice(0, 10).map((image) => absoluteUrl(image)),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    ...(product.category ? { category: product.category } : {}),
    sku: String(product._id || id),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/product/${id}`),
      priceCurrency: "USD",
      price: Number.isFinite(productPrice) ? productPrice.toFixed(2) : "0.00",
      availability: product.isAvailable !== false && Number(product.stock) > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <>
    <Seo
      title={productTitle}
      description={productDescription}
      path={`/product/${id}`}
      image={product.images?.[0] || "/og-image.png"}
      imageAlt={product.name}
      type="product"
      jsonLd={productSchema}
    />
    <Container className="py-8 md:py-16">
      <div className="flex flex-col lg:flex-row gap-10 lg:gap-20">
        
        {/* Left Side: Professional Gallery with High-End Zoom */}
        <div className="flex flex-col-reverse md:flex-row gap-5 lg:w-[65%]">
          
          {/* Thumbnails */}
          <div className="flex md:flex-col gap-3 shrink-0 overflow-x-auto no-scrollbar md:h-[550px]">
            {product.images?.map((img, index) => (
              <div
                key={index}
                onMouseEnter={() => setMainImage(img)}
                onClick={() => setMainImage(img)}
                className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-300 bg-white p-2 shrink-0 ${
                  mainImage === img ? "border-indigo-600 shadow-xl scale-95" : "border-zinc-100 opacity-60 hover:opacity-100"
                }`}
              >
                <img src={img} alt="thumb" className="w-full h-full object-contain" loading="lazy" />
              </div>
            ))}
          </div>

          {/* Main Image Container with Zoom Feature */}
          <div 
            className="flex-1 bg-white rounded-[2.5rem] overflow-hidden border border-zinc-100 relative cursor-zoom-in group flex items-center justify-center p-8 shadow-sm"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setZoomPos({ ...zoomPos, show: false })}
          >
            <img
              src={mainImage}
              alt={product.name}
              className={`w-full h-[400px] md:h-[550px] object-contain transition-opacity duration-300 ${zoomPos.show ? 'opacity-0' : 'opacity-100'}`} loading="lazy"
            />
            
            {/* High-End Magnifier Overlay */}
            {zoomPos.show && (
              <div 
                className="absolute inset-0 pointer-events-none transition-transform duration-150 ease-out"
                style={{
                  backgroundImage: `url(${mainImage})`,
                  backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                  backgroundSize: '250%', // Premium zoom level
                  backgroundRepeat: 'no-repeat'
                }}
              />
            )}
          </div>
        </div>

        {/* Right Side: Product Details */}
        <div className="lg:w-[35%]">
          <div className="sticky top-32">
            <ProductInfo product={product} />

            {sellerId && (
              <Link
                to={`/store/${sellerId}`}
                className="mt-6 flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-orange-300 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-50 text-orange-600">
                  {seller?.storeLogo || seller?.avatar ? <img src={seller.storeLogo || seller.avatar} alt={seller.storeName || seller.name} className="h-full w-full object-cover" loading="lazy" /> : <FaStore size={20} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Seller Description</p>
                  <p className="truncate font-bold text-zinc-900">{seller?.storeName || seller?.name || "View this seller’s store"}</p>
                </div>
                <span className="text-sm font-black text-orange-600">View →</span>
              </Link>
            )}
            
            {/* Trust Badges */}
            <div className="mt-10 pt-10 border-t border-zinc-100 grid grid-cols-2 gap-6">
              {[
                { icon: "🚚", label: "Global Shipping", sub: "Fast & Tracked" },
                { icon: "🛡️", label: "Pro Warranty", sub: "12 Months" },
                { icon: "🔄", label: "Easy Return", sub: "30-Day Policy" },
                { icon: "🔒", label: "Safe Checkout", sub: "AES-256 Bit" }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <span className="text-2xl mb-1">{item.icon}</span>
                  <p className="text-[13px] font-bold text-zinc-900 leading-none">{item.label}</p>
                  <p className="text-[11px] text-zinc-400 font-medium">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Specifications Table */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <div className="mt-20 lg:mt-32 max-w-5xl">
          <div className="flex items-center gap-4 mb-10">
            <h3 className="text-3xl font-black text-zinc-900 tracking-tight">Technical Specs</h3>
            <div className="h-[2px] flex-1 bg-zinc-100"></div>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-zinc-200/60 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <tbody>
                {Object.entries(product.specifications).map(([key, value], index) => (
                  <tr key={index} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors">
                    <td className="py-5 px-8 font-bold text-zinc-400 text-xs tracking-widest w-1/3 capitalize">
                      {key.replace(/_/g, ' ')}
                    </td>
                    <td className="py-5 px-8 text-zinc-800 font-semibold text-sm">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Container>
    </>
  );
};

export default SingleProduct;
