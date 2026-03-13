import { Metadata } from "next";
import { Send, Music, MapPin, Calendar, Clock } from "lucide-react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

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
            We pull listings from public calendars daily, but we don&apos;t
            catch everything. If your show is missing, let us know.
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
                Fifth Set aggregates jazz listings from public sources
                including{" "}
                <a
                  href="https://jazz-nyc.com/"
                  className="text-accent hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  jazz-nyc.com
                </a>{" "}
                and{" "}
                <a
                  href="https://www.wwoz.org/livewire"
                  className="text-accent hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WWOZ Livewire
                </a>
                . Our scrapers run every morning and update automatically.
              </p>
              <p className="text-pretty">
                If your venue or event isn&apos;t showing up, it might not be
                listed on a source we track yet. Submit it here and we&apos;ll
                add it manually and look into adding your calendar as a source.
              </p>
            </div>
          </div>
        </section>

        {/* Submission form */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
          <form
            action="https://formspree.io/f/submit@fifthset.live"
            method="POST"
            className="space-y-8"
          >
            {/* Event details */}
            <div className="rounded-xl bg-surface border border-border p-6 sm:p-8 space-y-6">
              <h2 className="font-serif text-xl text-text flex items-center gap-2">
                <Music className="w-5 h-5 text-accent" />
                Event details
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="artist"
                    className="block text-sm text-text-muted mb-1.5"
                  >
                    Artist / Band name *
                  </label>
                  <input
                    type="text"
                    id="artist"
                    name="artist"
                    required
                    placeholder="e.g. Thelonious Monk Tribute"
                    className="w-full rounded-lg bg-bg border border-border px-4 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="genre"
                    className="block text-sm text-text-muted mb-1.5"
                  >
                    Genre / Style
                  </label>
                  <input
                    type="text"
                    id="genre"
                    name="genre"
                    placeholder="e.g. Bebop, Funk, Brass Band"
                    className="w-full rounded-lg bg-bg border border-border px-4 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="date"
                    className="block text-sm text-text-muted mb-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5 inline mr-1" />
                    Date *
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    required
                    className="w-full rounded-lg bg-bg border border-border px-4 py-2.5 text-sm text-text focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="time"
                    className="block text-sm text-text-muted mb-1.5"
                  >
                    <Clock className="w-3.5 h-3.5 inline mr-1" />
                    Start time *
                  </label>
                  <input
                    type="time"
                    id="time"
                    name="time"
                    required
                    className="w-full rounded-lg bg-bg border border-border px-4 py-2.5 text-sm text-text focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm text-text-muted mb-1.5"
                >
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Anything else about the show... cover charge, special guests, etc."
                  className="w-full rounded-lg bg-bg border border-border px-4 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors resize-none"
                />
              </div>
            </div>

            {/* Venue details */}
            <div className="rounded-xl bg-surface border border-border p-6 sm:p-8 space-y-6">
              <h2 className="font-serif text-xl text-text flex items-center gap-2">
                <MapPin className="w-5 h-5 text-accent" />
                Venue
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="venue"
                    className="block text-sm text-text-muted mb-1.5"
                  >
                    Venue name *
                  </label>
                  <input
                    type="text"
                    id="venue"
                    name="venue"
                    required
                    placeholder="e.g. Preservation Hall"
                    className="w-full rounded-lg bg-bg border border-border px-4 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm text-text-muted mb-1.5"
                  >
                    City *
                  </label>
                  <select
                    id="city"
                    name="city"
                    required
                    className="w-full rounded-lg bg-bg border border-border px-4 py-2.5 text-sm text-text focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="">Select a city</option>
                    <option value="nyc">New York City</option>
                    <option value="nola">New Orleans</option>
                    <option value="chicago">Chicago</option>
                    <option value="la">Los Angeles</option>
                    <option value="sf">San Francisco</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="venue_url"
                  className="block text-sm text-text-muted mb-1.5"
                >
                  Venue website or calendar URL
                </label>
                <input
                  type="url"
                  id="venue_url"
                  name="venue_url"
                  placeholder="https://..."
                  className="w-full rounded-lg bg-bg border border-border px-4 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors"
                />
                <p className="text-xs text-text-muted/60 mt-1.5">
                  If you share your calendar URL, we can add it as a recurring
                  source so your shows appear automatically.
                </p>
              </div>
            </div>

            {/* Submitter info */}
            <div className="rounded-xl bg-surface border border-border p-6 sm:p-8 space-y-6">
              <h2 className="font-serif text-xl text-text">Your info</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="submitter_name"
                    className="block text-sm text-text-muted mb-1.5"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="submitter_name"
                    name="submitter_name"
                    placeholder="Your name"
                    className="w-full rounded-lg bg-bg border border-border px-4 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm text-text-muted mb-1.5"
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-lg bg-bg border border-border px-4 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm text-text-muted mb-1.5"
                >
                  I am a...
                </label>
                <select
                  id="role"
                  name="role"
                  className="w-full rounded-lg bg-bg border border-border px-4 py-2.5 text-sm text-text focus:outline-none focus:border-accent transition-colors"
                >
                  <option value="">Select</option>
                  <option value="venue">Venue owner / manager</option>
                  <option value="artist">Artist / Musician</option>
                  <option value="promoter">Promoter / Booker</option>
                  <option value="fan">Fan / Listener</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-center">
              <button
                type="submit"
                className="flex items-center gap-2 px-8 py-3 bg-accent text-bg font-medium rounded-lg hover:bg-accent-hover transition-colors"
              >
                <Send className="w-4 h-4" />
                Submit Show
              </button>
            </div>

            <p className="text-center text-xs text-text-muted/60">
              We review submissions daily. Most shows are added within 24 hours.
            </p>
          </form>
        </section>

        {/* WWOZ attribution */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
          <div className="rounded-xl bg-surface border border-border p-6 text-center">
            <p className="text-sm text-text-muted text-balance">
              New Orleans listings powered by{" "}
              <a
                href="https://www.wwoz.org/livewire"
                className="text-accent hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                WWOZ Livewire Music Calendar
              </a>
              . Artists and venues can also submit directly to{" "}
              <a
                href="https://www.wwoz.org/submitting-events-livewire-music-calendar"
                className="text-accent hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                WWOZ
              </a>
              .
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
