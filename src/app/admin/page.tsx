import React from "react";
import { AdminDashboard } from "../../components/admin-dashboard";
import { feedbackStore } from "../api/feedback/route";

export const metadata = {
  title: "Panel administratora — czypodpisac.pl",
  description: "Monitorowanie kosztów, wydajności, uwag użytkowników i stanu bazy prawnej.",
};

export default function AdminPage() {
  return (
    <div className="bg-slate-50 min-h-screen">
      <AdminDashboard initialDisputes={feedbackStore} />
    </div>
  );
}
