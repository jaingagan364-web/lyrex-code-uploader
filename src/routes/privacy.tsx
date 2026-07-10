import { createFileRoute } from "@tanstack/react-router";
import LegalLayout from "@/components/LegalLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Febily" },
      { name: "description", content: "How Febily collects, uses, and protects your information." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="January 1, 2026">
      <p>
        Febily ("Febily," "we," "us," or "our") provides AI receptionist services for salons and
        barber shops. This Privacy Policy explains how we collect, use, share, and protect
        information when you visit our website, request a demo, or subscribe to our services.
      </p>

      <h2>1. Information We Collect</h2>
      <ul>
        <li><strong>Account & contact information:</strong> name, business name, email, phone number, and billing details you submit through our forms or checkout.</li>
        <li><strong>Call data:</strong> audio recordings, transcripts, caller phone numbers, appointment details, and metadata generated when our AI receptionist handles calls on your behalf.</li>
        <li><strong>Usage data:</strong> device, browser, IP address, pages viewed, and interactions with our website, collected via cookies and similar technologies.</li>
        <li><strong>Integration data:</strong> calendar availability and appointment details from services you connect (e.g., Google Calendar).</li>
      </ul>

      <h2>2. How We Use Information</h2>
      <ul>
        <li>To provide, operate, and improve the Febily service.</li>
        <li>To answer calls, book appointments, and sync with your calendar.</li>
        <li>To communicate with you about your account, billing, support, and product updates.</li>
        <li>To train and improve our AI models using de-identified or aggregated data.</li>
        <li>To comply with legal obligations and enforce our terms.</li>
      </ul>

      <h2>3. How We Share Information</h2>
      <p>
        We do not sell your personal information. We share limited information with trusted
        service providers who help us operate the platform (hosting, telephony, AI infrastructure,
        payment processing, analytics, and customer support), and when required by law.
      </p>

      <h2>4. Data Retention</h2>
      <p>
        We retain personal information for as long as your account is active and as needed to
        provide the service, resolve disputes, and comply with our legal obligations. Call
        recordings may be retained on a rolling basis according to your plan.
      </p>

      <h2>5. Security</h2>
      <p>
        We use industry-standard technical and organizational safeguards to protect your data,
        including encryption in transit and at rest, restricted access controls, and monitoring.
        No system can be guaranteed 100% secure.
      </p>

      <h2>6. Your Rights</h2>
      <p>
        Depending on your location, you may have rights to access, correct, delete, or export
        your personal information, and to opt out of certain processing. To exercise these
        rights, email us at <a href="mailto:febilysupport@gmail.com">febilysupport@gmail.com</a>.
      </p>

      <h2>7. Children's Privacy</h2>
      <p>
        Febily is intended for business use and is not directed to children under 13. We do not
        knowingly collect personal information from children.
      </p>

      <h2>8. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Material changes will be notified
        via email or on our website.
      </p>

      <h2>9. Contact Us</h2>
      <p>
        Questions? Email <a href="mailto:febilysupport@gmail.com">febilysupport@gmail.com</a>.
      </p>
    </LegalLayout>
  );
}
