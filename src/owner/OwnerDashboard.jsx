import { createElement, useEffect, useRef, useState } from "react";
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  Store,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import axios from "axios";
import { serverUrl } from "../../config";
import { persistor, store } from "../redux/store";
import { removeUser, resetCart } from "../redux/digitalSlice";
import { clearAuthSession, getAuthToken, setAuthUser } from "../auth/session";
import { OwnerActivity, OwnerOverview, OwnerReports, OwnerSettings } from "./OwnerAnalytics";
import { CustomersPage, OrdersPage, ProductsPage } from "./OwnerManagementPages";
import { getOwnerPreferences, saveOwnerPreferences } from "./ownerPreferences";
import Seo from "../component/Seo";

const navigationGroups = [
  { label: "Workspace", items: [
    { label: "Overview", path: "/owner", icon: LayoutDashboard, end: true },
    { label: "Activity", path: "/owner/activity", icon: Bell },
  ] },
  { label: "Marketplace", items: [
    { label: "Sellers", path: "/owner/sellers", icon: Store },
    { label: "Products", path: "/owner/products", icon: Boxes },
    { label: "Orders", path: "/owner/orders", icon: ClipboardList },
    { label: "Customers", path: "/owner/customers", icon: Users },
  ] },
  { label: "Insights", items: [{ label: "Reports", path: "/owner/reports", icon: BarChart3 }] },
  { label: "System", items: [{ label: "Settings", path: "/owner/settings", icon: Settings }] },
];

