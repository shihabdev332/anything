import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import EmptyCart from "../assets/images/empty.jpg";
import { Link, useNavigate } from "react-router-dom";
import CartProduct from "../component/CartProduct";
import { resetCart } from "../redux/digitalSlice";
import Price from "../component/Price";
import toast from "react-hot-toast";
import axios from "axios";
import { serverUrl } from "../../config";
import Container from "../component/Container";
import ShippingAddress from "../component/ShippingAddress";
import { FaTrash, FaTruck, FaShieldAlt } from "react-icons/fa";
import { getAuthToken, getAuthUser } from "../auth/session";
import Seo from "../component/Seo";

const Cart = () => {
  const { products } = useSelector((state) => state.digital);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [subtotal, setSubtotal] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // User authentication state from local storage
  const [user] = useState(getAuthUser);
  const [token] = useState(getAuthToken);
  const blockedSellerProducts = products.filter((item) => {
    const sellerId = typeof item?.sellerId === "object" ? item.sellerId?._id : item?.sellerId;
    const isOwnProduct = user?._id && sellerId && String(user._id) === String(sellerId);
    const sellerOwnershipUnknown = user?.isAdmin && !sellerId;
    return isOwnProduct || sellerOwnershipUnknown;
  });

  // Shipping details state compatible with Upazila detection
  const [shippingDetails, setShippingDetails] = useState({
    city: "",
    upazila: "", 
    fullAddress: "",
    phone: "",
    position: [23.8103, 90.4125],
  });

  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");

  // Logic to calculate subtotal, discounts and final total
  useEffect(() => {
    let sub = 0;
    let discount = 0;
    let total = 0;

    products?.forEach((item) => {
      const qty = item.quantity || 1;
      const originalPrice = item.price * qty;
      const discountAmount = ((item.discountedPercentage || 0) * originalPrice) / 100;
      
      sub += originalPrice + discountAmount;
      discount += discountAmount;
      total += originalPrice;
    });

    setSubtotal(sub);
    setTotalDiscount(discount);
    setCartTotal(total);
  }, [products]);

  // Update shipping details from child component
  const handleAddressUpdate = useCallback((newDetails) => {
    setShippingDetails(newDetails);
  }, []);

  /**
   * handleClearCart:
   * Adds a confirmation step before resetting the cart state
   */
  const handleClearCart = () => {
    const confirmClear = window.confirm("Are you sure you want to clear your entire cart?");
    if (confirmClear) {
      dispatch(resetCart());
      toast.success("Cart cleared successfully");
    }
  };

  /**
   * handleCheckOut:
   * Processes the order after validating user session and shipping address
   */
  const handleCheckOut = async () => {
    if (isSubmitting) return;

    if (!user || !token) {
      toast.error("Please login first to checkout!");
      return;
    }

    if (blockedSellerProducts.length) {
      toast.error("Remove your own or unassigned products from the cart before checkout.");
      return;
    }

    const { city, upazila, fullAddress, phone } = shippingDetails;
    if (!city || !upazila || !fullAddress) {
      toast.error("Please complete your shipping address details!");
      return;
    }
    if (!phone?.trim()) {
      toast.error("Please add a phone number so the delivery person can contact you.");
      return;
    }

    const loadingToast = toast.loading("Processing your order...");
    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${serverUrl}/api/order/create`,
        {
          products: products.map((item) => ({
            productId: item._id,
            quantity: item.quantity,
          })),
          address: { ...shippingDetails, phone: phone.trim() },
          paymentMethod,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.dismiss(loadingToast);

      if (response.data.success) {
        toast.success("Order placed. Your delivery code is available in My Orders.");
        dispatch(resetCart());
        navigate("/order");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Checkout Error:", error);
      toast.error(error.response?.data?.message || "Order creation failed!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (products?.length === 0) {
    return (
      <>
      <Seo title="Shopping Cart | Digital Store" description="Review the products in your Digital Store shopping cart." path="/cart" noindex />
      <Container className="py-20 flex flex-col items-center text-center">
        <img src={EmptyCart} alt="Empty" className="w-64 md:w-80 opacity-80" loading="lazy" />
        <h2 className="text-3xl font-bold mt-8 text-zinc-900">Your cart is empty</h2>
        <Link to="/shop" className="mt-8 px-10 py-4 bg-zinc-900 text-white rounded-full font-bold hover:bg-orange-600 transition-all shadow-lg">
          Start Shopping
        </Link>
      </Container>
      </>
    );
  }

  return (
    <>
    <Seo title="Checkout | Digital Store" description="Review your cart and delivery details before placing your Digital Store order." path="/cart" noindex />
    <Container className="py-10">
      <div className="flex flex-col gap-10">
        <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight">Checkout</h1>
        
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content: Products & Address */}
          <div className="flex-1 space-y-10">
            <div className="bg-white rounded-3xl border border-zinc-100 p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Review Items</h2>
                <button 
                  onClick={handleClearCart} 
                  className="text-red-500 text-sm font-bold flex items-center gap-1 transition-transform active:scale-90 hover:opacity-80 cursor-pointer"
                >
                  <FaTrash size={12}/> Clear Cart
                </button>
              </div>
              {blockedSellerProducts.length > 0 && (
                <p className="mb-5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800">
                  Sellers cannot purchase their own products or listings without an assigned seller. Remove the highlighted item{blockedSellerProducts.length > 1 ? "s" : ""} to continue.
                </p>
              )}
              <div className="space-y-6">
                {products.map((item) => (
                  <CartProduct key={item._id} item={item} />
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
               <ShippingAddress onAddressUpdate={handleAddressUpdate} />
            </div>
          </div>

          {/* Sticky Payment Summary Sidebar */}
          <div className="lg:w-[420px]">
            <div className="bg-zinc-900 text-white rounded-[2.5rem] p-8 md:p-10 sticky top-28 shadow-2xl">
              <h2 className="text-2xl font-bold mb-8">Payment Summary</h2>
              
              <div className="space-y-5 mb-10">
                <div className="flex justify-between text-zinc-400 font-medium">
                  <span>Subtotal</span>
                  <Price amount={subtotal} className="text-white" />
                </div>
                <div className="flex justify-between text-zinc-400 font-medium">
                  <span>Savings</span>
                  <span className="text-orange-400 font-bold">-<Price amount={totalDiscount} /></span>
                </div>
                <div className="h-[1px] bg-zinc-800 my-2"></div>
                <div className="flex justify-between text-2xl font-black">
                  <span>Order Total</span>
                  <Price amount={cartTotal} />
                </div>
              </div>

              <div className="mb-8">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3">Select Payment</p>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-4 text-sm font-bold outline-none focus:border-orange-500 transition-all cursor-pointer"
                >
                  <option value="Cash on Delivery">Cash on Delivery</option>
                  <option value="Online Payment" disabled>Online Payment (Coming Soon)</option>
                </select>
              </div>

              <button 
                onClick={handleCheckOut}
                disabled={blockedSellerProducts.length > 0 || isSubmitting}
                className="w-full py-5 bg-orange-600 hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-zinc-500 disabled:hover:bg-zinc-500 text-white rounded-2xl font-black uppercase tracking-[0.15em] transition-all shadow-lg active:scale-95 mb-6 cursor-pointer"
              >
                {blockedSellerProducts.length > 0
                  ? "Remove Blocked Product First"
                  : isSubmitting ? "Placing Order..." : "Place My Order"}
              </button>

              <div className="flex items-center justify-around opacity-40">
                <div className="flex flex-col items-center gap-1 text-[9px] uppercase font-black">
                  <FaTruck size={16}/> <span>Fast Ship</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-[9px] uppercase font-black">
                  <FaShieldAlt size={16}/> <span>Secure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
    </>
  );
};

export default Cart;
