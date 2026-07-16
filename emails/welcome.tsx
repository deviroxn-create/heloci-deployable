export function WelcomeEmail({ name }: { name: string }) {
  return (
    <div>
      <h1>Welcome to Heloci</h1>
      <p>Hi {name},</p>
      <p>Thanks for joining our housing support community.</p>
    </div>
  );
}
