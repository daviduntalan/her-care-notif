const packages = [
  {
    id: "basic-prenatal",
    name: "Basic Prenatal Visit",
    price: 500,
    priceLabel: "₱500",
    featured: false,
    includes: [
      "Maternal vital signs",
      "Weight monitoring",
      "Fetal heart rate monitoring",
      "Fundic height assessment",
      "Basic pregnancy assessment",
      "Health education",
    ],
  },
  {
    id: "prenatal-plus",
    name: "Prenatal Plus",
    price: 750,
    priceLabel: "₱750",
    featured: true,
    includes: [
      "Everything in Basic Prenatal Visit",
      "More comprehensive pregnancy counseling",
      "Nutrition education",
      "Birth preparation guidance",
      "Breastfeeding preparation",
      "Pregnancy danger-sign education",
    ],
  },
  {
    id: "prenatal-tetanus",
    name: "Prenatal + Tetanus Immunization",
    price: 850,
    priceLabel: "₱850 + vaccine cost",
    priceNote: "if applicable",
    featured: false,
    includes: [
      "Prenatal assessment",
      "Immunization history review",
      "Tetanus-containing vaccine administration when indicated",
      "Vaccine counseling",
      "Documentation",
      "Post-vaccination instructions",
    ],
  },
  {
    id: "postpartum",
    name: "Postpartum Home Visit",
    price: 600,
    priceLabel: "₱600",
    featured: false,
    includes: [
      "Maternal assessment",
      "Vital signs",
      "Postpartum education",
      "Breastfeeding support",
      "Newborn care guidance",
      "Warning-sign education",
    ],
  },
  {
    id: "new-mom",
    name: "New Mom Care Package",
    price: 1000,
    priceLabel: "₱1,000",
    featured: false,
    includes: [
      "Prenatal/postpartum consultation",
      "Breastfeeding guidance",
      "Newborn care education",
      "Maternal self-care education",
      "Personalized questions and counseling",
    ],
  },
];

const midwives = [
  {
    id: "midwife-a",
    name: "Ty, Everrt Joyce",
    initials: "TE",
    photo: "images/mid-a.png",
    credential: "Registered Midwife",
    services: ["Prenatal Care", "Postpartum Care", "Breastfeeding Support"],
    about:
      "Available for home-based prenatal and postpartum care, including breastfeeding support for mothers who need flexible scheduling.",
  },
  {
    id: "midwife-b",
    name: "Abalos, Ivy Maricar",
    initials: "AI",
    photo: "images/mid-b.png",
    credential: "Registered Midwife",
    services: [
      "Prenatal Care",
      "Birth Preparation",
      "First-Time Mother Support",
    ],
    about:
      "Supports prenatal home care, birth preparation, and first-time mothers who want additional guidance before delivery.",
  },
  {
    id: "midwife-c",
    name: "Gabaldon, Jana Ishi",
    initials: "GJ",
    photo: "images/mid-c.png",
    credential: "Registered Midwife",
    services: ["Prenatal Care", "Postpartum Care", "Newborn Care Guidance"],
    about:
      "Provides prenatal and postpartum home support with a focus on newborn-care guidance and maternal education.",
  },
  {
    id: "midwife-d",
    name: "Iligan, Lykah Laurence",
    initials: "IL",
    photo: "images/mid-d.png",
    credential: "Registered Midwife",
    services: [
      "Prenatal Care",
      "Birth Preparation",
      "First-Time Mother Support",
    ],
    about:
      "Supports prenatal home care, birth preparation, and first-time mothers who want additional guidance before delivery.",
  },
];

const $ = (id) => document.getElementById(id);
const peso = (amount) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);

function escapeHTML(value = "") {
  return String(value).replace(
    /[&<>'"]/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#039;",
        '"': "&quot;",
      })[char],
  );
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(
    () => toast.classList.add("hidden"),
    2800,
  );
}

