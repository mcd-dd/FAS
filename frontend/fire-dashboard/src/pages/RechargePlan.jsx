import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function RechargePlanPage() {
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [paymentMethod, setPaymentMethod] = useState("upi");

  const pricing = {
    monthly: 500,
    quarterly: 1400,
    yearly: 5000,
  };

  function handleRecharge() {
    alert(
      `Recharge Successful!\nPlan: ${selectedPlan}\nAmount: ₹${pricing[selectedPlan]}\nPayment: ${paymentMethod}`
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* 🔷 NAVBAR */}
      <nav className="flex justify-between items-center px-8 py-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-blue-500">HiGrid</h1>
        <div className="space-x-6 text-sm text-slate-300">
          <Link to="/user-dashboard" className="hover:text-white">Dashboard</Link>
          <Link to="/profile" className="hover:text-white">Profile</Link>
        </div>
      </nav>

      {/* 🔷 HERO */}
      <section className="text-center py-16 bg-gradient-to-b from-slate-900 to-slate-950">
        <h2 className="text-4xl font-bold mb-4">
          Recharge Your Plan
        </h2>
        <p className="text-slate-400">
          Continue uninterrupted smart fire monitoring.
        </p>
      </section>

      {/* 🔷 RECHARGE CARD */}
      <section className="py-12 px-6">
        <div className="max-w-xl mx-auto bg-slate-900 p-10 rounded-xl shadow-xl">

          {/* Plan Selection */}
          <h3 className="text-xl font-semibold mb-4">Select Plan</h3>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {Object.keys(pricing).map(plan => (
              <div
                key={plan}
                onClick={() => setSelectedPlan(plan)}
                className={`cursor-pointer p-4 rounded-lg text-center border transition ${
                  selectedPlan === plan
                    ? "border-blue-500 bg-slate-800"
                    : "border-slate-700 hover:border-blue-400"
                }`}
              >
                <div className="capitalize font-semibold">{plan}</div>
                <div className="text-blue-400 text-lg font-bold">
                  ₹{pricing[plan]}
                </div>
              </div>
            ))}
          </div>

          {/* Payment Method */}
          <h3 className="text-xl font-semibold mb-4">Payment Method</h3>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full p-3 rounded bg-slate-800 mb-6 focus:ring-2 focus:ring-blue-500"
          >
            <option value="upi">UPI</option>
            <option value="credit">Credit Card</option>
            <option value="debit">Debit Card</option>
            <option value="bank">Net Banking</option>
          </select>

          {/* Conditional Payment Fields */}
          {paymentMethod === "upi" && (
            <input
              placeholder="Enter UPI ID"
              className="w-full p-3 rounded bg-slate-800 mb-6"
            />
          )}

          {(paymentMethod === "credit" || paymentMethod === "debit") && (
            <>
              <input
                placeholder="Card Number"
                className="w-full p-3 rounded bg-slate-800 mb-4"
              />
              <div className="flex gap-4">
                <input
                  placeholder="MM/YY"
                  className="w-1/2 p-3 rounded bg-slate-800"
                />
                <input
                  placeholder="CVV"
                  className="w-1/2 p-3 rounded bg-slate-800"
                />
              </div>
            </>
          )}

          {paymentMethod === "bank" && (
            <input
              placeholder="Select Bank"
              className="w-full p-3 rounded bg-slate-800 mb-6"
            />
          )}

          {/* Recharge Button */}
          <button
            onClick={handleRecharge}
            className="w-full mt-8 bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-medium transition"
          >
            Recharge Now
          </button>

        </div>
      </section>

      {/* 🔷 FOOTER */}
      <footer className="text-center py-6 border-t border-slate-800 text-slate-500 text-sm">
        © 2026 HiGrid Technologies. All rights reserved.
      </footer>

    </div>
  );
}