const SellersPage = ({ token }) => {
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [sellers, setSellers] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [changingSellerId, setChangingSellerId] = useState("");
  const searchRef = useRef(search);
  const pageRequestRef = useRef(0);
  searchRef.current = search;

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchText.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    const requestId = ++pageRequestRef.current;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setSellers([]);
    setNextCursor(null);
    setHasMore(false);

    axios
      .get(`${serverUrl}/api/owner/sellers`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 12, search },
        signal: controller.signal,
      })
      .then(({ data }) => {
        if (pageRequestRef.current !== requestId) return;
        if (!data?.success) throw new Error(data?.message || "Could not load sellers");
        setSellers(data.sellers || []);
        setNextCursor(data.nextCursor || null);
        setHasMore(Boolean(data.hasMore));
      })
      .catch((requestError) => {
        if (pageRequestRef.current !== requestId || requestError.name === "CanceledError") return;
        setError(requestError.response?.data?.message || requestError.message || "Could not load sellers");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [search, token, refreshKey]);

  const revokeAccess = async (seller) => {
    if (!window.confirm(`Remove seller access from ${seller.name || seller.email}?`)) return;
    setChangingSellerId(seller._id);
    setError("");
    setNotice("");
    try {
      const { data } = await axios.patch(
        `${serverUrl}/api/owner/users/${seller._id}/seller-access`,
        { isAdmin: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data?.success) throw new Error(data?.message || "Could not remove seller access");
      setNotice(`Seller access removed for ${seller.name || seller.email}.`);
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Could not remove seller access");
    } finally {
      setChangingSellerId("");
    }
  };

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    const requestedSearch = search;
    const requestId = pageRequestRef.current;
    setLoadingMore(true);
    setError("");
    try {
      const { data } = await axios.get(`${serverUrl}/api/owner/sellers`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 12, search: requestedSearch, cursor: nextCursor },
      });
      if (pageRequestRef.current !== requestId || searchRef.current !== requestedSearch) return;
      if (!data?.success) throw new Error(data?.message || "Could not load more sellers");
      setSellers((current) => [...current, ...(data.sellers || [])]);
      setNextCursor(data.nextCursor || null);
      setHasMore(Boolean(data.hasMore));
    } catch (requestError) {
      if (pageRequestRef.current !== requestId || searchRef.current !== requestedSearch) return;
      setError(requestError.response?.data?.message || requestError.message || "Could not load more sellers");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section className="space-y-5 text-[#111827]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C2410C]">Marketplace</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#111827]">Sellers</h1>
          <p className="mt-1 text-sm text-[#4B5563]">Browse seller accounts registered on the platform.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <label className="relative block w-full sm:w-64">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]" />
            <input
              type="search"
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value.slice(0, 80));
                setNotice("");
              }}
              placeholder="Search name or email"
              className="w-full rounded-xl border border-[#FED7AA] bg-[#F3F4F6] py-2.5 pl-10 pr-3 text-sm text-[#111827] outline-none transition placeholder:text-[#4B5563] focus:border-[#FDBA74] focus:ring-2 focus:ring-[#FDBA74]/10"
            />
          </label>
          <button
            type="button"
            onClick={() => setShowSellerModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FDBA74] px-4 py-2.5 text-sm font-semibold text-[#111827] transition hover:bg-[#FB923C]"
          >
            <UserPlus size={16} /> Add seller
          </button>
        </div>
      </div>

      {notice && (
        <p role="status" className="rounded-xl border border-[#BBF7D0] bg-[#DCFCE7] px-4 py-3 text-sm text-[#166534]">{notice}</p>
      )}
      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</p>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#FED7AA] bg-[#FFFFFF] shadow-[0_14px_45px_rgba(0,0,0,0.12)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="border-b border-[#FED7AA] bg-[#FED7AA]/35 text-xs uppercase tracking-wider text-[#4B5563]">
              <tr>
                <th className="px-5 py-4 font-semibold">Seller</th>
                <th className="px-5 py-4 font-semibold">Email</th>
                <th className="px-5 py-4 font-semibold">Account ID</th>
                <th className="px-5 py-4 text-right font-semibold">Permission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FED7AA]/70">
              {sellers.map((seller) => (
                <tr key={seller._id} className="hover:bg-[#FED7AA]/35">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {seller.avatar ? (
                        <img src={seller.avatar} alt="" className="h-9 w-9 rounded-full object-cover" loading="lazy" />
                      ) : (
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-[#DCFCE7] text-sm font-bold text-[#166534]">
                          {(seller.name || "S").slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span className="font-semibold text-[#111827]">{seller.name || "Unnamed seller"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#4B5563]">{seller.email}</td>
                  <td className="px-5 py-4 font-mono text-xs text-[#4B5563]">{seller._id}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => revokeAccess(seller)}
                      disabled={changingSellerId === seller._id}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-wait disabled:opacity-60"
                    >
                      {changingSellerId === seller._id ? "Updating…" : "Revoke access"}
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && sellers.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-5 py-12 text-center text-sm text-[#4B5563]">
                    {search ? "No sellers match this search." : "No seller accounts found."}
                  </td>
                </tr>
              )}
              {loading && (
                <tr><td colSpan="4" className="px-5 py-12 text-center text-sm text-[#4B5563]">Loading sellers…</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-[#FED7AA]/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#4B5563]">Showing {sellers.length} seller{sellers.length === 1 ? "" : "s"}</p>
          {hasMore && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loading || loadingMore}
              className="rounded-xl bg-[#FDBA74] px-4 py-2 text-sm font-semibold text-[#111827] transition hover:bg-[#FB923C] disabled:cursor-wait disabled:opacity-60"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          )}
        </div>
      </div>

      {showSellerModal && (
        <SellerAccessModal
          token={token}
          onClose={() => setShowSellerModal(false)}
          onSaved={(message) => {
            setShowSellerModal(false);
            setNotice(message);
            setError("");
            setRefreshKey((current) => current + 1);
          }}
        />
      )}
    </section>
  );
};

const SellerAccessModal = ({ token, onClose, onSaved }) => {
  const [mode, setMode] = useState("create");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [customerSearchText, setCustomerSearchText] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [grantingId, setGrantingId] = useState("");
  const [error, setError] = useState("");
  const customerSearchRef = useRef(customerSearch);
  customerSearchRef.current = customerSearch;

  useEffect(() => {
    const timer = window.setTimeout(() => setCustomerSearch(customerSearchText.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [customerSearchText]);

  useEffect(() => {
    if (mode !== "grant") return undefined;
    const controller = new AbortController();
    setLoadingCustomers(true);
    setError("");
    setCustomers([]);
    setNextCursor(null);
    setHasMore(false);

    axios
      .get(`${serverUrl}/api/owner/customers`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 8, search: customerSearch },
        signal: controller.signal,
      })
      .then(({ data }) => {
        if (!data?.success) throw new Error(data?.message || "Could not load customer accounts");
        setCustomers(data.customers || []);
        setNextCursor(data.nextCursor || null);
        setHasMore(Boolean(data.hasMore));
      })
      .catch((requestError) => {
        if (requestError.name === "CanceledError") return;
        setError(requestError.response?.data?.message || requestError.message || "Could not load customer accounts");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingCustomers(false);
      });

    return () => controller.abort();
  }, [mode, customerSearch, token]);

  const createSeller = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const { data } = await axios.post(
        `${serverUrl}/api/owner/sellers`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data?.success) throw new Error(data?.message || "Could not create seller account");
      onSaved(`${data.seller.name} has been added as a seller. Share the initial password with them securely.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Could not create seller account");
    } finally {
      setSubmitting(false);
    }
  };

  const grantAccess = async (customer) => {
    setGrantingId(customer._id);
    setError("");
    try {
      const { data } = await axios.patch(
        `${serverUrl}/api/owner/users/${customer._id}/seller-access`,
        { isAdmin: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!data?.success) throw new Error(data?.message || "Could not grant seller access");
      onSaved(`${customer.name || customer.email} now has seller access.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Could not grant seller access");
    } finally {
      setGrantingId("");
    }
  };

  const loadMoreCustomers = async () => {
    if (!nextCursor || loadingMore) return;
    const requestedSearch = customerSearch;
    setLoadingMore(true);
    try {
      const { data } = await axios.get(`${serverUrl}/api/owner/customers`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 8, search: requestedSearch, cursor: nextCursor },
      });
      if (customerSearchRef.current !== requestedSearch) return;
      if (!data?.success) throw new Error(data?.message || "Could not load more accounts");
      setCustomers((current) => [...current, ...(data.customers || [])]);
      setNextCursor(data.nextCursor || null);
      setHasMore(Boolean(data.hasMore));
    } catch (requestError) {
      if (customerSearchRef.current !== requestedSearch) return;
      setError(requestError.response?.data?.message || requestError.message || "Could not load more accounts");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#D1D5DB]/80 p-4" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="seller-modal-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#FED7AA] bg-[#FFFFFF] p-5 text-[#111827] shadow-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C2410C]">Seller permissions</p>
            <h2 id="seller-modal-title" className="mt-1 text-xl font-bold text-[#111827]">Add a seller</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-[#4B5563] hover:bg-[#FED7AA]/50">
            <X size={19} />
          </button>
        </div>

        <div className="mt-6 flex gap-2 border-b border-[#FED7AA] pb-3">
          {[{ id: "create", label: "Create seller account" }, { id: "grant", label: "Grant access to customer" }].map(({ id, label }) => (
            <button
              type="button"
              key={id}
              onClick={() => { setMode(id); setError(""); }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === id ? "bg-[#FDBA74]/15 text-[#C2410C]" : "text-[#4B5563] hover:bg-[#FED7AA]/50"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</p>}

        {mode === "create" ? (
          <form onSubmit={createSeller} className="mt-5 space-y-4">
            <label className="block space-y-1.5 text-sm font-medium text-[#111827]">
              Seller name
              <input
                required
                minLength={2}
                maxLength={80}
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-xl border border-[#FED7AA] bg-[#F3F4F6] px-3 py-2.5 text-[#111827] font-normal outline-none focus:border-[#FDBA74] focus:ring-2 focus:ring-[#FDBA74]/20"
              />
            </label>
            <label className="block space-y-1.5 text-sm font-medium text-[#111827]">
              Email
              <input
                required
                type="email"
                maxLength={254}
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="w-full rounded-xl border border-[#FED7AA] bg-[#F3F4F6] px-3 py-2.5 text-[#111827] font-normal outline-none focus:border-[#FDBA74] focus:ring-2 focus:ring-[#FDBA74]/20"
              />
            </label>
            <label className="block space-y-1.5 text-sm font-medium text-[#111827]">
              Initial password
              <input
                required
                type="password"
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="w-full rounded-xl border border-[#FED7AA] bg-[#F3F4F6] px-3 py-2.5 text-[#111827] font-normal outline-none focus:border-[#FDBA74] focus:ring-2 focus:ring-[#FDBA74]/20"
              />
              <span className="block text-xs font-normal text-[#4B5563]">Share this initial password with the seller securely.</span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="rounded-xl border border-[#FED7AA] px-4 py-2.5 text-sm font-semibold text-[#4B5563] hover:bg-[#FED7AA]/50">Cancel</button>
              <button type="submit" disabled={submitting} className="rounded-xl bg-[#FDBA74] px-4 py-2.5 text-sm font-semibold text-[#111827] hover:bg-[#FB923C] disabled:opacity-60">
                {submitting ? "Creating…" : "Create seller"}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-5 space-y-4">
            <label className="relative block">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]" />
              <input
                type="search"
                value={customerSearchText}
                onChange={(event) => setCustomerSearchText(event.target.value.slice(0, 80))}
                placeholder="Find an existing customer by name or email"
                className="w-full rounded-xl border border-[#FED7AA] bg-[#F3F4F6] py-2.5 pl-10 pr-3 text-sm text-[#111827] outline-none placeholder:text-[#4B5563] focus:border-[#FDBA74] focus:ring-2 focus:ring-[#FDBA74]/20"
              />
            </label>
            <div className="divide-y divide-[#FED7AA]/70 rounded-xl border border-[#FED7AA]">
              {customers.map((customer) => (
                <div key={customer._id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#111827]">{customer.name || "Unnamed customer"}</p>
                    <p className="truncate text-xs text-[#4B5563]">{customer.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => grantAccess(customer)}
                    disabled={Boolean(grantingId)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#FDBA74] px-3 py-2 text-xs font-semibold text-[#111827] hover:bg-[#FB923C] disabled:opacity-60"
                  >
                    <ShieldCheck size={14} /> {grantingId === customer._id ? "Updating…" : "Grant access"}
                  </button>
                </div>
              ))}
              {loadingCustomers && <p className="px-4 py-8 text-center text-sm text-[#4B5563]">Loading customers…</p>}
              {!loadingCustomers && customers.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-[#4B5563]">No customer accounts found.</p>
              )}
            </div>
            {hasMore && (
              <div className="text-center">
                <button type="button" onClick={loadMoreCustomers} disabled={loadingMore} className="rounded-lg px-4 py-2 text-sm font-semibold text-[#C2410C] hover:bg-[#FDBA74]/15 disabled:opacity-60">
                  {loadingMore ? "Loading…" : "Load more customers"}
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

const OwnerDashboard = () => {
  const token = getAuthToken();
  const [user, setUser] = useState(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessError, setAccessError] = useState("");
  const [accessCheckKey, setAccessCheckKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getOwnerPreferences().sidebarCollapsed);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate("/signIn", { replace: true });
      return;
    }

    let cancelled = false;
    axios
      .get(`${serverUrl}/api/user/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => {
        if (cancelled) return;
        if (!data?.success || !data.user?.isOwner) {
          navigate("/", { replace: true });
          return;
        }
        setUser(data.user);
        setAuthUser(data.user);
      })
      .catch((requestError) => {
        if (cancelled) return;
        const status = requestError.response?.status;
        if (status === 401) {
          clearAuthSession();
          navigate("/signIn", { replace: true });
          return;
        }
        if (status === 403) {
          navigate("/", { replace: true });
          return;
        }
        setAccessError(requestError.response?.data?.message || "Could not verify owner access. Check your connection and retry.");
      })
      .finally(() => {
        if (!cancelled) setCheckingAccess(false);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, accessCheckKey]);

  const handleLogout = async () => {
    store.dispatch(resetCart());
    store.dispatch(removeUser());
    try {
      await persistor.flush();
    } catch {
      // The persisted snapshot is removed below if flushing fails.
    }
    clearAuthSession();
    await persistor.purge().catch(() => {});
    navigate("/signIn", { replace: true });
  };

  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    saveOwnerPreferences({ sidebarCollapsed: next });
    setSidebarCollapsed(next);
  };

  const retryAccessCheck = () => {
    setAccessError("");
    setCheckingAccess(true);
    // Changing this key reruns the access check even when the token is unchanged.
    setAccessCheckKey((key) => key + 1);
  };

  if (checkingAccess || !user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#D1D5DB] px-4">
        <Seo title="Owner Dashboard | Digital Store" description="Private Digital Store owner workspace." path="/owner" noindex />
        {accessError ? (
          <section role="alert" className="max-w-md rounded-2xl border border-[#FED7AA] bg-[#FFFFFF] p-6 text-center">
            <p className="text-lg font-semibold text-[#111827]">Owner dashboard unavailable</p>
            <p className="mt-2 text-sm text-[#4B5563]">{accessError}</p>
            <button type="button" onClick={retryAccessCheck} className="mt-5 rounded-xl bg-[#FDBA74] px-4 py-2.5 text-sm font-semibold text-[#111827] hover:bg-[#FB923C]">Retry</button>
          </section>
        ) : <p className="text-sm font-medium text-[#4B5563]">Checking owner access…</p>}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#D1D5DB] text-[#111827] print:bg-white print:text-[#111827]">
      <Seo title="Owner Dashboard | Digital Store" description="Private Digital Store owner workspace." path={window.location.pathname} noindex />
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#FED7AA] bg-[#F3F4F6] px-4 sm:px-6 lg:px-8 print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileMenuOpen}
            aria-controls="owner-navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="rounded-lg p-2 text-[#4B5563] hover:bg-[#FED7AA]/60 hover:text-[#111827] lg:hidden"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to="/owner" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#FDBA74] text-[#111827]">
              <LayoutDashboard size={18} />
            </span>
            <span>
              <span className="block text-sm font-bold leading-4 text-[#111827]">Digital Store</span>
              <span className="block pt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#C2410C]">Owner Center</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-[#111827]">{user.name}</p>
            <p className="text-xs text-[#4B5563]">Owner</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-[#FED7AA] px-3 py-2 text-sm font-semibold text-[#4B5563] transition hover:border-[#FED7AA] hover:bg-[#FED7AA]/50 hover:text-[#111827]"
          >
            <LogOut size={16} /> <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[1720px]">
        <aside
          id="owner-navigation"
          className={`${mobileMenuOpen ? "block" : "hidden"} fixed inset-x-0 top-16 z-20 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-[#FED7AA] bg-[#F3F4F6] p-4 text-[#111827] shadow-2xl shadow-slate-950/20 transition-[width] lg:sticky lg:top-16 lg:flex lg:h-[calc(100vh-4rem)] lg:max-h-none lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r lg:border-[#FED7AA] lg:shadow-none ${sidebarCollapsed ? "lg:w-20 lg:px-2" : "lg:w-64 lg:p-5"}`}
        >
          <nav aria-label="Owner dashboard navigation" className="space-y-5">
            {navigationGroups.map(({ label: groupLabel, items }) => (
              <section key={groupLabel}>
                <p className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#4B5563] ${sidebarCollapsed ? "lg:hidden" : ""}`}>{groupLabel}</p>
                <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-1">
                  {items.map(({ label, path, icon: Icon, end }) => (
                    <NavLink
                      key={path}
                      to={path}
                      end={end}
                      onClick={() => setMobileMenuOpen(false)}
                      title={sidebarCollapsed ? label : undefined}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2410C] ${sidebarCollapsed ? "lg:justify-center lg:px-0" : ""} ${
                          isActive
                            ? "border-[#C2410C]/35 bg-[#FDBA74]/20 text-[#111827] shadow-inner shadow-white/[0.02]"
                            : "border-transparent text-[#4B5563] hover:bg-[#FED7AA]/60 hover:text-[#111827]"
                        }`
                      }
                    >
                      {createElement(Icon, { size: 17, strokeWidth: 1.8, className: "shrink-0" })}
                      <span className={sidebarCollapsed ? "lg:hidden" : ""}>{label}</span>
                    </NavLink>
                  ))}
                </div>
              </section>
            ))}
          </nav>
          <div className={`mt-8 hidden rounded-2xl border border-[#FED7AA] bg-[#FED7AA]/40 p-4 lg:block ${sidebarCollapsed ? "text-center" : ""}`}>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#111827]">
              <ShieldCheck size={15} className="shrink-0 text-emerald-700" /> {!sidebarCollapsed && "Owner account"}
            </div>
            {!sidebarCollapsed && <p className="mt-2 break-all text-xs leading-5 text-[#4B5563]">{user.email}</p>}
          </div>
          <button type="button" onClick={toggleSidebar} aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"} className="mt-auto hidden items-center justify-center gap-2 rounded-xl border border-[#FED7AA] px-3 py-2.5 text-xs font-semibold text-[#4B5563] transition hover:bg-[#FED7AA]/50 hover:text-[#111827] lg:flex">
            {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <><PanelLeftClose size={16} /> Collapse menu</>}
          </button>
        </aside>

        <div className="min-w-0 flex-1 p-3 sm:p-5 lg:p-7 print:p-0">
          <Routes>
            <Route path="/" element={<OwnerOverview user={user} token={token} />} />
            <Route path="sellers" element={<SellersPage token={token} />} />
            <Route path="products" element={<ProductsPage token={token} />} />
            <Route path="orders" element={<OrdersPage token={token} />} />
            <Route path="customers" element={<CustomersPage token={token} />} />
            <Route path="reports" element={<OwnerReports token={token} />} />
            <Route path="activity" element={<OwnerActivity token={token} />} />
            <Route path="settings" element={<OwnerSettings />} />
            <Route path="*" element={<Navigate to="/owner" replace />} />
          </Routes>
        </div>
      </div>
    </main>
  );
};

export default OwnerDashboard;
