import api from "../utils/api";

export type Review = {
  _id: string;
  reviewerId: {
    _id: string;
    name: string;
  } | null;
  petId: string | null;
  shelterId: string | null;
  rating: number;
  comment: string;
  createdAt: string;
};

export type ReviewsResponse = {
  totalReviews: number;
  averageRating: number;
  matchingReviews: number;
  reviews: Review[];
};

export type ReviewSort = "newest" | "oldest" | "highest" | "lowest";

type ReviewTarget =
  | { petId: string; shelterId?: never }
  | { shelterId: string; petId?: never };

export const getReviews = async (
  target: ReviewTarget,
  rating?: number,
  sort: ReviewSort = "newest"
): Promise<ReviewsResponse> => {
  const response = await api.get<ReviewsResponse>("/reviews", {
    params: {
      ...target,
      ...(rating ? { rating } : {}),
      sort,
    },
  });

  return response.data;
};

export const getPetReviews = async (
  petId: string,
  rating?: number,
  sort: ReviewSort = "newest"
) => getReviews({ petId }, rating, sort);

export const createPetReview = async (
  petId: string,
  rating: number,
  comment: string
) => {
  const response = await api.post(
    "/reviews",
    { petId, rating, comment },
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );
  return response.data;
};

export const createShelterReview = async (
  shelterId: string,
  rating: number,
  comment: string
) => {
  const response = await api.post(
    "/reviews",
    { shelterId, rating, comment },
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }
  );
  return response.data;
};