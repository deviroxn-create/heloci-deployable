export function ApplicationSubmittedEmail({ name }: { name: string }) {
  return (
    <div>
      <h1>Application Received</h1>
      <p>Hi {name},</p>
      <p>We have received your housing assistance application and our team is reviewing it.</p>
    </div>
  );
}
