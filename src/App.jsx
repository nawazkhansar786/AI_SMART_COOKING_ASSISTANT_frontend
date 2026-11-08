
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import Dashboard from "./pages/Dashboard";
import Ingredients from "./pages/Ingredients";
import IngredientDetection from "./pages/IngredientDetection";
import PakistaniRecipes from "./pages/PakistaniRecipes";
import PakistaniRecipe from "./pages/PakistaniRecipe";
import Balti from "./pages/Balti";
import Recipe from "./pages/Recipe";
import About from "./pages/About";

import OnnxTest from "./pages/onnxTest";
import CsvTest from "./pages/CsvTest";

function Layout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

function Protected({ children }) {
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      {/* Default route: open Dashboard directly */}
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      {/* Authentication routes */}
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      <Route
        path="/reset-password/:token"
        element={<ResetPassword />}
      />

      {/* Main application */}
      <Route
        path="/dashboard"
        element={
          <Protected>
            <Dashboard />
          </Protected>
        }
      />

      <Route
        path="/ingredients"
        element={
          <Protected>
            <Ingredients />
          </Protected>
        }
      />

      <Route
        path="/ingredient_detection"
        element={
          <Protected>
            <IngredientDetection />
          </Protected>
        }
      />

      <Route
        path="/pakistani-recipes"
        element={
          <Protected>
            <PakistaniRecipes />
          </Protected>
        }
      />

      <Route
        path="/pakistani_recipe/:food"
        element={
          <Protected>
            <PakistaniRecipe />
          </Protected>
        }
      />

      <Route
        path="/balti"
        element={
          <Protected>
            <Balti />
          </Protected>
        }
      />

      <Route
        path="/recipe/:recipeNo"
        element={
          <Protected>
            <Recipe />
          </Protected>
        }
      />

      <Route
        path="/about"
        element={
          <Protected>
            <About />
          </Protected>
        }
      />

      {/* Temporary ONNX model test */}
      <Route
        path="/onnx-test"
        element={<OnnxTest />}
      />

      {/* Temporary offline CSV test */}
      <Route
        path="/csv-test"
        element={<CsvTest />}
      />

      {/* Unknown routes: redirect to Dashboard */}
      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}