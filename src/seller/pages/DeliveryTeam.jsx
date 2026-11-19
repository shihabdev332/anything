import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { serverUrl } from "../../../config";
import { FaMotorcycle, FaPlus, FaShieldAlt, FaUser } from "react-icons/fa";

const blankForm = { name: "", email: "", phone: "", password: "" };

const DeliveryTeam = ({ token }) => {
  const [team, setTeam] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState("");
  const [error, setError] = useState("");

  const loadTeam = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${serverUrl}/api/delivery/team`, { headers: { Authorization: `Bearer ${token}` } });
      setTeam(data.team || []);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not load your delivery team.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadTeam(); }, [loadTeam]);

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);
      const { data } = await axios.post(`${serverUrl}/api/delivery/team`, form, { headers: { Authorization: `Bearer ${token}` } });
      setTeam((current) => [data.deliveryMan, ...current]);
      setForm(blankForm);
      toast.success("Delivery account created. Share the login details securely.");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Could not create delivery account.");
    } finally {
      setSubmitting(false);
    }
  };

  const removeAccess = async (member) => {
    if (!window.confirm(`Remove delivery access for ${member.name}? Their account will remain available for shopping.`)) return;
    try {
      setRemovingId(member._id);
      const { data } = await axios.delete(`${serverUrl}/api/delivery/team/${member._id}`, { headers: { Authorization: `Bearer ${token}` } });
      setTeam((current) => current.filter((person) => person._id !== member._id));
      toast.success(data.message || "Delivery access removed.");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Could not remove delivery access.");
    } finally {
      setRemovingId("");
    }
  };

  const inputClass = "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10";

  return (
    <div className="grid gap-6 bg-slate-50 p-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:p-8">
      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm md:p-7">
        <div className="mb-6 flex items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-600"><FaMotorcycle size={20} /></span>
          <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">Delivery access</p><h3 className="mt-1 text-xl font-black text-zinc-900">Add a delivery person</h3><p className="mt-1 text-xs leading-5 text-zinc-500">The account can shop as a customer and only see deliveries assigned by your store.</p></div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-1.5 text-xs font-bold text-zinc-600">Full name<input className={inputClass} required minLength={2} maxLength={80} autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Delivery person's name" /></label>
          <label className="block space-y-1.5 text-xs font-bold text-zinc-600">Email<input className={inputClass} required type="email" maxLength={254} autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="name@example.com" /></label>
          <label className="block space-y-1.5 text-xs font-bold text-zinc-600">Phone number <span className="font-normal text-zinc-400">(optional)</span><input className={inputClass} type="tel" minLength={5} maxLength={30} autoComplete="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Contact number" /></label>
          <label className="block space-y-1.5 text-xs font-bold text-zinc-600">Temporary password<input className={inputClass} required type="password" minLength={10} maxLength={72} autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 10 characters" /><span className="block font-normal text-zinc-400">Share it with the delivery person through a secure channel.</span></label>
          <button disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-wait disabled:opacity-60"><FaPlus size={12} />{submitting ? "Creating account…" : "Create delivery account"}</button>
        </form>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm md:p-7">
        <div className="mb-5 flex items-center justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Your store</p><h3 className="mt-1 text-xl font-black text-zinc-900">Delivery team</h3></div><span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600">{team.length} members</span></div>
        {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}<button type="button" onClick={loadTeam} className="ml-2 font-bold underline">Retry</button></div>}
        {loading ? <div className="space-y-3">{[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-zinc-100" />)}</div> : team.length ? (
          <div className="divide-y divide-zinc-100">
            {team.map((member) => <article key={member._id} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-600">{member.avatar ? <img src={member.avatar} alt="" className="h-full w-full rounded-2xl object-cover" loading="lazy" /> : <FaUser />}</span>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-zinc-900">{member.name}</p><p className="truncate text-xs text-zinc-500">{member.email}</p><p className="mt-0.5 text-xs text-zinc-500">{member.deliveryPhone}</p></div>
              <div className="flex items-center gap-2">
                <span title="Account scoped to this seller" className="grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-emerald-600"><FaShieldAlt size={13} /></span>
                <button type="button" disabled={removingId === member._id} onClick={() => removeAccess(member)} className="rounded-lg border border-zinc-200 px-3 py-2 text-[11px] font-bold text-zinc-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50">{removingId === member._id ? "Removing…" : "Remove"}</button>
              </div>
            </article>)}
          </div>
        ) : <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-5 py-10 text-center"><FaMotorcycle className="mx-auto text-2xl text-zinc-300" /><p className="mt-3 text-sm font-bold text-zinc-700">No delivery accounts yet</p><p className="mt-1 text-xs text-zinc-500">Create an account to start assigning orders.</p></div>}
      </section>
    </div>
  );
};

export default DeliveryTeam;
