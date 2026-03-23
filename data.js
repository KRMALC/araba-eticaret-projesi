/**
 * Araba e-ticaret sitesi — ürün verileri
 * category: Yedek Parça | Aksesuar | Araç Satış
 * brand: araç markası (filtreleme için)
 */
const CARS = [
  {
    id: "car-1",
    title: "BMW 320i M Sport",
    description: "2022 model, otomatik, düşük kilometre, tam servis geçmişi.",
    price: 1850000,
    image:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80",
    brand: "BMW",
    category: "Araç Satış",
  },
  {
    id: "car-2",
    title: "Audi A4 40 TFSI",
    description: "Quattro, matrix LED, virtual cockpit. Tek sahibinden.",
    price: 2100000,
    image:
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=80",
    brand: "Audi",
    category: "Araç Satış",
  },
  {
    id: "car-3",
    title: "Mercedes-Benz C200 AMG Line",
    description: "Premium paket, panoramik cam tavan, hafif hibrit.",
    price: 2450000,
    image:
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80",
    brand: "Mercedes-Benz",
    category: "Araç Satış",
  },
  {
    id: "car-4",
    title: "Volkswagen Golf GTI",
    description: "Hot hatch ikonu, DSG, sport paket.",
    price: 1650000,
    image:
      "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80",
    brand: "Volkswagen",
    category: "Araç Satış",
  },
];

const SPARE_PARTS = [
  {
    id: "part-1",
    title: "BMW F30 Ön Fren Balata Takımı",
    description: "Orijinal kalite, seramik bileşen, gürültü azaltılmış.",
    price: 4200,
    image:
      "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80",
    brand: "BMW",
    category: "Yedek Parça",
  },
  {
    id: "part-2",
    title: "Audi A6 Quattro Hava Filtresi",
    description: "OEM uyumlu, yüksek filtrasyon verimliliği.",
    price: 890,
    image:
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&q=80",
    brand: "Audi",
    category: "Yedek Parça",
  },
  {
    id: "part-3",
    title: "Mercedes M274 Yağ Filtresi",
    description: "Motor koruması için uzun ömürlü sentetik uyumlu.",
    price: 450,
    image:
      "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=800&q=80",
    brand: "Mercedes-Benz",
    category: "Yedek Parça",
  },
  {
    id: "part-4",
    title: "VW EA888 Triger Seti + Su Pompası",
    description: "Komple kit, conta ve gergi dahil.",
    price: 6800,
    image:
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80",
    brand: "Volkswagen",
    category: "Yedek Parça",
  },
  {
    id: "part-5",
    title: "Porsche 911 Arka Amortisör",
    description: "PASM uyumlu, sport sürüş için optimize.",
    price: 12400,
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
    brand: "Porsche",
    category: "Yedek Parça",
  },
];

const ACCESSORIES = [
  {
    id: "acc-1",
    title: "Universal Bagaj Organizer",
    description: "Katlanabilir bölmeler, kaymaz taban, tüm sedan ve SUV uyumlu.",
    price: 1290,
    image:
      "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&q=80",
    brand: "BMW",
    category: "Aksesuar",
  },
  {
    id: "acc-2",
    title: "Deri Direksiyon Kılıfı — Siyah Dikiş",
    description: "El dikişi görünüm, nefes alan mikrofiber iç yüzey.",
    price: 650,
    image:
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80",
    brand: "Audi",
    category: "Aksesuar",
  },
  {
    id: "acc-3",
    title: "LED İç Ambiyans Aydınlatma Kiti",
    description: "16 renk, uygulama ile kontrol, Mercedes uyumlu konnektör.",
    price: 2100,
    image:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80",
    brand: "Mercedes-Benz",
    category: "Aksesuar",
  },
  {
    id: "acc-4",
    title: "Roof Box 400L — Aerodinamik",
    description: "Çift taraflı açılım, T-slot montaj, VW taşıyıcı ile uyumlu.",
    price: 8900,
    image:
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80",
    brand: "Volkswagen",
    category: "Aksesuar",
  },
  {
    id: "acc-5",
    title: "Karbon Fiber Ayna Kapağı Çifti",
    description: "Hafif, UV dayanımlı kaplama, 911 992 uyumlu.",
    price: 15600,
    image:
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80",
    brand: "Porsche",
    category: "Aksesuar",
  },
];

/** Tüm ürünler — filtreleme ve listeleme için tek dizi (global: app.js erişimi) */
var PRODUCTS = [...CARS, ...SPARE_PARTS, ...ACCESSORIES];
