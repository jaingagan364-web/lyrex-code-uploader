import { createFileRoute } from "@tanstack/react-router";
import LegalLayout from "@/components/LegalLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Febily" },
      { name: "description", content: "The terms and conditions for using Febily's AI receptionist service." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="January 1, 2026">
      <p>
        These Terms of Service ("Terms") govern your access to and use of Febily's website and
        AI receptionist services (collectively, the "Service"). By creating an account or using
        the Service, you agree to be bound by these Terms.
      </p>

      <h2>1. The Service</h2>
      <p>
        Febily provides an AI-powered receptionist that answers phone calls, books appointments,
        and integrates with your calendar. Features and availability may change from time to
        time.
      </p>

      <h2>2. Accounts & Eligibility</h2>
      <ul>
        <li>You must be at least 18 years old and authorized to bind your business.</li>
        <li>You are responsible for maintaining the security of your account credentials.</li>
        <li>You agree to provide accurate, complete information and to keep it current.</li>
      </ul>

      <h2>3. Subscriptions & Billing</h2>
      <ul>
        <li>Febily is offered on a monthly subscription basis. Plans and included AI minutes are described on our pricing page.</li>
        <li>Fees are billed in advance each month and are non-refundable except as described in our Refund Policy.</li>
        <li>Usage beyond your plan's included AI minutes may incur overage fees or trigger an automatic plan upgrade.</li>
        <li>You may cancel anytime; cancellation takes effect at the end of the current billing period.</li>
      </ul>

      <h2>4. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for unlawful, harassing, deceptive, or fraudulent purposes.</li>
        <li>Attempt to reverse engineer, disrupt, or gain unauthorized access to the Service.</li>
        <li>Send spam, robocalls, or communications that violate applicable telemarketing laws (e.g., TCPA).</li>
        <li>Upload content that infringes intellectual property or violates privacy rights.</li>
      </ul>

      <h2>5. Call Recording & Consent</h2>
      <p>
        You are responsible for complying with all applicable call-recording, notice, and consent
        laws in your jurisdiction. Febily may record and transcribe calls to deliver the Service.
      </p>

      <h2>6. Intellectual Property</h2>
      <p>
        Febily and all related trademarks, software, and content are the property of Febily or
        its licensors. You retain ownership of your business content and call data; you grant
        Febily a limited license to process it to provide the Service.
      </p>

      <h2>7. Third-Party Services</h2>
      <p>
        The Service may integrate with third-party providers (e.g., Google Calendar, telephony,
        payment processors). Your use of those services is subject to their terms.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        The Service is provided "as is" and "as available" without warranties of any kind. Febily
        does not guarantee that the AI will always answer perfectly or that appointments will
        never require human review.
      </p>

      <h2>9. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, Febily's total liability for any claim arising
        out of or related to the Service will not exceed the amount you paid Febily in the
        three (3) months preceding the claim. Febily will not be liable for indirect,
        incidental, or consequential damages.
      </p>

      <h2>10. Termination</h2>
      <p>
        We may suspend or terminate your access to the Service for violation of these Terms or
        for any reason on notice. You may cancel your subscription anytime from your account
        settings.
      </p>

      <h2>11. Governing Law</h2>
      <p>
        These Terms are governed by the laws of the United States and the state in which Febily
        is headquartered, without regard to conflict-of-laws rules.
      </p>

      <h2>12. Changes</h2>
      <p>
        We may update these Terms from time to time. Continued use of the Service after changes
        constitutes acceptance of the updated Terms.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions? Email <a href="mailto:febilysupport@gmail.com">febilysupport@gmail.com</a>.
      </p>
    </LegalLayout>
  );
}
