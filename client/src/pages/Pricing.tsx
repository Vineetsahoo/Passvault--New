import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ScrollButton from '../components/ScrollButton';

const Pricing = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      title: 'BASIC',
      price: billingPeriod === 'monthly' ? '₹99' : '₹990',
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      description: 'Perfect for individuals getting started.',
      features: [
        'Up to 50 passes',
        'Basic encryption',
        'Email support',
        'Mobile access',
        '1 device sync',
      ],
      cta: 'GET STARTED',
    },
    {
      title: 'PRO',
      price: billingPeriod === 'monthly' ? '₹299' : '₹2,990',
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      description: 'For professionals who need more.',
      features: [
        'Unlimited passes',
        'Advanced encryption',
        'Priority support',
        'Multi-device sync',
        'Custom categories',
        'Family sharing',
      ],
      cta: 'START FREE TRIAL',
      featured: true,
    },
    {
      title: 'ENTERPRISE',
      price: billingPeriod === 'monthly' ? '₹999' : '₹9,990',
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      description: 'For organisations that demand the best.',
      features: [
        'Everything in Pro',
        'Team management',
        '24/7 phone support',
        'Custom integration',
        'Advanced analytics',
        'Dedicated account manager',
      ],
      cta: 'CONTACT SALES',
    },
  ];

  const pricingFaq = [
    { q: 'Can I switch plans anytime?', a: 'Yes, upgrade or downgrade your plan at any time. Changes take effect immediately.' },
    { q: 'Is there a free trial?', a: 'Yes, 30 days free with full access to all premium features. No credit card required.' },
    { q: 'What payment methods do you accept?', a: 'Credit cards, PayPal, UPI, and bank transfers. All transactions are PCI-compliant.' },
    { q: 'Do you offer discounts for annual billing?', a: 'Yes, save 17% when you pay annually on any plan.' },
  ];

  return (
    <div className="bg-[#F9F9F7] overflow-hidden">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="border-b-4 border-[#111111] pt-[5.5rem] md:pt-[6.5rem]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div
            className="text-[0.65rem] uppercase tracking-[0.2em] text-[#525252] mb-6 pb-4 border-b border-[#E5E5E0]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Page 3 &nbsp;|&nbsp; Pricing Plans &nbsp;|&nbsp; Transparent Rates
          </div>
          <h1
            className="font-black leading-[0.88] tracking-tighter mb-8"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(3.5rem, 10vw, 8rem)',
            }}
          >
            SIMPLE<br />
            <span className="text-[#CC0000]">TRANSPARENT</span><br />
            PRICING
          </h1>
          <p
            className="text-lg md:text-xl max-w-2xl mb-12 leading-relaxed text-[#525252]"
            style={{ fontFamily: "'Lora', serif" }}
          >
            Choose the plan that fits your needs. No hidden fees, no surprises.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center gap-6 mb-4">
            <span
              className="text-xs font-black uppercase tracking-widest"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Billing:
            </span>
            <div className="flex border-2 border-[#111111]">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-3 font-bold text-xs tracking-widest uppercase transition-colors ${
                  billingPeriod === 'monthly'
                    ? 'bg-[#111111] text-[#F9F9F7]'
                    : 'bg-[#F9F9F7] text-[#111111] hover:bg-[#E5E5E0]'
                }`}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-6 py-3 font-bold text-xs tracking-widest uppercase transition-colors border-l-2 border-[#111111] ${
                  billingPeriod === 'yearly'
                    ? 'bg-[#111111] text-[#F9F9F7]'
                    : 'bg-[#F9F9F7] text-[#111111] hover:bg-[#E5E5E0]'
                }`}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Yearly
                <span className="ml-2 text-[#CC0000] text-[0.6rem]">SAVE 17%</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING CARDS ────────────────────────────────────────────────── */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 border-l border-t border-[#111111]">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className={`border-r border-b border-[#111111] p-8 transition-colors flex flex-col ${
                  plan.featured
                    ? 'bg-[#111111] text-[#F9F9F7] hover:bg-[#1a1a1a]'
                    : 'hover:bg-[#E5E5E0]'
                }`}
              >
                {plan.featured && (
                  <div
                    className="text-[#CC0000] font-bold text-xs tracking-widest mb-4"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    ★ MOST POPULAR
                  </div>
                )}
                <h3
                  className="text-2xl font-black mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {plan.title}
                </h3>
                <p
                  className={`text-sm mb-6 ${plan.featured ? 'text-[#A3A3A3]' : 'text-[#525252]'}`}
                  style={{ fontFamily: "'Lora', serif" }}
                >
                  {plan.description}
                </p>
                <div className="mb-8">
                  <span
                    className="text-4xl font-black"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={`text-xs uppercase tracking-widest ${plan.featured ? 'text-[#A3A3A3]' : 'text-[#525252]'}`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {plan.period}
                  </span>
                </div>
                <Link
                  to="/download"
                  className={`block text-center px-6 py-4 font-black uppercase text-xs tracking-widest mb-8 transition-colors ${
                    plan.featured
                      ? 'bg-[#CC0000] text-[#F9F9F7] hover:bg-[#FF3333]'
                      : 'border-2 border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-[#F9F9F7]'
                  }`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {plan.cta}
                </Link>
                <div className={`border-t ${plan.featured ? 'border-[#404040]' : 'border-[#E5E5E0]'} pt-6 space-y-4 flex-1`}>
                  {plan.features.map((feature, fidx) => (
                    <div key={fidx} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-[#CC0000] flex-shrink-0 mt-0.5" />
                      <span className="text-sm" style={{ fontFamily: "'Lora', serif" }}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING FAQ ──────────────────────────────────────────────────── */}
      <section className="bg-[#F9F9F7] border-b-4 border-[#111111]">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="border-b-4 border-[#111111] mb-12 pb-8">
            <h2
              className="font-black"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              }}
            >
              QUESTIONS?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-l border-t border-[#111111]">
            {pricingFaq.map((item, idx) => (
              <div key={idx} className="border-r border-b border-[#111111] p-6 hover:bg-[#E5E5E0] transition-colors">
                <h3 className="text-base font-black mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {item.q}
                </h3>
                <p className="text-sm text-[#525252]" style={{ fontFamily: "'Lora', serif" }}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <ScrollButton />
    </div>
  );
};

export default Pricing;
