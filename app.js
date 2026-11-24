// SerbaBisa — semua alat jalan di browser, tanpa server.
"use strict";

// ---------- Kalkulator ----------
(function () {
  var display = document.getElementById("calcDisplay");
  var current = "0", prev = null, op = null, fresh = true;
  function show(v) { display.textContent = v; }
  function compute(a, b, o) {
    a = parseFloat(a); b = parseFloat(b);
    if (o === "+") return a + b;
    if (o === "−") return a - b;
    if (o === "×") return a * b;
    if (o === "÷") return b === 0 ? NaN : a / b;
    return b;
  }
  function fmt(n) {
    if (isNaN(n) || !isFinite(n)) return "Error";
    var r = Math.round(n * 1e10) / 1e10;
    return String(r);
  }
  document.querySelector(".calc-buttons").addEventListener("click", function (e) {
    var t = e.target;
    if (t.tagName !== "BUTTON") return;
    if (t.dataset.num !== undefined) {
      if (fresh) { current = t.dataset.num === "." ? "0." : t.dataset.num; fresh = false; }
      else if (!(t.dataset.num === "." && current.indexOf(".") !== -1)) {
        current = current === "0" && t.dataset.num !== "." ? t.dataset.num : current + t.dataset.num;
      }
      show(current);
    } else if (t.dataset.op) {
      if (prev !== null && op && !fresh) { prev = fmt(compute(prev, current, op)); show(prev); }
      else prev = current;
      op = t.dataset.op; fresh = true;
    } else if (t.dataset.act === "eq") {
      if (prev !== null && op) { current = fmt(compute(prev, current, op)); show(current); prev = null; op = null; fresh = true; }
    } else if (t.dataset.act === "clear") {
      current = "0"; prev = null; op = null; fresh = true; show(current);
    } else if (t.dataset.act === "back") {
      current = current.length > 1 ? current.slice(0, -1) : "0"; show(current);
    } else if (t.dataset.act === "pct") {
      current = fmt(parseFloat(current) / 100); show(current); fresh = true;
    }
  });
})();

// ---------- Konverter satuan ----------
var UNITS = {
  panjang: { label: "Panjang", base: "m", units: { km: 1000, m: 1, cm: 0.01, mm: 0.001, mil: 1609.34, kaki: 0.3048, inci: 0.0254 } },
  berat: { label: "Berat", base: "kg", units: { ton: 1000, kg: 1, g: 0.001, mg: 0.000001, pon: 0.453592, ons: 0.0283495 } },
  suhu: { label: "Suhu", base: "C", units: { C: "C", F: "F", K: "K" } }
};
var unitKind = document.getElementById("unitKind"),
    unitFrom = document.getElementById("unitFrom"),
    unitTo = document.getElementById("unitTo"),
    unitValue = document.getElementById("unitValue"),
    unitResult = document.getElementById("unitResult");
function fillUnits() {
  var def = UNITS[unitKind.value];
  unitFrom.innerHTML = ""; unitTo.innerHTML = "";
  Object.keys(def.units).forEach(function (u, i) {
    unitFrom.add(new Option(u, u));
    unitTo.add(new Option(u, u));
    if (i === 1) unitTo.selectedIndex = 1;
  });
  convertUnit();
}
function convertUnit() {
  var def = UNITS[unitKind.value], v = parseFloat(unitValue.value);
  if (isNaN(v)) { unitResult.textContent = "Masukkan angka dulu."; return; }
  var from = unitFrom.value, to = unitTo.value, out;
  if (unitKind.value === "suhu") {
    var c = from === "C" ? v : from === "F" ? (v - 32) * 5 / 9 : v - 273.15;
    out = to === "C" ? c : to === "F" ? c * 9 / 5 + 32 : c + 273.15;
  } else {
    out = v * def.units[from] / def.units[to];
  }
  var r = Math.round(out * 1e6) / 1e6;
  unitResult.textContent = v + " " + from + " = " + r + " " + to;
}
unitKind.addEventListener("change", fillUnits);
[unitValue, unitFrom, unitTo].forEach(function (el) { el.addEventListener("input", convertUnit); });
fillUnits();

// ---------- Konverter mata uang ----------
var FALLBACK_RATES = { USD: 1, IDR: 16000, EUR: 0.92, SGD: 1.34, MYR: 4.5, JPY: 155 }; // per 1 USD, perkiraan
var rates = null, ratesLive = false;
var curNote = document.getElementById("curNote");
function convertCur() {
  var amt = parseFloat(document.getElementById("curAmount").value);
  var from = document.getElementById("curFrom").value, to = document.getElementById("curTo").value;
  var res = document.getElementById("curResult");
  if (isNaN(amt)) { res.textContent = "Masukkan angka dulu."; return; }
  var table = rates || FALLBACK_RATES;
  var inUSD = amt / table[from];
  var out = inUSD * table[to];
  var formatted = to === "IDR"
    ? "Rp" + Math.round(out).toLocaleString("id-ID")
    : out.toLocaleString("id-ID", { maximumFractionDigits: 2 }) + " " + to;
  res.textContent = amt.toLocaleString("id-ID") + " " + from + " = " + formatted;
  curNote.textContent = ratesLive
    ? "Kurs live dari open.er-api.com (USD sebagai dasar)."
    : "Kurs perkiraan (offline) — 1 USD ≈ Rp16.000. Cek lagi sebelum transaksi besar.";
}
["curAmount", "curFrom", "curTo"].forEach(function (id) {
  document.getElementById(id).addEventListener("input", convertCur);
});
fetch("https://open.er-api.com/v6/latest/USD")
  .then(function (r) { return r.json(); })
  .then(function (d) {
    if (d && d.rates) { rates = d.rates; ratesLive = true; convertCur(); }
    else convertCur();
  })
  .catch(function () { convertCur(); });
