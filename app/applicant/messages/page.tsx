import { ApplicantShell } from "@/components/applicant/applicant-shell";
import { ApplicantMessagesPanel } from "@/components/applicant/applicant-messages-panel";

export default function ApplicantMessagesPage() {
  return (
    <ApplicantShell title="Messages" description="Stay connected with your HELOCI support team.">
      <ApplicantMessagesPanel />
    </ApplicantShell>
  );
}
