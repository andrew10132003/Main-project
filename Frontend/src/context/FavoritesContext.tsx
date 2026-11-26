import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import api from "../utils/api";

type Favorite = {
  id: string;
  name: string;
  breed: string;
  age: string;
  image: string;
};

type FavoritesContextType = {
  favorites: Favorite[];
  addFavorite: (pet: Favorite) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean; 
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Favorite[]>(() => {
    try {
      const saved = localStorage.getItem("favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    api
      .get("/auth/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        const pets = response.data.favorites || [];
        const mapped = pets
          .filter((pet: any) => pet && pet._id)
          .map((pet: any) => ({
            id: String(pet._id),
            name: pet.name || "",
            breed: pet.breed || "",
            age: String(pet.age || ""),
            image: pet.image || "",
          }));
        setFavorites(mapped);
        localStorage.setItem("favorites", JSON.stringify(mapped));
      })
      .catch(() => {
        // Local favorites remain available when the backend is temporarily unreachable.
      });
  }, []);

  const syncFavorite = (petId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    api
      .post(
        "/auth/favorites",
        { petId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .catch(() => {
        // The local copy is retained for offline continuity.
      });
  };

  const addFavorite = (pet: Favorite) => {
    setFavorites((previous) => {
      if (previous.find((item) => item.id === pet.id)) return previous;
      const next = [...previous, pet];
      localStorage.setItem("favorites", JSON.stringify(next));
      syncFavorite(pet.id);
      return next;
    });
  };

  const removeFavorite = (id: string) => {
    setFavorites((previous) => {
      const next = previous.filter((pet) => pet.id !== id);
      localStorage.setItem("favorites", JSON.stringify(next));
      syncFavorite(id);
      return next;
    });
  };

  const isFavorite = (id: string) => {
    return favorites.some((pet) => pet.id === id);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite,
        isFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error("useFavorites must be used inside FavoritesProvider");
  }

  return context;
}