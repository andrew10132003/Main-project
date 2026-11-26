import axios from "axios";
import { useEffect, useState, type FormEvent } from "react";
import {
  createShelterReview,
  getReviews,
  type Review,
  type ReviewSort,
  type ReviewsResponse,
} from "../api/reviewService";

type Props = {
  shelterId: string;
  shelterName?: string;
};

const emptyReviews: ReviewsResponse = {
  totalReviews: 0,
  averageRating: 0,
  matchingReviews: 0,
  reviews: [],
};

function ShelterReviews({ shelterId, shelterName }: Props) {
  const [reviewData, setReviewData] = useState(emptyReviews);
  const [ratingFilter, setRatingFilter] = useState<number | undefined>();
  const [sort, setSort] = useState<ReviewSort>("newest");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    const loadReviews = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getReviews({ shelterId }, ratingFilter, sort);
        if (active) setReviewData(data);
      } catch (requestError: unknown) {
        if (active) {
          setError(
            (axios.isAxiosError<{ message?: string }>(requestError)
              ? requestError.response?.data?.message
              : undefined) ||
              "Unable to load shelter reviews. Please try again later."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadReviews();
    return () => {
      active = false;
    };
  }, [shelterId, ratingFilter, sort]);

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await createShelterReview(shelterId, rating, comment);
      setComment("");
      setSuccess("Your shelter review has been submitted.");
      const data = await getReviews({ shelterId }, ratingFilter, sort);
      setReviewData(data);
    } catch (requestError: unknown) {
      setSubmitError(
        (axios.isAxiosError<{ message?: string }>(requestError)
          ? requestError.response?.data?.message
          : undefined) ||
          "Unable to submit your review. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-16 border-t pt-10">
      <h2 className="mb-4 text-3xl font-bold">
        Reviews for {shelterName || "this shelter"}
      </h2>

      <div className="mb-8 rounded-xl bg-gray-50 p-6">
        <p className="text-lg font-semibold">
          ⭐ {reviewData.averageRating.toFixed(1)} / 5
        </p>
        <p className="mt-1 text-gray-600">
          Average rating across all reviews · {reviewData.totalReviews} review(s)
        </p>
      </div>

      <form onSubmit={submitReview} className="mb-8 max-w-2xl rounded-xl border bg-white p-5">
        <h3 className="mb-3 text-xl font-bold">Review this shelter</h3>
        {submitError && (
          <p role="alert" className="mb-3 rounded bg-red-100 p-3 text-red-700">
            {submitError}
          </p>
        )}
        {success && (
          <p role="status" className="mb-3 rounded bg-green-100 p-3 text-green-700">
            {success}
          </p>
        )}
        <label className="block text-sm font-semibold" htmlFor="shelter-review-rating">
          Rating
        </label>
        <select
          id="shelter-review-rating"
          value={rating}
          onChange={(event) => setRating(Number(event.target.value))}
          className="mt-1 w-full rounded border p-3"
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>{value} stars</option>
          ))}
        </select>
        <label className="mt-3 block text-sm font-semibold" htmlFor="shelter-review-comment">
          Review
        </label>
        <textarea
          id="shelter-review-comment"
          required
          minLength={3}
          maxLength={1000}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Share your experience with this shelter..."
          className="mt-1 w-full rounded border p-3"
          rows={4}
        />
        <button
          disabled={submitting}
          className="mt-3 rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label htmlFor="shelter-review-filter" className="font-semibold">
          Filter by rating:
        </label>
        <select
          id="shelter-review-filter"
          value={ratingFilter ?? "all"}
          onChange={(event) =>
            setRatingFilter(
              event.target.value === "all" ? undefined : Number(event.target.value)
            )
          }
          className="rounded-lg border bg-white px-4 py-2"
        >
          <option value="all">All ratings</option>
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>{value} stars</option>
          ))}
        </select>
        <label htmlFor="shelter-review-sort" className="font-semibold">
          Sort by:
        </label>
        <select
          id="shelter-review-sort"
          value={sort}
          onChange={(event) => setSort(event.target.value as ReviewSort)}
          className="rounded-lg border bg-white px-4 py-2"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="highest">Highest rating</option>
          <option value="lowest">Lowest rating</option>
        </select>
      </div>

      {loading ? (
        <p>Loading shelter reviews...</p>
      ) : error ? (
        <p role="alert" className="text-red-600">{error}</p>
      ) : reviewData.reviews.length === 0 ? (
        <p className="text-gray-600">No reviews found for this selection.</p>
      ) : (
        <div className="space-y-5">
          {reviewData.reviews.map((review: Review) => (
            <article key={review._id} className="rounded-xl border p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold">{review.reviewerId?.name || "Adopter"}</p>
                <p className="text-yellow-500">
                  {"★".repeat(review.rating)}
                  <span className="text-gray-300">{"★".repeat(5 - review.rating)}</span>
                  <span className="ml-2 text-gray-600">{review.rating}/5</span>
                </p>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-gray-700">{review.comment}</p>
              <p className="mt-3 text-sm text-gray-500">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default ShelterReviews;
