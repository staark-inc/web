import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
} from "lucide-react";

import { StandaloneLayout } from "../../components/SiteChrome";
import {
  getPostBySlug,
  posts,
} from "../../data/posts";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

/* =========================================================
   STATIC BLOG ROUTES
========================================================= */

export function generateStaticParams() {
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

/* =========================================================
   METADATA
========================================================= */

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;

  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "Artikel hittades inte",
    };
  }

  return {
    title: post.title,
    description: post.description,

    alternates: {
      canonical: `/blog/${post.slug}`,
    },

    openGraph: {
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime:
        post.updatedAt || post.publishedAt,
    },
  };
}

/* =========================================================
   PAGE
========================================================= */

export default async function BlogPostPage({
  params,
}: Props) {
  const { slug } = await params;

  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="v2-page">
      <StandaloneLayout>

        {/* HERO */}
        <section className="blog-article-hero">
          <div className="blog-article-hero-inner">

            <Link
              href="/blog"
              className="service-back-link"
            >
              <ArrowLeft size={16} />
              Alla artiklar
            </Link>

            <span className="blog-category">
              {post.category}
            </span>

            <h1>
              {post.title}
            </h1>

            <p>
              {post.description}
            </p>

            <div className="blog-article-meta">

              <span>
                {formatDate(post.publishedAt)}
              </span>

              <span className="blog-meta-dot" />

              <span>
                <Clock size={15} />
                {post.readingTime} läsning
              </span>

            </div>

          </div>
        </section>


        {/* CONTENT */}
        <section className="blog-article-section">

          <article className="blog-article-content">

            {post.content.map((section, index) => (
              <section
                key={`${post.slug}-${index}`}
                className="blog-content-section"
              >

                {section.heading && (
                  <h2>
                    {section.heading}
                  </h2>
                )}

                {section.paragraphs?.map(
                  (paragraph, paragraphIndex) => (
                    <p
                      key={`${index}-${paragraphIndex}`}
                    >
                      {paragraph}
                    </p>
                  )
                )}

                {section.list && (
                  <ul>
                    {section.list.map((item) => (
                      <li key={item}>

                        <span>
                          <Check size={15} />
                        </span>

                        {item}

                      </li>
                    ))}
                  </ul>
                )}

              </section>
            ))}


            {/* CTA */}
            <div className="blog-article-cta">

              <span>
                STAARK INC.
              </span>

              <h2>
                Behöver ditt företag en bättre webbplats?
              </h2>

              <p>
                Vi hjälper företag med webbdesign,
                webbutveckling, SEO och prestanda.
              </p>

              <div>

                <Link
                  href="/kontakt"
                  className="v2-button v2-button-primary"
                >
                  Få kostnadsfri offert
                  <ArrowRight size={17} />
                </Link>

                <Link
                  href="/tjanster"
                  className="v2-button v2-button-light"
                >
                  Våra tjänster
                </Link>

              </div>

            </div>


            <Link
              href="/blog"
              className="blog-back-bottom"
            >
              <ArrowLeft size={16} />
              Tillbaka till bloggen
            </Link>

          </article>

        </section>

      </StandaloneLayout>
    </div>
  );
}