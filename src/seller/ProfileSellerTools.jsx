import { createElement } from "react";
import { useSearchParams } from "react-router-dom";
import { FaBoxOpen, FaChartLine, FaClipboardList, FaMotorcycle, FaPaintBrush, FaPlus } from "react-icons/fa";
import Home from "./pages/Home";
import Add from "./pages/Add";
import List from "./pages/List";
import Orders from "./pages/Orders";
import TotalSales from "./pages/TotalSales";
import DeliveryTeam from "./pages/DeliveryTeam";
import StorefrontBranding from "./pages/StorefrontBranding";

const sections = [
  { id: "overview", label: "Overview", icon: FaChartLine },
  { id: "products", label: "My Products", icon: FaBoxOpen },
  { id: "add", label: "Add Product", icon: FaPlus },
  { id: "orders", label: "Orders", icon: FaClipboardList },
  { id: "sales", label: "Sales", icon: FaChartLine },
  { id: "delivery", label: "Delivery team", icon: FaMotorcycle },
  { id: "storefront", label: "My storefront", icon: FaPaintBrush },
];

const ProfileSellerTools = ({ token, user, onUserUpdate }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = sections.some(({ id }) => id === searchParams.get("seller"))
    ? searchParams.get("seller")
    : "overview";

  const openSection = (section) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("seller", section);
    nextParams.delete("product");
    setSearchParams(nextParams);
  };

  return (
    <section className="mt-10 overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-col gap-5 border-b border-zinc-100 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">Seller workspace</p>
          <h2 className="mt-1 text-2xl font-black text-zinc-900">Manage your store</h2>
          <p className="mt-1 text-sm text-zinc-500">Your store tools are available here alongside your customer profile.</p>
        </div>
        <div className="rounded-2xl bg-zinc-50 px-4 py-3 text-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Seller ID</p>
          <p className="mt-1 font-mono text-xs font-semibold text-zinc-700">{user._id}</p>
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto border-b border-zinc-100 px-4 py-3 md:px-8">
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => openSection(id)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              activeSection === id
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            {createElement(Icon, { size: 14 })} {label}
          </button>
        ))}
      </nav>

      <div className="min-h-[24rem]">
        {activeSection === "overview" && <Home token={token} user={user} />}
        {activeSection === "products" && <List token={token} />}
        {activeSection === "add" && <Add token={token} />}
        {activeSection === "orders" && <Orders token={token} />}
        {activeSection === "sales" && <TotalSales token={token} />}
        {activeSection === "delivery" && <DeliveryTeam token={token} />}
        {activeSection === "storefront" && <StorefrontBranding token={token} user={user} onUserUpdate={onUserUpdate} />}
      </div>
    </section>
  );
};

export default ProfileSellerTools;
