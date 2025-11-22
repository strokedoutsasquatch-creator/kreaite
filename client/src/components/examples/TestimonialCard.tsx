import TestimonialCard from '../TestimonialCard';

export default function TestimonialCardExample() {
  return (
    <div className="max-w-md">
      <TestimonialCard
        quote="Nick's baseball bat therapy changed everything for me. When my therapists said I'd never regain arm function, his methods proved them wrong. I'm back to playing guitar after 2 years."
        name="Sarah Martinez"
        recovery="2 Years Post-Stroke • 75% Recovery"
        initials="SM"
      />
    </div>
  );
}
