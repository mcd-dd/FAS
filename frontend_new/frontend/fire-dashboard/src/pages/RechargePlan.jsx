import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAuthHeaders } from "../api";

const BASE =
  import.meta.env.VITE_API_BASE || "api";

export default function RechargePlanPage() {
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [history, setHistory] = useState([]);

  const pricing = {
    monthly: 500,
    quarterly: 1400,
    yearly: 5000,
  };

  // function handleRecharge() {
  //   alert(
  //     `Recharge Successful!\nPlan: ${selectedPlan}\nAmount: ₹${pricing[selectedPlan]}\nPayment: ${paymentMethod}`
  //   );
  // }

  useEffect(() => {
    async function loadHistory() {
      const res = await fetch(`${BASE}/v1/recharge/history`, {
        headers: getAuthHeaders()
      });

      if (!res.ok) return;
      const data = await res.json();
      setHistory(data);
    }

    loadHistory();
  }, []);

  async function handleRecharge() {
    const res = await fetch(`${BASE}/v1/recharge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        plan: selectedPlan,
        payment_method: paymentMethod
      })
    });

    if (!res.ok) {
      alert("Recharge failed");
      return;
    }

    alert("Recharge Successful!");
    window.location.reload(); // refresh history
  }
  // async function handleRecharge() {
  //   const res = await fetch(`${BASE}/v1/payment/create-order`, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       ...getAuthHeaders()
  //     },
  //     body: JSON.stringify({ plan: selectedPlan })
  //   });

  //   const data = await res.json();

  //   const options = {
  //     key: data.key,
  //     amount: data.amount * 100,
  //     currency: "INR",
  //     name: "HiGrid",
  //     description: "Plan Recharge",
  //     order_id: data.order_id,
  //     handler: async function (response) {
  //       await fetch(`${BASE}/v1/payment/verify`, {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           ...getAuthHeaders()
  //         },
  //         body: JSON.stringify({
  //           razorpay_payment_id: response.razorpay_payment_id,
  //           razorpay_order_id: response.razorpay_order_id,
  //           razorpay_signature: response.razorpay_signature,
  //           plan: selectedPlan
  //         })
  //       });

  //       alert("Payment Successful!");
  //       window.location.reload();
  //     }
  //   };

  //   const rzp = new window.Razorpay(options);
  //   rzp.open();
  // }
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* 🔷 NAVBAR */}
      <nav className="flex justify-between items-center px-8 py-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-blue-500">HiGrid</h1>
        <div className="space-x-6 text-sm text-slate-300">
          <Link to="/user-dashboard" className="hover:text-white">Dashboard</Link>
          <Link to="/view-profile" className="hover:text-white">Profile</Link>
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
      {/* 🔷 CONTENT SECTION */}
      <section className="py-12 px-6 max-w-5xl mx-auto space-y-12">

        {/* 🔥 Recharge History (Moved to Top) */}
        <div>
          <h3 className="text-xl font-semibold mb-4">
            Recharge History
          </h3>

          <div className="bg-slate-900 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-800 text-slate-300 text-sm">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, idx) => (
                  <tr key={idx} className="border-t border-slate-800">
                    <td className="p-3">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="p-3 capitalize">
                      {item.plan}
                    </td>
                    <td className="p-3 text-blue-400">
                      ₹{item.amount}
                    </td>
                    <td className="p-3 capitalize">
                      {item.payment_method}
                    </td>
                    <td className={`p-3 ${
                      item.status === "SUCCESS"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}>
                      {item.status}
                    </td>
                  </tr>
                ))}

                {history.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-slate-500">
                      No recharge history yet
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>
        </div>


        {/* 💳 Recharge Card */}
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