function renderPackages() {
  $("packageGrid").innerHTML = packages
    .map(
      (pkg) => `
    <article class="package-card ${pkg.featured ? "featured" : ""}">
      <span class="eyebrow">${pkg.featured ? "POPULAR HOME-VISIT OPTION" : "HERCARE PACKAGE"}</span>
      <h3>${pkg.name}</h3>
      <div class="price">${pkg.priceLabel}${pkg.priceNote ? `<small>${pkg.priceNote}</small>` : ""}</div>
      <ul>${pkg.includes.map((item) => `<li>${item}</li>`).join("")}</ul>
      <button class="btn ${pkg.featured ? "btn-primary" : "btn-soft"} choose-package" type="button" data-package="${pkg.id}">Choose package</button>
    </article>
  `,
    )
    .join("");

  $("packageChoices").innerHTML = packages
    .map(
      (pkg) => `
    <button class="package-choice" type="button" data-package="${pkg.id}" aria-pressed="false">
      <strong>${pkg.name}</strong>
      <span>${pkg.priceLabel}${pkg.priceNote ? ` • ${pkg.priceNote}` : ""}</span>
    </button>
  `,
    )
    .join("");

  document.querySelectorAll(".choose-package").forEach((button) => {
    button.addEventListener("click", () => {
      selectPackage(button.dataset.package);
      $("booking").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  document.querySelectorAll(".package-choice").forEach((button) => {
    button.addEventListener("click", () =>
      selectPackage(button.dataset.package),
    );
  });
}

function selectPackage(id) {
  const pkg = packages.find((p) => p.id === id);
  if (!pkg) return;
  $("packageSelect").value = id;
  document.querySelectorAll(".package-choice").forEach((button) => {
    const active = button.dataset.package === id;
    button.classList.toggle("selected", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
  updateBookingSummary();
}

function renderMidwives() {
  $("midwifeGrid").innerHTML = midwives
    .map(
      (midwife) => `
    <article class="midwife-card">
      <div class="midwife-head">        
        <img
          class="midwife-photo"
          src="${midwife.photo}"
          alt="${midwife.name}"
        >
        <div><h3>${midwife.name}</h3><div class="sub">${midwife.credential}</div></div>
      </div>
      <div class="tag-row">${midwife.services.map((service) => `<span class="tag">${service}</span>`).join("")}</div>
      <div class="availability"><strong>Available for:</strong><br>${midwife.services.join(" • ")}</div>
      <div class="midwife-actions">
        <button class="btn btn-outline view-profile" type="button" data-midwife="${midwife.id}">View Profile</button>
        <button class="btn btn-soft choose-midwife" type="button" data-midwife="${midwife.id}">Choose Midwife</button>
      </div>
    </article>
  `,
    )
    .join("");

  $("midwifeSelect").innerHTML = `
    <option value="">Select preference</option>
    ${midwives.map((midwife) => `<option value="${midwife.id}">${midwife.name} — ${midwife.credential}</option>`).join("")}
    <option value="any">Assign me any available HerCare midwife</option>
  `;

  document.querySelectorAll(".view-profile").forEach((button) => {
    button.addEventListener("click", () => openProfile(button.dataset.midwife));
  });
  document.querySelectorAll(".choose-midwife").forEach((button) => {
    button.addEventListener("click", () => {
      $("midwifeSelect").value = button.dataset.midwife;
      updateMidwifeInfo();
      $("booking").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function openProfile(id) {
  const midwife = midwives.find((m) => m.id === id);
  if (!midwife) return;
  $("profileContent").innerHTML = `
    <div class="midwife-head" style="margin:8px 0 16px">
      <img
        class="midwife-photo profile-photo"
        src="${midwife.photo}"
        alt="${midwife.name}"
      >
      <div><h2 id="profileTitle">${midwife.name}</h2><p class="profile-meta">${midwife.credential}</p></div>
    </div>
    <p>${midwife.about}</p>
    <strong>Available services</strong>
    <ul class="profile-list">${midwife.services.map((service) => `<li>${service}</li>`).join("")}</ul>
    <button class="btn btn-primary btn-full" type="button" id="profileChoose">Choose ${midwife.name}</button>
  `;
  $("profileModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
  $("profileChoose").addEventListener("click", () => {
    $("midwifeSelect").value = midwife.id;
    updateMidwifeInfo();
    closeProfile();
    $("booking").scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function closeProfile() {
  $("profileModal").classList.add("hidden");
  document.body.style.overflow = "";
}

function updateMidwifeInfo() {
  const value = $("midwifeSelect").value;
  if (!value) {
    $("selectedMidwife").textContent =
      "Select a midwife to see her available services.";
  } else if (value === "any") {
    $("selectedMidwife").innerHTML =
      "<strong>Any available HerCare midwife</strong><br>HerCare will assign an available midwife based on the selected schedule, service, and location.";
  } else {
    const midwife = midwives.find((m) => m.id === value);
    $("selectedMidwife").innerHTML =
      `<strong>${midwife.name}</strong> • ${midwife.services.join(" • ")}`;
  }
  updateBookingSummary();
}

function localDateISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function configureDateField() {
  const today = new Date();
  const max = new Date(today);
  max.setDate(max.getDate() + 60);
  $("dateSelect").min = localDateISO(today);
  $("dateSelect").max = localDateISO(max);
}

function formatDate(value) {
  if (!value) return "Not selected";
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function selectedPackage() {
  return packages.find((pkg) => pkg.id === $("packageSelect").value);
}

function selectedMidwifeName() {
  const value = $("midwifeSelect").value;
  if (value === "any") return "Any available HerCare midwife";
  return midwives.find((m) => m.id === value)?.name || "Not selected";
}

function updateBookingSummary() {
  const pkg = selectedPackage();
  const values = {
    service: $("serviceSelect").value || "Not selected",
    packageName: pkg?.name || "Not selected",
    date: formatDate($("dateSelect").value),
    time: $("timeSelect").value || "Not selected",
    midwife: selectedMidwifeName(),
    fee: pkg
      ? pkg.priceLabel + (pkg.priceNote ? ` (${pkg.priceNote})` : "")
      : "Not selected",
    address: $("homeAddress").value.trim() || "Not provided",
  };
  $("bookingSummary").innerHTML = `
    <div class="summary-grid">
      <div class="summary-item"><small>Service</small><strong>${escapeHTML(values.service)}</strong></div>
      <div class="summary-item"><small>Package</small><strong>${escapeHTML(values.packageName)}</strong></div>
      <div class="summary-item"><small>Date</small><strong>${escapeHTML(values.date)}</strong></div>
      <div class="summary-item"><small>Time</small><strong>${escapeHTML(values.time)}</strong></div>
      <div class="summary-item"><small>Preferred Midwife</small><strong>${escapeHTML(values.midwife)}</strong></div>
      <div class="summary-item"><small>Home Visit Fee</small><strong>${escapeHTML(values.fee)}</strong></div>
      <div class="summary-item full"><small>Home Address</small><strong>${escapeHTML(values.address)}</strong></div>
    </div>
  `;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPhone(value) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function validateBookingForm() {
  const requiredIds = [
    "serviceSelect",
    "packageSelect",
    "dateSelect",
    "timeSelect",
    "midwifeSelect",
    "motherName",
    "contactNumber",
    "clientEmail",
    "homeAddress",
    "motherStatus",
    "bookingConsent",
  ];
  let valid = true;
  let firstInvalid = null;

  requiredIds.forEach((id) => {
    const field = $(id);
    let valueValid =
      field.type === "checkbox" ? field.checked : Boolean(field.value.trim());
    if (id === "clientEmail" && valueValid)
      valueValid = isValidEmail(field.value);
    if (id === "contactNumber" && valueValid)
      valueValid = isValidPhone(field.value);
    field.classList.toggle("validation-error", !valueValid);
    if (!valueValid && !firstInvalid) firstInvalid = field;
    valid = valid && valueValid;
  });

  if (firstInvalid) {
    if (firstInvalid.id === "packageSelect") {
      $("packageChoices").scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    } else {
      firstInvalid.focus({ preventScroll: false });
    }
    showToast("Please complete all required booking details correctly.");
  }
  return valid;
}

async function sendServerNotification(payload) {
  if (window.location.protocol === "file:") {
    throw new Error(
      "Email/SMS notifications require the site to run through a PHP web server (for example XAMPP), not by double-clicking index.html.",
    );
  }

  const response = await fetch("notify.php", {
    // const response = await fetch("notify-email-only.php", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  let result = {};
  try {
    result = await response.json();
  } catch (error) {
    throw new Error("The notification server returned an unreadable response.");
  }

  if (!response.ok || result.ok === false) {
    throw new Error(result.message || "The notification could not be sent.");
  }
  return result;
}

function clientDeliveryLabel(channel) {
  if (channel === "sms")
    return "A confirmation was also sent to your contact number by SMS.";
  if (channel === "email")
    return "A confirmation was sent to your email address.";
  return "The administrator was notified, but a client confirmation could not be delivered.";
}

async function saveBooking(event) {
  event.preventDefault();
  if (!validateBookingForm()) return;

  const pkg = selectedPackage();
  const booking = {
    reference: `HC-${Date.now().toString().slice(-7)}`,
    createdAt: new Date().toISOString(),
    service: $("serviceSelect").value,
    packageId: pkg.id,
    packageName: pkg.name,
    fee: pkg.priceLabel + (pkg.priceNote ? ` (${pkg.priceNote})` : ""),
    date: $("dateSelect").value,
    time: $("timeSelect").value,
    midwife: selectedMidwifeName(),
    motherName: $("motherName").value.trim(),
    contactNumber: $("contactNumber").value.trim(),
    clientEmail: $("clientEmail").value.trim(),
    homeAddress: $("homeAddress").value.trim(),
    motherStatus: $("motherStatus").value,
    concerns: $("notes").value.trim(),
    // website: $("bookingWebsite").value,
    website: "",
    status: "Awaiting notification delivery",
  };

  const submitButton = $("bookingSubmit");
  const originalText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "Sending booking...";
  $("successBox").classList.add("hidden");
  $("successBox").classList.remove("error-box");

  try {
    const delivery = await sendServerNotification({
      type: "booking",
      ...booking,
    });
    booking.status = delivery.partial
      ? "Admin notified; client confirmation delivery issue"
      : "Home visit request received";
    booking.notification = delivery;

    const bookings = JSON.parse(
      localStorage.getItem("hercareHomeVisits") || "[]",
    );
    bookings.push(booking);
    localStorage.setItem("hercareHomeVisits", JSON.stringify(bookings));

    $("successBox").innerHTML = `
      <strong>Your home visit request has been received!</strong>
      <p>Reference: <b>${escapeHTML(booking.reference)}</b></p>
      <p>${escapeHTML(booking.service)} • ${escapeHTML(booking.packageName)} • ${escapeHTML(formatDate(booking.date))} • ${escapeHTML(booking.time)}</p>
      <p>Preferred midwife: ${escapeHTML(booking.midwife)}</p>
      <p>Your booking information was emailed to the HER CARE administrator. ${escapeHTML(clientDeliveryLabel(delivery.clientChannel))}</p>
      <p>A HerCare midwife will confirm your appointment and provide further instructions.</p>
    `;
    $("successBox").classList.remove("hidden");
    $("successBox").focus();
    showToast("Booking sent to HER CARE.");
  } catch (error) {
    booking.status = "Notification failed";
    const bookings = JSON.parse(
      localStorage.getItem("hercareHomeVisits") || "[]",
    );
    bookings.push(booking);
    localStorage.setItem("hercareHomeVisits", JSON.stringify(bookings));

    $("successBox").innerHTML = `
      <strong>We could not deliver the booking notification.</strong>
      <p>${escapeHTML(error.message)}</p>
      <p>Your details were saved only in this browser as a local backup. Please do not assume the appointment is confirmed until HER CARE receives it.</p>
    `;
    $("successBox").classList.add("error-box");
    $("successBox").classList.remove("hidden");
    $("successBox").focus();
    showToast("Notification could not be delivered.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
}

function validateQuestionForm() {
  const ids = [
    "questionTopic",
    "questionName",
    "questionContact",
    "questionEmail",
    "questionText",
  ];
  let valid = true;
  let firstInvalid = null;
  ids.forEach((id) => {
    const field = $(id);
    let valueValid = Boolean(field.value.trim());
    if (id === "questionEmail" && valueValid)
      valueValid = isValidEmail(field.value);
    if (id === "questionContact" && valueValid)
      valueValid = isValidPhone(field.value);
    field.classList.toggle("validation-error", !valueValid);
    if (!valueValid && !firstInvalid) firstInvalid = field;
    valid = valid && valueValid;
  });
  if (firstInvalid) {
    firstInvalid.focus();
    showToast("Please complete your contact details and question correctly.");
  }
  return valid;
}

async function saveQuestion(event) {
  event.preventDefault();
  if (!validateQuestionForm()) return;

  const question = {
    reference: `Q-${Date.now().toString().slice(-6)}`,
    topic: $("questionTopic").value,
    name: $("questionName").value.trim(),
    contactNumber: $("questionContact").value.trim(),
    clientEmail: $("questionEmail").value.trim(),
    question: $("questionText").value.trim(),
    website: $("questionWebsite").value,
    createdAt: new Date().toISOString(),
  };

  const submitButton = $("questionSubmit");
  const originalText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "Sending question...";
  $("questionSuccess").classList.add("hidden");
  $("questionSuccess").classList.remove("error-box");

  try {
    const delivery = await sendServerNotification({
      type: "question",
      ...question,
    });
    question.notification = delivery;
    const questions = JSON.parse(
      localStorage.getItem("hercareQuestions") || "[]",
    );
    questions.push(question);
    localStorage.setItem("hercareQuestions", JSON.stringify(questions));

    $("questionSuccess").innerHTML = `
      <strong>Your question has been received.</strong>
      <p>Reference: <b>${escapeHTML(question.reference)}</b></p>
      <p>Your question was emailed to the HER CARE administrator. ${escapeHTML(clientDeliveryLabel(delivery.clientChannel))}</p>
      <p>A HER CARE midwife can follow up using the contact information you provided.</p>
    `;
    $("questionSuccess").classList.remove("hidden");
    $("askForm").reset();
    showToast("Question sent to HER CARE.");
  } catch (error) {
    question.status = "Notification failed";
    const questions = JSON.parse(
      localStorage.getItem("hercareQuestions") || "[]",
    );
    questions.push(question);
    localStorage.setItem("hercareQuestions", JSON.stringify(questions));

    $("questionSuccess").innerHTML = `
      <strong>We could not deliver your question to HER CARE.</strong>
      <p>${escapeHTML(error.message)}</p>
      <p>Your question was saved only in this browser as a local backup. Please try again after the notification settings are configured.</p>
    `;
    $("questionSuccess").classList.add("error-box");
    $("questionSuccess").classList.remove("hidden");
    showToast("Question notification could not be delivered.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
}

function setupNavigation() {
  $("menuBtn").addEventListener("click", () => {
    const open = $("nav").classList.toggle("open");
    $("menuBtn").setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.querySelectorAll(".nav a").forEach((link) =>
    link.addEventListener("click", () => {
      $("nav").classList.remove("open");
      $("menuBtn").setAttribute("aria-expanded", "false");
    }),
  );
}

function bindFormSummary() {
  [
    "serviceSelect",
    "dateSelect",
    "timeSelect",
    "midwifeSelect",
    "homeAddress",
  ].forEach((id) => {
    $(id).addEventListener(id === "homeAddress" ? "input" : "change", () => {
      if (id === "midwifeSelect") updateMidwifeInfo();
      else updateBookingSummary();
    });
  });
}

renderPackages();
renderMidwives();
configureDateField();
setupNavigation();
bindFormSummary();
updateBookingSummary();

$("bookingForm").addEventListener("submit", saveBooking);
$("askForm").addEventListener("submit", saveQuestion);
$("closeProfile").addEventListener("click", closeProfile);
$("profileModal").addEventListener("click", (event) => {
  if (event.target === $("profileModal")) closeProfile();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !$("profileModal").classList.contains("hidden"))
    closeProfile();
});
