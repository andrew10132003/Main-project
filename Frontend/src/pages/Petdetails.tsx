import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPet } from "../api/petService";
import {
  createPetReview,
  getPetReviews,
  type Review,
  type ReviewSort,
  type ReviewsResponse,
} from "../api/reviewService";
import { petImages } from "../utils/petsImages";
import api from "../utils/api";
import ShelterReviews from "../components/ShelterReviews";

type Pet = {
  _id: string;
  name: string;
  breed: string;
  age: string;
  image: string;
  description: string;
  shelterId?: string | { _id: string; name?: string };
};

function PetDetails() {
  const { id } = useParams();

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);

  const [reviewData, setReviewData] = useState<ReviewsResponse>({
    totalReviews: 0,
    averageRating: 0,
    matchingReviews: 0,
    reviews: [],
  });
  const [reviewLoading, setReviewLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(
    undefined
  );
  const [reviewSort, setReviewSort] = useState<ReviewSort>("newest");
  const [reviewError, setReviewError] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitError, setReviewSubmitError] = useState("");
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [contactStatus, setContactStatus] = useState("");
  const [contactError, setContactError] = useState("");
  const [contactSubmitting, setContactSubmitting] = useState(false);

  // Fetch pet details
  useEffect(() => {
    const fetchPet = async () => {
      setLoading(true);

      try {
        if (!id) {
          setPet(null);
          return;
        }

        const data = await getPet(id);
        setPet(data);
      } catch (error) {
        console.error("Error fetching pet:", error);
        setPet(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPet();
  }, [id]);

  // Fetch reviews for this pet
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) {
        setReviewLoading(false);
        return;
      }

      setReviewLoading(true);
      setReviewError("");

      try {
        const data = await getPetReviews(id, ratingFilter, reviewSort);
        setReviewData(data);
      } catch (error: unknown) {
        console.error("Error fetching reviews:", error);
        setReviewError(
          (axios.isAxiosError<{ message?: string }>(error)
            ? error.response?.data?.message
            : undefined) ||
            "Unable to load reviews. Please try again later."
        );
      } finally {
        setReviewLoading(false);
      }
    };

    fetchReviews();
  }, [id, ratingFilter, reviewSort]);

  const submitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id || reviewSubmitting) return;

    setReviewSubmitError("");
    setReviewSubmitSuccess("");
    setReviewSubmitting(true);

    try {
      await createPetReview(id, reviewRating, reviewComment);
      setReviewComment("");
      setReviewSubmitSuccess("Your review has been submitted.");
      const data = await getPetReviews(id, ratingFilter, reviewSort);
      setReviewData(data);
    } catch (error: unknown) {
      setReviewSubmitError(
        (axios.isAxiosError<{ message?: string }>(error)
          ? error.response?.data?.message
          : undefined) ||
          "Unable to submit your review. Please try again."
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  const sendShelterMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (contactSubmitting) return;
    setContactError("");
    setContactStatus("");

    const recipientId =
      typeof pet?.shelterId === "object"
        ? pet.shelterId._id
        : pet?.shelterId;

    if (!recipientId) {
      setContactError("This pet has no shelter contact information.");
      return;
    }

    setContactSubmitting(true);
    try {
      await api.post(
        "/messages",
        {
          recipientId,
          petId: id,
          subject: `Enquiry about ${pet?.name || "a pet"}`,
          body: contactMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setContactMessage("");
      setContactStatus("Your message was sent to the shelter.");
    } catch (error: unknown) {
      setContactError(
        (axios.isAxiosError<{ message?: string }>(error)
          ? error.response?.data?.message
          : undefined) ||
          "Unable to send the shelter message."
      );
    } finally {
      setContactSubmitting(false);
    }
  };

  if (loading) {
    return (
      <h1 className="text-center text-3xl mt-20">Loading...</h1>
    );
  }

  if (!pet) {
    return (
      <h1 className="text-center text-4xl mt-20">Pet Not Found</h1>
    );
  }

  return (
    <>
      <div className="max-w-6xl mx-auto py-16 px-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Pet Image */}
          <img
            src={petImages[pet.name] || pet.image}
            alt={pet.name}
            className="rounded-xl w-full h-[500px] object-cover shadow-lg"
          />

          {/* Pet Details */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {pet.name}
            </h1>

            <p className="text-xl text-gray-600 mb-6">
              {pet.breed}
            </p>

            <div className="space-y-3">
              <p>
                <strong>Age:</strong> {pet.age}
              </p>
              <p>
                <strong>Breed:</strong> {pet.breed}
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-3">
              About {pet.name}
            </h2>

            <p className="text-gray-600 leading-8">
              {pet.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-10">
              <Link
                to="/adopt"
                state={{ pet }}
                className="w-full sm:w-auto"
              >
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold">
                  Adopt Me ❤️
                </button>
              </Link>

              <Link to="/pets" className="w-full sm:w-auto">
                <button className="w-full bg-gray-300 hover:bg-gray-400 px-8 py-4 rounded-lg font-semibold">
                  Back to Pets
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="mt-16 border-t pt-10">
          <h2 className="text-3xl font-bold mb-4">
            Reviews for {pet.name}
          </h2>

          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <p className="text-lg font-semibold">
              ⭐ {reviewData.averageRating.toFixed(1)} / 5
            </p>
            <p className="text-gray-600 mt-1">
              Average rating across all reviews ·{" "}
              {reviewData.totalReviews} review(s)
            </p>
          </div>

          <div className="mb-8 grid gap-5 md:grid-cols-2">
            <form onSubmit={submitReview} className="rounded-xl border bg-white p-5">
              <h3 className="mb-3 text-xl font-bold">Write a review</h3>
              {reviewSubmitError && (
                <p className="mb-3 rounded bg-red-100 p-3 text-red-700">{reviewSubmitError}</p>
              )}
              {reviewSubmitSuccess && (
                <p className="mb-3 rounded bg-green-100 p-3 text-green-700">{reviewSubmitSuccess}</p>
              )}
              <label className="block text-sm font-semibold">
                Rating
                <select
                  value={reviewRating}
                  onChange={(event) => setReviewRating(Number(event.target.value))}
                  className="mt-1 w-full rounded border p-3"
                >
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>{rating} stars</option>
                  ))}
                </select>
              </label>
              <textarea
                required
                minLength={3}
                maxLength={1000}
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                placeholder="Share your experience..."
                className="mt-3 w-full rounded border p-3"
                rows={4}
              />
              <button disabled={reviewSubmitting} className="mt-3 rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white disabled:opacity-50">
                {reviewSubmitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>

            <form onSubmit={sendShelterMessage} className="rounded-xl border bg-white p-5">
              <h3 className="mb-3 text-xl font-bold">Message the shelter</h3>
              {contactError && (
                <p className="mb-3 rounded bg-red-100 p-3 text-red-700">{contactError}</p>
              )}
              {contactStatus && (
                <p className="mb-3 rounded bg-green-100 p-3 text-green-700">{contactStatus}</p>
              )}
              <textarea
                required
                minLength={1}
                maxLength={2000}
                value={contactMessage}
                onChange={(event) => setContactMessage(event.target.value)}
                placeholder="Ask about availability, visits, or care..."
                className="w-full rounded border p-3"
                rows={5}
              />
              <button disabled={contactSubmitting} className="mt-3 rounded-lg bg-purple-600 px-5 py-2 font-semibold text-white disabled:opacity-50">
                {contactSubmitting ? "Sending..." : "Send to Shelter"}
              </button>
            </form>
          </div>

          {/* Rating Filter */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <label
              htmlFor="ratingFilter"
              className="font-semibold"
            >
              Filter by rating:
            </label>

            <select
              id="ratingFilter"
              value={ratingFilter ?? "all"}
              onChange={(event) => {
                const value = event.target.value;
                setRatingFilter(
                  value === "all" ? undefined : Number(value)
                );
              }}
              className="border rounded-lg px-4 py-2 bg-white"
            >
              <option value="all">All ratings</option>
              <option value="5">⭐⭐⭐⭐⭐ 5 stars</option>
              <option value="4">⭐⭐⭐⭐ 4 stars</option>
              <option value="3">⭐⭐⭐ 3 stars</option>
              <option value="2">⭐⭐ 2 stars</option>
              <option value="1">⭐ 1 star</option>
            </select>

            <label htmlFor="reviewSort" className="font-semibold">
              Sort by:
            </label>
            <select
              id="reviewSort"
              value={reviewSort}
              onChange={(event) =>
                setReviewSort(event.target.value as ReviewSort)
              }
              className="border rounded-lg px-4 py-2 bg-white"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest rating</option>
              <option value="lowest">Lowest rating</option>
            </select>
          </div>

          {/* Reviews List */}
          {reviewLoading ? (
            <p className="text-gray-600">Loading reviews...</p>
          ) : reviewError ? (
            <p className="text-red-600">{reviewError}</p>
          ) : reviewData.reviews.length === 0 ? (
            <p className="text-gray-600">
              No reviews found for this selection.
            </p>
          ) : (
            <div className="space-y-5">
              {reviewData.reviews.map((review: Review) => (
                <article
                  key={review._id}
                  className="border rounded-xl p-5 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p className="font-semibold">
                      {review.reviewerId?.name || "Adopter"}
                    </p>

                    <p className="text-yellow-500">
                      {"★".repeat(review.rating)}
                      <span className="text-gray-300">
                        {"★".repeat(5 - review.rating)}
                      </span>
                      <span className="text-gray-600 ml-2">
                        {review.rating}/5
                      </span>
                    </p>
                  </div>

                  <p className="text-gray-700 mt-3 whitespace-pre-wrap">
                    {review.comment}
                  </p>

                  <p className="text-sm text-gray-500 mt-3">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        {pet.shelterId && (
          <ShelterReviews
            shelterId={
              typeof pet.shelterId === "string"
                ? pet.shelterId
                : pet.shelterId._id
            }
            shelterName={
              typeof pet.shelterId === "object"
                ? pet.shelterId.name
                : undefined
            }
          />
        )}
      </div>
    </>
  );
}

export default PetDetails;