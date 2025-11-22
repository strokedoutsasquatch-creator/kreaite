import BookCard from '../BookCard';
import bookCoverImage from "@assets/generated_images/sasquatch_recovery_book_cover.png";

export default function BookCardExample() {
  return (
    <div className="max-w-sm">
      <BookCard
        title="If The Sasquatch Can Do It, So Can You!"
        subtitle="How an Arkansas Boy Who Couldn't Read Proved That Impossible Recovery is Actually Inevitable"
        pageCount={334}
        chapterCount={28}
        readingTime="8-10 hours"
        coverImage={bookCoverImage}
        preview="The ONLY stroke recovery book written by someone who went from 0% to 90% function using methods that don't exist in medical textbooks. Battle-tested techniques, brutal honesty, and proof that comeback can exceed setback."
        onClick={() => console.log("Read book clicked")}
      />
    </div>
  );
}
