import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const services = [
  {
    id: 1,
    name: "Deep Cleaning",
    icon: "cleaning_services",
    price: "₹1,499",
    rating: "4.8",
  },
  {
    id: 2,
    name: "Pest Control",
    icon: "pest_control",
    price: "₹999",
    rating: "4.6",
  },
  {
    id: 3,
    name: "AC Servicing",
    icon: "ac_unit",
    price: "₹499",
    rating: "4.9",
  },
  {
    id: 4,
    name: "Packers & Movers",
    icon: "local_shipping",
    price: "Get Quote",
    rating: "4.7",
  },
  {
    id: 5,
    name: "Plumber",
    icon: "plumbing",
    price: "Starts at ₹199",
    rating: "4.5",
  },
  {
    id: 6,
    name: "Electrician",
    icon: "electrical_services",
    price: "Starts at ₹199",
    rating: "4.7",
  },
];

const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="min-h-screen font-sans pb-[100px] text-text-primary selection:bg-primary/30">
      <header className="sticky top-0 z-20 border-b border-white/40 bg-white/40 backdrop-blur-[20px] shadow-sm px-5 pb-4 pt-6">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/60 border border-white/50 text-text-secondary hover:text-primary hover:bg-white/80 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">
              arrow_back
            </span>
          </button>

          <h1 className="text-[17px] font-black tracking-tight text-text-primary uppercase tracking-widest">
            Home Services
          </h1>

          <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/60 border border-white/50 text-text-secondary hover:text-primary hover:bg-white/80 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">
              search
            </span>
          </button>
        </div>
      </header>

      <main className="px-5 pt-6 pb-8 flex flex-col gap-6 motion-page-enter">
        {/* Banner */}
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-md shadow-sm border border-white/50 p-6">
          <div className="absolute right-[-20px] top-[-20px] size-40 rounded-full bg-primary/20 blur-[40px]"></div>
          <div className="relative z-10">
            <span className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
              Premium Partners
            </span>
            <h2 className="text-[24px] font-black text-text-primary mb-2 leading-tight">
              Expert Services for your Home
            </h2>
            <p className="text-[12px] text-text-secondary font-bold">
              Verified professionals, upfront pricing.
            </p>
          </div>
        </div>

        {/* Categories */}
        <section>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar px-1 -mx-1">
            {["All Services", "Cleaning", "Repairs", "Moving"].map((tab) => {
              const isActive = activeTab === tab.toLowerCase().replace(" ", "");
              return (
                <button
                  key={tab}
                  onClick={() =>
                    setActiveTab(tab.toLowerCase().replace(" ", ""))
                  }
                  className={`shrink-0 px-5 py-2.5 rounded-full text-[13px] font-bold transition-all whitespace-nowrap border shadow-sm ${
                    isActive
                      ? "bg-gradient-to-r from-[#FF9A3D] to-[#FF7A00] text-white border-primary shadow-[0_4px_15px_rgba(255,122,0,0.3)]"
                      : "bg-white/60 text-text-secondary border-white/50 hover:border-primary/50 hover:text-primary active:scale-[0.98]"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </section>

        {/* Grid */}
        <section className="grid grid-cols-2 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white/40 backdrop-blur-[20px] rounded-[24px] border border-white/50 p-4 flex flex-col gap-3 hover:border-primary/40 hover:bg-white/60 transition-all shadow-sm active:scale-[0.98] group cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="size-10 rounded-full bg-white/60 border border-white/50 shadow-inner flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[20px]">
                    {service.icon}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-white/60 px-2 py-1 rounded-[8px] border border-white/50 shadow-inner">
                  <span className="material-symbols-outlined text-[10px] text-warning">
                    star
                  </span>
                  <span className="text-[10px] font-bold text-text-primary">
                    {service.rating}
                  </span>
                </div>
              </div>

              <div className="mt-2">
                <h3 className="text-[14px] font-black text-text-primary leading-tight mb-1">
                  {service.name}
                </h3>
                <p className="text-[12px] font-bold text-text-secondary">
                  {service.price}
                </p>
              </div>
            </div>
          ))}
        </section>

        <div className="rounded-[24px] bg-white/40 backdrop-blur-[20px] p-5 shadow-sm border border-white/50 flex items-center gap-4 mt-2">
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
            <span className="material-symbols-outlined text-[24px] text-primary">
              verified_user
            </span>
          </div>
          <div>
            <h4 className="text-[14px] font-black text-text-primary">
              RentMate Guarantee
            </h4>
            <p className="text-[11px] font-bold text-text-secondary mt-0.5">
              If you're not satisfied, we'll fix it for free or refund your
              money.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Marketplace;
