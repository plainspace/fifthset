import { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SubmitForm from "@/components/SubmitForm";

export const metadata: Metadata = {
  title: "Submit a Show",
  description:
    "Add your show to Fifth Set. Venues and artists can submit live jazz events for free.",
  robots: { index: true, follow: true },
};

export default function SubmitPage() {
  return (
    <>
      <Nav />
      <main className="pt-16 min-h-screen">
        {/* Hero */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-12 text-center">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-text text-balance">
            Submit a show to{" "}
            <span className="text-accent">Fifth Set</span>
          </h1>
          <p className="text-text-muted text-lg mt-6 max-w-xl mx-auto text-balance">
            We curate listings daily, but we don&apos;t catch everything.
            If your show is missing, let us know.
          </p>
        </section>

        {/* How we get listings */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-12">
          <div className="rounded-xl bg-surface border border-border p-6 sm:p-8">
            <h2 className="font-serif text-xl text-text mb-4">
              How listings work
            </h2>
            <div className="space-y-3 text-sm text-text-muted">
              <p className="text-pretty">
                Fifth Set curates jazz listings across every city we
                cover. Listings update every morning automatically.
              </p>
              <p className="text-pretty">
                If your venue or event isn&apos;t showing up, submit it
                here and we&apos;ll add it.
              </p>
            </div>
          </div>
        </section>

        {/* Submission form */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
          <SubmitForm />
        </section>

        <div className="pb-24" />
      </main>
      <Footer />
    </>
  );
}
