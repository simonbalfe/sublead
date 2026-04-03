import { useEffect, useState } from "react";
import { Particles } from "./ui/particles";

export const ParticlesHero = () => {
  const [color, setColor] = useState("#000000");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setColor(isDark ? "#ffffff" : "#000000");

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          const isDark = document.documentElement.classList.contains("dark");
          setColor(isDark ? "#ffffff" : "#000000");
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <Particles
      className="absolute inset-0 z-0"
      quantity={100}
      ease={80}
      color={color}
      refresh
    />
  );
};
