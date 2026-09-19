import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Clock,
} from "lucide-react";

import { StandaloneLayout } from "../components/SiteChrome";
import { posts } from "../data/posts";

export const metadata: Metadata = {
  title: "Blogg",
  description:
    "Guider och tips om webbdesign, SEO, webbutveckling och digital synlighet för småföretag.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Blogg | Staark Inc.",
    description:
      "Guider och praktiska tips om webbdesign, SEO och webbutveckling för företag.",
    url: "/blog",
    type: "website",
  },
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export default function BlogPage() {
  const sortedPosts = [...posts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() -
      new Date(a.publishedAt).getTime()
  );

  return (
    <div className="v2-page">
      <StandaloneLayout>

        {/* HERO */}
        <section className="v2-hero">
          <div className="v2-hero-copy">

            <span className="v2-pill">
              STAARK BLOGG
            </span>

            <h1>
              Kunskap för en bättre närvaro online.
            </h1>

            <p>
              Guider och praktiska tips om webbdesign,
              SEO, prestanda och webbutveckling för
              företag som vill växa digitalt.
            </p>

          </div>
        </section>


        {/* ARTICLES */}
        <section className="v2-section blog-section">

          <div className="v2-section-header">

            <span>
              SENASTE ARTIKLARNA
            </span>

            <h2>
              Tips, guider och idéer.
            </h2>

            <p>
              Vi delar med oss av kunskap som hjälper dig
              att förstå webben och fatta bättre digitala
              beslut för ditt företag.
            </p>

          </div>


          <div className="blog-grid">

            {sortedPosts.map((post) => (
              <article
                key={post.slug}
                className={
                  post.featured
                    ? "blog-card featured"
                    : "blog-card"
                }
              >

                <div className="blog-card-top">

                  <span className="blog-category">
                    {post.category}
                  </span>

                  {post.featured && (
                    <span className="blog-featured">
                      UTVALD
                    </span>
                  )}

                </div>


                <h3>
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h3>


                <p>
                  {post.description}
                </p>


                <div className="blog-card-meta">

                  <span>
                    <BookOpen size={14} />
                    {formatDate(post.publishedAt)}
                  </span>

                  <span>
                    <Clock size={14} />
                    {post.readingTime}
                  </span>

                </div>


                <Link
                  href={`/blog/${post.slug}`}
                  className="v2-text-link"
                >
                  Läs artikeln
                  <ArrowRight size={15} />
                </Link>

              </article>
            ))}

          </div>

        </section>


        {/* CTA */}
        <section className="v2-section v2-portfolio">

          <div className="blog-cta">

            <span>
              BEHÖVER DU HJÄLP?
            </span>

            <h2>
              Från kunskap till en bättre webbplats.
            </h2>

            <p>
              Behöver ditt företag en ny webbplats,
              bättre prestanda eller hjälp med SEO?
              Berätta vad du behöver så hjälper vi dig.
            </p>

            <Link
              href="/kontakt"
              className="v2-button v2-button-primary"
            >
              Kontakta oss
              <ArrowRight size={17} />
            </Link>

          </div>

        </section>

      </StandaloneLayout>
    </div>
  );
}