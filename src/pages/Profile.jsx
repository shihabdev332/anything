import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import LogOut from "../component/LogOut";
import ProfileSellerTools from "../seller/ProfileSellerTools";
import { FaUserCircle, FaShoppingBag, FaMapMarkerAlt, FaShieldAlt, FaStore, FaMotorcycle } from "react-icons/fa";
import { serverUrl } from "../../config";
import { clearAuthSession, getAuthToken, setAuthUser } from "../auth/session";
import Seo from "../component/Seo";
import FullPageLoader from "../component/FullPageLoader";

const Profile = () => {
  const token = getAuthToken();
  const [user, setUser] = useState(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/signIn", { replace: true });
      setCheckingAccess(false);
      return;
    }

    let cancelled = false;
    axios.get(`${serverUrl}/api/user/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.success && data.user) {
          setUser(data.user);
          setAuthUser(data.user);
        } else {
          clearAuthSession();
          navigate("/signIn", { replace: true });
        }
      })
      .catch((requestError) => {
        if (requestError.response?.status === 401) clearAuthSession();
        if (!cancelled) navigate("/signIn", { replace: true });
      })
      .finally(() => {
        if (!cancelled) setCheckingAccess(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  if (checkingAccess) return <FullPageLoader />;
  if (!user) return null;
  const isDeliveryMan = user.isDeliveryMan === true;
  const isSeller = user.isAdmin === true && user.isOwner !== true && !isDeliveryMan;

  return (
    <div className="min-h-[80vh] bg-zinc-50/50 px-4 py-10 md:py-12">
      <Seo title="My Profile | Digital Store" description="Manage your Digital Store account, orders and seller tools." path="/profile" noindex />
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col items-center gap-7 rounded-[2.5rem] border border-zinc-100 bg-white p-7 shadow-sm md:flex-row md:p-10">
          <div className="relative shrink-0">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-orange-100 text-orange-600 shadow-lg md:h-32 md:w-32">
              <FaUserCircle size={80} />
            </div>
            <div className="absolute bottom-1 right-1 h-6 w-6 rounded-full border-4 border-white bg-green-500" />
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-black tracking-tight text-zinc-900">{user.name}</h1>
            <p className="font-medium text-zinc-500">{user.email}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
              <span className="rounded-full bg-zinc-900 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white">Verified Account</span>
              {isSeller && <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-orange-700"><FaStore /> Seller</span>}
              {isDeliveryMan && <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-700"><FaMotorcycle /> Delivery partner</span>}
            </div>
          </div>

          <LogOut />
        </div>

        {isSeller && (
          <div className="mb-8 grid gap-4 rounded-[2rem] border border-orange-100 bg-orange-50/70 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm"><FaStore size={20} /></div>
              <div>
                <h2 className="text-lg font-black text-zinc-900">Seller account</h2>
                <p className="mt-1 text-sm text-zinc-600">You can shop as a customer and manage your own store from this profile.</p>
                <p className="mt-2 break-all font-mono text-[11px] text-zinc-500">ID: {user._id}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="#seller-workspace" className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-700">Open seller tools</a>
              <Link to={`/store/${user._id}`} className="inline-flex items-center justify-center rounded-xl border border-orange-200 bg-white px-5 py-3 text-sm font-bold text-orange-700 transition hover:bg-orange-50">View my store</Link>
            </div>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          {isDeliveryMan && <Link to="/delivery" className="group rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-7 shadow-sm transition hover:border-indigo-300 hover:shadow-xl"><div className="flex items-center gap-5"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white transition group-hover:bg-indigo-700"><FaMotorcycle size={22} /></div><div><h3 className="font-bold text-zinc-900">Delivery portal</h3><p className="text-sm text-zinc-500">View assigned orders and delivery history</p></div></div></Link>}
          <Link to="/order" className="group rounded-[2rem] border border-zinc-100 bg-white p-7 shadow-sm transition hover:border-orange-200 hover:shadow-xl">
            <div className="flex items-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 transition group-hover:bg-orange-600 group-hover:text-white"><FaShoppingBag size={22} /></div>
              <div><h3 className="font-bold text-zinc-900">My Orders</h3><p className="text-sm text-zinc-500">Track orders and view your purchase history</p></div>
            </div>
          </Link>
          <div className="rounded-[2rem] border border-zinc-100 bg-white p-7 shadow-sm">
            <div className="flex items-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400"><FaMapMarkerAlt size={21} /></div>
              <div><h3 className="font-bold text-zinc-900">Shipping Address</h3><p className="text-sm text-zinc-500">Saved delivery details for your orders</p></div>
            </div>
          </div>
          <div className="rounded-[2rem] border border-zinc-100 bg-white p-7 shadow-sm">
            <div className="flex items-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400"><FaShieldAlt size={21} /></div>
              <div><h3 className="font-bold text-zinc-900">Account Security</h3><p className="text-sm text-zinc-500">Your account is protected by sign-in credentials</p></div>
            </div>
          </div>
          <div className="rounded-[2rem] bg-gradient-to-br from-orange-500 to-orange-600 p-7 text-white shadow-lg shadow-orange-100">
            <h3 className="mb-2 text-xl font-black">Welcome to Digital Store</h3>
            <p className="text-sm leading-relaxed text-orange-100">Thank you for being with us. We’re here to make your shopping experience smooth and enjoyable.</p>
          </div>
        </div>

        {isSeller && <div id="seller-workspace"><ProfileSellerTools token={token} user={user} onUserUpdate={(updatedUser) => setUser((current) => ({ ...current, ...updatedUser }))} /></div>}
      </div>
    </div>
  );
};

export default Profile;
