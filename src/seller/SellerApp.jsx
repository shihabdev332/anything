import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./component/Navbar";
import Sidebar from "./component/Sidebar";
import Login from "./component/Login";
import Home from "./pages/Home";
import Add from "./pages/Add";
import List from "./pages/List";
import Orders from "./pages/Orders";
import User from "./pages/User";
import TotalSales from "./pages/TotalSales";
import { getSellerToken, setSellerToken } from "./session";

const SellerApp = () => {
  const [token, setToken] = useState(getSellerToken);

  useEffect(() => {
    if (token) {
      setSellerToken(token);
    } else {
      setSellerToken("");
    }
  }, [token]);

  return (
    <main className="seller-panel min-h-screen w-full bg-gray-50">
      {token ? (
        <>
          <Navbar token={token} setToken={setToken} />
          <div className="flex w-full">
            <aside className="fixed min-h-screen w-[18%] border-r border-gray-400 bg-white shadow-2xl">
              <Sidebar />
            </aside>
            <section className="ml-[18%] min-w-0 flex-1 px-5 py-2">
              <Routes>
                <Route path="/" element={<Home token={token} />} />
                <Route path="add" element={<Add token={token} />} />
                <Route path="add/:id" element={<Add token={token} />} />
                <Route path="list" element={<List token={token} />} />
                <Route path="order" element={<Orders token={token} />} />
                <Route path="user" element={<User token={token} />} />
                <Route path="sales" element={<TotalSales token={token} />} />
                <Route path="*" element={<Navigate to="/seller" replace />} />
              </Routes>
            </section>
          </div>
        </>
      ) : (
        <Login setToken={setToken} />
      )}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: "#000000", color: "#ffffff" },
        }}
      />
    </main>
  );
};

export default SellerApp;
