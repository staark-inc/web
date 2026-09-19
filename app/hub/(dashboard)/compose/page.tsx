import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import ComposeForm from "./ComposeForm";

type PageProps = {
  searchParams: Promise<{
    replyTo?: string;
    subject?: string;
  }>;
};

export default async function HubComposePage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  return (
    <div className="hub-page hub-compose-page">
      <header className="hub-page-header">
        <div>
          <Link href="/hub" className="hub-back">
            <ArrowLeft size={16} />
            Inbox
          </Link>

          <h1>New message</h1>
          <p>Send an email using the Staark template.</p>
        </div>
      </header>

      <ComposeForm
        initialTo={params.replyTo ?? ""}
        initialSubject={params.subject ?? ""}
      />
    </div>
  );
}