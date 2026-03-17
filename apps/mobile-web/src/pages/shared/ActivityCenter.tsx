import React from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import { useAuth } from "../../context/AuthContext";

const toUiRole = (role?: string) =>
  role === "LANDLORD" ? "landlord" : "tenant";

const ActivityCenter: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Static mock data for activity center.
  const activities = [
    {
      id: 1,
      type: "PAYMENT",
      title: "Rent Paid Successfully",
      desc: "You paid ₹45,000 for October Rent.",
      time: "2 hours ago",
      icon: "check_circle",
      color: "text-success",
      bg: "bg-success/10 shadow-inner",
    },
    {
      id: 2,
      type: "MAINTENANCE",
      title: "Request Updated",
      desc: "Plumbing issue status changed to In Progress.",
      time: "Yesterday",
      icon: "build",
      color: "text-primary",
      bg: "bg-primary/10 shadow-inner",
    },
    {
      id: 3,
      type: "DOCUMENT",
      title: "New Lease Uploaded",
      desc: "Landlord uploaded 'Renewal_2024.pdf'.",
      time: "Oct 15",
      icon: "description",
      color: "text-[#4F46E5]",
      bg: "bg-[#4F46E5]/10 shadow-inner",
    },
    {
      id: 4,
      type: "SYSTEM",
      title: "Account Verified",
      desc: "Your identity verification is complete.",
      time: "Oct 10",
      icon: "verified_user",
      color: "text-text-secondary",
      bg: "bg-white border shadow-inner",
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
            Activity Center
          </h1>

          <div className="w-9"></div>
        </div>
      </header>

      <main className="px-5 pt-6 pb-8 flex flex-col gap-6 motion-page-enter">
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between pl-1">
            <h2 className="text-[12px] font-bold uppercase tracking-widest text-text-secondary">
              Recent Activity
            </h2>
            <button className="text-[11px] font-bold text-primary uppercase tracking-wider hover:text-text-primary transition-colors">
              Mark all read
            </button>
          </div>

          <div className="rounded-[24px] border bg-white overflow-hidden shadow-sm">
            {activities.map((activity, i) => (
              <div
                key={activity.id}
                className={`flex gap-4 p-4  active:bg-white transition-all group cursor-pointer ${i !== activities.length - 1 ? "border-b" : ""}`}
              >
                <div
                  className={`flex size-10 items-center justify-center rounded-full shrink-0 ${activity.bg}`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${activity.color}`}
                  >
                    {activity.icon}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="truncate text-[14px] font-black text-text-primary group-hover:text-primary transition-colors">
                      {activity.title}
                    </p>
                    <span className="text-[10px] font-bold text-text-secondary/70 whitespace-nowrap uppercase tracking-wider">
                      {activity.time}
                    </span>
                  </div>
                  <p className="text-[12px] font-bold text-text-secondary leading-snug">
                    {activity.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="rounded-[24px] border border-primary/30 bg-primary/5 p-6 text-center shadow-sm  mt-4">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shadow-inner">
            <span className="material-symbols-outlined text-[24px] text-primary">
              done_all
            </span>
          </div>
          <p className="text-[14px] font-black text-text-primary mb-1">
            You're all caught up!
          </p>
          <p className="text-[12px] font-bold text-text-secondary">
            Check back later for new updates.
          </p>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNav role={toUiRole(profile?.role)} />
      </div>
    </div>
  );
};

export default ActivityCenter;
