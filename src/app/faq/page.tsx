import Disclaimers from "@/components/Disclaimers";

const faqs = [
  {
    q: "What is a drop?",
    a: "A drop is a limited-batch release. Each drop has a fixed number of units. Once they're gone, they're gone. Every drop is a unique mystery blend.",
  },
  {
    q: 'What does "mystery" mean?',
    a: "You won't know the exact recipe, but we share the general profile: effect type, tasting notes, ingredient families that may be included, caffeine info, and steep instructions. The exact blend is the surprise.",
  },
  {
    q: "Does it contain caffeine?",
    a: 'Each drop listing shows caffeine status: Yes, No, May Contain, or Unknown. Check the product page for specifics. "May Contain" means the blend might include ingredients that naturally contain caffeine.',
  },
  {
    q: "What about allergens?",
    a: "All blends are curated from a rotating library of herbs, teas, spices, flowers, and other botanicals. Cross-contact with common allergens (herbs, spices, citrus, etc.) is possible. Check each drop's allergen note for details. If you have known allergies, please consult a healthcare professional before purchasing.",
  },
  {
    q: "Shipping and returns?",
    a: "Orders ship within 3–5 business days. Due to the nature of mystery drops and food safety, we cannot accept returns on opened items. If your order arrives damaged, contact us and we'll make it right.",
  },
];

export default function FAQPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <p className="text-xs tracking-[0.3em] uppercase text-stone-400 mb-3">
        Frequently Asked Questions
      </p>
      <h1 className="text-2xl font-light tracking-wide text-stone-800 mb-10">FAQ</h1>

      <div className="space-y-8">
        {faqs.map((faq, i) => (
          <div key={i} className="border-b border-stone-200/60 pb-6">
            <h2 className="text-sm font-medium text-stone-800 mb-2">{faq.q}</h2>
            <p className="text-sm leading-relaxed text-stone-500">{faq.a}</p>
          </div>
        ))}
      </div>

      <Disclaimers />
    </div>
  );
}
