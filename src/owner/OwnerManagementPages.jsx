import { useEffect, useRef, useState } from "react";
import { Fragment } from "react";
import { useSearchParams } from "react-router-dom";
import { Boxes, ChevronDown, ChevronRight, Search, Users } from "lucide-react";
import axios from "axios";
import { serverUrl } from "../../config";

const formatMoney = (value) => Number(value || 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const dateLabel = (value) => value ? new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "Date unavailable";
const panelClass = "rounded-2xl border border-[#243451] bg-[#10182B] shadow-[0_14px_45px_rgba(0,0,0,0.12)]";

const ErrorMessage = ({ error, onRetry }) => error ? (
  <div role="alert" className="flex flex-col gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] px-4 py-3 text-sm text-rose-100 sm:flex-row sm:items-center sm:justify-between">
    <span>{error}</span>
    <button type="button" onClick={onRetry} className="w-fit rounded-lg border border-rose-200/20 px-3 py-1.5 text-xs font-semibold hover:bg-rose-200/10">Retry</button>
  </div>
) : null;

const SearchBox = ({ value, onChange, placeholder }) => (
  <label className="relative block w-full sm:w-72">
    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9AAAC4]" />
    <input type="search" value={value} onChange={(event) => onChange(event.target.value.slice(0, 80))} placeholder={placeholder} className="w-full rounded-xl border border-[#243451] bg-[#080B18] py-2.5 pl-9 pr-3 text-xs text-[#F8FAFC] outline-none placeholder:text-[#9AAAC4] focus:border-[#6D4AFF]/50" />
  </label>
);

const PageHeading = ({ eyebrow, title, detail, count }) => (
  <header>
    <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#9675FF]">{eyebrow}</p>
    <div className="mt-1 flex flex-wrap items-center gap-3">
      <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC] sm:text-3xl">{title}</h1>
      {count !== undefined && <span className="rounded-full border border-[#243451] bg-[#243451]/40 px-2.5 py-1 text-[10px] font-semibold text-[#9AAAC4]">{count}</span>}
    </div>
    <p className="mt-2 text-sm text-[#9AAAC4]">{detail}</p>
  </header>
);

const useDebounced = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value.trim()), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

