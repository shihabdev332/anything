import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { serverUrl } from "../../config";
import { FaCheckCircle, FaTruck, FaBoxOpen, FaClock, FaTimesCircle, FaShoppingBag, FaMapMarkerAlt, FaCalendarAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import Container from "../component/Container";
import Price from "../component/Price";
import { getAuthToken, getAuthUser } from "../auth/session";
import Seo from "../component/Seo";

const getAddressLabel = (address) => typeof address === "string"
  ? address
  : [address?.fullAddress, address?.upazila, address?.city].filter(Boolean).join(", ") || "Delivery address unavailable";

const getOrderDisplayStatus = (order) => {
  if (order.status === "Cancelled") return "Cancelled";
  const activeLines = (order.products || []).filter((line) => line.sellerStatus !== "Cancelled");
  const deliveryStatuses = activeLines.map((line) => line.deliveryStatus).filter(Boolean);
  if (deliveryStatuses.length) {
    if (deliveryStatuses.every((status) => status === "Delivered")) return "Delivered";
    if (deliveryStatuses.includes("Out for Delivery")) return "Out for Delivery";
    if (deliveryStatuses.includes("Picked Up")) return "Picked Up";
    if (deliveryStatuses.includes("Assigned")) return "Assigned";
  }
  const sellerStatuses = activeLines.map((line) => line.sellerStatus).filter(Boolean);
  if (sellerStatuses.length && sellerStatuses.every((status) => status === "Delivered")) return "Delivered";
  if (sellerStatuses.includes("Shipped")) return "Shipped";
  if (sellerStatuses.includes("Processing")) return "Processing";
  if (sellerStatuses.includes("Order Placed")) return "Order Placed";
  return order.status;
};

const Order = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const user = getAuthUser();
  const token = getAuthToken();

  const getAuthHeaders = useCallback(() => {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  }, [token]);

  const fetchOrders = useCallback(async ({ silent = false } = {}) => {
    if (!user?._id || !token) {
      if (!silent) toast.error("Please login to view orders");
      return;
    }

    try {
      if (!silent) setLoading(true);
      const res = await axios.get(`${serverUrl}/api/order/user/${user._id}`, {
        headers: getAuthHeaders(),
      });

      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      if (!silent) toast.error(err.response?.data?.message || "Failed to fetch orders");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user?._id, token, getAuthHeaders]);

  useEffect(() => {
    fetchOrders();
    const refreshInterval = window.setInterval(() => fetchOrders({ silent: true }), 15000);
    return () => window.clearInterval(refreshInterval);
  }, [fetchOrders]);

  const handleClientCancel = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    
    try {
      const response = await axios.put(
        `${serverUrl}/api/order/cancel`,
        { orderId },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        toast.success("Order cancelled successfully!");
        fetchOrders();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Cancellation failed");
    }
  };
  

  const getStatusStyles = (status) => {
    switch (status) {
      case "Delivered": return { color: "text-green-600", bg: "bg-green-50", icon: <FaCheckCircle /> };
      case "Shipped":
      case "Picked Up":
      case "Out for Delivery": return { color: "text-blue-600", bg: "bg-blue-50", icon: <FaTruck /> };
      case "Assigned":
      case "Processing":
      case "Order Placed": return { color: "text-indigo-600", bg: "bg-indigo-50", icon: <FaBoxOpen /> };
      case "Pending": return { color: "text-amber-600", bg: "bg-amber-50", icon: <FaClock /> };
      case "Cancelled": return { color: "text-red-600", bg: "bg-red-50", icon: <FaTimesCircle /> };
      default: return { color: "text-zinc-500", bg: "bg-zinc-50", icon: <FaBoxOpen /> };
    }
  };

  return (
    <div className="bg-white min-h-screen selection:bg-zinc-900 selection:text-white">
      <Seo title="My Orders | Digital Store" description="View your order history and track order and delivery status on Digital Store." path="/order" noindex />
      <Container className="py-16">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 animate-fadeInUp">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-zinc-400">
               <FaShoppingBag className="text-zinc-900" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em]">Purchase History</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-zinc-950 tracking-tighter leading-none">
              My <span className="text-zinc-400 italic font-light">Orders.</span>
            </h1>
          </div>
          <div className="bg-zinc-50 px-8 py-4 rounded-3xl border border-zinc-100 hidden md:block">
            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Purchases</p>
            <p className="text-2xl font-black text-zinc-900">{orders.length} Orders</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-zinc-900"></div>
            <p className="text-zinc-400 font-bold uppercase text-[10px] tracking-[0.3em]">Synchronizing Records...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-32 bg-zinc-50 rounded-[4rem] border border-zinc-100 animate-fadeInUp">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
               <FaBoxOpen size={32} className="text-zinc-200" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">No Acquisitions Found</h2>
            <p className="text-zinc-400 font-medium mb-10">Your digital collection is currently empty.</p>
            <button 
              onClick={() => window.location.href='/shop'} 
              className="bg-zinc-950 text-white px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all shadow-2xl"
            >
              Start Exploring
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {orders.map((order, index) => {
              const displayStatus = getOrderDisplayStatus(order);
              const styles = getStatusStyles(displayStatus);
              return (
                <div 
                  key={order._id} 
                  className="group bg-white border border-zinc-100 rounded-[3rem] p-8 md:p-12 shadow-sm hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] transition-all duration-700 animate-fadeInUp"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12 border-b border-zinc-50 pb-8">
                    <div className="flex flex-wrap items-center gap-6">
                      <div className={`flex items-center gap-2 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.2em] ${styles.bg} ${styles.color} border border-current/10`}>
                        {styles.icon} {displayStatus}
                      </div>
                      <div className="h-8 w-[1px] bg-zinc-100 hidden md:block"></div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Order Reference</p>
                        <p className="font-bold text-zinc-900">#{order._id.slice(-12).toUpperCase()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <div className="lg:text-right">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 flex items-center lg:justify-end gap-2">
                          <FaCalendarAlt /> Date
                        </p>
                        <p className="font-bold text-zinc-900">{new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                  </div>

                  {/* Products Grid - Using your Cart format */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
                    {order.products?.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-6 bg-zinc-50/50 p-5 rounded-[2rem] border border-zinc-100/50 group/item hover:bg-white hover:shadow-xl transition-all duration-500">
                        <div className="w-24 h-24 bg-white rounded-2xl overflow-hidden shrink-0 shadow-sm group-hover/item:scale-105 transition-transform duration-500">
                          <img 
                            src={p.productId?.images?.[0] || "https://placehold.co/200x200?text=Product"} 
                            alt="asset" 
                            className="w-full h-full object-cover grayscale group-hover/item:grayscale-0 transition-all duration-700" loading="lazy" 
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-lg font-black text-zinc-900 leading-tight line-clamp-1">{p.productId?.name || "Premium Asset"}</p>
                          <div className="flex items-center gap-4 text-xs font-bold text-zinc-400">
                             <span>Quantity: <span className="text-zinc-900">{p.quantity}</span></span>
                             <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                             <Price amount={p.unitPrice ?? p.productId?.price} className="text-zinc-600" />
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold">
                            {p.sellerId?.name && <span className="rounded-full bg-white px-2.5 py-1 text-zinc-500">{p.sellerId.name}</span>}
                            <span className={`rounded-full px-2.5 py-1 ${p.deliveryStatus === "Delivered" ? "bg-emerald-50 text-emerald-700" : p.deliveryStatus ? "bg-indigo-50 text-indigo-700" : "bg-zinc-100 text-zinc-500"}`}>
                              {p.deliveryStatus || p.sellerStatus || order.status || "Order Placed"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right px-4">
                           <Price amount={(p.unitPrice ?? p.productId?.price) * p.quantity} className="text-xl font-black text-zinc-900" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer Actions */}
                  {order.deliveryCodes?.length > 0 && (
                    <div className="mb-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 md:p-8">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Secure handoff</p><h3 className="mt-1 text-lg font-black text-emerald-950">Give this code to your delivery person</h3><p className="mt-1 max-w-xl text-xs leading-5 text-emerald-800">Only share it after you receive the parcel. The driver cannot mark this delivery complete without your code.</p></div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {order.deliveryCodes.map((entry) => <div key={entry.sellerId} className="rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-center"><p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{entry.sellerName}</p><p className="mt-1 font-mono text-2xl font-black tracking-[0.3em] text-emerald-800">{entry.code}</p></div>)}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col md:flex-row justify-between items-center gap-10 pt-10 border-t border-zinc-100">
                    <div className="flex items-start gap-4 bg-zinc-50 px-8 py-5 rounded-2xl w-full md:w-fit">
                      <FaMapMarkerAlt className="mt-1 text-zinc-400" />
                      <div>
                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Delivery Destination</p>
                        <p className="text-sm font-bold text-zinc-700 italic">"{getAddressLabel(order.address)}"</p>
                        {(order.address?.phone || order.address?.mobile || order.address?.contactNumber) && <a href={`tel:${order.address.phone || order.address.mobile || order.address.contactNumber}`} className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900">Contact: {order.address.phone || order.address.mobile || order.address.contactNumber}</a>}
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-8 w-full md:w-fit">
                      <div className="text-center md:text-right">
                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Total Valuation</p>
                        <Price amount={order.totalAmount} className="text-5xl font-black text-zinc-950 tracking-tighter" />
                      </div>
                      
                      {order.status === "Pending" && (
                        <button
                          onClick={() => handleClientCancel(order._id)}
                          className="w-full md:w-fit bg-zinc-950 text-white px-10 py-5 rounded-2xl hover:bg-red-600 transition-all duration-500 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 cursor-pointer"
                        >
                          Revoke Request
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
};

export default Order;
