import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft, FaSearch, FaStore, FaUserCircle } from "react-icons/fa";
import { serverUrl } from "../../config";
import Container from "../component/Container";
import Product from "../component/Product";
import Seo from "../component/Seo";
import { absoluteUrl } from "../utils/seoUtils";

const SellerStore = () => {
  const { sellerId } = useParams();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    const fetchStore = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const { data } = await axios.get(`${serverUrl}/api/product/store/${sellerId}`);
        if (!active) return;
        if (data?.success) {
          setSeller(data.seller);
          setProducts(data.products || []);
        } else {
          setNotFound(true);
        }
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchStore();
    window.scrollTo(0, 0);
    return () => { active = false; };
  }, [sellerId]);

  const visibleProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((item) => [item.name, item.category, item.brand, item.description]
      .some((value) => String(value || "").toLowerCase().includes(normalized)));
  }, [products, query]);

  const storeName = seller?.storeName || seller?.name || "Seller store";
  const storeDescription = seller?.storeDescription || `Browse ${products.length} products from ${storeName} on Digital Store.`;
  const storeSchema = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "Store",
    name: storeName,
    description: storeDescription.slice(0, 500),
    url: absoluteUrl(`/store/${sellerId}`),
    ...(seller?.storeLogo || seller?.avatar ? { image: absoluteUrl(seller.storeLogo || seller.avatar) } : {}),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${storeName} products`,
      itemListElement: products.slice(0, 20).map((item) => ({
        "@type": "Offer",
        price: Number.isFinite(Number(item.price)) ? Number(item.price).toFixed(2) : "0.00",
        priceCurrency: "USD",
        availability: item.isAvailable !== false && Number(item.stock) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        itemOffered: {
          "@type": "Product",
          name: item.name,
          url: absoluteUrl(`/product/${item._id}`),
          ...(item.images?.[0] ? { image: absoluteUrl(item.images[0]) } : {}),
        },
      })),
    },
  }), [storeName, storeDescription, seller?.storeLogo, seller?.avatar, products, sellerId]);

  if (loading) {
    return <><Seo title="Loading seller store | Digital Store" description="Loading seller store on Digital Store." path={`/store/${sellerId}`} noindex /><Container className="py-24 text-center text-sm font-semibold text-zinc-500">Loading seller store…</Container></>;
  }

  if (notFound || !seller) {
    return (
      <>
      <Seo title="Seller store not found | Digital Store" description="This seller store is unavailable on Digital Store." path={`/store/${sellerId}`} noindex />
      <Container className="py-24 text-center">
        <h1 className="text-3xl font-black text-zinc-900">Seller not found</h1>
        <Link to="/shop" className="mt-5 inline-flex rounded-xl bg-zinc-900 px-5 py-3 text-sm font-bold text-white">Back to shop</Link>
      </Container>
      </>
    );
  }

  return (
    <>
    <Seo
      title={`${storeName} | Seller Store on Digital Store`}
      description={storeDescription.replace(/\s+/g, " ").trim().slice(0, 160)}
      path={`/store/${sellerId}`}
      image={seller.storeBanner || seller.storeLogo || seller.avatar || "/og-image.png"}
      imageAlt={`${storeName} seller storefront`}
      jsonLd={storeSchema}
    />
    <main className="min-h-screen bg-[#f7f7f8] pb-16">
      <section className="relative isolate overflow-hidden bg-zinc-950">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-700 via-zinc-900 to-zinc-950" />
        {seller.storeBanner && <img src={seller.storeBanner} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45" loading="lazy" />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-zinc-950/95 via-zinc-950/75 to-zinc-950/30" />
        <Container className="py-10 sm:py-14 lg:py-20">
          <Link to="/shop" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-4 py-2 text-xs font-semibold text-white/80 backdrop-blur transition hover:bg-white/10 hover:text-white"><FaArrowLeft size={11} /> All stores</Link>
          <div className="mt-10 flex flex-col gap-7 sm:flex-row sm:items-end">
            <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-[1.8rem] border border-white/30 bg-white/10 text-white shadow-2xl shadow-black/30 backdrop-blur sm:h-28 sm:w-28">
              {seller.storeLogo || seller.avatar ? <img src={seller.storeLogo || seller.avatar} alt={seller.storeName || seller.name} className="h-full w-full object-cover" loading="lazy" /> : <FaUserCircle size={56} />}
            </div>
            <div className="min-w-0 flex-1 text-white">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-300/30 bg-orange-500/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-100"><FaStore size={11} /> Official seller store</div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">{seller.storeName || seller.name}</h1>
              {seller.storeDescription ? <p className="mt-3 max-w-2xl whitespace-pre-line text-sm leading-6 text-white/75 sm:text-base">{seller.storeDescription}</p> : <p className="mt-3 text-sm text-white/65">Curated products, selected with care.</p>}
            </div>
            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white backdrop-blur">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-orange-200"><FaStore /></span>
              <div><p className="text-[10px] font-semibold uppercase tracking-widest text-white/55">In this store</p><p className="mt-0.5 text-lg font-black">{products.length} products</p></div>
            </div>
          </div>
        </Container>
      </section>

      <Container className="pt-10 md:pt-14">
        <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">Shop the collection</p><h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">From {seller.storeName || seller.name}</h2><p className="mt-1 text-sm text-zinc-500">Explore products from this seller.</p></div>
          <label className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-400 shadow-sm sm:max-w-xs"><FaSearch size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this store" className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400" /></label>
        </div>

        {visibleProducts.length ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-4 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 lg:gap-7 2xl:grid-cols-5">
            {visibleProducts.map((item) => <Product key={item._id} item={item} />)}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-zinc-200 bg-white px-6 py-20 text-center shadow-sm">
            <FaStore className="mx-auto text-3xl text-zinc-300" />
            <h2 className="mt-4 text-xl font-black text-zinc-900">{query ? "No matching products" : "No products listed yet"}</h2>
            <p className="mt-2 text-sm text-zinc-500">{query ? "Try a different product name or category." : "This seller has no products available in the store."}</p>
          </div>
        )}
      </Container>
    </main>
    </>
  );
};

export default SellerStore;
