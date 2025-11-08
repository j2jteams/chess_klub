import { Header, Footer } from '@/components/layout';
import { BUSINESS_NAME, BUSINESS_LEGAL_NAME, SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_ADDRESS } from '@/lib/site-config';

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 max-w-4xl py-8">
        <div className="prose prose-lg max-w-none">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold sunset-text-gradient mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-muted-foreground">
              Last updated: January 15, 2025
            </p>
          </div>

          <div className="space-y-8 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">1. Acceptance of Terms</h2>
              <p className="mb-4">
                Welcome to {BUSINESS_NAME} ("we," "us," "our," or "the Service"). These Terms of Service 
                ("Terms") govern your use of our website, mobile application, and related services 
                (collectively, "the Service") operated by {BUSINESS_LEGAL_NAME}.
              </p>
              <p className="mb-4">
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree 
                with any part of these terms, then you may not access the Service.
              </p>
              <p>
                We reserve the right to update, change, or replace any part of these Terms by posting 
                updates and/or changes to our website. Your continued use of or access to the website 
                following the posting of any changes constitutes acceptance of those changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">2. Description of Service</h2>
              <p className="mb-4">
                {BUSINESS_NAME} is a platform that connects event organizers with local communities. 
                Our Service allows users to:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Discover chess tournaments and events</li>
                <li>Create and manage events</li>
                <li>Register and purchase tickets for events</li>
                <li>Communicate with other users and event organizers</li>
                <li>Share event information on social media</li>
                <li>Receive notifications about events and updates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">3. User Accounts</h2>
              
              <h3 className="text-xl font-medium mb-3">Account Creation</h3>
              <p className="mb-4">
                To access certain features of the Service, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your account information</li>
                <li>Keep your password secure and confidential</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">Account Termination</h3>
              <p className="mb-4">
                You may terminate your account at any time by contacting us. We may terminate or suspend 
                your account immediately, without prior notice, for conduct that we believe violates these 
                Terms or is harmful to other users, us, or third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">4. User Content and Conduct</h2>
              
              <h3 className="text-xl font-medium mb-3">Content Ownership</h3>
              <p className="mb-4">
                You retain ownership of any content you submit, post, or display on the Service ("User Content"). 
                By submitting User Content, you grant us a non-exclusive, worldwide, royalty-free license to 
                use, display, and distribute your content in connection with the Service.
              </p>

              <h3 className="text-xl font-medium mb-3">Prohibited Content</h3>
              <p className="mb-4">You agree not to post User Content that:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Is illegal, harmful, threatening, abusive, or discriminatory</li>
                <li>Violates any intellectual property rights</li>
                <li>Contains false or misleading information</li>
                <li>Promotes illegal activities or violence</li>
                <li>Contains spam, viruses, or malicious code</li>
                <li>Violates privacy rights of others</li>
                <li>Is sexually explicit or inappropriate</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">User Conduct</h3>
              <p className="mb-4">You agree to use the Service responsibly and not to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Impersonate any person or entity</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Interfere with the proper functioning of the Service</li>
                <li>Use the Service for commercial purposes without permission</li>
                <li>Create fake events or provide false event information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">5. Event Creation and Management</h2>
              
              <h3 className="text-xl font-medium mb-3">Event Organizer Responsibilities</h3>
              <p className="mb-4">As an event organizer, you agree to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Provide accurate and complete event information</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Obtain necessary permits and licenses</li>
                <li>Ensure event safety and security measures</li>
                <li>Handle ticket sales and refunds appropriately</li>
                <li>Communicate changes or cancellations promptly</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">Event Approval</h3>
              <p className="mb-4">
                We reserve the right to review and approve events before they are published. Events may be 
                rejected if they violate these Terms or our community guidelines.
              </p>

              <h3 className="text-xl font-medium mb-3">Event Cancellation</h3>
              <p>
                Event organizers may cancel events through their dashboard. In case of cancellation, 
                organizers are responsible for refunding ticket holders according to their stated refund policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">6. Payment and Fees</h2>
              
              <h3 className="text-xl font-medium mb-3">Service Fees</h3>
              <p className="mb-4">
                {BUSINESS_NAME} may charge service fees for certain features, including:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Premium event listings</li>
                <li>Advanced promotional features</li>
                <li>Payment processing for ticket sales</li>
                <li>Additional analytics and reporting tools</li>
              </ul>

              <h3 className="text-xl font-medium mb-3">Payment Terms</h3>
              <p className="mb-4">
                All fees are due immediately upon purchase. Payments are processed through secure third-party 
                payment processors. We do not store your payment information on our servers.
              </p>

              <h3 className="text-xl font-medium mb-3">Refunds</h3>
              <p>
                Service fees are generally non-refundable except in cases of technical errors or as required by law. 
                Event ticket refunds are subject to the event organizer's refund policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">7. Intellectual Property</h2>
              <p className="mb-4">
                The Service and its original content, features, and functionality are owned by {BUSINESS_LEGAL_NAME} 
                and are protected by international copyright, trademark, patent, trade secret, and other 
                intellectual property laws.
              </p>
              <p className="mb-4">
                You may not use our trademarks, logos, or proprietary information without our express written consent.
              </p>
              <p>
                If you believe that any content on our Service infringes your intellectual property rights, 
                please contact us with details of the alleged infringement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">8. Privacy and Data Protection</h2>
              <p className="mb-4">
                Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect 
                your information when you use the Service. By using our Service, you agree to the collection 
                and use of information in accordance with our Privacy Policy.
              </p>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and for 
                all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">9. Disclaimers and Limitations</h2>
              
              <h3 className="text-xl font-medium mb-3">Service Availability</h3>
              <p className="mb-4">
                We strive to provide reliable service, but cannot guarantee that the Service will be available 
                at all times or without interruption. We may temporarily suspend or restrict access for 
                maintenance, updates, or other reasons.
              </p>

              <h3 className="text-xl font-medium mb-3">Content Disclaimer</h3>
              <p className="mb-4">
                We are not responsible for the accuracy, completeness, or reliability of User Content or 
                event information. Users participate in events at their own risk.
              </p>

              <h3 className="text-xl font-medium mb-3">Limitation of Liability</h3>
              <p className="mb-4">
                To the maximum extent permitted by law, {BUSINESS_LEGAL_NAME} shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages, including without limitation, loss of 
                profits, data, use, goodwill, or other intangible losses.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">10. Indemnification</h2>
              <p>
                You agree to defend, indemnify, and hold harmless {BUSINESS_LEGAL_NAME} and its affiliates, officers, 
                directors, employees, and agents from and against any claims, damages, obligations, losses, 
                liabilities, costs, or debt arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">11. Governing Law and Disputes</h2>
              <p className="mb-4">
                These Terms shall be interpreted and governed by the laws of the State of New York, United States, 
                without regard to conflict of law provisions.
              </p>
              <p className="mb-4">
                Any disputes arising under these Terms will be resolved through binding arbitration in accordance 
                with the rules of the American Arbitration Association, except where prohibited by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">12. Severability</h2>
              <p>
                If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions 
                will remain in full force and effect, and the invalid provision will be replaced with a valid 
                provision that most closely matches the intent of the original provision.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">13. Entire Agreement</h2>
              <p>
                These Terms, together with our Privacy Policy and our Refunds & Cancellations Policy, constitute the entire agreement between you and 
                {BUSINESS_LEGAL_NAME} regarding your use of the Service and supersede all prior agreements and understandings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">14. Contact Information</h2>
              <p className="mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p><strong>{BUSINESS_LEGAL_NAME}</strong></p>
                <p>Email: {SUPPORT_EMAIL}</p>
                <p>Phone: {SUPPORT_PHONE}</p>
                <p>Address: {SUPPORT_ADDRESS}</p>
              </div>
              <p className="mt-4 text-sm">See our <a href="/refunds" className="underline">Refunds & Cancellations</a> policy for refund windows and dispute handling.</p>
            </section>

            <div className="mt-8 p-6 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> These Terms of Service are effective as of the date listed above. 
                Your continued use of {BUSINESS_NAME} after any changes to these Terms constitutes your 
                acceptance of the new Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}