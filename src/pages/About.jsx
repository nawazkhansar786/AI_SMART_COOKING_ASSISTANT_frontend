import React from "react";
import { Bot, Mountain, Utensils } from "lucide-react";

const team = [
  { name: "SUMAIRA BATOOL", image: "/images/Sumaira Batool.jpg" },
  { name: "MUHAMMAD NAWAZ", image: "/images/nawaz.jpg" },
  { name: "MUHAMMAD JAMAL", image: "/images/jamal.jpg" },
];

const features = [
  {
    Icon: Bot,
    title: "AI Recipe Recommendation",
    text: "Find suitable recipes according to available ingredients.",
  },
  {
    Icon: Utensils,
    title: "Pakistani Food Dataset",
    text: "Explore traditional Pakistani dishes with complete ingredients and cooking steps.",
  },
  {
    Icon: Mountain,
    title: "Balti Traditional Food",
    text: "Discover authentic Balti cuisine with traditional recipes and local ingredients.",
  },
];

export default function About() {
  return (
    <main className="about-container">
      <header className="about-header">
        <h1>AI Based Smart Cooking Assistant</h1>
        <p className="intro">
          An intelligent cooking assistant designed to make Pakistani food preparation easier,
          smarter and healthier. Our system uses Artificial Intelligence to recommend recipes,
          detect ingredients, provide cooking instructions and suggest healthy alternatives
          according to user needs.
        </p>
      </header>

      <div className="cards">
        {features.map(({ Icon, title, text }) => (
          <div className="feature-card" key={title}>
            <div className="feature-icon">
              <Icon size={24} />
            </div>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </div>

      <h2 className="section-label">Our Team</h2>

      <div className="team">
        {team.map((member, i) => (
          <div className="member" key={member.name}>
            <div className="avatar">
              <img src={member.image} alt={member.name} />
            </div>
            <h3>Member {i + 1}</h3>
            <p>{member.name}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
