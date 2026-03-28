function loadRazorpayScript() {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function useRazorpay() {
  async function pay({ amount, description, themeColor, onSuccess, onFailure }) {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      onFailure?.("Failed to load payment gateway.");
      return;
    }

    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!keyId) {
      onFailure?.("Razorpay key not configured.");
      return;
    }

    const options = {
      key: keyId,
      amount: amount * 100,
      currency: "INR",
      name: "TRIPP.",
      description,

      // Force only UPI + card, UPI listed first
      method: {
        upi: true,
        card: true,
        netbanking: false,
        wallet: false,
        emi: false,
        paylater: false,
      },

      // Pre-fill test UPI VPA so user just hits pay
      prefill: {
        vpa: "success@razorpay",
      },

      handler: function (response) {
        onSuccess?.(response.razorpay_payment_id);
      },

      theme: {
        color: themeColor || "#0f766e",
      },

      modal: {
        ondismiss: () => onFailure?.("Payment cancelled"),
        escape: true,
        animation: true,
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", function (response) {
      onFailure?.(response.error?.description || "Payment failed");
    });
    rzp.open();
  }

  return { pay };
}
