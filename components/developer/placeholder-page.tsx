import { DeveloperHeader } from "./developer-header";

interface PlaceholderPageProps {
  title: string;
}

export function DeveloperPlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <DeveloperHeader title={title} />
      <div className="rounded-xl border bg-card p-12 shadow-sm text-center">
        <h2 className="text-xl font-semibold text-muted-foreground">
          {title} page coming soon
        </h2>
        <p className="mt-2 text-muted-foreground">This page is under development</p>
      </div>
    </div>
  );
}
