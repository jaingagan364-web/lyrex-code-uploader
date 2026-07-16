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

      <h2>2. Refund Eligibility</h2>
      <p>
        Refunds may be granted for duplicate charges, accidental purchases, billing errors, or
        verified technical issues that prevent Febily from functioning as intended. Refund
        requests are reviewed on a case-by-case basis.
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
        You may cancel your subscription at any time to stop future renewals. Your subscription
        remains active until the end of your current billing period.
      </p>

      <h2>5. Non-Refundable Charges</h2>
      <p>
        Unless required by applicable law, subscription payments are non-refundable once a billing
        period has begun.
      </p>

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
