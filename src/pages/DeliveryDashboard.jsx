import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createElement } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowRight, Check, ChevronRight, Clock3, ExternalLink, KeyRound, MapPin, MapPinned, Navigation, PackageCheck, Phone, RefreshCw, ShoppingBag, Truck, UserRound, X } from "lucide-react";
import { serverUrl } from "../../config";
import { clearAuthSession, getAuthToken, getAuthUser, setAuthUser } from "../auth/session";
import Seo from "../component/Seo";

const stages = ["Assigned", "Picked Up", "Out for Delivery", "Delivered"];
const nextStage = (stage) => stages[stages.indexOf(stage) + 1] || "";
const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};
const readUser = () => getAuthUser();

const addressText = (address) => {
  if (typeof address === "string") return address;
  if (!address) return "Delivery address was not saved";
  return [address.fullAddress || address.address || address.street, address.upazila, address.city || address.district, address.postalCode].filter(Boolean).join(", ") || "Delivery address was not saved";
};

const addressPhone = (address) => address?.phone || address?.mobile || address?.contactNumber || "";

const mapDestination = (address) => {
  const position = Array.isArray(address?.position) ? address.position : Array.isArray(address?.coordinates) ? address.coordinates : null;
  if (position?.length >= 2 && position.every((point) => point !== null && point !== "" && Number.isFinite(Number(point)))) return `${Number(position[0])},${Number(position[1])}`;
  const latitude = address?.latitude ?? address?.lat;
  const longitude = address?.longitude ?? address?.lng;
  if (Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))) return `${Number(latitude)},${Number(longitude)}`;
  return addressText(address);
};

const StatCard = ({ icon: Icon, label, value, detail, color }) => <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><span className={`grid h-10 w-10 place-items-center rounded-xl ${color}`}>{createElement(Icon, { size: 18 })}</span><p className="mt-4 text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 text-2xl font-black tracking-tight text-slate-950">{value}</p><p className="mt-1 text-[11px] text-slate-500">{detail}</p></article>;

