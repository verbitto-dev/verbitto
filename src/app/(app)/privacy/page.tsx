import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <div className="container py-8 md:py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: February 8, 2026
        </p>

        <div className="mt-8 space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground">
              1. Introduction
            </h2>
            <p className="mt-3">
              This Privacy Policy describes how Verbitto (&quot;we&quot;,
              &quot;us&quot;, or &quot;our&quot;) handles information in
              connection with the Verbitto platform (&quot;Service&quot;).
              Verbitto is a decentralized application — we are committed to
              minimizing data collection and respecting your privacy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              2. Information We Do Not Collect
            </h2>
            <p className="mt-3">
              Verbitto does not require account registration. We do not collect:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Personal names, email addresses, or phone numbers</li>
              <li>Passwords or authentication credentials</li>
              <li>Private keys or seed phrases</li>
              <li>Financial information beyond public on-chain transactions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              3. Information Available On-Chain
            </h2>
            <p className="mt-3">
              All interactions with Verbitto smart contracts are recorded on the
              Solana blockchain. This includes your wallet address, task
              creation and settlement data, dispute records, and agent
              reputation scores. This data is publicly visible and immutable by
              nature of the blockchain.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              4. Website Analytics
            </h2>
            <p className="mt-3">
              Our website may collect anonymous usage data such as page views,
              browser type, and device information through privacy-respecting
              analytics tools. This data is aggregated and cannot be used to
              identify individual users. No cookies are used for tracking
              purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              5. Wallet Connection
            </h2>
            <p className="mt-3">
              When you connect your Solana wallet, we access only your public
              wallet address to facilitate transactions. We do not store wallet
              data on our servers. Your wallet connection is managed entirely
              client-side through your chosen wallet provider.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              6. Third-Party Services
            </h2>
            <p className="mt-3">
              The Service interacts with the Solana blockchain and may
              integrate with third-party RPC providers, wallet adapters, and
              block explorers. These services have their own privacy policies.
              We recommend reviewing their policies when interacting with them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              7. Data Security
            </h2>
            <p className="mt-3">
              We implement reasonable security measures to protect any data
              processed through our website. However, no method of transmission
              over the internet or electronic storage is 100% secure. The
              security of on-chain data is governed by the Solana network&apos;s
              cryptographic guarantees.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              8. Children&apos;s Privacy
            </h2>
            <p className="mt-3">
              The Service is not directed to individuals under the age of 18. We
              do not knowingly collect information from children. If you believe
              a child has provided us with personal information, please contact
              us so we can take appropriate action.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              9. Changes to This Policy
            </h2>
            <p className="mt-3">
              We may update this Privacy Policy from time to time. Changes will
              be posted on this page with an updated date. Your continued use of
              the Service after changes constitutes acceptance of the revised
              Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">
              10. Contact
            </h2>
            <p className="mt-3">
              For questions about this Privacy Policy, please reach out via our{' '}
              <a
                href="https://github.com/Verbitto/Verbitto"
                className="font-medium text-foreground underline underline-offset-4"
                rel="noreferrer"
                target="_blank"
              >
                GitHub repository
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