const OrdersPage = ({ token }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [searchText, setSearchText] = useState(initialSearch);
  const [status, setStatus] = useState("all");
  const search = useDebounced(searchText);
  const [orders, setOrders] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedId, setExpandedId] = useState("");
  const latestSearch = useRef(search);
  const pageRequestRef = useRef(0);
  latestSearch.current = search;

  useEffect(() => {
    pageRequestRef.current += 1;
    setSearchParams(search ? { search } : {}, { replace: true });
  }, [search, setSearchParams]);

  useEffect(() => {
    const requestId = ++pageRequestRef.current;
    const controller = new AbortController();
    setOrders([]);
    setCursor(null);
    setHasMore(false);
    setLoading(true);
    setError("");
    axios.get(`${serverUrl}/api/owner/orders`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 20, search, status },
      signal: controller.signal,
      timeout: 12000,
    }).then(({ data }) => {
      if (pageRequestRef.current !== requestId) return;
      if (!data?.success) throw new Error(data?.message || "Could not load orders");
      setOrders(data.orders || []);
      setCursor(data.nextCursor || null);
      setHasMore(Boolean(data.hasMore));
    }).catch((requestError) => {
      if (pageRequestRef.current !== requestId) return;
      if (requestError.name === "CanceledError" || requestError.code === "ERR_CANCELED") return;
      setError(requestError.response?.data?.message || requestError.message || "Could not load orders");
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [token, search, status, refreshKey]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    const requestedSearch = search;
    const requestedStatus = status;
    const requestId = pageRequestRef.current;
    setLoadingMore(true);
    setError("");
    try {
      const { data } = await axios.get(`${serverUrl}/api/owner/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 20, cursor, search: requestedSearch, status },
      });
      if (pageRequestRef.current !== requestId || latestSearch.current !== requestedSearch || status !== requestedStatus) return;
      if (!data?.success) throw new Error(data?.message || "Could not load more orders");
      setOrders((current) => [...current, ...(data.orders || [])]);
      setCursor(data.nextCursor || null);
      setHasMore(Boolean(data.hasMore));
    } catch (requestError) {
      if (pageRequestRef.current !== requestId || latestSearch.current !== requestedSearch || status !== requestedStatus) return;
      setError(requestError.response?.data?.message || requestError.message || "Could not load more orders");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section className="space-y-5 text-[#F8FAFC]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeading eyebrow="Marketplace · Sales" title="Orders" detail="Browse orders with status, item and stored order value. Payment is cash on delivery." />
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchBox value={searchText} onChange={setSearchText} placeholder="Search full order ID" />
          <label className="relative">
            <span className="sr-only">Filter by order status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="w-full appearance-none rounded-xl border border-[#243451] bg-[#080B18] py-2.5 pl-3 pr-8 text-xs font-semibold text-[#F8FAFC] outline-none focus:border-[#6D4AFF] sm:w-44">
              {["all", "Pending", "Order Placed", "Processing", "Shipped", "Delivered", "Cancelled"].map((item) => <option key={item} value={item}>{item === "all" ? "All statuses" : item}</option>)}
            </select><ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9AAAC4]" />
          </label>
        </div>
      </div>
      <ErrorMessage error={error} onRetry={() => setRefreshKey((value) => value + 1)} />
      <div className={`${panelClass} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b border-[#243451] bg-[#243451]/35 text-[10px] uppercase tracking-wider text-[#9AAAC4]"><tr><th className="px-5 py-4 font-semibold">Order</th><th className="px-5 py-4 font-semibold">Customer</th><th className="px-5 py-4 font-semibold">Items</th><th className="px-5 py-4 font-semibold">Date</th><th className="px-5 py-4 font-semibold">Payment</th><th className="px-5 py-4 text-right font-semibold">Order value</th><th className="px-5 py-4 text-right font-semibold">Status</th></tr></thead>
            <tbody className="divide-y divide-[#243451]/70">
              {orders.map((order) => (
                <Fragment key={order._id}>
                  <tr className="hover:bg-[#243451]/35">
                    <td className="px-5 py-4"><button type="button" onClick={() => setExpandedId((value) => value === order._id ? "" : order._id)} className="inline-flex items-center gap-2 font-mono font-semibold text-[#34D399] hover:text-[#9675FF]"><ChevronRight size={14} className={`transition ${expandedId === order._id ? "rotate-90" : ""}`} />#{String(order._id).slice(-8).toUpperCase()}</button></td>
                    <td className="px-5 py-4 font-medium text-[#F8FAFC]">{order.customerName}</td>
                    <td className="px-5 py-4 text-[#9AAAC4]">{order.itemCount} item{order.itemCount === 1 ? "" : "s"}</td>
                    <td className="px-5 py-4 text-[#9AAAC4]">{dateLabel(order.createdAt)}</td>
                    <td className="px-5 py-4 text-[#9AAAC4]">{order.paymentMethod}</td>
                    <td className="px-5 py-4 text-right font-semibold tabular-nums text-[#F8FAFC]">{formatMoney(order.orderValue)}</td>
                    <td className="px-5 py-4 text-right"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${order.status === "Delivered" ? "bg-[#34D399]/10 text-[#34D399]" : order.status === "Cancelled" ? "bg-rose-400/10 text-rose-300" : "bg-[#FBBF24]/10 text-[#FBBF24]"}`}>{order.status}</span></td>
                  </tr>
                  {expandedId === order._id && <tr className="bg-[#080B18]/60"><td colSpan="7" className="px-12 py-3"><div className="flex flex-wrap gap-2">{order.products?.map((line, index) => <span key={`${line.name}-${index}`} className="rounded-lg border border-[#243451] bg-[#243451]/30 px-2.5 py-1.5 text-[10px] text-[#9AAAC4]">{line.name} × {line.quantity} · {line.sellerStatus}</span>)}</div></td></tr>}
                </Fragment>
              ))}
              {!loading && orders.length === 0 && <tr><td colSpan="7" className="px-5 py-14 text-center text-sm text-[#9AAAC4]">{search ? "No order matches this ID." : "No orders match this filter."}</td></tr>}
              {loading && <tr><td colSpan="7" className="px-5 py-14 text-center text-sm text-[#9AAAC4]">Loading orders…</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-[#243451]/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-[11px] text-[#9AAAC4]">Showing {orders.length} order{orders.length === 1 ? "" : "s"}. Order values exclude cancelled order lines.</p>{hasMore && <button type="button" onClick={loadMore} disabled={loading || loadingMore} className="rounded-xl bg-[#6D4AFF] px-4 py-2 text-xs font-semibold text-[#F8FAFC] transition hover:bg-[#9675FF] disabled:opacity-50">{loadingMore ? "Loading…" : "Load more"}</button>}</div>
      </div>
    </section>
  );
};

const ProductsPage = ({ token }) => {
  const [searchText, setSearchText] = useState("");
  const search = useDebounced(searchText);
  const [stock, setStock] = useState("all");
  const [products, setProducts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const latestSearch = useRef(search);
  const pageRequestRef = useRef(0);
  latestSearch.current = search;

  useEffect(() => {
    const requestId = ++pageRequestRef.current;
    const controller = new AbortController();
    setProducts([]); setCursor(null); setHasMore(false); setLoading(true); setError("");
    axios.get(`${serverUrl}/api/owner/products`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { limit: 20, search, stock },
      signal: controller.signal,
      timeout: 10000,
    }).then(({ data }) => {
      if (pageRequestRef.current !== requestId) return;
      if (!data?.success) throw new Error(data?.message || "Could not load products");
      setProducts(data.products || []); setCursor(data.nextCursor || null); setHasMore(Boolean(data.hasMore));
    }).catch((requestError) => {
      if (pageRequestRef.current !== requestId) return;
      if (requestError.name === "CanceledError" || requestError.code === "ERR_CANCELED") return;
      setError(requestError.response?.data?.message || requestError.message || "Could not load products");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, search, stock, refreshKey]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    const requestedSearch = search;
    const requestedStock = stock;
    const requestId = pageRequestRef.current;
    setLoadingMore(true); setError("");
    try {
      const { data } = await axios.get(`${serverUrl}/api/owner/products`, { headers: { Authorization: `Bearer ${token}` }, params: { limit: 20, cursor, search: requestedSearch, stock } });
      if (pageRequestRef.current !== requestId || latestSearch.current !== requestedSearch || stock !== requestedStock) return;
      if (!data?.success) throw new Error(data?.message || "Could not load more products");
      setProducts((current) => [...current, ...(data.products || [])]); setCursor(data.nextCursor || null); setHasMore(Boolean(data.hasMore));
    } catch (requestError) {
      if (pageRequestRef.current !== requestId || latestSearch.current !== requestedSearch || stock !== requestedStock) return;
      setError(requestError.response?.data?.message || requestError.message || "Could not load more products");
    } finally { setLoadingMore(false); }
  };

  return (
    <section className="space-y-5 text-[#F8FAFC]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><PageHeading eyebrow="Marketplace · Catalog" title="Products" detail="Browse product pricing, availability and exact stock counts." /><div className="flex flex-col gap-2 sm:flex-row"><SearchBox value={searchText} onChange={setSearchText} placeholder="Search product, brand or category" /><label className="relative"><span className="sr-only">Filter stock</span><select value={stock} onChange={(event) => setStock(event.target.value)} className="w-full appearance-none rounded-xl border border-[#243451] bg-[#080B18] py-2.5 pl-3 pr-8 text-xs font-semibold text-[#F8FAFC] outline-none focus:border-[#6D4AFF] sm:w-40"><option value="all">All stock</option><option value="available">In stock</option><option value="out">Out of stock</option></select><ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9AAAC4]" /></label></div></div>
      <ErrorMessage error={error} onRetry={() => setRefreshKey((value) => value + 1)} />
      <div className={`${panelClass} overflow-hidden`}><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="border-b border-[#243451] bg-[#243451]/35 text-[10px] uppercase tracking-wider text-[#9AAAC4]"><tr><th className="px-5 py-4 font-semibold">Product</th><th className="px-5 py-4 font-semibold">Brand</th><th className="px-5 py-4 font-semibold">Category</th><th className="px-5 py-4 text-right font-semibold">Price</th><th className="px-5 py-4 text-right font-semibold">Stock</th><th className="px-5 py-4 text-right font-semibold">Availability</th></tr></thead><tbody className="divide-y divide-[#243451]/70">{products.map((product) => <tr key={product._id} className="hover:bg-[#243451]/35"><td className="px-5 py-3"><div className="flex items-center gap-3">{product.image ? <img src={product.image} alt="" className="h-10 w-10 rounded-lg object-cover" loading="lazy" /> : <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#243451]/40 text-[#9AAAC4]"><Boxes size={16} /></span>}<span className="max-w-56 truncate font-semibold text-[#F8FAFC]">{product.name}</span></div></td><td className="px-5 py-4 text-[#9AAAC4]">{product.brand || "—"}</td><td className="px-5 py-4 text-[#9AAAC4]">{product.category || "Uncategorized"}</td><td className="px-5 py-4 text-right font-semibold tabular-nums text-[#F8FAFC]">{formatMoney(product.price)}</td><td className={`px-5 py-4 text-right font-semibold tabular-nums ${product.stock <= 0 ? "text-rose-300" : "text-[#9AAAC4]"}`}>{product.stock}</td><td className="px-5 py-4 text-right"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${product.isAvailable ? "bg-[#34D399]/10 text-[#34D399]" : "bg-slate-400/10 text-[#9AAAC4]"}`}>{product.isAvailable ? "Listed" : "Hidden"}</span></td></tr>)}{loading && <tr><td colSpan="6" className="px-5 py-14 text-center text-[#9AAAC4]">Loading products…</td></tr>}{!loading && !products.length && <tr><td colSpan="6" className="px-5 py-14 text-center text-[#9AAAC4]">No products match this filter.</td></tr>}</tbody></table></div><div className="flex flex-col gap-3 border-t border-[#243451]/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-[11px] text-[#9AAAC4]">Showing {products.length} products. Inventory alert is triggered only at zero stock.</p>{hasMore && <button type="button" onClick={loadMore} disabled={loading || loadingMore} className="rounded-xl bg-[#6D4AFF] px-4 py-2 text-xs font-semibold text-[#F8FAFC] transition hover:bg-[#9675FF] disabled:opacity-50">{loadingMore ? "Loading…" : "Load more"}</button>}</div></div>
    </section>
  );
};

const CustomersPage = ({ token }) => {
  const [searchParams] = useSearchParams();
  const [searchText, setSearchText] = useState(searchParams.get("search") || "");
  const search = useDebounced(searchText);
  const [customers, setCustomers] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const latestSearch = useRef(search);
  const pageRequestRef = useRef(0);
  latestSearch.current = search;

  useEffect(() => {
    const requestId = ++pageRequestRef.current;
    const controller = new AbortController();
    setCustomers([]); setCursor(null); setHasMore(false); setLoading(true); setError("");
    axios.get(`${serverUrl}/api/owner/customers`, { headers: { Authorization: `Bearer ${token}` }, params: { limit: 20, search }, signal: controller.signal })
      .then(({ data }) => { if (pageRequestRef.current !== requestId) return; if (!data?.success) throw new Error(data?.message || "Could not load customers"); setCustomers(data.customers || []); setCursor(data.nextCursor || null); setHasMore(Boolean(data.hasMore)); })
      .catch((requestError) => { if (pageRequestRef.current !== requestId || requestError.name === "CanceledError" || requestError.code === "ERR_CANCELED") return; setError(requestError.response?.data?.message || requestError.message || "Could not load customers"); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, search, refreshKey]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    const requestedSearch = search;
    const requestId = pageRequestRef.current;
    setLoadingMore(true); setError("");
    try {
      const { data } = await axios.get(`${serverUrl}/api/owner/customers`, { headers: { Authorization: `Bearer ${token}` }, params: { limit: 20, cursor, search: requestedSearch } });
      if (pageRequestRef.current !== requestId || latestSearch.current !== requestedSearch) return;
      if (!data?.success) throw new Error(data?.message || "Could not load more customers");
      setCustomers((current) => [...current, ...(data.customers || [])]); setCursor(data.nextCursor || null); setHasMore(Boolean(data.hasMore));
    } catch (requestError) { if (pageRequestRef.current !== requestId || latestSearch.current !== requestedSearch) return; setError(requestError.response?.data?.message || requestError.message || "Could not load more customers"); }
    finally { setLoadingMore(false); }
  };

  return (
    <section className="space-y-5 text-[#F8FAFC]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><PageHeading eyebrow="Marketplace · Relationships" title="Customers" detail="Customer account directory. Missing legacy sign-up dates are shown as unavailable." count={`Loaded ${customers.length}`} /><SearchBox value={searchText} onChange={setSearchText} placeholder="Search name or email" /></div>
      <ErrorMessage error={error} onRetry={() => setRefreshKey((value) => value + 1)} />
      <div className={`${panelClass} overflow-hidden`}><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead className="border-b border-[#243451] bg-[#243451]/35 text-[10px] uppercase tracking-wider text-[#9AAAC4]"><tr><th className="px-5 py-4 font-semibold">Customer</th><th className="px-5 py-4 font-semibold">Email</th><th className="px-5 py-4 font-semibold">Account created</th><th className="px-5 py-4 text-right font-semibold">Account ID</th></tr></thead><tbody className="divide-y divide-[#243451]/70">{customers.map((customer) => <tr key={customer._id} className="hover:bg-[#243451]/35"><td className="px-5 py-4"><div className="flex items-center gap-3">{customer.avatar ? <img src={customer.avatar} alt="" className="h-9 w-9 rounded-full object-cover" loading="lazy" /> : <span className="grid h-9 w-9 place-items-center rounded-full bg-[#34D399]/10 text-sm font-bold text-[#34D399]">{(customer.name || "C").slice(0, 1).toUpperCase()}</span>}<span className="font-semibold text-[#F8FAFC]">{customer.name || "Unnamed customer"}</span></div></td><td className="px-5 py-4 text-[#9AAAC4]">{customer.email}</td><td className="px-5 py-4 text-[#9AAAC4]">{dateLabel(customer.createdAt)}</td><td className="px-5 py-4 text-right font-mono text-[10px] text-[#9AAAC4]">{customer._id}</td></tr>)}{loading && <tr><td colSpan="4" className="px-5 py-14 text-center text-[#9AAAC4]">Loading customers…</td></tr>}{!loading && !customers.length && <tr><td colSpan="4" className="px-5 py-14 text-center text-[#9AAAC4]">No customer accounts found.</td></tr>}</tbody></table></div><div className="flex flex-col gap-3 border-t border-[#243451]/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-[11px] text-[#9AAAC4]">Showing {customers.length} customer accounts.</p>{hasMore && <button type="button" onClick={loadMore} disabled={loading || loadingMore} className="rounded-xl bg-[#6D4AFF] px-4 py-2 text-xs font-semibold text-[#F8FAFC] transition hover:bg-[#9675FF] disabled:opacity-50">{loadingMore ? "Loading…" : "Load more"}</button>}</div></div>
      <p className="flex items-start gap-2 text-[11px] leading-5 text-[#9AAAC4]"><Users size={14} className="mt-0.5 shrink-0" /> Customer order history is summarized in Analytics; this table intentionally omits addresses and other private order details.</p>
    </section>
  );
};

export { CustomersPage, OrdersPage, ProductsPage };
