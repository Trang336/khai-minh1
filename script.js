/* Website Khai Minh - JS thuần */

// 1) Dán URL Web App (Google Apps Script) của bạn vào đây để lưu Google Sheets.
// Nếu để rỗng, form vẫn chạy nhưng chỉ hiển thị thông báo (không gửi đi).
const SHEETS_ENDPOINT = ""; // ví dụ: "https://script.google.com/macros/s/XXXX/exec"

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function setYear() {
  const y = $("#year");
  if (y) y.textContent = String(new Date().getFullYear());
}

function headerShadowOnScroll() {
  const header = document.querySelector("[data-header]");
  if (!header) return;

  const onScroll = () => {
    const scrolled = window.scrollY > 10;
    header.classList.toggle("is-scrolled", scrolled);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function mobileNav() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    document.documentElement.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
  };

  toggle.addEventListener("click", () => {
    const open = document.documentElement.classList.contains("nav-open");
    setOpen(!open);
  });

  // đóng menu khi click link
  nav.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    setOpen(false);
  });

  // đóng khi bấm ESC
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
}

function revealOnScroll() {
  const items = $$("[data-reveal]");
  if (!items.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const ent of entries) {
        if (ent.isIntersecting) {
          ent.target.classList.add("is-visible");
          io.unobserve(ent.target);
        }
      }
    },
    { threshold: 0.12 }
  );

  items.forEach((el) => io.observe(el));
}

function animateCounters() {
  const counters = $$("[data-counter]");
  if (!counters.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const ent of entries) {
        if (!ent.isIntersecting) continue;
        const el = ent.target;
        io.unobserve(el);
        const to = Number(el.getAttribute("data-counter") || "0");
        const dur = 1100;
        const t0 = performance.now();

        const tick = (t) => {
          const p = Math.min(1, (t - t0) / dur);
          const ease = 1 - Math.pow(1 - p, 3);
          el.textContent = String(Math.round(to * ease));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    },
    { threshold: 0.6 }
  );

  counters.forEach((el) => io.observe(el));
}

function toastShow(message, type = "success") {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${type}`;
}

function toastHide() {
  const toast = $("#toast");
  if (!toast) return;
  toast.className = "toast";
  toast.textContent = "";
}

function setFieldError(name, message = "") {
  const error = document.querySelector(`[data-error-for="${name}"]`);
  if (error) error.textContent = message;
}

function validateEmail(s) {
  if (!s) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function normalizePhone(s) {
  return (s || "").replace(/[^\d+]/g, "").trim();
}

function validateForm(data) {
  let ok = true;
  setFieldError("name");
  setFieldError("phone");
  setFieldError("email");

  if (!data.name || data.name.trim().length < 2) {
    setFieldError("name", "Vui lòng nhập họ tên (tối thiểu 2 ký tự).");
    ok = false;
  }

  const phone = normalizePhone(data.phone);
  const isPhoneOk = /^(\+?84|0)\d{8,10}$/.test(phone);
  if (!phone || !isPhoneOk) {
    setFieldError("phone", "SĐT chưa đúng định dạng (ví dụ: 0909xxxxxx).");
    ok = false;
  }

  if (!validateEmail(data.email || "")) {
    setFieldError("email", "Email chưa đúng định dạng.");
    ok = false;
  }

  return ok;
}

async function submitToSheets(payload) {
  // Gửi kiểu form-urlencoded để dễ tương thích với Apps Script.
  const body = new URLSearchParams(payload);

  // Lưu ý CORS:
  // - Apps Script đôi khi không trả được CORS headers cho website tĩnh.
  // - `mode: "no-cors"` sẽ tạo request gửi đi, response opaque (không đọc được).
  // - Vì vậy ta coi như "đã gửi" nếu request không throw.
  await fetch(SHEETS_ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  });
}

function leadForm() {
  const form = $("#leadForm");
  const btn = $("#submitBtn");
  if (!form || !btn) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    toastHide();

    const honeypot = form.elements.website?.value || "";
    if (honeypot) return; // spam bot

    const data = {
      name: form.elements.name?.value || "",
      phone: form.elements.phone?.value || "",
      email: form.elements.email?.value || "",
      service: form.elements.service?.value || "",
      message: form.elements.message?.value || "",
      source: window.location.href,
    };

    if (!validateForm(data)) {
      toastShow("Vui lòng kiểm tra lại thông tin bắt buộc.", "error");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Đang gửi...";

    try {
      if (!SHEETS_ENDPOINT) {
        // Chưa cấu hình: vẫn giả lập thành công để bạn xem UI.
        await new Promise((r) => setTimeout(r, 700));
      } else {
        await submitToSheets(data);
      }

      form.reset();
      toastShow("Đã gửi đăng ký. Khai Minh sẽ liên hệ sớm!", "success");
    } catch (err) {
      console.error(err);
      toastShow("Gửi thất bại. Vui lòng thử lại hoặc liên hệ qua hotline.", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Gửi đăng ký";
    }
  });
}

setYear();
headerShadowOnScroll();
mobileNav();
revealOnScroll();
animateCounters();
leadForm();

