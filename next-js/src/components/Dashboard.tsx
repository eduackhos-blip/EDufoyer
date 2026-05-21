// @ts-nocheck
import React, { useState } from 'react';
import AskDoubt from './AskDoubt';
import SolverRequestForm from './SolverRequestForm';
import DashboardPageLayout from './dashboard/DashboardPageLayout';
import DashboardContentLoading from './dashboard/DashboardContentLoading';
import DashboardWelcomeHeader from './dashboard/DashboardWelcomeHeader';
import DashboardStatCards from './dashboard/DashboardStatCards';
import DashboardWalletCard from './dashboard/DashboardWalletCard';
import DashboardWithdrawTimeline from './dashboard/DashboardWithdrawTimeline';
import { useDashboardAuth } from '../hooks/useDashboardAuth';

const Dashboard = () => {
  const { user, isLoading } = useDashboardAuth();
  const [showSolverRequestForm, setShowSolverRequestForm] = useState(false);
  const [askDoubtOpenSignal, setAskDoubtOpenSignal] = useState(0);

  return (
    <>
      <DashboardPageLayout
        topBar={
          !isLoading ? (
            <DashboardWelcomeHeader
              userName={user?.name}
              onAskDoubt={() => setAskDoubtOpenSignal((n) => n + 1)}
              onSolveDoubt={() => setShowSolverRequestForm(true)}
            />
          ) : undefined
        }
      >
        {isLoading ? (
          <DashboardContentLoading message="Loading…" />
        ) : (
          <div className="dash-home-grid grid grid-cols-1 gap-5 p-4 pb-2 md:p-5 xl:grid-cols-2 xl:items-start xl:gap-10">
            <DashboardStatCards />
            <div className="flex flex-col gap-2">
              <DashboardWalletCard />
              <DashboardWithdrawTimeline />
            </div>
          </div>
        )}
      </DashboardPageLayout>

      <AskDoubt hideTrigger externalOpenSignal={askDoubtOpenSignal} />

      <SolverRequestForm
        isOpen={showSolverRequestForm}
        onClose={() => setShowSolverRequestForm(false)}
        onSuccess={() => {
          setShowSolverRequestForm(false);
        }}
      />
    </>
  );
};

export default Dashboard;
