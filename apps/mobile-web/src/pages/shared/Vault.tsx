import React from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import { useAuth } from "../../context/AuthContext";

const toUiRole = (role?: string) =>
  role === "LANDLORD" ? "landlord" : "tenant";

const Vault: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Static mock data for purely UI demonstration.
  const vaultItems = [
    {
      id: 1,
      name: "Lease_Agreement_2023.pdf",
      size: "2.4 MB",
      date: "Oct 12, 2023",
      icon: "picture_as_pdf",
    },
    {
      id: 2,
      name: "ID_Verification.jpg",
      size: "1.1 MB",
      date: "Oct 10, 2023",
      icon: "image",
    },
    {
      id: 3,
      name: "Move_In_Condition.pdf",
      size: "4.5 MB",
      date: "Oct 14, 2023",
      icon: "picture_as_pdf",
    },
    {
      id: 4,
      name: "Insurance_Policy.pdf",
      size: "1.8 MB",
      date: "Nov 02, 2023",
      icon: "verified_user",
    },
  ];

  return (
    <div className="min-h-screen font-sans pb-[100px] text-text-primary selection:bg-primary/30">
      <header className="sticky top-0 z-20 border-b bg-white shadow-sm px-5 pb-4 pt-6">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white border text-text-secondary hover:text-primary  transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">
              arrow_back
            </span>
          </button>

          <h1 className="text-[17px] font-black tracking-tight text-text-primary">
            Document Vault
          </h1>

          <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
        </div>
      </header>

      <main className="px-5 pt-6 pb-8 flex flex-col gap-6 motion-page-enter">
        <div className="relative overflow-hidden rounded-[24px] border border-primary/30 bg-primary/5 p-6 shadow-sm  flex items-center justify-between gap-4 group">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#F5A623] to-[#F5A623] opacity-80"></div>

          <div>
            <h2 className="text-[18px] font-black text-text-primary mb-1">
              Secure Storage
            </h2>
            <p className="text-[12px] font-bold text-text-secondary max-w-[200px]">
              Access and manage your encrypted personal and lease documents.
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white border shadow-inner group-hover:bg-primary/10 group-hover:border-primary/30 group-hover:scale-105 transition-all duration-300">
            <span className="material-symbols-outlined text-[32px] text-primary">
              lock
            </span>
          </div>
        </div>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between pl-1">
            <h2 className="text-[12px] font-bold uppercase tracking-widest text-text-secondary">
              Your Documents
            </h2>
            <span className="text-[12px] font-bold text-primary">
              {vaultItems.length} Files
            </span>
          </div>

          <div className="rounded-[24px] border bg-white overflow-hidden shadow-sm">
            {vaultItems.map((item, i) => (
              <div
                key={item.id}
                className={`flex items-center gap-4 p-4  active:bg-white transition-all group cursor-pointer ${i !== vaultItems.length - 1 ? "border-b" : ""}`}
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-white border shadow-inner group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors shrink-0">
                  <span className="material-symbols-outlined text-[20px] text-text-secondary group-hover:text-primary transition-colors">
                    {item.icon}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-black text-text-primary group-hover:text-primary transition-colors mb-0.5">
                    {item.name}
                  </p>
                  <p className="text-[11px] font-bold text-text-secondary flex items-center gap-1.5">
                    <span>{item.size}</span>
                    <span className="size-1 rounded-full bg-text-secondary/50"></span>
                    <span className="uppercase tracking-wider">
                      {item.date}
                    </span>
                  </p>
                </div>
                <div className="flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px] text-text-secondary group-hover:text-primary transition-colors">
                    more_vert
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNav role={toUiRole(profile?.role)} />
      </div>
    </div>
  );
};

export default Vault;
