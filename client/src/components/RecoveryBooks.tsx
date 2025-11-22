import BookCard from "./BookCard";
import { Badge } from "@/components/ui/badge";
import bookCoverImage from "@assets/generated_images/sasquatch_recovery_book_cover.png";

export default function RecoveryBooks() {
  const books = [
    {
      title: "If The Sasquatch Can Do It, So Can You!",
      subtitle: "How an Arkansas Boy Who Couldn't Read Proved That Impossible Recovery is Actually Inevitable",
      pageCount: 334,
      chapterCount: 28,
      readingTime: "8-10 hours",
      coverImage: bookCoverImage,
      preview:
        "The ONLY stroke recovery book written by someone who went from 0% to 90% function using methods that don't exist in medical textbooks.",
    },
    {
      title: "The Ultimate Stroke Recovery Guide",
      subtitle: "Your Path to Reclaiming Life - Patience, Persistence, and the Power of Neuroplasticity",
      pageCount: 476,
      chapterCount: 29,
      readingTime: "12-15 hours",
      coverImage: bookCoverImage,
      preview:
        "The comprehensive technical manual for stroke survivors who refuse to accept limitations. Complete protocols from wheelchair to walking.",
    },
    {
      title: "The Ultimate Survivor Recovery Bible 2025",
      subtitle: "From Impossible to Inevitable - The Stroke Survivor Your Mom Warned You About",
      pageCount: 6113,
      chapterCount: 31,
      readingTime: "20+ hours",
      coverImage: bookCoverImage,
      preview:
        "72-month recovery arsenal combining street-tested methods with 2025's breakthrough neuroscience. Brain-computer interfaces, stem cell therapy, and advanced protocols.",
    },
  ];

  return (
    <section className="py-20 bg-card" id="books">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4" data-testid="badge-books-category">
            DIGITAL RECOVERY LIBRARY
          </Badge>
          <h2 className="text-4xl font-bold mb-4" data-testid="text-books-title">
            Complete Recovery Guides
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="text-books-subtitle">
            Everything I wish existed when I was lying in that ICU bed with 50 staples in my skull and zero hope.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {books.map((book, index) => (
            <BookCard
              key={index}
              {...book}
              onClick={() => console.log(`${book.title} clicked`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