convertCur();

// ---------- Hitung umur ----------
document.getElementById("ageBtn").addEventListener("click", function () {
  var b = document.getElementById("birthDate").valueAsDate;
  var res = document.getElementById("ageResult");
  if (!b) { res.textContent = "Pilih tanggal lahir dulu."; return; }
  var now = new Date();
  if (b > now) { res.textContent = "Tanggal lahir belum terjadi."; return; }
  var y = now.getFullYear() - b.getFullYear(),
      m = now.getMonth() - b.getMonth(),
      d = now.getDate() - b.getDate();
  if (d < 0) { m--; var pm = new Date(now.getFullYear(), now.getMonth(), 0).getDate(); d += pm; }
  if (m < 0) { y--; m += 12; }
  var totalDays = Math.floor((now - b) / 86400000);
  res.textContent = "Umurmu: " + y + " tahun, " + m + " bulan, " + d + " hari (" + totalDays.toLocaleString("id-ID") + " hari).";
});

// ---------- BMI ----------
document.getElementById("bmiBtn").addEventListener("click", function () {
  var w = parseFloat(document.getElementById("bmiWeight").value);
  var h = parseFloat(document.getElementById("bmiHeight").value);
  var res = document.getElementById("bmiResult");
  if (!w || !h) { res.textContent = "Isi berat dan tinggi dulu."; return; }
  var bmi = w / Math.pow(h / 100, 2);
  var cat = bmi < 18.5 ? "Kurus" : bmi < 25 ? "Normal" : bmi < 30 ? "Berlebih" : "Obesitas";
  res.textContent = "BMI kamu: " + (Math.round(bmi * 10) / 10) + " — " + cat + ".";
});

// ---------- QR Code ----------
document.getElementById("qrBtn").addEventListener("click", function () {
  var text = document.getElementById("qrText").value.trim();
  var out = document.getElementById("qrOut");
  out.innerHTML = "";
  if (!text) { out.textContent = "Isi teks atau link dulu."; return; }
  if (typeof QRCode === "undefined") { out.textContent = "Pustaka QR belum termuat — periksa koneksi internet lalu coba lagi."; return; }
  new QRCode(out, { text: text, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.M });
});

// ---------- Kompres gambar ----------
var imgInput = document.getElementById("imgInput"),
    imgQuality = document.getElementById("imgQuality"),
    imgQualityLabel = document.getElementById("imgQualityLabel"),
    imgBefore = document.getElementById("imgBefore"),
    imgAfter = document.getElementById("imgAfter"),
    imgDownload = document.getElementById("imgDownload");
var loadedImg = null, loadedName = "gambar-kompres.jpg";
function fmtSize(n) {
  return n > 1048576 ? (Math.round(n / 104857.6) / 10) + " MB" : Math.round(n / 1024) + " KB";
}
function compress() {
  if (!loadedImg) return;
  var q = imgQuality.value / 100;
  imgQualityLabel.textContent = imgQuality.value + "%";
  var maxSide = 1920, w = loadedImg.naturalWidth, h = loadedImg.naturalHeight;
  var scale = Math.min(1, maxSide / Math.max(w, h));
  var canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
  canvas.getContext("2d").drawImage(loadedImg, 0, 0, canvas.width, canvas.height);
  canvas.toBlob(function (blob) {
    if (!blob) return;
    imgAfter.src = URL.createObjectURL(blob);
    document.getElementById("imgAfterSize").textContent = fmtSize(blob.size) + " • " + canvas.width + "×" + canvas.height;
    imgDownload.href = URL.createObjectURL(blob);
    imgDownload.download = loadedName.replace(/\.[^.]+$/, "") + "-kompres.jpg";
  }, "image/jpeg", q);
}
imgInput.addEventListener("change", function () {
  var file = imgInput.files[0];
  if (!file) return;
  loadedName = file.name;
  var url = URL.createObjectURL(file);
  var img = new Image();
  img.onload = function () {
    loadedImg = img;
    imgBefore.src = url;
    document.getElementById("imgBeforeSize").textContent = fmtSize(file.size) + " • " + img.naturalWidth + "×" + img.naturalHeight;
    compress();
  };
  img.src = url;
});
imgQuality.addEventListener("input", compress);
