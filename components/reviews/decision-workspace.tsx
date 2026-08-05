"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Send,
  FileText,
  Lock,
  RefreshCw,
  History,
} from "lucide-react";
import { DecisionHistory } from "./decision-history";
import {
  ApproveDialog,
  ConditionalApprovalDialog,
  RejectDialog,
  WaitlistDialog,
  EscalateDialog,
  RequestAdditionalInfoDialog,
  WithdrawDialog,
  CloseCaseDialog,
} from "./decision-dialogs";

interface DecisionWorkspaceProps {
  applicationId: string;
  organizationId: string;
  applicantName?: string;
  isReady: boolean;
  onDecisionMade?: () => void;
}

interface DialogState {
  [key: string]: boolean;
}

export function DecisionWorkspace({
  applicationId,
  organizationId,
  applicantName = "Applicant",
  isReady,
  onDecisionMade,
}: DecisionWorkspaceProps) {
  const [openDialogs, setOpenDialogs] = useState<DialogState>({
    approve: false,
    conditional: false,
    reject: false,
    waitlist: false,
    escalate: false,
    requestInfo: false,
    withdraw: false,
    close: false,
  });

  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("actions");

  const openDialog = useCallback((dialogId: string) => {
    setOpenDialogs((prev) => ({ ...prev, [dialogId]: true }));
  }, []);

  const closeDialog = useCallback((dialogId: string) => {
    setOpenDialogs((prev) => ({ ...prev, [dialogId]: false }));
  }, []);

  const handleDecisionSuccess = useCallback(() => {
    // Refresh all data
    setRefreshKey((k) => k + 1);
    onDecisionMade?.();
  }, [onDecisionMade]);

  const decisions = [
    {
      id: "approve",
      label: "Approve",
      icon: CheckCircle2,
      color: "bg-success/10 hover:bg-success/20 text-success",
      description: "Application meets all requirements",
    },
    {
      id: "conditional",
      label: "Conditional Approval",
      icon: AlertTriangle,
      color: "bg-warning/10 hover:bg-warning/20 text-warning",
      description: "Approve with conditions to be met",
    },
    {
      id: "reject",
      label: "Reject",
      icon: XCircle,
      color: "bg-error/10 hover:bg-error/20 text-error",
      description: "Does not meet requirements",
    },
    {
      id: "waitlist",
      label: "Waitlist",
      icon: Clock,
      color: "bg-slate-100 hover:bg-slate-200 text-slate-700",
      description: "Place on waitlist for future review",
    },
    {
      id: "escalate",
      label: "Escalate",
      icon: Send,
      color: "bg-brand/10 hover:bg-brand/20 text-brand",
      description: "Send to management review",
    },
    {
      id: "requestInfo",
      label: "Request Information",
      icon: FileText,
      color: "bg-brand/10 hover:bg-brand/20 text-brand",
      description: "Request additional documents",
    },
    {
      id: "withdraw",
      label: "Withdraw",
      icon: Lock,
      color: "bg-slate-100 hover:bg-slate-200 text-slate-700",
      description: "Withdraw the application",
    },
    {
      id: "close",
      label: "Close Case",
      icon: Lock,
      color: "bg-slate-100 hover:bg-slate-200 text-slate-700",
      description: "Close the case permanently",
    },
  ];

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="actions">Decision Actions</TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Decision Actions Tab */}
        <TabsContent value="actions" className="space-y-4 mt-4">
          {!isReady && (
            <Card className="p-4 border-warning/20 bg-warning/5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-950">
                    Application not ready for decision
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Please complete the checklist and verify all documents
                    before making a decision.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Decision Buttons Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {decisions.map((decision) => {
              const Icon = decision.icon;
              return (
                <Button
                  key={decision.id}
                  onClick={() => openDialog(decision.id)}
                  disabled={!isReady && decision.id !== "requestInfo"}
                  variant="outline"
                  className={`flex flex-col items-center gap-2 h-auto py-3 px-2 ${decision.color} ${
                    !isReady && decision.id !== "requestInfo"
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-semibold text-center">
                    {decision.label}
                  </span>
                </Button>
              );
            })}
          </div>

          {/* Decision Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {decisions.map((decision) => (
              <Card key={decision.id} className="p-3">
                <div className="flex items-start gap-2">
                  <decision.icon className="h-4 w-4 flex-shrink-0 mt-0.5 text-slate-400" />
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {decision.label}
                    </p>
                    <p className="text-xs text-slate-600">
                      {decision.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Decision History Tab */}
        <TabsContent value="history" className="mt-4">
          <DecisionHistory key={refreshKey} applicationId={applicationId} />
        </TabsContent>
      </Tabs>

      {/* Decision Dialogs */}
      <ApproveDialog
        open={openDialogs.approve}
        onOpenChange={(open) => closeDialog("approve")}
        applicationId={applicationId}
        organizationId={organizationId}
        applicantName={applicantName}
        onSuccess={handleDecisionSuccess}
      />

      <ConditionalApprovalDialog
        open={openDialogs.conditional}
        onOpenChange={(open) => closeDialog("conditional")}
        applicationId={applicationId}
        organizationId={organizationId}
        applicantName={applicantName}
        onSuccess={handleDecisionSuccess}
      />

      <RejectDialog
        open={openDialogs.reject}
        onOpenChange={(open) => closeDialog("reject")}
        applicationId={applicationId}
        organizationId={organizationId}
        applicantName={applicantName}
        onSuccess={handleDecisionSuccess}
      />

      <WaitlistDialog
        open={openDialogs.waitlist}
        onOpenChange={(open) => closeDialog("waitlist")}
        applicationId={applicationId}
        organizationId={organizationId}
        applicantName={applicantName}
        onSuccess={handleDecisionSuccess}
      />

      <EscalateDialog
        open={openDialogs.escalate}
        onOpenChange={(open) => closeDialog("escalate")}
        applicationId={applicationId}
        organizationId={organizationId}
        applicantName={applicantName}
        onSuccess={handleDecisionSuccess}
      />

      <RequestAdditionalInfoDialog
        open={openDialogs.requestInfo}
        onOpenChange={(open) => closeDialog("requestInfo")}
        applicationId={applicationId}
        organizationId={organizationId}
        applicantName={applicantName}
        onSuccess={handleDecisionSuccess}
      />

      <WithdrawDialog
        open={openDialogs.withdraw}
        onOpenChange={(open) => closeDialog("withdraw")}
        applicationId={applicationId}
        organizationId={organizationId}
        applicantName={applicantName}
        onSuccess={handleDecisionSuccess}
      />

      <CloseCaseDialog
        open={openDialogs.close}
        onOpenChange={(open) => closeDialog("close")}
        applicationId={applicationId}
        organizationId={organizationId}
        applicantName={applicantName}
        onSuccess={handleDecisionSuccess}
      />
    </div>
  );
}
