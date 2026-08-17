import { AssistantChat } from "@/components/ai/assistant-chat"
import { PageHeader } from "@/components/ui/page-header"
import { requireCompleteProfile } from "@/lib/auth"

export default async function AssistantPage() {
  const ctx = await requireCompleteProfile()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Waste2Worth AI Assistant"
        description="Ask about selling, buying, materials, listings, offers, or marketplace use."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <AssistantChat role={ctx.company.role} pageContext="/dashboard/assistant" />
        <aside className="space-y-3 rounded-lg border border-border bg-muted/20 p-5 text-sm">
          <p className="font-medium text-foreground">What the assistant can help with</p>
          <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
            <li>How to sell waste with AI Smart Listing or manual listing</li>
            <li>How offers, matching, and transactions work</li>
            <li>What contamination and reuse mean in plain language</li>
            <li>Where to find your listings, offers, and messages</li>
          </ul>
          <p className="text-muted-foreground">
            The assistant guides and navigates — it will not publish listings or accept offers for
            you.
          </p>
        </aside>
      </div>
    </div>
  )
}
