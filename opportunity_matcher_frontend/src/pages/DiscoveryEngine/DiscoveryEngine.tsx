import React, { useState } from "react";
import AppShell from "../../components/AppShell";
import DiscoveryDashboard from "./DiscoveryDashboard";
import DiscoveryFilter from "./DiscoveryFilter";

const DiscoveryEngine: React.FC = () => {
  const [filters, setFilters] = useState<any>(null);

  return (
    <AppShell filterSlot={<DiscoveryFilter onFilterChange={setFilters} />}>
      <DiscoveryDashboard filters={filters} />
    </AppShell>
  );
};

export default DiscoveryEngine;
