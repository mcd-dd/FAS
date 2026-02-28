import React, { useState } from "react";
import { Link } from "react-router-dom";
import { registerUser } from "../api";

export default function UserSignupPage() {
  const [form, setForm] = useState({});
  const [amount, setAmount] = useState(null);

  const pricing = {
    monthly: 500,
    quarterly: 1400,
    yearly: 5000
  };

  function handlePlanChange(plan) {
    setForm({ ...form, plan });
    setAmount(pricing[plan]);
  }

  async function handleSubmit() {
    try {
      const res = await registerUser(form);
      alert(`Registered successfully. Amount ₹${res.amount}`);
    } catch (err) {
      alert("Registration failed: " + err.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-8 py-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-blue-500">HiGrid</h1>
        <div className="space-x-6 text-sm text-slate-300">
          <a href="#" className="hover:text-white">Home</a>
          <a href="#" className="hover:text-white">Features</a>
          <a href="#" className="hover:text-white">Pricing</a>
          <Link to="/user-login" className="hover:text-white">Login</Link>
          <a href="#" className="hover:text-white">Contact</a>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="text-center py-20 px-6 bg-gradient-to-b from-slate-900 to-slate-950">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Smart Fire Detection & Monitoring
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          HiGrid delivers real-time fire detection, instant alerts, and direct
          integration with fire stations to protect lives and property.
        </p>
      </section>

      {/* PRICING SECTION */}
      <section className="py-16 px-6 bg-slate-900">
        <h3 className="text-3xl font-semibold text-center mb-10">
          Choose Your Plan
        </h3>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {Object.keys(pricing).map(plan => (
            <div
              key={plan}
              onClick={() => handlePlanChange(plan)}
              className={`cursor-pointer p-6 rounded-xl border ${
                form.plan === plan
                  ? "border-blue-500 bg-slate-800"
                  : "border-slate-700 bg-slate-800 hover:border-blue-400"
              } transition`}
            >
              <h4 className="text-xl font-semibold capitalize mb-4">
                {plan}
              </h4>
              <p className="text-3xl font-bold text-blue-400 mb-4">
                ₹{pricing[plan]}
              </p>
              <p className="text-slate-400 text-sm">
                Real-time monitoring, emergency alerts, and cloud dashboard access.
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SIGNUP FORM */}
      <section className="py-20 px-6 bg-slate-950">
        <div className="max-w-xl mx-auto bg-slate-900 p-10 rounded-xl shadow-xl">
          <h3 className="text-2xl font-semibold mb-8 text-center">
            Create Your Account
          </h3>

          <div className="space-y-4">

            <input
              className="w-full p-3 rounded bg-slate-800"
              placeholder="Full Name"
              onChange={e => setForm({ ...form, name: e.target.value })}
            />

            <input
              className="w-full p-3 rounded bg-slate-800"
              placeholder="Mobile Number"
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />

            <input
              className="w-full p-3 rounded bg-slate-800"
              placeholder="Address"
              onChange={e => setForm({ ...form, address: e.target.value })}
            />

            <input
              className="w-full p-3 rounded bg-slate-800"
              placeholder="Email"
              onChange={e => setForm({ ...form, email: e.target.value })}
            />

            <input
              className="w-full p-3 rounded bg-slate-800"
              placeholder="Username"
              onChange={e => setForm({ ...form, username: e.target.value })}
            />

            <input
              type="password"
              className="w-full p-3 rounded bg-slate-800"
              placeholder="Password"
              onChange={e => setForm({ ...form, password: e.target.value })}
            />

            {amount && (
              <div className="text-green-400 text-center text-sm mt-2">
                Selected Plan Amount: ₹{amount}
              </div>
            )}

            <button
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-medium mt-6"
            >
              Register Now
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-6 border-t border-slate-800 text-slate-500 text-sm">
        © 2026 HiGrid Technologies. All rights reserved.
      </footer>

    </div>
  );
}
