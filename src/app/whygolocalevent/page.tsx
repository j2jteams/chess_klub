'use client';

import { Header, Footer } from '@/components/layout';
import Link from 'next/link';

export default function WhyChessKlubPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 max-w-4xl py-8">
        <div className="prose prose-lg max-w-none">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold sunset-text-gradient mb-4">
              Why Chess Klub?
            </h1>
            <p className="text-lg text-muted-foreground">
              Your premier platform for chess tournaments and events, built for the chess community.
            </p>
          </div>

          <div className="space-y-8 text-foreground">
            {/* For Chess Players */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">For Chess Players</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Discover local chess tournaments and events near you</li>
                <li>Easy registration and event management</li>
                <li>Get reminders for upcoming tournaments and matches</li>
                <li>Connect with fellow chess enthusiasts in your area</li>
              </ul>
            </section>

            {/* For Tournament Organizers */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary">For Tournament Organizers</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Reach chess players in your local community</li>
                <li>Customizable tournament pages with registration built-in</li>
                <li>Track registrations and manage participants easily</li>
                <li>Simple, focused platform designed specifically for chess events</li>
              </ul>
            </section>

            {/* What Makes Us Different */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary"> What Makes Us Different</h2>
              <p>
                Chess Klub is dedicated exclusively to the chess community. Whether it's a local club tournament, 
                a rated competition, a blitz event, or a casual meetup — we provide a platform that understands 
                the unique needs of chess players and organizers. We connect players to events, making it easy to 
                find, register for, and participate in chess activities in your area.
              </p>
            </section>

            {/* Reach Out */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-primary"> Reach Out to Us</h2>
              <p className='mb-4'>
                Have questions or want to know more about Chess Klub? We'd love to connect with you!
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Email:{' '}
                  <a href="mailto:support@chessklub.com" className="text-primary underline">
                    support@chessklub.com
                  </a>
                </li>
                <li>
                  Contact:{' '}
                  <a href="https://wa.me/19803219151" className="text-primary underline">
                    +1 (980) 321-9151
                  </a>
                </li>
                <li>
                  Or use our{' '}
                  <Link href="/contact" className="text-primary underline">
                    Contact Form
                  </Link>
                </li>
              </ul>
            </section>

            {/* Button to Browse Events */}
            <section className="mt-8 mb-4 flex justify-center">
              <Link
                href="/events"
                className="bg-primary text-white px-6 py-3 rounded-full font-medium hover:bg-primary/90 transition"
              >
                Browse Chess Events
              </Link>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
