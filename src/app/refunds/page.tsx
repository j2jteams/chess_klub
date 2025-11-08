import { Header, Footer } from '@/components/layout';
import { BUSINESS_NAME, BUSINESS_LEGAL_NAME, SUPPORT_EMAIL } from '@/lib/site-config';

export default function RefundsPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 max-w-4xl py-8">
        <div className="prose prose-lg max-w-none">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold sunset-text-gradient mb-4">
              Refunds & Cancellations
            </h1>
            <p className="text-lg text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <section>
            <h2>What we do</h2>
            <p>
              {BUSINESS_NAME} is a marketplace platform operated by {BUSINESS_LEGAL_NAME}. Organizers list events and
              attendees purchase tickets/registrations through our platform.
            </p>
          </section>

          <section>
            <h2>Ticket refunds</h2>
            <ul>
              <li>Event pages should state the organizer’s refund window (e.g., full refund up to 7 days before start).</li>
              <li>If an event is cancelled by the organizer, attendees are entitled to a full refund of the ticket price.</li>
              <li>Platform service/processing fees are non‑refundable unless required by law or in case of processing error.</li>
            </ul>
          </section>

          <section>
            <h2>How to request a refund</h2>
            <ol>
              <li>Contact the organizer via the event page, or email {SUPPORT_EMAIL} with your order ID.</li>
              <li>Refunds are issued to the original payment method. Banks may take 5–10 business days to post funds.</li>
            </ol>
          </section>

          <section>
            <h2>Cancellations</h2>
            <p>
              Organizers may cancel events from their dashboard. When applicable, affected orders are refunded automatically
              according to the event’s stated policy.
            </p>
          </section>

          <section>
            <h2>Disputes</h2>
            <p>
              Please contact us first so we can help resolve the issue quickly. If a chargeback is filed, the timeline is
              governed by the card network and your bank.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
