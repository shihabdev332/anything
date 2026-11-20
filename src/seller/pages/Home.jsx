import { createElement, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { serverUrl } from "../../../config";
import { FaBoxOpen, FaClipboardList, FaDollarSign, FaPlus } from "react-icons/fa";

const Home = ({ token, user }) => {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [productsRes, ordersRes] = await Promise.all([
        axios.get(`${serverUrl}/api/product/mine`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${serverUrl}/api/order/seller`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const products = productsRes.data?.product || [];
      const orders = ordersRes.data?.orders || [];
      const revenue = orders.reduce((sum, order) => sum + Number(order.sellerTotalAmount || 0), 0);
      setStats({ products: products.length, orders: orders.length, revenue });
    } catch {
      toast.error("Could not load your store overview");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const cards = [
    { label: "Your products", value: stats.products, icon: FaBoxOpen, path: "/profile?seller=products", color: "bg-orange-50 text-orange-600" },
    { label: "Orders with your items", value: stats.orders, icon: FaClipboardList, path: "/profile?seller=orders", color: "bg-blue-50 text-blue-600" },
    { label: "Sales total", value: `$${stats.revenue.toLocaleString()}`, icon: FaDollarSign, path: "/profile?seller=sales", color: "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <div className="p-5 md:p-8">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">Seller overview</p>
          <h3 className="mt-1 text-2xl font-black text-zinc-900">Welcome, {user?.name || "Seller"}</h3>
          <p className="mt-1 text-sm text-zinc-500">Here is the activity for your store.</p>
        </div>
        <Link to="/profile?seller=add" className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-bold text-white hover:bg-orange-600">
          <FaPlus size={12} /> Add a product
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, path, color }) => (
          <Link key={label} to={path} className="rounded-2xl border border-zinc-100 p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>{createElement(Icon)}</div>
            <p className="text-sm font-medium text-zinc-500">{label}</p>
            <p className="mt-1 text-3xl font-black text-zinc-900">{loading ? "…" : value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;
