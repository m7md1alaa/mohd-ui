import { Toc, type TocHeading } from "@/components/ui/toc";

const HEADINGS: TocHeading[] = [
  { id: "overview", level: 2, text: "Overview" },
  { id: "installation", level: 2, text: "Installation" },
  { id: "configuration", level: 3, text: "Configuration" },
  { id: "accessibility", level: 2, text: "Accessibility" },
];

export function TocDemo() {
  return (
    <div className="relative min-h-[28rem] overflow-hidden rounded-xl border bg-background p-8">
      <Toc headings={HEADINGS} />
      <article className="mx-auto max-w-2xl space-y-20">
        {HEADINGS.map((heading) => (
          <section key={heading.id} id={heading.id} className="scroll-mt-24 space-y-3">
            <h2 className="text-2xl font-semibold">{heading.text}</h2>
            <p className="text-muted-foreground">A section of content that the table of contents can track and navigate to.</p>
          </section>
        ))}
      </article>
    </div>
  );
}
