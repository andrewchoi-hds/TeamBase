export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl">
            TB
          </div>
          <h1 className="mt-4 text-2xl font-bold">TeamBase</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            팀원 성과관리 플랫폼
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
