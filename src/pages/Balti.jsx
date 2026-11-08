import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../services/api";
import { ArrowRight, Mountain } from "lucide-react";

const foods = [
  {
    name: "Marzen",
    image: "/images/Marzen.jpg",
  },
  {
    name: "Prapo",
    image: "/images/Prapo.jpg",
  },
  {
    name: "Kesir",
    image: "/images/kesir.jpg",
  },
  {
    name: "Khorba",
    image: "/images/khorba.jpg",
  },
  {
    name: "Namkeen Cha",
    image: "/images/chai.jpg",
  },
  {
    name: "BaltiKulcha",
    image: "/images/kulcha.jpg",
  },
  {
    name: "TroBalay",
    image: "/images/Trobalay.jpg",
  },
  {
    name: "RxapKhur",
    image: "/images/Rxapkhur.jpg",
  },
];

export default function Balti() {
  return (
    <main className="dashboard-container">

      <div className="welcome">
        <span className="eyebrow"><Mountain size={14} /> Gilgit-Baltistan</span>
        <h1>Balti Dishes</h1>
        <p>Select your favorite traditional Balti dish.</p>
      </div>

      <div className="cards">
        {foods.map((food) => (
          <BaltiCard
            key={food.name}
            food={food}
          />
        ))}
      </div>

    </main>
  );
}

function BaltiCard({ food }) {
  const [d, setD] = useState(null);

  useEffect(() => {
    apiFetch(
      `/api/balti-recipe/${encodeURIComponent(food.name)}`
    )
      .then(setD)
      .catch(() => {});
  }, [food.name]);

  return (
    <article className="feature-card balti-card">

      {/* DISH IMAGE */}
      <div className="balti-image">
        <img
          src={food.image}
          alt={food.name}
        />
      </div>

      {/* DISH NAME */}
      <h3>
        {d?.food || food.name}
      </h3>

      {/* DESCRIPTION */}
      <p>
        Traditional food from Gilgit-Baltistan.
      </p>

      {/* RECIPE BUTTON */}
      {d?.recipe_no ? (
        <Link
          className="primary inline"
          to={`/recipe/${encodeURIComponent(d.recipe_no)}`}
        >
          View Recipe <ArrowRight size={16} />
        </Link>
      ) : (
        <span>Loading…</span>
      )}

    </article>
  );
}