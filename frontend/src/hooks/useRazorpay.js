// Payment hook — UPI QR + card fallback
// UPI deep link works with any UPI app (GPay, PhonePe, Paytm) — no gateway account needed

export function useRazorpay() {
  async function pay({ amount, description, onSuccess, onFailure }) {
    return new Promise(resolve => {
      // UPI deep link — replace with your actual UPI ID
      const upiId = "demo@ybl"; // Dummy UPI ID — transactions will fail, no money moves
      const upiLink = `upi://pay?pa=${upiId}&pn=TransitRewards&am=${amount}&cu=INR&tn=${encodeURIComponent(description)}`;

      const overlay = document.createElement("div");
      overlay.id = "pay-overlay";
      overlay.innerHTML = `
        <div style="position:fixed;inset:0;background:rgba(245,240,232,0.92);display:flex;align-items:center;justify-content:center;z-index:9999;font-family:'Space Grotesk',sans-serif;">
          <div style="background:#fff;border:2px solid #1a1a1a;border-radius:4px;padding:28px;width:100%;max-width:360px;box-shadow:6px 6px 0 #1a1a1a;">

            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
              <div style="font-size:16px;font-weight:800;color:#1a1a1a;">Pay ₹${amount}</div>
              <button id="pay-close" style="background:#f5f0e8;border:2px solid #1a1a1a;border-radius:4px;width:28px;height:28px;cursor:pointer;font-size:16px;">×</button>
            </div>

            <div style="font-size:11px;color:#6b5e4e;margin-bottom:20px;padding:10px;background:#f5f0e8;border:1px solid #1a1a1a;border-radius:4px;">${description}</div>

            <!-- Tabs -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;margin-bottom:20px;border:2px solid #1a1a1a;border-radius:4px;overflow:hidden;">
              <button id="tab-upi" style="padding:10px;background:#0f766e;color:#fff;border:none;font-size:12px;font-weight:700;cursor:pointer;">📱 UPI</button>
              <button id="tab-card" style="padding:10px;background:#f5f0e8;color:#1a1a1a;border:none;font-size:12px;font-weight:700;cursor:pointer;border-left:2px solid #1a1a1a;">💳 Card</button>
            </div>

            <!-- UPI panel -->
            <div id="panel-upi">
              <div style="text-align:center;margin-bottom:16px;">
                <canvas id="upi-qr" style="border:2px solid #1a1a1a;border-radius:4px;"></canvas>
                <div style="font-size:11px;color:#6b5e4e;margin-top:8px;">Scan with any UPI app</div>
                <div style="font-size:12px;font-weight:700;color:#1a1a1a;margin-top:4px;">${upiId}</div>
              </div>
              <a href="${upiLink}" style="display:block;text-align:center;padding:12px;background:#0f766e;color:#fff;border:2px solid #1a1a1a;border-radius:4px;font-size:13px;font-weight:700;text-decoration:none;box-shadow:3px 3px 0 #1a1a1a;margin-bottom:12px;">Open UPI App</a>
              <button id="upi-done" style="width:100%;padding:11px;background:#f5f0e8;color:#1a1a1a;border:2px solid #1a1a1a;border-radius:4px;font-size:13px;font-weight:700;cursor:pointer;">I've Paid ✓</button>
            </div>

            <!-- Card panel -->
            <div id="panel-card" style="display:none;">
              <div style="margin-bottom:12px;">
                <div style="font-size:10px;font-weight:700;color:#6b5e4e;letter-spacing:1px;text-transform:uppercase;margin-bottom:5px;">Card Number</div>
                <input id="mock-card" maxlength="19" placeholder="4111 1111 1111 1111" style="width:100%;padding:10px 12px;border:2px solid #1a1a1a;border-radius:4px;font-size:14px;font-family:inherit;outline:none;" />
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
                <div>
                  <div style="font-size:10px;font-weight:700;color:#6b5e4e;letter-spacing:1px;text-transform:uppercase;margin-bottom:5px;">Expiry</div>
                  <input id="mock-exp" maxlength="5" placeholder="MM/YY" style="width:100%;padding:10px 12px;border:2px solid #1a1a1a;border-radius:4px;font-size:14px;font-family:inherit;outline:none;" />
                </div>
                <div>
                  <div style="font-size:10px;font-weight:700;color:#6b5e4e;letter-spacing:1px;text-transform:uppercase;margin-bottom:5px;">CVV</div>
                  <input id="mock-cvv" maxlength="3" placeholder="123" type="password" style="width:100%;padding:10px 12px;border:2px solid #1a1a1a;border-radius:4px;font-size:14px;font-family:inherit;outline:none;" />
                </div>
              </div>
              <div id="card-error" style="color:#d94f2a;font-size:12px;font-weight:600;margin-bottom:10px;display:none;"></div>
              <button id="card-pay" style="width:100%;padding:13px;background:#0f766e;color:#fff;border:2px solid #1a1a1a;border-radius:4px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:3px 3px 0 #1a1a1a;">Pay ₹${amount}</button>
            </div>

            <div style="text-align:center;margin-top:12px;font-size:10px;color:#6b5e4e;">🔒 Secured payment</div>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);

      // Generate QR code using qrcode.js CDN
      function renderQR() {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
        script.onload = () => {
          new window.QRCode(document.getElementById("upi-qr"), {
            text: upiLink, width: 180, height: 180,
            colorDark: "#1a1a1a", colorLight: "#ffffff",
          });
        };
        document.head.appendChild(script);
      }
      renderQR();

      function cleanup() { if (document.getElementById("pay-overlay")) document.body.removeChild(overlay); }

      // Tab switching
      document.getElementById("tab-upi").onclick = () => {
        document.getElementById("panel-upi").style.display = "block";
        document.getElementById("panel-card").style.display = "none";
        document.getElementById("tab-upi").style.background = "#0f766e";
        document.getElementById("tab-upi").style.color = "#fff";
        document.getElementById("tab-card").style.background = "#f5f0e8";
        document.getElementById("tab-card").style.color = "#1a1a1a";
      };
      document.getElementById("tab-card").onclick = () => {
        document.getElementById("panel-upi").style.display = "none";
        document.getElementById("panel-card").style.display = "block";
        document.getElementById("tab-card").style.background = "#0f766e";
        document.getElementById("tab-card").style.color = "#fff";
        document.getElementById("tab-upi").style.background = "#f5f0e8";
        document.getElementById("tab-upi").style.color = "#1a1a1a";
      };

      // Close
      document.getElementById("pay-close").onclick = () => { cleanup(); onFailure?.("Payment cancelled"); resolve(); };

      // UPI "I've Paid" — trust-based confirmation
      document.getElementById("upi-done").onclick = () => {
        cleanup();
        onSuccess?.(`upi_${Date.now()}`);
        resolve();
      };

      // Card pay
      document.getElementById("mock-card").addEventListener("input", e => {
        e.target.value = e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim();
      });
      document.getElementById("card-pay").onclick = () => {
        const card = document.getElementById("mock-card").value.replace(/\s/g, "");
        const exp = document.getElementById("mock-exp").value;
        const cvv = document.getElementById("mock-cvv").value;
        const err = document.getElementById("card-error");
        if (card.length < 16) { err.textContent = "Enter a valid 16-digit card number"; err.style.display = "block"; return; }
        if (!/^\d{2}\/\d{2}$/.test(exp)) { err.textContent = "Enter expiry as MM/YY"; err.style.display = "block"; return; }
        if (cvv.length < 3) { err.textContent = "Enter a 3-digit CVV"; err.style.display = "block"; return; }
        err.style.display = "none";
        const btn = document.getElementById("card-pay");
        btn.textContent = "Processing..."; btn.disabled = true;
        setTimeout(() => { cleanup(); onSuccess?.(`pay_${Date.now()}`); resolve(); }, 1500);
      };
    });
  }

  return { pay };
}

