import React from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { persistor } from "../redux/store";
import { removeUser, resetCart } from "../redux/digitalSlice";
import { clearAuthSession } from "../auth/session";

const LogOut = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogOut = async () => {
    try {
      // Clear user-scoped Redux data and wait until the empty state is persisted.
      dispatch(resetCart());
      dispatch(removeUser());
      await persistor.flush();

      // Clear user authentication
      clearAuthSession();
      await persistor.purge();

      // Show success toast
      toast.success("Logged out successfully!", {
        position: "top-center",
        style: {
          background: "#333",
          color: "#fff",
        },
        duration: 2000,
      });

      navigate("/signin", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      // If persistence could not flush, remove its old snapshot as a fallback.
      clearAuthSession();
      await persistor.purge().catch(() => {});
      navigate("/signin", { replace: true });
      toast.error("Session cleared, but local storage could not be synchronized.", {
        position: "top-center",
      });
    }
  };

  return (
    <button
      onClick={handleLogOut}
      className="flex items-center justify-center gap-2 px-5 py-2 
                 bg-gradient-to-r from-orange-500 to-orange-600
                 hover:from-orange-600 hover:to-orange-700
                 text-white font-medium rounded-full shadow-md
                 transition-all duration-300 ease-in-out 
                 active:scale-95 cursor-pointer"
    >
      <FiLogOut className="text-lg" />
      Log Out
    </button>
  );
};

export default LogOut;