const DeliveryCard = ({ delivery, onAdvance, onConfirm, updating }) => {
  const phone = addressPhone(delivery.address);
  const destination = mapDestination(delivery.address);
  const mapsUrl = destination && destination !== "Delivery address was not saved"
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`
    : "";
  const stageIndex = Math.max(0, stages.indexOf(delivery.status));

  return <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4 sm:px-6">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><PackageCheck size={19} /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Delivery reference</p><p className="font-mono text-sm font-bold text-slate-900">#{String(delivery._id).slice(-10).toUpperCase()}</p></div></div>
      <div className="text-right"><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${delivery.status === "Delivered" ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700"}`}>{delivery.status === "Delivered" ? <Check size={12} /> : <Truck size={12} />}{delivery.status}</span><p className="mt-1 text-[10px] text-slate-500">{delivery.status === "Delivered" ? `Completed ${formatDate(delivery.completedAt || delivery.createdAt)}` : `Order placed ${formatDate(delivery.createdAt)}`}</p></div>
    </div>

    <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_minmax(250px,0.72fr)]">
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500"><UserRound size={13} /> Buyer</p><p className="mt-2 font-bold text-slate-900">{delivery.buyer?.name || "Customer"}</p><a className="mt-1 block truncate text-xs text-indigo-700 hover:underline" href={`mailto:${delivery.buyer?.email || ""}`}>{delivery.buyer?.email || "Email unavailable"}</a>{phone && <a className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-700" href={`tel:${phone}`}><Phone size={12} />{phone}</a>}</div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500"><ShoppingBag size={13} /> Seller</p><p className="mt-2 font-bold text-slate-900">{delivery.seller?.name || "Store"}</p><p className="mt-1 text-xs text-slate-500">{delivery.paymentMethod || "Cash on Delivery"}</p><p className="mt-2 text-[11px] font-medium text-slate-500">{delivery.products.length} assigned item{delivery.products.length === 1 ? "" : "s"}</p></div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start gap-3"><span className="mt-0.5 text-indigo-600"><MapPin size={17} /></span><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Drop-off address</p><p className="mt-1 text-sm font-semibold leading-6 text-slate-900">{addressText(delivery.address)}</p></div></div>{mapsUrl ? <a target="_blank" rel="noreferrer" href={mapsUrl} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 sm:w-auto"><Navigation size={16} /> Navigate with Google Maps <ExternalLink size={13} /></a> : <p className="mt-3 text-xs text-amber-700">No saved destination for map navigation.</p>}</div>

        <div className="rounded-2xl bg-slate-50 p-4"><div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500"><PackageCheck size={13} /> Order details</div><div className="space-y-2.5">{delivery.products.map((item, index) => <div key={`${item.name}-${index}`} className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white p-2.5"><div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">{item.image && <img src={item.image} alt="" className="h-full w-full object-cover" loading="lazy" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{item.name}</p><p className="mt-0.5 text-xs text-slate-500">Quantity: {item.quantity}</p></div></div>)}</div></div>
      </div>

      <aside className="flex flex-col rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 sm:p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-700">Delivery progress</p>
        <div className="mt-4 space-y-3">{stages.map((stage, index) => <div key={stage} className="flex items-center gap-3"><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold ${index <= stageIndex ? "bg-indigo-600 text-white" : "border border-slate-300 bg-white text-slate-400"}`}>{index < stageIndex ? <Check size={13} /> : index + 1}</span><span className={`text-xs font-semibold ${index <= stageIndex ? "text-slate-900" : "text-slate-400"}`}>{stage}</span>{index === stageIndex && <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-indigo-500" />}</div>)}</div>
        <div className="mt-auto pt-6">{delivery.status === "Out for Delivery" ? <button type="button" disabled={updating} onClick={() => onConfirm(delivery)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"><KeyRound size={16} />{updating ? "Verifying…" : "Complete with buyer code"}</button> : nextStage(delivery.status) ? <button type="button" disabled={updating} onClick={() => onAdvance(delivery)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-600 disabled:cursor-wait disabled:opacity-60">{updating ? "Updating…" : `Mark ${nextStage(delivery.status)}`}<ChevronRight size={16} /></button> : <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-100 px-4 py-3 text-sm font-bold text-emerald-800"><Check size={16} />Delivery completed</div>}</div>
      </aside>
    </div>
  </article>;
};

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const token = getAuthToken();
  const [user, setUser] = useState(readUser);
  const [deliveries, setDeliveries] = useState([]);
  const [stats, setStats] = useState({ assigned: 0, pickedUp: 0, outForDelivery: 0, delivered: 0, total: 0 });
  const [view, setView] = useState("active");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [verificationTarget, setVerificationTarget] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const authorized = useRef(false);
  const requestIdRef = useRef(0);
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const load = useCallback(async ({ append = false, cursor = null } = {}) => {
    if (!token) { navigate("/signIn", { replace: true }); return; }
    const requestId = ++requestIdRef.current;
    try {
      if (append) setLoadingMore(true);
      else { setLoading(true); setLoadingMore(false); }
      let profileResponse = null;
      if (!authorized.current) profileResponse = await axios.get(`${serverUrl}/api/user/me`, { headers });
      if (profileResponse) {
        if (requestIdRef.current !== requestId) return;
        if (!profileResponse.data?.user?.isDeliveryMan || profileResponse.data.user.isOwner) {
          setError("This account does not have active delivery access. Ask your seller to check your delivery account.");
          return;
        }
        setUser(profileResponse.data.user);
        setAuthUser(profileResponse.data.user);
        authorized.current = true;
      }
      const deliveryResponse = await axios.get(`${serverUrl}/api/delivery/deliveries`, { headers, params: { status: view, limit: 20, ...(cursor ? { cursor } : {}) } });
      if (requestIdRef.current !== requestId) return;
      const data = deliveryResponse.data;
      setDeliveries((current) => append ? [...current, ...(data.deliveries || [])] : (data.deliveries || []));
      setStats(data.stats || { assigned: 0, pickedUp: 0, outForDelivery: 0, delivered: 0, total: 0 });
      setNextCursor(data.nextCursor || null);
      setHasMore(Boolean(data.hasMore));
      setError("");
    } catch (requestError) {
      if (requestIdRef.current !== requestId) return;
      const status = requestError.response?.status;
      if (status === 401) { clearAuthSession(); navigate("/signIn", { replace: true }); return; }
      if (status === 403) { authorized.current = false; setError(requestError.response?.data?.message || "Delivery access is inactive. Ask your seller to check your account."); return; }
      setError(requestError.response?.data?.message || "Could not load your assigned deliveries.");
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [headers, navigate, token, view]);

  useEffect(() => { load(); }, [load]);

  const advance = async (delivery, buyerCode = "") => {
    const status = nextStage(delivery.status);
    if (!status || updatingId) return;
    try {
      setUpdatingId(delivery._id);
      await axios.put(`${serverUrl}/api/delivery/deliveries/status`, { orderId: delivery._id, status, ...(status === "Delivered" ? { verificationCode: buyerCode } : {}) }, { headers });
      setDeliveries((current) => current.map((item) => item._id === delivery._id ? { ...item, status, products: item.products.map((product) => ({ ...product, status })) } : item));
      await load();
      return true;
    } catch (requestError) {
      if (requestError.response?.status === 401) { clearAuthSession(); navigate("/signIn", { replace: true }); return; }
      if (requestError.response?.status === 403) { authorized.current = false; setError(requestError.response?.data?.message || "Delivery access is inactive. Ask your seller to check your account."); return false; }
      setError(requestError.response?.data?.message || "Could not update this delivery.");
      return false;
    } finally {
      setUpdatingId("");
    }
  };

  const completeWithBuyerCode = async (event) => {
    event.preventDefault();
    if (!verificationTarget || !/^\d{6}$/.test(verificationCode)) return;
    const completed = await advance(verificationTarget, verificationCode);
    if (completed) {
      setVerificationTarget(null);
      setVerificationCode("");
    }
  };

  const inProgress = stats.pickedUp + stats.outForDelivery;

  return <main className="min-h-[70vh] bg-slate-50 px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
    <Seo title="Delivery Dashboard | Digital Store" description="Manage your assigned Digital Store deliveries and delivery history." path="/delivery" noindex />
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-14 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300"><Truck size={14} /> Delivery workspace</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Your delivery route</h1><p className="mt-2 text-sm text-slate-300">Welcome, {user?.name || "Delivery partner"}. Your assigned orders are ready here.</p></div><div className="flex flex-wrap gap-2"><Link to="/shop" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"><ShoppingBag size={15} /> Shop</Link><Link to="/profile" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-indigo-100"><UserRound size={15} /> Profile</Link></div></div>
      </section>

      <section aria-label="Delivery statistics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Clock3} label="Pending pickup" value={stats.assigned} detail="Waiting to be collected" color="bg-amber-50 text-amber-700" />
        <StatCard icon={Truck} label="In progress" value={inProgress} detail={`${stats.pickedUp} picked up · ${stats.outForDelivery} on route`} color="bg-indigo-50 text-indigo-700" />
        <StatCard icon={PackageCheck} label="Completed" value={stats.delivered} detail="Delivered orders" color="bg-emerald-50 text-emerald-700" />
        <StatCard icon={MapPinned} label="Assigned total" value={stats.total} detail="Your delivery history" color="bg-cyan-50 text-cyan-700" />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600">Dispatch board</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{view === "active" ? "Active deliveries" : "Delivery history"}</h2><p className="mt-1 text-sm text-slate-500">Order details and customer delivery information for your assigned work.</p></div><div className="flex items-center gap-2"><div className="flex rounded-xl border border-slate-200 bg-white p-1"><button type="button" onClick={() => setView("active")} className={`rounded-lg px-3 py-2 text-xs font-bold ${view === "active" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"}`}>Active</button><button type="button" onClick={() => setView("Delivered")} className={`rounded-lg px-3 py-2 text-xs font-bold ${view === "Delivered" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"}`}>History</button></div><button type="button" onClick={() => load()} aria-label="Refresh deliveries" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"><RefreshCw size={15} /></button></div></div>

        {error && <div role="alert" className="flex flex-col justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center">{error}<button type="button" onClick={() => load()} className="inline-flex items-center gap-2 font-bold"><RefreshCw size={14} /> Try again</button></div>}
        {loading ? <div className="grid gap-4">{[0, 1].map((item) => <div key={item} className="h-80 animate-pulse rounded-3xl border border-slate-200 bg-white" />)}</div> : deliveries.length ? <div className="grid gap-4">{deliveries.map((delivery) => <DeliveryCard key={delivery._id} delivery={delivery} onAdvance={advance} onConfirm={(item) => { setVerificationTarget(item); setVerificationCode(""); }} updating={updatingId === delivery._id} />)}</div> : <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><Truck size={24} /></span><h3 className="mt-4 text-lg font-bold text-slate-900">{view === "active" ? "No active deliveries" : "No completed deliveries yet"}</h3><p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{view === "active" ? "When a seller assigns an order to you, it will appear here with the buyer’s saved delivery details." : "Completed orders will be saved here for quick reference."}</p></div>}
        {hasMore && <div className="text-center"><button type="button" disabled={loadingMore} onClick={() => load({ append: true, cursor: nextCursor })} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-50">{loadingMore ? "Loading…" : "Load more history"}<ArrowRight size={15} /></button></div>}
      </section>
      <p className="text-center text-[11px] text-slate-400">Signed in as {user?.email || "delivery partner"} · You can also use the storefront and checkout normally.</p>
    </div>
    {verificationTarget && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" role="presentation">
      <form role="dialog" aria-modal="true" aria-labelledby="buyer-code-title" onSubmit={completeWithBuyerCode} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4"><div><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><KeyRound size={20} /></span><h2 id="buyer-code-title" className="mt-4 text-xl font-black text-slate-950">Confirm with buyer code</h2></div><button type="button" aria-label="Close" onClick={() => setVerificationTarget(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button></div>
        <p className="mt-2 text-sm leading-6 text-slate-600">Ask the buyer for the six-digit code shown in their order page. The delivery can only be completed after the code is verified.</p>
        <label className="mt-5 block text-xs font-bold text-slate-600">Buyer verification code<input autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-center font-mono text-2xl font-black tracking-[0.4em] text-slate-950 outline-none focus:border-emerald-600" placeholder="••••••" /></label>
        <div className="mt-5 flex gap-3"><button type="button" onClick={() => setVerificationTarget(null)} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button><button type="submit" disabled={verificationCode.length !== 6 || updatingId === verificationTarget._id} className="flex-1 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">{updatingId === verificationTarget._id ? "Checking…" : "Verify & complete"}</button></div>
      </form>
    </div>}
  </main>;
};

export default DeliveryDashboard;
