// Real Razorpay integration
// Uses Razorpay checkout.js loaded dynamically — no npm package needed

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
  async function pay({ amount, description, onSuccess, onFailure }) {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      onFailure?.("Failed to load payment gateway. Check your connection.");
      return;
    }

    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!keyId) {
      onFailure?.("Razorpay key not configured.");
      return;
    }

    const options = {
      key: keyId,
      amount: amount * 100,          // Razorpay expects paise
      currency: "INR",
      name: "TRIPP.",
      description,
      image: "",                      // optional logo URL
      handler: function (response) {
        // response.razorpay_payment_id is the payment ID on success
        onSuccess?.(response.razorpay_payment_id);
      },
      prefill: {
        name: "",
        email: "",
        contact: "",
      },
      theme: {
        color: "#0f766e",
      },
      modal: {
        ondismiss: () => {
          onFailure?.("Payment cancelled");
        },
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
