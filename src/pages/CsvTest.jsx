import React, { useEffect, useState } from "react";
import { loadOfflineRecipes } from "../utils/offlineRecipes";

export default function CsvTest() {
  const [status, setStatus] = useState("Testing CSV...");
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    async function test() {
      try {
        const data = await loadOfflineRecipes();

        setRecipes(data);

        setStatus(
          `SUCCESS: ${data.length} recipes loaded from CSV files.`
        );
      } catch (error) {
        console.error(error);

        setStatus(
          `ERROR: ${error.message}`
        );
      }
    }

    test();
  }, []);

  return (
    <main style={{ padding: "30px" }}>
      <h1>Offline CSV Test</h1>

      <h2>{status}</h2>

      {recipes.slice(0, 5).map((recipe) => (
        <div
          key={recipe.recipe_id}
          style={{
            border: "1px solid #ccc",
            margin: "10px 0",
            padding: "15px",
          }}
        >
          <h3>{recipe.recipe_name}</h3>

          <p>
            Recipe ID: {recipe.recipe_id}
          </p>

          <p>
            Ingredients: {recipe.ingredients.length}
          </p>

          <p>
            Steps: {recipe.steps.length}
          </p>

          <p>
            Calories: {recipe.nutrition?.calories || "N/A"}
          </p>
        </div>
      ))}
    </main>
  );
}
