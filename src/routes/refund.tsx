import { createFileRoute } from "@tanstack/react-router";
import LegalLayout from "@/components/LegalLayout";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund Policy — Febily" },
      { name: "description", content: "Febily's refund and cancellation policy for monthly subscriptions." },
    ],
  }),
  component: RefundPage,
});

function RefundPage() {
  return (
    <LegalLayout title="Refund Policy" updated="January 1, 2026">
      <p>
        We want you to be delighted with Febily. This Refund Policy explains when and how you
        can request a refund for your Febily subscription.
      </p>

      <h2>1. Monthly Subscriptions</h2>
      <p>
        Febily is billed monthly in advance. Because you can cancel anytime, we do not
        automatically prorate or refund unused time in the current billing period once it has
        started.
      </p>

      <h2>2. 7-Day Money-Back Guarantee</h2>
      <p>
        If you are not satisfied with Febily, you may request a full refund of your first
        month's subscription within seven (7) days of your initial paid subscription. This
        guarantee applies only to your first paid billing cycle.
      </p>

      <h2>3. How to Request a Refund</h2>
      <p>
        Email <a href="mailto:support@febily.com">support@febily.com</a> from the email
        associated with your account. Please include your business name and the reason for the
        request. Approved refunds are issued to the original payment method within 5–10 business
        days.
      </p>

      <h2>4. Cancellations</h2>
      <p>
        You can cancel your subscription at any time. Cancellation stops future billing; your
        service remains active until the end of your current billing period.
      </p>

      <h2>5. Non-Refundable Items</h2>
      <ul>
        <li>Usage-based overage charges.</li>
        <li>Custom onboarding, integration, or professional-service fees.</li>
        <li>Renewal charges after the initial 7-day guarantee period.</li>
      </ul>

      <h2>6. Chargebacks</h2>
      <p>
        Please contact us before initiating a chargeback. We are almost always able to resolve
        billing issues directly and quickly.
      </p>

      <h2>7. Contact</h2>
      <p>
        Questions about refunds? Email <a href="mailto:support@febily.com">support@febily.com</a>.
      </p>
    </LegalLayout>
  );
}
