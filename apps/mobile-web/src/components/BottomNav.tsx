import React from "react";
import FloatingDock from "./FloatingDock";

interface BottomNavProps {
  role: "landlord" | "tenant";
}

const BottomNav: React.FC<BottomNavProps> = ({ role }) => (
  <FloatingDock role={role} />
);

export default BottomNav;
