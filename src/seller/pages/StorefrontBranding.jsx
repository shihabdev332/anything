import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { ArrowUpRight, ImagePlus, Palette, Save, Store } from "lucide-react";
import { serverUrl } from "../../../config";
import { setAuthUser } from "../../auth/session";

const StorefrontBranding = ({ token, user, onUserUpdate }) => {
  const [storeName, setStoreName] = useState(user.storeName || "");
  const [storeDescription, setStoreDescription] = useState(user.storeDescription || "");
  const [logo, setLogo] = useState(null);
  const [banner, setBanner] = useState(null);
  const [logoPreview, setLogoPreview] = useState(user.storeLogo || "");
  const [bannerPreview, setBannerPreview] = useState(user.storeBanner || "");
  const [saving, setSaving] = useState(false);
  const storeUrl = `/store/${user._id}`;

  useEffect(() => {
    setStoreName(user.storeName || "");
    setStoreDescription(user.storeDescription || "");
    setLogoPreview(user.storeLogo || "");
    setBannerPreview(user.storeBanner || "");
  }, [user]);

  const chooseImage = (event, kind) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file.");
    if (file.size > 5 * 1024 * 1024) return toast.error("Images must be 5 MB or smaller.");
    const preview = URL.createObjectURL(file);
    if (kind === "logo") {
      setLogo(file);
      setLogoPreview(preview);
    } else {
      setBanner(file);
      setBannerPreview(preview);
    }
  };

  const save = async (event) => {
    event.preventDefault();
    if (saving) return;
    const formData = new FormData();
    formData.append("storeName", storeName.trim());
    formData.append("storeDescription", storeDescription.trim());
    if (logo) formData.append("logo", logo);
    if (banner) formData.append("banner", banner);

    try {
      setSaving(true);
      const { data } = await axios.put(`${serverUrl}/api/user/seller/store-profile`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data.success) throw new Error(data.message || "Could not save store profile.");
      setAuthUser({ ...user, ...data.seller });
      onUserUpdate?.(data.seller);
      setLogo(null);
      setBanner(null);
      toast.success("Your storefront is updated.");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Could not save store profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 p-4 md:grid-cols-[minmax(0,1fr)_minmax(300px,0.9fr)] md:p-8">
      <form onSubmit={save} className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm md:p-7">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-600"><Palette size={20} /></span>
          <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">Personal branding</p><h3 className="mt-1 text-xl font-black text-zinc-900">Your public storefront</h3><p className="mt-1 text-xs leading-5 text-zinc-500">Add a store name, a short introduction and images. Your products remain connected automatically.</p></div>
        </div>

        <label className="block space-y-1.5 text-xs font-bold text-zinc-600">Store name <span className="font-normal text-zinc-400">(optional)</span>
          <input value={storeName} onChange={(event) => setStoreName(event.target.value)} maxLength={70} placeholder={user.name || "Your store name"} className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10" />
        </label>
        <label className="block space-y-1.5 text-xs font-bold text-zinc-600">About your store <span className="font-normal text-zinc-400">(optional)</span>
          <textarea value={storeDescription} onChange={(event) => setStoreDescription(event.target.value)} maxLength={500} rows={4} placeholder="Tell customers what makes your store special…" className="w-full resize-y rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium leading-6 text-zinc-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10" />
          <span className="block text-right font-normal text-zinc-400">{storeDescription.length}/500</span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="group cursor-pointer rounded-2xl border border-dashed border-zinc-300 p-4 transition hover:border-orange-400 hover:bg-orange-50/40">
            <input type="file" accept="image/*" className="sr-only" onChange={(event) => chooseImage(event, "logo")} />
            <span className="flex items-center gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-zinc-100 text-zinc-400">{logoPreview ? <img src={logoPreview} alt="Store logo preview" className="h-full w-full object-cover" loading="lazy" /> : <ImagePlus size={19} />}</span><span><span className="block text-xs font-bold text-zinc-800">Store logo</span><span className="mt-1 block text-[10px] text-zinc-500">Square image · up to 5 MB</span></span></span>
          </label>
          <label className="group cursor-pointer rounded-2xl border border-dashed border-zinc-300 p-4 transition hover:border-orange-400 hover:bg-orange-50/40">
            <input type="file" accept="image/*" className="sr-only" onChange={(event) => chooseImage(event, "banner")} />
            <span className="flex items-center gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-zinc-100 text-zinc-400">{bannerPreview ? <img src={bannerPreview} alt="Store banner preview" className="h-full w-full object-cover" loading="lazy" /> : <ImagePlus size={19} />}</span><span><span className="block text-xs font-bold text-zinc-800">Cover image</span><span className="mt-1 block text-[10px] text-zinc-500">Wide image · up to 5 MB</span></span></span>
          </label>
        </div>

        <div className="flex flex-col gap-3 border-t border-zinc-100 pt-5 sm:flex-row">
          <button type="submit" disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-wait disabled:opacity-60"><Save size={16} />{saving ? "Saving…" : "Save storefront"}</button>
          <Link to={storeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-700 transition hover:border-orange-300 hover:text-orange-700">Preview store <ArrowUpRight size={16} /></Link>
        </div>
      </form>

      <aside className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="relative h-40 overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-800 to-orange-700 sm:h-48">
          {bannerPreview && <img src={bannerPreview} alt="Store cover preview" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-black/10" />
          <span className="absolute left-5 top-5 rounded-full border border-white/25 bg-black/20 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur">Store preview</span>
        </div>
        <div className="relative px-5 pb-6 sm:px-7">
          <div className="-mt-9 grid h-[4.5rem] w-[4.5rem] place-items-center overflow-hidden rounded-2xl border-4 border-white bg-orange-50 text-orange-600 shadow-lg">{logoPreview ? <img src={logoPreview} alt="Store logo" className="h-full w-full object-cover" loading="lazy" /> : <Store size={25} />}</div>
          <h4 className="mt-4 text-xl font-black tracking-tight text-zinc-900">{storeName.trim() || user.name || "Your Store"}</h4>
          <p className="mt-2 min-h-12 whitespace-pre-line text-sm leading-6 text-zinc-500">{storeDescription.trim() || "Your store introduction will appear here. Tell customers what you sell and why they should shop with you."}</p>
          <div className="mt-5 flex items-center gap-2 border-t border-zinc-100 pt-4 text-xs font-semibold text-zinc-500"><Store size={14} className="text-orange-500" /> Products from your store appear below your brand on the public page.</div>
        </div>
      </aside>
    </div>
  );
};

export default StorefrontBranding;
