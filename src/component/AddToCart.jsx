import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  deleteProduct,
} from "../redux/digitalSlice";
import { twMerge } from "tailwind-merge";
import { FaPlus } from "react-icons/fa";
import { TiMinus } from "react-icons/ti";
import { getAuthUser } from "../auth/session";

const AddToCart = ({ item, className }) => {
  const dispatch = useDispatch();

  const handleAddToCart = () => {
    const availableStock = Number(item?.stock);
    if (item?.isAvailable !== true || !Number.isSafeInteger(availableStock) || availableStock < 1) {
      toast.error("This product is currently out of stock.");
      return;
    }
    dispatch(addToCart(item));
    toast.success(`${item?.name} added Successfully`);
  };

  const { products } = useSelector((state) => state.digital);
  const [cartProduct, setCartProduct] = useState(null);
  let currentUser = null;
  try {
    currentUser = getAuthUser();
  } catch {
    currentUser = null;
  }
  const currentSellerId = typeof item?.sellerId === "object" ? item.sellerId?._id : item?.sellerId;
  const isOwnProduct = currentUser?._id && currentSellerId && String(currentUser._id) === String(currentSellerId);
  const sellerOwnershipUnknown = Boolean(currentUser?.isAdmin && !currentSellerId);

  useEffect(() => {
    const existingProduct = products?.find(
      (product) => product?._id === item?._id
    );
    setCartProduct(existingProduct);
  }, [item, products]);

  const handleIncreaseQuantity = () => {
    const availableStock = Number(item?.stock);
    if (!Number.isSafeInteger(availableStock) || cartProduct?.quantity >= availableStock) {
      toast.error("There is not enough stock for another item.");
      return;
    }
    dispatch(increaseQuantity(item?._id));
    toast.success(`${item?.name} increased Successfully`);
  };
  const handleDecreaseQuantity = () => {
    dispatch(decreaseQuantity(item?._id));
    toast.success(`${item?.name} decreased Successfully`);
  };

  if (isOwnProduct || sellerOwnershipUnknown) {
    return (
      <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-orange-50 px-4 py-2 text-xs font-bold text-orange-700">
        <span>{isOwnProduct ? "Your own listing" : "Seller ownership not assigned"}</span>
        {cartProduct && (
          <button
            type="button"
            onClick={() => dispatch(deleteProduct(item?._id))}
            className="underline underline-offset-2 hover:text-orange-900"
          >
            Remove
          </button>
        )}
      </div>
    );
  }

  if (item?.isAvailable !== true || !Number.isSafeInteger(Number(item?.stock)) || Number(item?.stock) < 1) {
    return (
      <div className="space-y-2">
        <button type="button" disabled className={twMerge("w-full rounded-xl bg-zinc-200 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500", className)}>
          {Number(item?.stock) < 1 ? "Out of Stock" : "Unavailable"}
        </button>
        {cartProduct && <button type="button" onClick={() => dispatch(deleteProduct(item?._id))} className="w-full text-xs font-semibold text-red-600 underline underline-offset-2">Remove from cart</button>}
      </div>
    );
  }

  return (
    <div>
      {cartProduct ? (
        <div className="w-32 h-full flex items-center justify-between font-bold bg-gray-200 rounded-md text-2xl ">
          <button
            disabled={cartProduct?.quantity === 1}
            className="cursor-pointer  text-gray-600 hover:text-black disabled:cursor-not-allowed"
            onClick={handleDecreaseQuantity}
          >
            <TiMinus />
          </button>

          <p>{cartProduct?.quantity}</p>
          <FaPlus
            onClick={handleIncreaseQuantity}
            className="text-gray-600 hover:text-black cursor-pointer"
          />
        </div>
      ) : (
        <button
          onClick={handleAddToCart}
          className={twMerge(
            "bg-black/80 text-white/80 text-sm font-medium py-2 w-full rounded-md mt-2 hover:text-white hover:bg-black  cursor-pointer",
            className
          )}
        >
          Add To Cart
        </button>
      )}
    </div>
  );
};
export default AddToCart;
